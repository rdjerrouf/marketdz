// src/app/api/admin/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🚨 API ROUTE DEBUG: /api/admin/check-status called')
    console.log('🔑 Authorization header:', request.headers.get('Authorization') ? 'present' : 'missing')
    console.log('🍪 Cookies count:', request.cookies.getAll().length)

    const supabase = createApiSupabaseClient(request)

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 Admin check for user:', user ? { id: user.id, email: user.email } : 'no user')
    console.log('❌ Auth error:', authError?.message || 'none')

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Use admin client for database operations to bypass RLS
    const adminSupabase = createSupabaseAdminClient()
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('Error checking admin status:', adminError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (adminUser) {
      // User is in admin_users table
      return NextResponse.json({
        isAdmin: true,
        adminUser,
        method: 'database'
      })
    }

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

    if (isLegacyAdmin) {
      // Create legacy admin object
      const legacyAdmin = {
        id: 'legacy',
        user_id: user.id,
        role: 'admin',
        permissions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }

      return NextResponse.json({
        isAdmin: true,
        adminUser: legacyAdmin,
        method: 'legacy',
        needsMigration: true
      })
    }

    // Not an admin
    return NextResponse.json({
      isAdmin: false,
      adminUser: null,
      method: 'none'
    })

  } catch (error) {
    console.error('Unexpected error in admin check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}