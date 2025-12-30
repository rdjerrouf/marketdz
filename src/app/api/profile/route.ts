/**
 * Profile API Route - User Profile Management
 *
 * ARCHITECTURE: Service Role Pattern
 * =====================================
 * This route uses the "authenticate first, then bypass RLS" pattern to avoid JWT forwarding issues.
 *
 * WHY THIS PATTERN:
 * - In Next.js API routes, JWT tokens don't reliably reach PostgREST for RLS policies
 * - This caused auth.uid() to return NULL → permission denied errors (42501)
 * - Solution: Authenticate with regular client, then use admin client with manual security checks
 *
 * SECURITY MODEL:
 * 1. Authenticate user via getUser() (validates JWT)
 * 2. Use service role client (bypasses RLS)
 * 3. Manually enforce authorization via .eq('id', user.id)
 *
 * See CLAUDE.md "Profile Update Issue" section for full context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

// Force Node runtime for consistent behavior (not Edge runtime)
// Required for reliable database connections and connection pooling
export const runtime = 'nodejs'

/**
 * PUT /api/profile - Update user profile
 *
 * @param request - Contains user authentication and profile data to update
 * @returns Updated profile data or error
 *
 * FLOW:
 * 1. Authenticate user (validates JWT)
 * 2. Extract and validate profile fields
 * 3. Update via admin client (bypasses RLS)
 * 4. Manual security: .eq('id', user.id) ensures users only update their own profile
 */
export async function PUT(request: NextRequest) {
  try {
    // ===== STEP 1: AUTHENTICATION =====
    // Authenticate user with regular client to validate JWT token
    // This ensures the user is who they claim to be before any database operations
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ===== STEP 2: USE SERVICE ROLE CLIENT =====
    // Use admin client to bypass RLS (we've already verified the user above)
    // WHY: Avoids JWT forwarding issues where auth.uid() returns NULL in RLS policies
    // SECURITY: We manually enforce authorization via .eq('id', user.id) below
    const adminClient = createSupabaseAdminClient()

    // Extract profile fields from request body
    const body = await request.json()
    const {
      first_name,
      last_name,
      bio,
      phone,
      city,
      wilaya
    } = body

    // ===== STEP 3: VALIDATION =====
    // Validate required fields before database operation
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // ===== STEP 4: DATABASE UPDATE WITH MANUAL SECURITY =====
    // Update profile using admin client (bypasses RLS)
    // CRITICAL SECURITY: .eq('id', user.id) ensures users can ONLY update their own profile
    // This is our manual authorization check, replacing RLS policy enforcement
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
      .eq('id', user.id)  // ← SECURITY ENFORCEMENT: Only update authenticated user's profile
      .select()
      .single()

    if (error) {
      // Log detailed error information for debugging
      console.error('Profile update error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: (error as any).hint,
      })
      // 42501 = permission denied, 400 = other database errors
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

/**
 * GET /api/profile - Fetch user profile
 *
 * @param request - Contains user authentication
 * @returns User profile data including email
 *
 * FLOW:
 * 1. Authenticate user (validates JWT)
 * 2. Fetch profile via admin client (bypasses RLS)
 * 3. Manual security: .eq('id', user.id) ensures users only fetch their own profile
 * 4. Merge email from auth.users with profile data
 */
export async function GET(request: NextRequest) {
  try {
    // ===== STEP 1: AUTHENTICATION =====
    // Authenticate user with regular client to validate JWT token
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ===== STEP 2: USE SERVICE ROLE CLIENT =====
    // Use admin client to bypass RLS (we've already verified the user above)
    const adminClient = createSupabaseAdminClient()

    // ===== STEP 3: FETCH PROFILE WITH MANUAL SECURITY =====
    // Get the profile - security ensured via .eq('id', user.id)
    // CRITICAL: This prevents users from fetching other users' profiles
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)  // ← SECURITY ENFORCEMENT: Only fetch authenticated user's profile
      .single()

    if (error) {
      // Log detailed error information for debugging
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

    // ===== STEP 4: RETURN COMBINED DATA =====
    // Merge profile data from 'profiles' table with email from 'auth.users' table
    // Why separate? Email is stored in Supabase auth system, profile metadata in our table
    return NextResponse.json({
      data: {
        ...profile,
        email: user.email  // Add email from auth.users to profile data
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