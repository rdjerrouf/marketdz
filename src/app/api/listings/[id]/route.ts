// src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = await params

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          phone,
          city,
          wilaya
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = await params

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
      status,
      // Category-specific fields
      available_from,
      available_to,
      rental_period,
      salary_min,
      salary_max,
      job_type,
      company_name,
      condition
    } = body

    // First check if the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user owns the listing
    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update the listing
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory
    if (price !== undefined) {
      // Set price to null for services, keep jobs and other categories as they were
      updateData.price = category === 'service' ? null : price
    }
    if (location_city !== undefined) updateData.location_city = location_city
    if (location_wilaya !== undefined) updateData.location_wilaya = location_wilaya
    if (photos !== undefined) updateData.photos = photos
    if (metadata !== undefined) updateData.metadata = metadata
    if (status !== undefined) updateData.status = status
    // Category-specific fields
    if (available_from !== undefined) updateData.available_from = available_from
    if (available_to !== undefined) updateData.available_to = available_to
    if (rental_period !== undefined) updateData.rental_period = rental_period
    if (salary_min !== undefined) updateData.salary_min = salary_min
    if (salary_max !== undefined) updateData.salary_max = salary_max
    if (job_type !== undefined) updateData.job_type = job_type
    if (company_name !== undefined) updateData.company_name = company_name
    if (condition !== undefined) updateData.condition = condition

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating listing:', error)
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = await params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user owns the listing
    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting listing:', error)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}