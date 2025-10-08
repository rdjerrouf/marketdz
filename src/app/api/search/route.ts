// src/app/api/search/route.ts - Real database version
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);
    const urlSearchParams = request.nextUrl.searchParams;
    const query = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
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

    console.log('🔍 Search params:', {
      query, category, wilaya, city, minPrice, maxPrice, sortBy, safePage, safeLimit,
      availableFrom, availableTo, rentalPeriod, minSalary, maxSalary, jobType, companyName, condition
    });

    // Build the query with explicit column selection
    // Always use exact count to avoid connection issues
    let supabaseQuery = supabase
      .from('listings')
      .select(`
        id, title, description, price, category, created_at, status,
        user_id, location_wilaya, location_city, photos,
        condition, available_from, available_to, rental_period,
        salary_min, salary_max, job_type, company_name,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'active'); // Only show active listings

    // Apply filters
    if (category && ['for_sale', 'job', 'service', 'for_rent'].includes(category)) {
      supabaseQuery = supabaseQuery.eq('category', category as 'for_sale' | 'job' | 'service' | 'for_rent');
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

    // Full-text search using proper PostgreSQL FTS with bilingual support
    if (query) {
      // Use textSearch for both Arabic and French vectors with ranking
      // This uses the GIN indexes (search_vector_ar, search_vector_fr) for fast searches
      // Note: Supabase .fts operator automatically uses ts_query for proper word matching
      try {
        // Use websearch_to_tsquery format for better phrase handling
        supabaseQuery = supabaseQuery.or(
          `search_vector_ar.fts.${query},search_vector_fr.fts.${query}`
        );
      } catch (error) {
        console.warn('Full-text search error, falling back to ILIKE:', error);
        // Fallback to ILIKE only if FTS fails (shouldn't happen in production)
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

    const { data: listings, error, count } = await supabaseQuery;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${listings?.length || 0} listings`);

    // Calculate pagination info
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / safeLimit);
    const hasNextPage = safePage < totalPages;

    const response = {
      listings: listings || [],
      pagination: {
        currentPage: safePage,
        totalPages,
        totalItems,
        hasNextPage,
        hasPreviousPage: safePage > 1,
        limit: safeLimit
      },
      metadata: {
        executionTime: Date.now(),
        strategy: 'database',
        countStrategy: 'exact'
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