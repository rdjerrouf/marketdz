// src/app/api/search/count/route.ts - Dedicated count endpoint for pagination
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  escapeSearchQuery, 
  normalizeSearchQuery,
  validateSearchParams 
} from '@/lib/search/utils';
import { smartRateLimit } from '@/lib/rate-limit/hybrid';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for count endpoint (lower limit since it's more expensive)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    const rateLimitResult = await smartRateLimit(`count:${ip}`, 10, 60000); // 10 requests per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many count requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim();
    const wilaya = searchParams.get('wilaya')?.trim();
    const city = searchParams.get('city')?.trim();
    const minPriceParam = searchParams.get('minPrice')?.trim();
    const maxPriceParam = searchParams.get('maxPrice')?.trim();

    // Normalize and validate search query
    const query = normalizeSearchQuery(rawQuery);

    // Validate parameters
    const validation = validateSearchParams({
      query,
      category,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.errors },
        { status: 400 }
      );
    }

    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

    const supabase = await createServerSupabaseClient();

    // Count-only query (no data fetching for maximum performance)
    let queryBuilder = supabase
      .from('listings')
      .select('*', { count: 'estimated', head: true }) // head: true means no data, count only
      .eq('status', 'active');

    // Apply same filters as main search
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
    
    // Text search filter
    if (query) {
      const escapedQuery = escapeSearchQuery(query);
      queryBuilder = queryBuilder.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('Count query error:', error);
      return NextResponse.json(
        { error: 'Count failed', details: error.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      count: count || 0,
      filters: { query, category, wilaya, city, minPrice, maxPrice }
    });

    // Cache count results for longer (they change less frequently)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60'); // 5 minutes

    return response;

  } catch (error) {
    console.error('Count API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
