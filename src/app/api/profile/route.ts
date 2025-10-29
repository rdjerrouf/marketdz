// src/app/api/profile/route.ts
// Cookie-based approach (Next.js standard pattern)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// Force Node runtime for consistent behavior
export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Pass request to enable Authorization header forwarding to PostgREST
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
    // CRITICAL: Pass request to enable Authorization header forwarding to PostgREST
    const supabase = await createServerSupabaseClient(request)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the profile
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