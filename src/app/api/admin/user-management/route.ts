// src/app/api/admin/user-management/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'

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

    // Use admin client for database operations to bypass RLS
    const adminSupabase = createSupabaseAdminClient()
    const { data: currentAdmin } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Fallback to email-based check for legacy support
    const adminEmails = [
      'admin@marketdz.com',
      'moderator@marketdz.com',
      'test@example.com',
      'ryad@marketdz.com',
      'rdjerrouf@gmail.com',
      'anyadjerrouf@gmail.com'
    ]

    const isLegacyAdmin = adminEmails.includes(user.email || '')

    if (!currentAdmin && !isLegacyAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query
    let query = adminSupabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, city, wilaya, status, created_at, updated_at', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Add search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Add status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: users, error: usersError, count } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get status distribution for dashboard
    const { data: statusData, error: statusError } = await adminSupabase
      .from('profiles')
      .select('status')

    let statusCounts = { active: 0, suspended: 0, banned: 0 }
    if (!statusError && statusData) {
      statusData.forEach(user => {
        const userStatus = user.status || 'active'
        if (userStatus in statusCounts) {
          statusCounts[userStatus as keyof typeof statusCounts]++
        }
      })
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
      currentAdmin: currentAdmin || {
        id: 'legacy',
        user_id: user.id,
        role: 'admin',
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
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

    // Use admin client for database operations
    const adminSupabase = createSupabaseAdminClient()
    const { data: currentAdmin } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Fallback to email-based check
    const adminEmails = [
      'admin@marketdz.com',
      'moderator@marketdz.com',
      'test@example.com',
      'ryad@marketdz.com',
      'rdjerrouf@gmail.com',
      'anyadjerrouf@gmail.com'
    ]

    const isLegacyAdmin = adminEmails.includes(user.email || '')

    if (!currentAdmin && !isLegacyAdmin) {
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

      const { error: updateError } = await adminSupabase
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

      // Create audit log entry
      try {
        await adminSupabase
          .from('admin_activity_logs')
          .insert({
            admin_user_id: currentAdmin?.id || 'legacy',
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