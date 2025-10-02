// src/app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizePhoneNumber } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    
    // Check authentication
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
      // New category-specific fields
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
      service_phone
    } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['for_sale', 'job', 'service', 'for_rent']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate images based on category
    if ((category === 'for_sale' || category === 'for_rent')) {
      if (!photos || photos.length === 0) {
        return NextResponse.json(
          { error: 'At least 1 image is required for for_sale and for_rent listings' },
          { status: 400 }
        )
      }
      // Allow 5 photos for rentals, 3 for other categories
      const maxPhotos = category === 'for_rent' ? 5 : 3
      if (photos.length > maxPhotos) {
        return NextResponse.json(
          { error: `Maximum ${maxPhotos} images allowed${category === 'for_rent' ? ' for rentals' : ''}` },
          { status: 400 }
        )
      }
    }

    // Jobs and services should not have images
    if ((category === 'job' || category === 'service') && photos && photos.length > 0) {
      return NextResponse.json(
        { error: 'Images are not allowed for job and service listings' },
        { status: 400 }
      )
    }

    // Enhanced input validation
    if (category !== 'job' && category !== 'service') {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return NextResponse.json(
          { error: 'Price is required and must be a valid positive number' },
          { status: 400 }
        )
      }
    }

    // Validate category-specific enums
    if (rental_period && !['daily', 'weekly', 'monthly', 'yearly'].includes(rental_period)) {
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

    // Create the listing (temporarily without new fields due to schema cache issue)
    const { data, error } = await supabase
      .from('listings')
      .insert([{
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory?.trim() || null,
        price: (category === 'job' || category === 'service') ? null : parseFloat(price),
        location_city: location_city?.trim(),
        location_wilaya,
        photos: photos || [],
        metadata: {
          ...metadata || {},
          // Store new fields in metadata temporarily until schema cache refreshes
          ...(available_from && { available_from }),
          ...(available_to && { available_to }),
          ...(rental_period && { rental_period }),
          ...(salary_min && { salary_min }),
          ...(salary_max && { salary_max }),
          ...(job_type && { job_type }),
          ...(company_name?.trim() && { company_name: company_name.trim() }),
          ...(condition && { condition }),
          // Job application contact fields
          ...(application_email?.trim() && { application_email: application_email.trim() }),
          ...(application_phone?.trim() && { application_phone: normalizePhoneNumber(application_phone.trim()) }),
          ...(application_instructions?.trim() && { application_instructions: application_instructions.trim() }),
          // Service fields
          ...(service_phone?.trim() && { service_phone: normalizePhoneNumber(service_phone.trim()) })
        },
        status: 'active'
      }])
      .select(`
        id, title, description, category, subcategory, price, created_at, status,
        user_id, location_city, location_wilaya, photos, metadata
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId') ?? undefined
    const category = searchParams.get('category') ?? undefined
    const status = searchParams.get('status') ?? undefined

    // Input validation and bounds checking
    const rawPage = Number(searchParams.get('page') ?? '1')
    const rawLimit = Number(searchParams.get('limit') ?? '10')
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 10, 1), 50)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Only get exact count for page 1 to reduce cost
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
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
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
    const headers = !userId ? {
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
