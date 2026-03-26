/**
 * Signup API Route - User Registration with Email Verification
 *
 * FLOW:
 * 1. Create user via admin client (email_confirm: false)
 * 2. Generate confirmation link via admin API
 * 3. Send confirmation email via Resend
 * 4. User must verify email before signing in
 * 5. Trigger (handle_new_user) creates profile with metadata
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

    // Generate confirmation link and send via Resend
    // (admin.createUser does NOT auto-send confirmation emails — must be done explicitly)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Failed to generate confirmation link:', linkError?.message)
      // User was created — return success but warn about email
      return NextResponse.json({
        success: true,
        user: data.user,
        message: 'Account created! Email confirmation may be delayed — please check your inbox.',
        requiresVerification: true,
      })
    }

    const confirmationUrl = linkData.properties.action_link

    // Send via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DlalaDZ <noreply@dlaladz.com>',
        to: email,
        subject: 'Verify your email - DlalaDZ',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#1e293b">Welcome to DlalaDZ!</h2>
            <p>Please verify your email address to activate your account.</p>
            <a href="${confirmationUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
              Verify Email Address
            </a>
            <p style="color:#64748b;font-size:14px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          </div>
        `,
      }),
    })

    if (!resendResponse.ok) {
      console.error('Resend error:', await resendResponse.text())
    } else {
      console.log('Verification email sent via Resend to:', email)
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'Account created successfully! Please check your email to verify your account.',
      requiresVerification: true,
    })

  } catch (error) {
    console.error('Unexpected signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}