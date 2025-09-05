// src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = params

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
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = params

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
      status
    } = body

    // Check if user owns the listing
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id, category')
      .eq('id', id)
      .single()

    if (fetchError || !existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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

    // Update the listing
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title) updateData.title = title.trim()
    if (description) updateData.description = description.trim()
    if (category) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory?.trim() || null
    if (price !== undefined) updateData.price = category === 'job' ? null : parseFloat(price)
    if (location_city !== undefined) updateData.location_city = location_city?.trim()
    if (location_wilaya !== undefined) updateData.location_wilaya = location_wilaya
    if (photos !== undefined) updateData.photos = photos
    if (metadata !== undefined) updateData.metadata = metadata
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update listing' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const { id } = params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the listing
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

    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Soft delete by updating status
    const { data, error } = await supabase
      .from('listings')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
