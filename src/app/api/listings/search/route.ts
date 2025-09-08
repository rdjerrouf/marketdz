// Example: Optimized API route using connection pooling
// src/app/api/listings/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase, getAuthenticatedServerSupabase, extractJWTFromRequest } from '@/lib/supabase/serverPool'
import { Database } from '@/types/database'

type ListingCategory = Database['public']['Tables']['listings']['Row']['category']

export async function GET(request: NextRequest) {
  const start = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const wilaya = searchParams.get('wilaya')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')

    // Use the pooled server client for public search
    const supabase = getServerSupabase()

    // Build the query
    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        category,
        price,
        location,
        photos,
        created_at,
        profiles:user_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('status', 'active')

    // Apply filters with proper typing
    if (category && category !== 'all') {
      // Type guard to ensure category is valid
      const validCategories: ListingCategory[] = ['for_sale', 'job', 'service', 'for_rent']
      if (validCategories.includes(category as ListingCategory)) {
        query = query.eq('category', category as ListingCategory)
      }
    }
    
    // Handle location filtering (assuming location is JSON with wilaya/city)
    if (wilaya && wilaya !== 'all') {
      query = query.contains('location', { wilaya })
    }
    if (city && city !== 'all') {
      query = query.contains('location', { city })
    }
    
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice))
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice))
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Execute query with optimized ordering
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50) // Prevent large result sets

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const duration = Date.now() - start
    console.log(`Search completed in ${duration}ms, found ${data?.length || 0} results`)

    return NextResponse.json({ 
      listings: data,
      meta: {
        count: data?.length || 0,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    const duration = Date.now() - start
    console.error('Search API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      meta: { duration_ms: duration }
    }, { status: 500 })
  }
}

// Example: Authenticated endpoint using connection pooling
export async function POST(request: NextRequest) {
  try {
    // Extract JWT for authenticated operations
    const jwt = extractJWTFromRequest(request)
    if (!jwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use authenticated client that respects user permissions
    const supabase = getAuthenticatedServerSupabase(jwt)
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    const body = await request.json()
    const { title, description, category, price, location } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Type guard for category
    const validCategories: ListingCategory[] = ['for_sale', 'job', 'service', 'for_rent']
    if (!validCategories.includes(category as ListingCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create listing with user context
    const { data, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        description,
        category: category as ListingCategory,
        price,
        location,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Create listing error:', error)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    return NextResponse.json({ listing: data })

  } catch (error) {
    console.error('Create listing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
