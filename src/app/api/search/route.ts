// src/app/api/search/route.ts - Production-ready with multi-instance safe rate limiting
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  escapeSearchQuery, 
  normalizeSearchQuery, 
  logSearchAnalytics,
  validateSearchParams 
} from '@/lib/search/utils';
import { smartRateLimit } from '@/lib/rate-limit/hybrid';

export async function GET(request: NextRequest) {
  const startTime = Date.now() // For performance monitoring
  
  try {
    // Production-ready rate limiting with multi-instance safety
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitResult = await smartRateLimit(ip, 30, 60000); // 30 requests per minute
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        },
        { status: 429 }
      );
      
      // Add comprehensive rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
      response.headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
      
      return response;
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim();
    const wilaya = searchParams.get('wilaya')?.trim();
    const city = searchParams.get('city')?.trim();
    const minPriceParam = searchParams.get('minPrice')?.trim();
    const maxPriceParam = searchParams.get('maxPrice')?.trim();
    const sortBy = searchParams.get('sortBy')?.trim() || 'created_at';
    const pageParam = searchParams.get('page')?.trim() || '1';
    const limitParam = searchParams.get('limit')?.trim() || '20';
    const includeCount = searchParams.get('includeCount') === 'true'; // Default false for max performance

    // Normalize and validate search query
    const query = normalizeSearchQuery(rawQuery);

    // Quick validation using utility function
    const validation = validateSearchParams({
      query,
      category,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
      page: parseInt(pageParam),
      limit: parseInt(limitParam)
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.errors },
        { status: 400 }
      );
    }

    // Extract validated parameters with DoS protection
    const page = Math.max(Math.min(parseInt(pageParam) || 1, 500), 1); // Max page 500 to prevent deep scans
    const limit = Math.min(Math.max(parseInt(limitParam) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

    const supabase = await createServerSupabaseClient();

    // Optimized single query with joins to avoid N+1 problem
    // Count disabled by default for maximum performance - use /api/search/count endpoint when needed
    let queryBuilder = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        category,
        location_wilaya,
        location_city,
        photos,
        created_at,
        user_id,
        status,
        profiles!inner (
          id,
          first_name,
          last_name,
          avatar_url,
          city,
          wilaya,
          rating
        )
      `, { count: includeCount ? 'estimated' : undefined }) // No count by default for speed
      .eq('status', 'active');

    // Apply filters with proper escaping
    if (category) {
      queryBuilder = queryBuilder.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent');
    }
    if (wilaya) {
      queryBuilder = queryBuilder.eq('location_wilaya', wilaya);
    }
    if (city) {
      queryBuilder = queryBuilder.eq('location_city', city);
    }
    if (minPrice !== undefined) {
      queryBuilder = queryBuilder.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte('price', maxPrice);
    }
    
    // Secure search implementation with optimized strategy
    if (query) {
      // Use trigram similarity for better performance with fuzzy matching
      // This works best with the gin_trgm_ops indexes we deploy
      const escapedQuery = escapeSearchQuery(query);
      
      // Option 1: Current ILIKE approach (works without additional indexes)
      queryBuilder = queryBuilder.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
      
      // Option 2: Trigram similarity (uncomment when trigram indexes are deployed)
      // queryBuilder = queryBuilder.or(`title.like.%${escapedQuery}%,description.like.%${escapedQuery}%`);
      
      // Option 3: Full-text search (uncomment when FTS indexes are deployed)  
      // const ftsQuery = escapedQuery.split(' ').join(' & ');
      // queryBuilder = queryBuilder.textSearch('fts', ftsQuery);
    }

    // Apply sorting
    if (sortBy === 'price_asc') {
      queryBuilder = queryBuilder.order('price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      queryBuilder = queryBuilder.order('price', { ascending: false });
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: listings, error: listingsError, count } = await queryBuilder;

    if (listingsError) {
      console.error('Listings query error:', listingsError);
      return NextResponse.json(
        { error: 'Search failed', details: listingsError.message },
        { status: 500 }
      );
    }

    // Transform results to consistent format - optimized photo handling
    const transformedListings = (listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      wilaya: listing.location_wilaya,
      city: listing.location_city,
      photos: Array.isArray(listing.photos) ? listing.photos.slice(0, 3) : [], // Limit to 3 photos for performance
      created_at: listing.created_at,
      user_id: listing.user_id,
      status: listing.status,
      user: listing.profiles ? {
        id: listing.profiles.id,
        first_name: listing.profiles.first_name,
        last_name: listing.profiles.last_name,
        avatar_url: listing.profiles.avatar_url,
        city: listing.profiles.city,
        wilaya: listing.profiles.wilaya,
        rating: listing.profiles.rating
      } : null
    }));

    // Calculate pagination from count (when enabled)
    const totalItems = includeCount ? (count || 0) : null;
    const totalPages = totalItems ? Math.ceil(totalItems / limit) : null;

    // Enhanced search analytics with performance metrics
    logSearchAnalytics({
      query: rawQuery,
      category,
      resultsCount: transformedListings.length,
      timestamp: new Date(),
      ip,
      responseTime: Date.now() - startTime
    });

    // Create response with caching headers
    const response = NextResponse.json({
      listings: transformedListings,
      pagination: {
        currentPage: page,
        totalPages: totalPages || 0,
        totalItems: totalItems || 0,
        hasNextPage: totalPages ? page < totalPages : transformedListings.length === limit,
        hasPreviousPage: page > 1,
        hasCount: includeCount // Indicate whether count was requested
      },
      filters: { 
        query, 
        category, 
        wilaya, 
        city, 
        minPrice: minPrice?.toString(), 
        maxPrice: maxPrice?.toString(), 
        sortBy 
      }
    });

    // Add caching headers for performance
    if (!query && (totalItems || 0) > 0) {
      // Cache non-search queries for 60 seconds
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    } else {
      // Short cache for search queries
      response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=5');
    }

    // Add rate limit headers for transparency (sync with actual limit)
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}