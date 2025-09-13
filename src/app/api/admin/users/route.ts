// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow any authenticated user to view users
    // In production, you should check admin permissions

    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        bio,
        phone,
        avatar_url,
        city,
        wilaya,
        created_at,
        updated_at
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  try {
    const body = await request.json()
    const { action, userIds, notificationData } = body

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow any authenticated user to send notifications
    // In production, you should check admin permissions

    switch (action) {
      case 'send_notification':
        // For now, just return success message
        // In production, implement push notification sending
        if (!notificationData || !userIds?.length) {
          return NextResponse.json(
            { error: 'Missing notification data or user IDs' },
            { status: 400 }
          )
        }

        return NextResponse.json({ 
          message: `Notification would be sent to ${userIds.length} users`,
          data: { notificationData, userIds }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in admin users POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
