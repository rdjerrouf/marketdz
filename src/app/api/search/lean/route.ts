// src/app/api/search/lean/route.ts - Cost-optimized search for lean launch
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);
    const urlSearchParams = request.nextUrl.searchParams;
    
    // Core search parameters
    const query = urlSearchParams.get('q')?.trim() || '';
    const category = urlSearchParams.get('category')?.trim();
    const wilaya = urlSearchParams.get('wilaya')?.trim();
    const minPrice = urlSearchParams.get('minPrice');
    const maxPrice = urlSearchParams.get('maxPrice');
    const sortBy = urlSearchParams.get('sortBy') || 'created_at';
    const page = parseInt(urlSearchParams.get('page') || '1');
    const limit = Math.min(parseInt(urlSearchParams.get('limit') || '20'), 50); // Max 50 results

    console.log('🔍 Lean Search:', { query, category, wilaya, minPrice, maxPrice, page, limit });

    // =================================================================
    // COST CONTROL: Require at least one filter to prevent full scans
    // =================================================================
    const hasFilter = category || wilaya || minPrice || maxPrice;
    
    if (!hasFilter && !query) {
      return NextResponse.json({
        error: "Please select at least one filter (category, location, or price) or enter a search term",
        message: "This helps us provide better results faster",
        suggestion: "Try selecting a category or location first"
      }, { status: 400 });
    }

    // =================================================================
    // OPTIMIZED QUERY: Use compound index for efficient filtering
    // =================================================================
    let supabaseQuery = supabase
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
        favorites_count,
        views_count,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          rating
        )
      `, { count: 'exact' })
      .eq('status', 'active') // Use index
      .range((page - 1) * limit, page * limit - 1) // Pagination
      .limit(limit); // Hard limit

    // Apply filters in order of index efficiency
    if (category && ['for_sale', 'job', 'service', 'for_rent'].includes(category)) {
      supabaseQuery = supabaseQuery.eq('category', category);
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

    // Full-text search (uses GIN index)
    if (query) {
      supabaseQuery = supabaseQuery.textSearch('title,description', query);
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        supabaseQuery = supabaseQuery.order('price', { ascending: true, nullsLast: true });
        break;
      case 'price_high':
        supabaseQuery = supabaseQuery.order('price', { ascending: false, nullsLast: true });
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

    // Execute query
    const { data: listings, error, count } = await supabaseQuery;

    if (error) {
      console.error('🚨 Search error:', error);
      return NextResponse.json({ 
        error: 'Search failed', 
        details: error.message 
      }, { status: 500 });
    }

    // Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    console.log(`✅ Search completed: ${listings?.length || 0} results (${count} total)`);

    return NextResponse.json({
      listings: listings || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        hasNextPage,
        hasPreviousPage,
        limit
      },
      searchParams: {
        query,
        category,
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