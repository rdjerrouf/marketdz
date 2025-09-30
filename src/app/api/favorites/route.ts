// src/app/api/favorites/route.ts - Enhanced favorites API with rate limiting and better error handling
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { smartRateLimit } from '@/lib/rate-limit/database';

export async function GET(request: NextRequest) {
  try {
    // Enhanced rate limiting: per-user when authenticated, fallback to per-IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // First check IP-based rate limit
    const ipRateLimitResult = await smartRateLimit(`favorites:ip:${ip}`, 60, 60000); // 60 requests per minute per IP

    if (!ipRateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const supabase = await createServerSupabaseClient(request);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Additional per-user rate limiting for authenticated users
    const userRateLimitResult = await smartRateLimit(`favorites:user:${user.id}`, 120, 60000); // 120 requests per minute per user

    if (!userRateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests for this account. Please try again later.' },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 50);
    const offset = (page - 1) * limit;

    // Optimized favorites query with field selection and smart count strategy
    const needExactCount = page === 1;
    const { data: favorites, error: favoritesError, count } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        listing_id,
        listings!inner (
          id,
          title,
          left(description, 160) as description,
          price,
          category,
          location_wilaya,
          location_city,
          photos,
          created_at,
          user_id,
          status,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        )
      `, { count: needExactCount ? 'exact' : 'planned' })
      .eq('user_id', user.id)
      .eq('listings.status', 'active')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Stable secondary sort
      .range(offset, offset + limit - 1);

    if (favoritesError) {
      console.error('Favorites query error:', favoritesError);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedFavorites = (favorites || []).map((fav: any) => ({
      favoriteId: fav.id,
      favoritedAt: fav.created_at,
      listing: {
        id: fav.listings.id,
        title: fav.listings.title,
        description: fav.listings.description,
        price: fav.listings.price,
        category: fav.listings.category,
        wilaya: fav.listings.location_wilaya,
        city: fav.listings.location_city,
        photos: Array.isArray(fav.listings.photos) ? fav.listings.photos.slice(0, 3) : [],
        created_at: fav.listings.created_at,
        user_id: fav.listings.user_id,
        status: fav.listings.status,
        user: fav.listings.profiles ? {
          id: fav.listings.user_id, // Use listing's user_id since we don't select profiles.id
          first_name: fav.listings.profiles.first_name,
          last_name: fav.listings.profiles.last_name,
          avatar_url: fav.listings.profiles.avatar_url,
          city: null, // Removed to reduce data transfer
          wilaya: null, // Removed to reduce data transfer
          rating: null // Removed to reduce data transfer
        } : null
      }
    }));

    // Calculate pagination with smart count strategy
    const totalItems = typeof count === 'number' ? count : undefined;
    const totalPages = totalItems ? Math.ceil(totalItems / limit) : undefined;
    const hasNextPage = needExactCount
      ? (totalPages ? page < totalPages : false)
      : (transformedFavorites.length === limit); // Heuristic for planned count

    const response = NextResponse.json({
      favorites: transformedFavorites,
      pagination: {
        currentPage: page,
        totalPages: needExactCount ? totalPages : undefined,
        totalItems: needExactCount ? totalItems : undefined,
        hasNextPage,
        hasPreviousPage: page > 1,
        limit
      },
      metadata: {
        countStrategy: needExactCount ? 'exact' : 'planned'
      }
    });

    // Cache favorites for short time
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=10');
    
    return response;

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting for adding favorites
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const ipRateLimitResult = await smartRateLimit(`add-favorite:ip:${ip}`, 30, 60000); // 30 adds per minute per IP

    if (!ipRateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const supabase = await createServerSupabaseClient(request);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Additional per-user rate limiting for authenticated users
    const userRateLimitResult = await smartRateLimit(`add-favorite:user:${user.id}`, 50, 60000); // 50 adds per minute per user

    if (!userRateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many favorite additions for this account. Please try again later.' },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Check if listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, status')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found or not active' },
        { status: 404 }
      );
    }

    // Prevent users from favoriting their own listings
    if (listing.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot favorite your own listing' },
        { status: 400 }
      );
    }

    // Add to favorites using proper auth context
    
    const { data: favorite, error: favoriteError } = await supabase
      .from('favorites')
      .upsert(
        {
          user_id: user.id,
          listing_id: listingId
        },
        {
          onConflict: 'user_id,listing_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (favoriteError) {
      console.error('Add favorite error:', favoriteError);
      return NextResponse.json(
        { error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Added to favorites successfully',
      favorite: {
        id: favorite.id,
        user_id: favorite.user_id,
        listing_id: favorite.listing_id,
        created_at: favorite.created_at
      }
    });

  } catch (error) {
    console.error('Add favorite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
