// src/app/api/admin/user-management/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)

    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check admin status using RLS
    const { data: currentAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !currentAdmin || !(currentAdmin as any)?.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Type assertion for admin user
    const admin: any = currentAdmin

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query using RLS (admins can view all profiles)
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, city, wilaya, created_at, updated_at, status', { count: 'exact' })

    // Add search if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get status counts
    const { data: statusData } = await supabase
      .from('profiles')
      .select('status', { count: 'exact', head: true })

    const statusCounts = {
      active: count || 0,
      suspended: 0,
      banned: 0
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      statusCounts,
      currentAdmin
    })

  } catch (error) {
    console.error('Unexpected error in user management API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)
    const body = await request.json()
    const { action, userId, newStatus } = body

    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check admin status using RLS
    const { data: currentAdmin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !currentAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Handle user status updates
    if (action === 'updateStatus') {
      if (!['active', 'suspended', 'banned'].includes(newStatus)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }

      // Update user status using RLS (admins can update profiles)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user status' },
          { status: 500 }
        )
      }

      // Create audit log entry using RLS
      try {
        await supabase
          .from('admin_activity_logs' as any)
          .insert({
            admin_user_id: (currentAdmin as any).id,
            action: `user_status_changed`,
            target_type: 'user',
            target_id: userId,
            details: {
              new_status: newStatus,
              changed_by: user.email
            }
          })
      } catch (err) {
        console.log('Audit log failed (non-critical):', err)
        // Continue execution even if audit log fails
      }

      return NextResponse.json({
        success: true,
        message: `User ${newStatus === 'active' ? 'activated' : newStatus} successfully`
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in user management POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}