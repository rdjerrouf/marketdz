/**
 * Listings API Route - Create and List Marketplace Items
 *
 * POST - Create new listing
 * GET  - Fetch listings with filters and pagination
 *
 * FEATURES:
 * - Multi-category support (for_sale, for_rent, job, service, urgent)
 * - Category-specific validation (photos, price, salary, urgent fields, etc.)
 * - Phone normalization for WhatsApp integration
 * - Metadata storage for flexible category fields
 * - Urgent category with auto-expiration (48h default)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/utils'

/**
 * POST /api/listings - Create new listing
 * Validates category-specific fields and normalizes contact info
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)

    // Require authentication for creating listings
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      subcategory,
      price,
      location_city,
      location_wilaya,
      photos,
      metadata,
      // Category-specific fields
      available_from,
      available_to,
      rental_period,
      salary_min,
      salary_max,
      job_type,
      company_name,
      condition,
      // Job application fields
      application_email,
      application_phone,
      application_instructions,
      // Service fields
      service_phone,
      // Urgent category fields
      urgent_type,
      urgent_expires_at,
      urgent_contact_preference
    } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['for_sale', 'job', 'service', 'for_rent', 'urgent']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Category-specific photo validation
    // for_sale/for_rent: require photos (1-3 for sale, 1-5 for rent)
    // job/service: no photos allowed
    // urgent: optional photos, max 2
    if ((category === 'for_sale' || category === 'for_rent')) {
      if (!photos || photos.length === 0) {
        return NextResponse.json(
          { error: 'At least 1 image is required for for_sale and for_rent listings' },
          { status: 400 }
        )
      }
      const maxPhotos = category === 'for_rent' ? 5 : 3
      if (photos.length > maxPhotos) {
        return NextResponse.json(
          { error: `Maximum ${maxPhotos} images allowed${category === 'for_rent' ? ' for rentals' : ''}` },
          { status: 400 }
        )
      }
    }

    if ((category === 'job' || category === 'service') && photos && photos.length > 0) {
      return NextResponse.json(
        { error: 'Images are not allowed for job and service listings' },
        { status: 400 }
      )
    }

    if (category === 'urgent' && photos && photos.length > 2) {
      return NextResponse.json(
        { error: 'Maximum 2 images allowed for urgent listings' },
        { status: 400 }
      )
    }

    // Enhanced input validation
    // Price required for for_sale and for_rent only (optional for job, service, urgent)
    if (category !== 'job' && category !== 'service' && category !== 'urgent') {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return NextResponse.json(
          { error: 'Price is required and must be a valid positive number' },
          { status: 400 }
        )
      }
    }

    // Validate category-specific enums
    if (rental_period && !['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(rental_period)) {
      return NextResponse.json(
        { error: 'Invalid rental period' },
        { status: 400 }
      )
    }

    if (condition && !['new', 'like_new', 'good', 'fair', 'poor'].includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition' },
        { status: 400 }
      )
    }

    if (job_type && !['full-time', 'part-time', 'contract', 'freelance', 'internship'].includes(job_type)) {
      return NextResponse.json(
        { error: 'Invalid job type' },
        { status: 400 }
      )
    }

    // Urgent category validation
    if (category === 'urgent') {
      // urgent_type is required
      if (!urgent_type || !['blood_donation', 'medicine_needed', 'food_assistance', 'medical_equipment', 'emergency_housing'].includes(urgent_type)) {
        return NextResponse.json(
          { error: 'Valid urgent type is required (blood_donation, medicine_needed, food_assistance, medical_equipment, emergency_housing)' },
          { status: 400 }
        )
      }

      // urgent_contact_preference is required
      if (!urgent_contact_preference || !['phone', 'whatsapp', 'both'].includes(urgent_contact_preference)) {
        return NextResponse.json(
          { error: 'Valid contact preference is required (phone, whatsapp, both)' },
          { status: 400 }
        )
      }
    }

    // Create listing with category-specific fields
    // IMPORTANT: Phone numbers normalized to +213 format for WhatsApp compatibility
    const { data, error } = await supabase
      .from('listings')
      .insert([{
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory?.trim() || null,
        price: (category === 'job' || category === 'service' || category === 'urgent') ? null : parseFloat(price),
        location_city: location_city?.trim(),
        location_wilaya,
        photos: photos || [],
        // Category-specific columns (for_rent, job, for_sale)
        available_from: available_from || null,
        available_to: available_to || null,
        rental_period: rental_period || null,
        salary_min: salary_min ? parseInt(salary_min) : null,
        salary_max: salary_max ? parseInt(salary_max) : null,
        job_type: job_type || null,
        company_name: company_name?.trim() || null,
        condition: condition || null,
        // Urgent category columns
        urgent_type: urgent_type || null,
        urgent_expires_at: urgent_expires_at || null, // Trigger sets default 48h if null
        urgent_contact_preference: urgent_contact_preference || null,
        // Contact info stored in metadata (normalized for WhatsApp)
        metadata: {
          ...metadata || {},
          ...(application_email?.trim() && { application_email: application_email.trim() }),
          ...(application_phone?.trim() && { application_phone: normalizePhoneNumber(application_phone.trim()) }),
          ...(application_instructions?.trim() && { application_instructions: application_instructions.trim() }),
          ...(service_phone?.trim() && { service_phone: normalizePhoneNumber(service_phone.trim()) })
        },
        status: 'active'
      }])
      .select(`
        id, title, description, category, subcategory, price, created_at, status,
        user_id, location_city, location_wilaya, photos, metadata,
        available_from, available_to, rental_period, salary_min, salary_max,
        job_type, company_name, condition,
        urgent_type, urgent_expires_at, urgent_contact_preference
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings - Fetch listings with filters
 *
 * Query params:
 * - userId: Filter by owner
 * - category: Filter by type (for_sale, for_rent, job, service)
 * - status: Filter by status (active, sold, rented, etc.)
 * - page, limit: Pagination
 *
 * OPTIMIZATION: Only counts total on page 1 (expensive at scale)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const status = searchParams.get('status') ?? undefined

    // Input validation with bounds (max 50 items per page)
    const rawPage = Number(searchParams.get('page') ?? '1')
    const rawLimit = Number(searchParams.get('limit') ?? '10')
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 10, 1), 50)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // PERFORMANCE: Only count on page 1 (expensive at 250k+ scale)
    const countMode = page === 1 ? 'exact' : 'planned'

    // Validate enum inputs
    if (category) {
      const validCategories = ['for_sale', 'job', 'service', 'for_rent'] as const
      if (!validCategories.includes(category as any)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
    }

    if (status) {
      const validStatus = ['active', 'sold', 'rented', 'completed', 'expired'] as const
      if (!validStatus.includes(status as any)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
    }

    let query = supabase
      .from('listings')
      .select(`
        id, title, description, category, subcategory, price, created_at, status,
        user_id, location_city, location_wilaya, photos, metadata,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `, { count: countMode })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Stable secondary sort
      .range(from, to)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (category) {
      query = query.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent')
    }

    if (status) {
      query = query.eq('status', status as 'active' | 'sold' | 'rented' | 'completed' | 'expired')
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch listings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalItems = typeof count === 'number' ? count : undefined
    const totalPages = totalItems ? Math.ceil(totalItems / limit) : undefined
    const hasNextPage = totalItems ? page < (totalPages || 0) : (data?.length || 0) === limit

    const response = {
      data: data ?? [],
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage: page > 1
      },
      metadata: {
        countStrategy: countMode
      }
    }

    // Add cache headers for public content (if no userId, it's public browsing)
    const headers: Record<string, string> = !userId ? {
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
    } : {}

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
