// src/app/api/profile/route.ts
// Force fresh deployment - v5 (fix RLS session issue with Node runtime)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// IMPORTANT: Force Node runtime for proper cookie handling and session management
// Edge runtime has different cookie behavior that can cause getSession() to fail
export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    // Extract token for per-request header (Supabase AI recommendation)
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!authHeader || !token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient(request)

    // Check authentication
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

    // CRITICAL FIX (from Supabase AI):
    // Use .withHeaders() to guarantee Authorization header reaches PostgREST
    // This ensures the JWT is on the exact mutation request for RLS context
    const updateQuery = supabase
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

    // Force Authorization header on this specific query
    // @ts-ignore - withHeaders exists but may not be in types
    const { data, error } = await updateQuery.withHeaders({
      Authorization: `Bearer ${token}`
    })

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
    // Extract token for per-request header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    const supabase = await createServerSupabaseClient(request)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the profile with forced Authorization header
    const selectQuery = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Force Authorization header if available
    const { data: profile, error } = token
      // @ts-ignore
      ? await selectQuery.withHeaders({ Authorization: `Bearer ${token}` })
      : await selectQuery

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