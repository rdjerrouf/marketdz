/**
 * Search API Route - Full-Text Search with Filters
 *
 * ARCHITECTURE: Admin Client + Manual Security
 * - Uses service role to bypass RLS (public search doesn't need auth)
 * - Enforces status='active' via applySearchSecurityConstraints() (legacy path)
 *   or inside search_listings_v2() (RPC path)
 * - Column allowlisting prevents data leaks
 *
 * SEARCH PATHS (flag: APP_CONFIG.features.searchSynonymExpansion):
 * - RPC path (default): search_listings_v2() — cross-language synonym expansion
 *   (FR/EN/MSA/Darija via search_lexicon), Arabic query normalization,
 *   relevance ranking. One round trip. See docs/DAILY_TASK.md 2026-06-11.
 * - Legacy path (kill switch): dual-vector PostgREST .or() — no expansion.
 *
 * PHASE 0: searches with a text query that return 0 rows are logged to
 * search_zero_results — feeds the lexicon and the zero-result-rate KPI.
 *
 * PERFORMANCE (250k+ scale):
 * - Uses precomputed search vectors (GIN indexes on search_vector_ar/fr)
 * - No COUNT queries (heuristic pagination instead)
 * - Lazy profile loading (only for results, not joins)
 * - Target: <800ms for full-text + multi-filter queries
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/config/app';
import {
  getListingSelectColumns,
  getProfileSelectColumns,
  applySearchSecurityConstraints,
  validateSearchParams,
  logServiceRoleQuery
} from '@/lib/search-security';

// JSONB subcategory detail filters (equality + partial text search)
// Key allowlist prevents column injection; d_ prefix namespaces these from other params
const ALLOWED_DETAIL_KEYS = new Set([
  'moto_type', 'part_category', 'truck_type', 'equipment_type', 'material_type',
  'property_type', 'furnished', 'parking', 'finishing', 'gender', 'age_range',
  'sport_type', 'appliance_type', 'tool_type', 'power_source', 'dedicated_gpu',
  'usage_type', 'catering_included', 'deposit_required', 'driver_included',
  'rate_unit', 'book_language', 'product_type',
  'brand', 'model_name', 'screen_size', 'processor', 'ram_gb', 'storage_gb',
  'size', 'genre',
]);
const TEXT_DETAIL_KEYS = new Set([
  'brand', 'model_name', 'screen_size', 'processor', 'ram_gb', 'storage_gb', 'size', 'genre',
]);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Use admin client for public search (bypasses RLS and 3s timeout)
    // SECURITY: status='active' enforced in both search paths
    const supabase = createSupabaseAdminClient();
    const urlSearchParams = request.nextUrl.searchParams;
    const rawQuery = urlSearchParams.get('q')?.trim() || '';
    if (rawQuery.length > 100) {
      return NextResponse.json(
        { error: 'Query too long (max 100 characters)' },
        { status: 400 }
      );
    }
    const query = rawQuery;
    const category = urlSearchParams.get('category')?.trim();
    const subcategory = urlSearchParams.get('subcategory')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const city = urlSearchParams.get('city')?.trim();
    const minPrice = urlSearchParams.get('minPrice');
    const maxPrice = urlSearchParams.get('maxPrice');
    const sortBy = urlSearchParams.get('sortBy') || 'created_at';
    const locale = urlSearchParams.get('locale')?.trim() || null;

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
    // Vehicle-specific filters
    const vehicleMake = urlSearchParams.get('vehicleMake')?.trim();
    const vehicleTransmission = urlSearchParams.get('vehicleTransmission')?.trim();
    const vehicleFuelType = urlSearchParams.get('vehicleFuelType')?.trim();
    const vehicleYearMin = urlSearchParams.get('vehicleYearMin');
    const vehicleYearMax = urlSearchParams.get('vehicleYearMax');
    const vehicleMileageMax = urlSearchParams.get('vehicleMileageMax');

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
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.errors },
        { status: 400 }
      );
    }

    // Parse d_* detail filters once, shared by both search paths
    const detailsEq: Record<string, string> = {};
    const detailsText: Record<string, string> = {};
    for (const [paramKey, paramValue] of urlSearchParams.entries()) {
      if (!paramKey.startsWith('d_')) continue;
      const detailKey = paramKey.slice(2);
      const value = paramValue.trim();
      if (!value || !ALLOWED_DETAIL_KEYS.has(detailKey)) continue;
      if (TEXT_DETAIL_KEYS.has(detailKey)) {
        detailsText[detailKey] = value;
      } else {
        detailsEq[detailKey] = value;
      }
    }

    const validCategory = category && ['for_sale', 'job', 'service', 'for_rent'].includes(category)
      ? category : undefined;
    // Tokenized make/model matching: "Mazda 3" → each token matches make OR model
    const vehicleMakeTokens = vehicleMake
      ? vehicleMake.trim().split(/\s+/).filter(Boolean).slice(0, 3)
      : [];
    const offset = (safePage - 1) * safeLimit;

    let listings: any[] | null = null;
    let error: any = null;

    if (APP_CONFIG.features.searchSynonymExpansion) {
      // ── RPC path: cross-language expansion + relevance ranking ──
      // Default sort becomes relevance when there's a text query (that's what a
      // search box should do); explicit price/date sorts are honored unchanged.
      const sortForRpc = (sortBy === 'created_at' || sortBy === 'newest') && query
        ? 'relevance' : sortBy;

      const rpc = await supabase.rpc('search_listings_v2', {
        p_query: query || null,
        p_category: validCategory ?? null,
        p_subcategory: subcategory || null,
        p_wilaya: wilaya || null,
        p_city: city || null,
        p_min_price: minPrice && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : null,
        p_max_price: maxPrice && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) : null,
        p_available_from: validCategory === 'for_rent' && availableFrom ? availableFrom : null,
        p_available_to: validCategory === 'for_rent' && availableTo ? availableTo : null,
        p_rental_period: validCategory === 'for_rent' && rentalPeriod ? rentalPeriod : null,
        p_min_salary: validCategory === 'job' && minSalary && !isNaN(parseFloat(minSalary)) ? parseFloat(minSalary) : null,
        p_max_salary: validCategory === 'job' && maxSalary && !isNaN(parseFloat(maxSalary)) ? parseFloat(maxSalary) : null,
        p_job_type: validCategory === 'job' && jobType ? jobType : null,
        p_company_name: validCategory === 'job' && companyName ? companyName : null,
        p_condition: validCategory === 'for_sale' && condition ? condition : null,
        p_vehicle_make: vehicleMakeTokens.length ? vehicleMakeTokens.join(' ') : null,
        p_vehicle_transmission: vehicleTransmission || null,
        p_vehicle_fuel_type: vehicleFuelType || null,
        p_vehicle_year_min: vehicleYearMin && !isNaN(parseInt(vehicleYearMin)) ? parseInt(vehicleYearMin) : null,
        p_vehicle_year_max: vehicleYearMax && !isNaN(parseInt(vehicleYearMax)) ? parseInt(vehicleYearMax) : null,
        p_vehicle_mileage_max: vehicleMileageMax && !isNaN(parseInt(vehicleMileageMax)) ? parseInt(vehicleMileageMax) : null,
        p_details: Object.keys(detailsEq).length ? detailsEq : null,
        p_details_text: Object.keys(detailsText).length ? detailsText : null,
        p_sort: sortForRpc,
        p_limit: safeLimit,
        p_offset: offset
      });
      listings = rpc.data as any[] | null;
      error = rpc.error;
    } else {
      // ── Legacy path (kill switch): dual-vector PostgREST query ──
      let supabaseQuery = supabase
        .from('listings')
        .select(getListingSelectColumns());

      // CRITICAL: Apply security constraints (enforces status='active')
      supabaseQuery = applySearchSecurityConstraints(supabaseQuery);

      if (validCategory) {
        supabaseQuery = supabaseQuery.eq('category', validCategory as 'for_sale' | 'job' | 'service' | 'for_rent');
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
      if (validCategory === 'for_rent') {
        if (availableFrom) {
          supabaseQuery = supabaseQuery.gte('available_from', availableFrom);
        }
        if (availableTo) {
          supabaseQuery = supabaseQuery.lte('available_to', availableTo);
        }
        if (rentalPeriod) {
          supabaseQuery = supabaseQuery.eq('rental_period', rentalPeriod as any);
        }
      }

      if (validCategory === 'job') {
        if (minSalary && !isNaN(parseFloat(minSalary))) {
          supabaseQuery = supabaseQuery.gte('salary_min', parseFloat(minSalary));
        }
        if (maxSalary && !isNaN(parseFloat(maxSalary))) {
          supabaseQuery = supabaseQuery.lte('salary_max', parseFloat(maxSalary));
        }
        if (jobType) {
          supabaseQuery = supabaseQuery.eq('job_type', jobType as any);
        }
        if (companyName) {
          supabaseQuery = supabaseQuery.ilike('company_name', `%${companyName}%`);
        }
      }

      if (validCategory === 'for_sale' && condition) {
        supabaseQuery = supabaseQuery.eq('condition', condition as any);
      }

      // Vehicle-specific filters (each token must match make OR model)
      for (const token of vehicleMakeTokens) {
        const escaped = token.replace(/[%_,]/g, (c) => `\\${c}`);
        supabaseQuery = supabaseQuery.or(
          `vehicle_make.ilike.%${escaped}%,vehicle_model.ilike.%${escaped}%`
        );
      }
      if (vehicleTransmission) {
        supabaseQuery = supabaseQuery.eq('vehicle_transmission', vehicleTransmission as any);
      }
      if (vehicleFuelType) {
        supabaseQuery = supabaseQuery.eq('vehicle_fuel_type', vehicleFuelType as any);
      }
      if (vehicleYearMin && !isNaN(parseInt(vehicleYearMin))) {
        supabaseQuery = supabaseQuery.gte('vehicle_year', parseInt(vehicleYearMin));
      }
      if (vehicleYearMax && !isNaN(parseInt(vehicleYearMax))) {
        supabaseQuery = supabaseQuery.lte('vehicle_year', parseInt(vehicleYearMax));
      }
      if (vehicleMileageMax && !isNaN(parseInt(vehicleMileageMax))) {
        supabaseQuery = supabaseQuery.lte('vehicle_mileage', parseInt(vehicleMileageMax));
      }

      for (const [detailKey, value] of Object.entries(detailsText)) {
        supabaseQuery = supabaseQuery.filter(`listing_details->>${detailKey}`, 'ilike', `%${value}%`);
      }
      for (const [detailKey, value] of Object.entries(detailsEq)) {
        supabaseQuery = supabaseQuery.contains('listing_details', { [detailKey]: value });
      }

      // Full-text search using precomputed vectors (CRITICAL for performance)
      if (query) {
        supabaseQuery = supabaseQuery.or(
          `search_vector_ar.wfts.${query},search_vector_fr.wfts.${query}`
        );
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

      supabaseQuery = supabaseQuery.range(offset, offset + safeLimit - 1);

      const legacy = await supabaseQuery;
      listings = legacy.data as any[] | null;
      error = legacy.error;
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    const resultCount = listings?.length || 0;

    // PHASE 0: log zero-result text searches (first page only, so paging past
    // the end doesn't pollute the log). Feeds search_lexicon curation —
    // see docs/BUDGET_WATCHLIST.md #6.
    if (query && resultCount === 0 && safePage === 1) {
      const { error: logError } = await supabase.from('search_zero_results').insert({
        query,
        locale,
        filters: { category: validCategory ?? null, subcategory: subcategory ?? null, wilaya: wilaya ?? null, city: city ?? null }
      });
      if (logError) {
        console.warn('zero-result log insert failed:', logError.message);
      }
    }

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
    const hasNextPage = resultCount === safeLimit;

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
        strategy: APP_CONFIG.features.searchSynonymExpansion ? 'rpc_v2' : 'database',
        countStrategy: 'none'  // No count for performance at 250k scale
      }
    };

    // Add caching headers for public content
    const headers = {
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
    };

    return NextResponse.json(response, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
