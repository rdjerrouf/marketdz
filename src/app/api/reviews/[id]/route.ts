// src/app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        id,
        reviewer_id,
        reviewed_id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id(first_name, last_name, avatar_url),
        reviewed:reviewed_id(first_name, last_name, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: review })
  } catch (error) {
    console.error('Error fetching review:', error)
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
    const { id } = await params
    const body = await request.json()
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        reviewer_id,
        reviewed_id,
        rating,
        comment,
        created_at,
        updated_at,
        reviewer:reviewer_id(first_name, last_name, avatar_url),
        reviewed:reviewed_id(first_name, last_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error updating review:', error)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedReview })
  } catch (error) {
    console.error('Error updating review:', error)
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
    const { id } = await params
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting review:', error)
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}