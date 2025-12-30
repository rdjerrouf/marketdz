/**
 * Signup API Route - User Registration with Email Verification
 *
 * FLOW:
 * 1. Create user via admin client (email_confirm: false)
 * 2. Supabase automatically sends verification email
 * 3. User must verify email before signing in
 * 4. Trigger (handle_new_user) creates profile with metadata
 *
 * NOTE: Email delays (5-30 min) are expected without custom SMTP/DNS
 * See CLAUDE.md "TODO: EMAIL SETUP WHEN DOMAIN IS READY"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient()
  try {
    const formData = await request.json()
    const { email, password, firstName, lastName, phone, city, wilaya } = formData

    console.log('=== Signup API Called ===')
    console.log('Email:', email)

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize phone for WhatsApp compatibility (adds +213 prefix for Algeria)
    const normalizedPhone = phone ? normalizePhoneNumber(phone) : ''
    console.log('Phone normalization:', phone, '->', normalizedPhone)

    // Create user with admin client (bypasses rate limits, allows metadata)
    // CRITICAL: email_confirm: false forces email verification before signin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User MUST verify email before signing in
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
        phone: normalizedPhone,
        city: city || '',
        wilaya: wilaya || '',
      },
    })

    if (error) {
      console.error('Signup error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    console.log('User created successfully:', data.user.id)
    console.log('Verification email sent to:', email)

    // Return success - verification email sent automatically by Supabase
    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true
    })

  } catch (error) {
    console.error('Unexpected signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}