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
    const page = parseInt(urlSearchParams.get('page') || '1');
    const limit = parseInt(urlSearchParams.get('limit') || '20');

    console.log('🔍 Search params:', { query, category, wilaya, city, minPrice, maxPrice, sortBy, page, limit });

    // Build the query
    let supabaseQuery = supabase
      .from('listings')
      .select(`
        *,
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

    // Text search (simple version)
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        supabaseQuery = supabaseQuery.order('price', { ascending: true });
        break;
      case 'price_high':
        supabaseQuery = supabaseQuery.order('price', { ascending: false });
        break;
      case 'newest':
      case 'created_at':
      default:
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

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
    const totalPages = Math.ceil(totalItems / limit);

    const response = {
      listings: listings || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      metadata: {
        executionTime: Date.now(),
        strategy: 'database'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}