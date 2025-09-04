// src/app/api/favorites/[id]/route.ts - Remove from favorites and get favorite status
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { smartRateLimit } from '@/lib/rate-limit/hybrid';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Rate limiting for removing favorites
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitResult = await smartRateLimit(`remove-favorite:${ip}`, 60, 60000); // 60 removes per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabaseClient(request);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const listingId = resolvedParams.id;

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Remove from favorites
    const { error: removeError, count } = await supabase
      .from('favorites')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    if (removeError) {
      console.error('Remove favorite error:', removeError);
      return NextResponse.json(
        { error: 'Failed to remove favorite' },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Removed from favorites successfully',
      removed: true
    });

  } catch (error) {
    console.error('Remove favorite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get favorite status for a specific listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const supabase = await createServerSupabaseClient(request);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { isFavorited: false }
      );
    }

    const listingId = resolvedParams.id;

    // Check if listing is favorited
    const { data: favorite, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .single();

    if (favoriteError && favoriteError.code !== 'PGRST116') {
      console.error('Check favorite error:', favoriteError);
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isFavorited: !!favorite,
      favoriteId: favorite?.id || null
    });

  } catch (error) {
    console.error('Check favorite API error:', error);
    return NextResponse.json(
      { isFavorited: false }
    );
  }
}
