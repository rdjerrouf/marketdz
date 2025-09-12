// src/app/api/auth/signup/route.ts
// Simple, working signup route without complex fallbacks

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const formData = await request.json()
    const { email, password, firstName, lastName, phone, city, wilaya } = formData

    console.log('=== Simple Signup API Called ===')
    console.log('Email:', email)

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use admin client for signup
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
        phone: phone || '',
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

    return NextResponse.json({
      success: true,
      user: data.user,
      message: 'User created successfully'
    })

  } catch (error) {
    console.error('Unexpected signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}