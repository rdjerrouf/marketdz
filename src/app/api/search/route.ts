// src/app/api/search/route.ts - Production-ready with enhanced search engine
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  AdvancedSearchEngine,
  SearchCache,
  SearchAnalyticsClass,
  type SearchParams 
} from '@/lib/search/enhanced-utils';
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

    const urlSearchParams = request.nextUrl.searchParams;
    const rawQuery = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const city = urlSearchParams.get('city')?.trim();
    const minPriceParam = urlSearchParams.get('minPrice')?.trim();
    const maxPriceParam = urlSearchParams.get('maxPrice')?.trim();
    const sortBy = urlSearchParams.get('sortBy')?.trim() || 'created_at';
    const pageParam = urlSearchParams.get('page')?.trim() || '1';
    const limitParam = urlSearchParams.get('limit')?.trim() || '20';
    const includeCount = urlSearchParams.get('includeCount') === 'true'; // Default false for max performance

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
    const searchParams: SearchParams = {
      query: query || undefined,
      category: category as 'for_sale' | 'job' | 'service' | 'for_rent' | undefined,
      wilaya: wilaya || undefined,
      city: city || undefined,
      minPrice: minPriceParam ? parseFloat(minPriceParam) : undefined,
      maxPrice: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
      sortBy: sortBy || 'created_at',
      page: Math.max(Math.min(parseInt(pageParam) || 1, 500), 1), // Max page 500 to prevent deep scans
      limit: Math.min(Math.max(parseInt(limitParam) || 20, 1), 100),
      includeCount
    };

    const supabase = await createServerSupabaseClient();
    
    // Initialize advanced search engine
    const searchEngine = new AdvancedSearchEngine(supabase);
    
    // Generate cache key for caching strategy
    const cacheKey = SearchCache.generateKey(searchParams);
    
    // Perform enhanced search
    const result = await searchEngine.search(searchParams);

    // Log performance analytics
    SearchAnalyticsClass.logPerformance(
      result.metadata?.strategy || 'unknown',
      rawQuery,
      result.listings.length,
      result.metadata?.executionTime || 0
    );

    // Enhanced search analytics with performance metrics
    logSearchAnalytics({
      query: rawQuery,
      category,
      resultsCount: result.listings.length,
      timestamp: new Date(),
      ip,
      responseTime: Date.now() - startTime
    });

    // Create response with enhanced metadata
    const response = NextResponse.json({
      listings: result.listings,
      pagination: result.pagination,
      filters: result.filters,
      metadata: result.metadata
    });

    // Add caching headers based on search cache strategy
    const cacheHeaders = SearchCache.getCacheHeaders(searchParams);
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add rate limit headers for transparency
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