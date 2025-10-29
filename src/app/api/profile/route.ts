// src/app/api/profile/route.ts
// FINAL FIX: setSession() approach (Supabase AI recommendation #3)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Force Node runtime for consistent behavior
export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    // Extract token - Pure Bearer approach (no cookie mixing)
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    // Create a pure Bearer client (Supabase AI recommendation #3: setSession approach)
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // CRITICAL: Seed the auth state with the bearer token
    // This ensures supabase-js includes the token for all PostgREST calls
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })

    // Check authentication (now using the seeded session)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      first_name,
      last_name,
      bio,
      phone,
      city,
      wilaya
    } = body

    // Validate required fields
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Update profile - token is already seeded via setSession()
    // The client will automatically include it in all PostgREST requests
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        bio: bio?.trim() || null,
        phone: phone?.trim() || null,
        city: city?.trim() || null,
        wilaya: wilaya || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: (error as any).hint,
      })
      const status = error.code === '42501' ? 403 : 400
      return NextResponse.json({ 
        error: error.message, 
        code: error.code 
      }, { status })
    }

    return NextResponse.json({ 
      data,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract token - Pure Bearer approach
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    // Create a pure Bearer client (Supabase AI recommendation #3: setSession approach)
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    // CRITICAL: Seed the auth state with the bearer token
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    })

    // Check authentication (now using the seeded session)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the profile - token is already seeded via setSession()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: (error as any).hint,
      })
      const status = error.code === '42501' ? 403 : 400
      return NextResponse.json({ 
        error: error.message, 
        code: error.code 
      }, { status })
    }

    return NextResponse.json({ 
      data: {
        ...profile,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}