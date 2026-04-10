// src/app/api/admin/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiSupabaseClient(request)

    // Verify identity: extract JWT and pass to getUser() directly.
    // global.headers.Authorization only affects PostgREST calls, not auth.getUser().
    const authHeader = request.headers.get('Authorization')
    const jwt = authHeader?.replace('Bearer ', '') || undefined

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Query admin_users with service role to bypass RLS.
    // RLS on admin_users blocks anon-key queries (chicken-and-egg: need to be admin
    // to read admin_users to check if you're admin). Service role resolves this.
    const adminClient = createSupabaseAdminClient()
    const { data: adminUser, error: adminError } = await (adminClient as any)
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
        method: 'database'  // layout checks for 'database' (was 'rls' — mismatch bug)
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