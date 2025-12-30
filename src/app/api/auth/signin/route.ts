/**
 * Signin API Route - Email/Password Authentication
 *
 * FLOW:
 * 1. Validate email/password format
 * 2. Sign in via Supabase Auth (checks email_confirmed_at)
 * 3. Fetch user profile from profiles table
 * 4. Return user + profile data
 *
 * SECURITY:
 * - Email verification required (see signup route)
 * - Middleware will set auth cookies automatically
 * - Profile fetch validates user exists in database
 *
 * NOTE: Unverified users will get error from Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  try {
    const { email, password } = await request.json()

    console.log('=== Signin API Called ===')
    console.log('Request data:', { email })

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Authenticate via Supabase Auth
    // IMPORTANT: This checks email_confirmed_at automatically
    // Unverified users will get "Email not confirmed" error
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Signin error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('=== Signin successful ===')

    // Fetch user profile (created by handle_new_user trigger)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // User authenticated but profile missing (data integrity issue)
      // Return partial success - client should handle gracefully
      return NextResponse.json({
        message: 'Signed in successfully',
        user: {
          id: data.user.id,
          email: data.user.email
        },
        profile: null
      })
    }

    // Success - return user + profile
    return NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: data.user.id,
        email: data.user.email
      },
      profile
    })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
