// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)

    // Get the current user
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
      .from('admin_users' as any)
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

    // Get all admin users
    const { data: adminUsers, error: adminError } = await adminSupabase
      .from('admin_users' as any)
      .select(`
        *,
        profiles:user_id (
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
      return NextResponse.json(
        { error: 'Failed to fetch admin users' },
        { status: 500 }
      )
    }

    // Get all users from auth
    const { data: authUsers, error: authError2 } = await adminSupabase.auth.admin.listUsers()

    if (authError2) {
      console.error('Error fetching auth users:', authError2)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const allUsers = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || 'No email',
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || 'Not confirmed'
    }))

    return NextResponse.json({
      adminUsers: adminUsers || [],
      allUsers,
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
    console.error('Unexpected error in admin users API:', error)
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
    const { action, userId, role, adminUserId, newRole } = body

    // Get the current user
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
      .from('admin_users' as any)
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

    // Handle different actions
    switch (action) {
      case 'promote':
        if (!currentAdmin || !['super_admin', 'admin'].includes((currentAdmin as any).role)) {
          return NextResponse.json(
            { error: 'You do not have permission to promote users' },
            { status: 403 }
          )
        }

        const { error: promoteError } = await adminSupabase
          .from('admin_users' as any)
          .insert({
            user_id: userId,
            role: role,
            created_by: (currentAdmin as any).id,
            notes: `Promoted by ${(currentAdmin as any).user_id}`
          })

        if (promoteError) {
          if (promoteError.code === '23505') {
            return NextResponse.json(
              { error: 'User is already an admin' },
              { status: 400 }
            )
          }
          throw promoteError
        }

        return NextResponse.json({ success: true, message: 'User promoted successfully' })

      case 'updateRole':
        if (!currentAdmin || (currentAdmin as any).role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Only super admins can change roles' },
            { status: 403 }
          )
        }

        const { error: updateError } = await adminSupabase
          .from('admin_users' as any)
          .update({ role: newRole })
          .eq('id', adminUserId)

        if (updateError) throw updateError

        return NextResponse.json({ success: true, message: 'Admin role updated successfully' })

      case 'deactivate':
        if (!currentAdmin || !['super_admin', 'admin'].includes((currentAdmin as any).role)) {
          return NextResponse.json(
            { error: 'You do not have permission to deactivate admins' },
            { status: 403 }
          )
        }

        const { error: deactivateError } = await adminSupabase
          .from('admin_users' as any)
          .update({ is_active: false })
          .eq('id', adminUserId)

        if (deactivateError) throw deactivateError

        return NextResponse.json({ success: true, message: 'Admin deactivated successfully' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in admin users POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}