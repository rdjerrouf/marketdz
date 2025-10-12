// src/app/api/admin/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/supabase/server'

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

    // Use RLS-protected query to check admin status
    // admin_users table is not in generated types, requires type assertion
    const { data: adminUser, error: adminError } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      return NextResponse.json(
        { error: 'Failed to check admin status' },
        { status: 500 }
      )
    }

    if (adminUser) {
      return NextResponse.json({
        isAdmin: true,
        adminUser,
        method: 'rls'
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