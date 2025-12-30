/**
 * Resend Verification API - Resend Email Verification Link
 *
 * WHEN USED:
 * - User signed up but didn't receive verification email
 * - Verification email expired or was lost
 *
 * FEATURES:
 * - Validates email format
 * - Handles specific errors (already verified, user not found)
 * - Uses Supabase auth.resend() with type='signup'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    console.log('=== Resend Verification Email API Called ===')
    console.log('Email:', email)

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Response cookies will be set in the response
          },
        },
      }
    )

    // Resend verification email using OTP
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
      }
    })

    if (error) {
      console.error('Resend verification error:', error.message)

      // Handle specific errors
      if (error.message.includes('already confirmed')) {
        return NextResponse.json(
          { error: 'This email is already verified. Please try signing in.' },
          { status: 400 }
        )
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'No account found with this email. Please sign up first.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('Verification email resent to:', email)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    })

  } catch (error) {
    console.error('Unexpected error in resend verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
