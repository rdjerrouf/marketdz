// src/app/api/profile/route.ts
// Service role approach - bypasses RLS after auth check
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// Force Node runtime for consistent behavior
export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user with regular client
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS (we've already verified the user)
    const adminClient = createSupabaseAdminClient()

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

    // Update profile using admin client (bypasses RLS)
    // Security: We manually ensure user can only update their own profile via .eq('id', user.id)
    const { data, error } = await adminClient
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
      .eq('id', user.id)  // Security check: only update own profile
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
    // Authenticate user with regular client
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS (we've already verified the user)
    const adminClient = createSupabaseAdminClient()

    // Get the profile - security ensured via .eq('id', user.id)
    const { data: profile, error } = await adminClient
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