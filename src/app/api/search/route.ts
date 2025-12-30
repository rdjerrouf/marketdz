/**
 * Search API Route - Full-Text Search with Filters
 *
 * ARCHITECTURE: Admin Client + Manual Security
 * - Uses service role to bypass RLS (public search doesn't need auth)
 * - Enforces status='active' via applySearchSecurityConstraints()
 * - Column allowlisting prevents data leaks
 *
 * PERFORMANCE (250k+ scale):
 * - Uses precomputed search vectors (idx_listings_fts_ar/fr GIN indexes)
 * - No COUNT queries (heuristic pagination instead)
 * - Lazy profile loading (only for results, not joins)
 * - Target: <800ms for full-text + multi-filter queries
 *
 * FEATURES:
 * - Bilingual search (Arabic + French)
 * - Category-specific filters (rentals, jobs, for_sale)
 * - Geographic filtering (wilaya, city)
 * - Price/salary ranges
 */

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
    // Use admin client for public search (bypasses RLS and 3s timeout)
    // SECURITY: status='active' enforced via applySearchSecurityConstraints()
    const supabase = createSupabaseAdminClient();
    const urlSearchParams = request.nextUrl.searchParams;
    const query = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
    const subcategory = urlSearchParams.get('subcategory')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const city = urlSearchParams.get('city')?.trim();
    const minPrice = urlSearchParams.get('minPrice');
    const maxPrice = urlSearchParams.get('maxPrice');
    const sortBy = urlSearchParams.get('sortBy') || 'created_at';

    // Input validation and bounds checking
    const safeLimit = Math.min(Math.max(parseInt(urlSearchParams.get('limit') || '20'), 1), 50);
    const safePage = Math.max(parseInt(urlSearchParams.get('page') || '1'), 1);

    // New category-specific filters
    const availableFrom = urlSearchParams.get('availableFrom');
    const availableTo = urlSearchParams.get('availableTo');
    const rentalPeriod = urlSearchParams.get('rentalPeriod');
    const minSalary = urlSearchParams.get('minSalary');
    const maxSalary = urlSearchParams.get('maxSalary');
    const jobType = urlSearchParams.get('jobType');
    const companyName = urlSearchParams.get('companyName');
    const condition = urlSearchParams.get('condition');

    // SECURITY: Validate all parameters before processing
    const validation = validateSearchParams({
      category,
      subcategory,
      wilaya,
      city,
      sortBy,
      limit: safeLimit,
      page: safePage
    });

    if (!validation.isValid) {
      console.error('❌ Invalid search parameters:', validation.errors);
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.errors },
        { status: 400 }
      );
    }

    console.log('🔍 Search params:', {
      query, category, subcategory, wilaya, city, minPrice, maxPrice, sortBy, safePage, safeLimit,
      availableFrom, availableTo, rentalPeriod, minSalary, maxSalary, jobType, companyName, condition
    });

    // Build the query with explicit column selection
    // PERFORMANCE: No exact count, no profile join for maximum speed at 250k scale
    // SECURITY: Use allowlisted columns only + enforce status='active'
    let supabaseQuery = supabase
      .from('listings')
      .select(getListingSelectColumns());

    // CRITICAL: Apply security constraints (enforces status='active')
    supabaseQuery = applySearchSecurityConstraints(supabaseQuery);

    // Apply filters
    if (category && ['for_sale', 'job', 'service', 'for_rent'].includes(category)) {
      supabaseQuery = supabaseQuery.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent');
    }

    if (subcategory) {
      supabaseQuery = supabaseQuery.eq('subcategory', subcategory);
    }

    if (wilaya) {
      supabaseQuery = supabaseQuery.eq('location_wilaya', wilaya);
    }

    if (city) {
      supabaseQuery = supabaseQuery.eq('location_city', city);
    }

    if (minPrice && !isNaN(parseFloat(minPrice))) {
      supabaseQuery = supabaseQuery.gte('price', parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      supabaseQuery = supabaseQuery.lte('price', parseFloat(maxPrice));
    }

    // Category-specific filters
    if (category === 'for_rent') {
      if (availableFrom) {
        supabaseQuery = supabaseQuery.gte('available_from', availableFrom);
      }
      if (availableTo) {
        supabaseQuery = supabaseQuery.lte('available_to', availableTo);
      }
      if (rentalPeriod) {
        supabaseQuery = supabaseQuery.eq('rental_period', rentalPeriod);
      }
    }

    if (category === 'job') {
      if (minSalary && !isNaN(parseFloat(minSalary))) {
        supabaseQuery = supabaseQuery.gte('salary_min', parseFloat(minSalary));
      }
      if (maxSalary && !isNaN(parseFloat(maxSalary))) {
        supabaseQuery = supabaseQuery.lte('salary_max', parseFloat(maxSalary));
      }
      if (jobType) {
        supabaseQuery = supabaseQuery.eq('job_type', jobType);
      }
      if (companyName) {
        supabaseQuery = supabaseQuery.ilike('company_name', `%${companyName}%`);
      }
    }

    if (category === 'for_sale' && condition) {
      supabaseQuery = supabaseQuery.eq('condition', condition);
    }

    // Full-text search using precomputed vectors (CRITICAL for performance)
    // WHY: to_tsvector() on every query = 4.5s timeout at 250k scale
    // SOLUTION: Use search_vector_ar/fr columns (updated by trigger)
    if (query) {
      // Bilingual search: query both Arabic and French vectors
      // Uses GIN indexes: idx_listings_fts_ar, idx_listings_fts_fr
      // .wfts = websearch full-text search (handles phrases better)
      try {
        supabaseQuery = supabaseQuery.or(
          `search_vector_ar.wfts.${query},search_vector_fr.wfts.${query}`
        );
      } catch (error) {
        console.warn('Full-text search error, falling back to ILIKE:', error);
        // Fallback to ILIKE (slower but works if FTS fails)
        supabaseQuery = supabaseQuery.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,company_name.ilike.%${query}%`
        );
      }
    }

    // Apply sorting with stable secondary order
    switch (sortBy) {
      case 'price_low':
        supabaseQuery = supabaseQuery.order('price', { ascending: true }).order('id', { ascending: true });
        break;
      case 'price_high':
        supabaseQuery = supabaseQuery.order('price', { ascending: false }).order('id', { ascending: false });
        break;
      case 'oldest':
        supabaseQuery = supabaseQuery.order('created_at', { ascending: true }).order('id', { ascending: true });
        break;
      case 'newest':
      case 'created_at':
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false }).order('id', { ascending: false });
        break;
    }

    // Apply pagination
    const offset = (safePage - 1) * safeLimit;
    supabaseQuery = supabaseQuery.range(offset, offset + safeLimit - 1);

    const { data: listings, error } = await supabaseQuery;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    const resultCount = listings?.length || 0;
    console.log(`✅ Found ${resultCount} listings`);

    // Audit logging for service role usage (security requirement)
    logServiceRoleQuery({
      endpoint: '/api/search',
      filters: { category, subcategory, wilaya, query },
      resultCount,
      executionTime: Date.now() - startTime
    });

    // OPTIMIZATION: Lazy load profiles (only for result set, not entire table)
    // Why: Avoids expensive JOIN at 250k scale, loads 20-50 profiles max
    const userIds = [...new Set((listings || []).map((l: any) => l.user_id))];
    let profileById = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select(getProfileSelectColumns())  // Allowlisted columns only
        .in('id', userIds);

      profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
    }

    // Merge profiles into listings
    const listingsWithProfiles = (listings || []).map((listing: any) => ({
      ...listing,
      profiles: profileById.get(listing.user_id) || null
    }));

    // Heuristic pagination (no COUNT for performance)
    // hasNextPage = true if we got a full page (might be more)
    const hasNextPage = (listings?.length || 0) === safeLimit;

    const response = {
      listings: listingsWithProfiles,
      pagination: {
        currentPage: safePage,
        totalPages: null,  // Unknown without expensive count query
        totalItems: null,  // Unknown without expensive count query
        hasNextPage,
        hasPreviousPage: safePage > 1,
        limit: safeLimit
      },
      metadata: {
        executionTime: Date.now() - startTime,  // Duration in milliseconds
        strategy: 'database',
        countStrategy: 'none'  // No count for performance at 250k scale
      }
    };

    // Add caching headers for public content
    const headers = {
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('❌ Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}