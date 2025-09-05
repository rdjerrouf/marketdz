// src/app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
      metadata
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
      if (photos.length > 3) {
        return NextResponse.json(
          { error: 'Maximum 3 images allowed' },
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

    // Price validation
    if (category !== 'job' && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Price is required and must be greater than 0' },
        { status: 400 }
      )
    }

    // Create the listing
    const { data, error } = await supabase
      .from('listings')
      .insert([{
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory: subcategory?.trim() || null,
        price: category === 'job' ? null : parseFloat(price),
        location_city: location_city?.trim(),
        location_wilaya,
        photos: photos || [],
        metadata: metadata || {},
        status: 'active'
      }])
      .select()
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
    
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (category) {
      query = query.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent')
    }

    if (status) {
      query = query.eq('status', status as 'active' | 'sold' | 'rented' | 'completed' | 'expired')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
