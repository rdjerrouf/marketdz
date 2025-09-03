// src/app/api/search/route.ts - Simple working version
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const wilaya = searchParams.get('wilaya');
    const city = searchParams.get('city');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = await createServerSupabaseClient();

    // Use simple query approach (skip RPC function for now)
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
        status
      `)
      .eq('status', 'active');

    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }
    if (wilaya) {
      queryBuilder = queryBuilder.eq('location_wilaya', wilaya);
    }
    if (city) {
      queryBuilder = queryBuilder.eq('location_city', city);
    }
    if (minPrice) {
      queryBuilder = queryBuilder.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      queryBuilder = queryBuilder.lte('price', parseFloat(maxPrice));
    }
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
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

    const { data: listings, error: listingsError } = await queryBuilder;

    if (listingsError) {
      console.error('Listings query error:', listingsError);
      return NextResponse.json(
        { error: 'Search failed', details: listingsError.message },
        { status: 500 }
      );
    }

    // Transform results to consistent format
    const transformedListings = (listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category: listing.category,
      wilaya: listing.location_wilaya,
      city: listing.location_city,
      photos: listing.photos || [],
      created_at: listing.created_at,
      user_id: listing.user_id,
      status: listing.status
    }));

    // Get user profiles
    const userIds = [...new Set(transformedListings.map((listing: any) => listing.user_id))];
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, city, wilaya, rating')
        .in('id', userIds);
      profiles = profilesData || [];
    }

    // Enrich listings with user data
    const enrichedListings = transformedListings.map((listing: any) => ({
      ...listing,
      user: profiles.find((profile: any) => profile.id === listing.user_id) || null
    }));

    // Get total count for pagination
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      listings: enrichedListings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: { query, category, wilaya, city, minPrice, maxPrice, sortBy }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}