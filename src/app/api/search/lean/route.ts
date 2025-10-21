// src/app/api/search/lean/route.ts - Cost-optimized search for lean launch
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  getListingSelectColumns,
  getProfileSelectColumns,
  applySearchSecurityConstraints,
  validateSearchParams,
  logServiceRoleQuery
} from '@/lib/search-security';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Use admin client to bypass RLS and 3s timeout for public search
    // SECURITY: We enforce status='active' server-side via applySearchSecurityConstraints()
    const supabase = createSupabaseAdminClient();
    const urlSearchParams = request.nextUrl.searchParams;
    
    // Core search parameters
    const query = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
    const subcategory = urlSearchParams.get('subcategory')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const minPrice = urlSearchParams.get('minPrice');
    const maxPrice = urlSearchParams.get('maxPrice');
    const sortBy = urlSearchParams.get('sortBy') || 'created_at';
    const page = parseInt(urlSearchParams.get('page') || '1');
    const limit = Math.min(parseInt(urlSearchParams.get('limit') || '20'), 50); // Max 50 results

    // SECURITY: Validate all parameters
    const validation = validateSearchParams({
      category,
      subcategory,
      wilaya,
      sortBy,
      limit,
      page
    });

    if (!validation.isValid) {
      console.error('❌ Invalid search parameters:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.errors },
        { status: 400 }
      );
    }

    console.log('🔍 Lean Search:', { query, category, subcategory, wilaya, minPrice, maxPrice, page, limit });

    // =================================================================
    // COST CONTROL: Require at least one filter to prevent full scans
    // =================================================================
    const hasFilter = category || subcategory || wilaya || minPrice || maxPrice;
    
    if (!hasFilter && !query) {
      return NextResponse.json({
        error: "Please select at least one filter (category, location, or price) or enter a search term",
        message: "This helps us provide better results faster",
        suggestion: "Try selecting a category or location first"
      }, { status: 400 });
    }

    // =================================================================
    // OPTIMIZED QUERY: Use compound index for efficient filtering
    // PERFORMANCE: No exact count, no profile join for maximum speed
    // SECURITY: Use allowlisted columns only + enforce status='active'
    // =================================================================
    let supabaseQuery = supabase
      .from('listings')
      .select(getListingSelectColumns());

    // CRITICAL: Apply security constraints (enforces status='active')
    supabaseQuery = applySearchSecurityConstraints(supabaseQuery);

    // Apply filters in order of index efficiency
    if (category && ['for_sale', 'job', 'service', 'for_rent'].includes(category)) {
      supabaseQuery = supabaseQuery.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent');
    }

    if (subcategory) {
      supabaseQuery = supabaseQuery.eq('subcategory', subcategory);
    }

    if (wilaya) {
      supabaseQuery = supabaseQuery.eq('location_wilaya', wilaya);
    }

    // Price range filtering
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        supabaseQuery = supabaseQuery.gte('price', min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        supabaseQuery = supabaseQuery.lte('price', max);
      }
    }

    // Full-text search using pre-computed search vectors (uses GIN indexes)
    // CRITICAL: Use search_vector_ar/fr instead of to_tsvector() to avoid 4.5s timeouts
    if (query) {
      // Search both Arabic and French vectors for multilingual support
      // This uses the idx_listings_fts_ar and idx_listings_fts_fr GIN indexes
      supabaseQuery = supabaseQuery.or(
        `search_vector_ar.wfts.${query},search_vector_fr.wfts.${query}`
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        supabaseQuery = supabaseQuery.order('price', { ascending: true });
        break;
      case 'price_high':
        supabaseQuery = supabaseQuery.order('price', { ascending: false });
        break;
      case 'newest':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
      case 'popular':
        supabaseQuery = supabaseQuery.order('favorites_count', { ascending: false });
        break;
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data: listings, error } = await supabaseQuery;

    if (error) {
      console.error('🚨 Search error:', error);
      return NextResponse.json({
        error: 'Search failed',
        details: error.message
      }, { status: 500 });
    }

    const resultCount = listings?.length || 0;
    console.log(`✅ Search completed: ${resultCount} results`);

    // SECURITY: Log service role query for audit trail
    logServiceRoleQuery({
      endpoint: '/api/search/lean',
      filters: { category, subcategory, wilaya, query },
      resultCount,
      executionTime: Date.now() - startTime
    });

    // Lazy load profiles for displayed results only (max 50 profiles)
    const userIds = [...new Set((listings || []).map((l: any) => l.user_id))];
    let profileById = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(getProfileSelectColumns())  // Use allowlisted columns
        .in('id', userIds);

      profileById = new Map((profiles || []).map(p => [p.id, p]));
    }

    // Merge profiles into listings
    const listingsWithProfiles = (listings || []).map((listing: any) => ({
      ...listing,
      profiles: profileById.get(listing.user_id) || null
    }));

    // Calculate pagination (heuristic without expensive count)
    const hasNextPage = (listings?.length || 0) === limit;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      listings: listingsWithProfiles,
      pagination: {
        currentPage: page,
        totalPages: null,  // Unknown without expensive count
        totalItems: null,  // Unknown without expensive count
        hasNextPage,
        hasPreviousPage,
        limit
      },
      searchParams: {
        query,
        category,
        subcategory,
        wilaya,
        minPrice,
        maxPrice,
        sortBy
      },
      performance: {
        resultsCount: listings?.length || 0,
        searchStrategy: 'lean_optimized',
        indexesUsed: [
          'status + category + location_wilaya', 
          query ? 'full_text_search' : null
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('🚨 Search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Please try again in a moment'
    }, { status: 500 });
  }
}