// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reviewedId = searchParams.get('reviewed_id')
    const reviewerId = searchParams.get('reviewer_id')
    const listingId = searchParams.get('listing_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('reviews')
      .select(`
        id,
        reviewer_id,
        reviewed_id,
        listing_id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(
          first_name,
          last_name,
          avatar_url
        ),
        reviewed:profiles!reviews_reviewed_id_fkey(
          first_name,
          last_name,
          avatar_url
        ),
        listing:listings(title)
      `)

    if (reviewedId) {
      query = query.eq('reviewed_id', reviewedId)
    }
    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId)
    }
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }

    const { data: reviews, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewer_id, reviewed_id, listing_id, rating, comment } = body

    // Validate required fields
    if (!reviewer_id || !reviewed_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: reviewer_id, reviewed_id, rating' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if review already exists for this combination
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewer_id)
      .eq('reviewed_id', reviewed_id)
      .eq('listing_id', listing_id || null)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this listing' },
        { status: 409 }
      )
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id,
        reviewed_id,
        listing_id: listing_id || null,
        rating,
        comment: comment || null
      }])
      .select(`
        id,
        reviewer_id,
        reviewed_id,
        listing_id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error in reviews POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
