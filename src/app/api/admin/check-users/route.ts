// API to check users in database
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== Checking users in database ===')

    // Check auth.users table
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users', details: authError.message }, { status: 500 })
    }

    // Check profiles table
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, created_at')
      .order('created_at', { ascending: false })

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
    }

    const result = {
      authUsers: {
        count: authUsers.users.length,
        users: authUsers.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at
        }))
      },
      profiles: {
        count: profiles?.length || 0,
        data: profiles || [],
        error: profileError?.message || null
      }
    }

    console.log('Users found:', result.authUsers.count)
    console.log('Profiles found:', result.profiles.count)

    return NextResponse.json(result)

  } catch (error) {
    console.error('=== Error checking users ===', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
