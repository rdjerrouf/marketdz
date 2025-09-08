import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

interface WilayaFilter {
  wilaya_ids?: number[]
  wilaya_names?: string[]
  radius_km?: number
  center_lat?: number
  center_lng?: number
}

interface ListingFilter extends WilayaFilter {
  category?: string
  price_min?: number
  price_max?: number
  limit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/geographic-listings', '')

    // Get all wilayas
    if (path === '/wilayas') {
      const { data, error } = await supabaseClient
        .from('wilayas')
        .select('id, name_en, name_ar, code')
        .order('name_en')

      if (error) throw error

      return new Response(
        JSON.stringify({ wilayas: data }),
        { headers: corsHeaders }
      )
    }

    // Get listings by wilaya
    else if (path === '/by-wilaya') {
      const wilayaParam = url.searchParams.get('wilaya')
      const categoryParam = url.searchParams.get('category')
      const limitParam = url.searchParams.get('limit')

      if (!wilayaParam) {
        return new Response(
          JSON.stringify({ error: 'Wilaya parameter is required' }),
          { status: 400, headers: corsHeaders }
        )
      }

      let query = supabaseClient
        .from('listings')
        .select(`
          id, title, description, price, location_city, location_wilaya,
          category, status, created_at,
          wilayas:wilaya_id (id, name_en, name_ar)
        `)
        .eq('status', 'active')

      // Filter by wilaya (support both name and ID)
      if (isNaN(Number(wilayaParam))) {
        // It's a name, join with wilayas table
        query = query.or(`wilayas.name_en.eq.${wilayaParam},wilayas.name_ar.eq.${wilayaParam}`)
      } else {
        // It's an ID
        query = query.eq('wilaya_id', Number(wilayaParam))
      }

      if (categoryParam) {
        query = query.eq('category', categoryParam)
      }

      if (limitParam) {
        query = query.limit(Number(limitParam))
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify({ listings: data }),
        { headers: corsHeaders }
      )
    }

    // Get listings within radius of a point
    else if (path === '/by-radius') {
      const { latitude, longitude, radius_km = 50, filters = {} } = await req.json()

      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'Latitude and longitude are required' }),
          { status: 400, headers: corsHeaders }
        )
      }

      // Use PostGIS to find listings within radius
      const { data, error } = await supabaseClient.rpc(
        'get_listings_within_radius',
        {
          center_lat: latitude,
          center_lng: longitude,
          radius_km: radius_km,
          category_filter: filters.category || null,
          price_min: filters.price_min || null,
          price_max: filters.price_max || null,
          limit_count: filters.limit || 50
        }
      )

      if (error) throw error

      return new Response(
        JSON.stringify({ listings: data }),
        { headers: corsHeaders }
      )
    }

    // Create geographic subscription channel
    else if (path === '/subscribe') {
      const { wilaya_ids, categories, user_location } = await req.json()

      // Generate a unique channel ID for this geographic subscription
      const channelId = `geo-${wilaya_ids?.join('-') || 'all'}-${categories?.join('-') || 'all'}-${Date.now()}`

      // Store subscription preferences (could be in a subscriptions table)
      const subscriptionData = {
        channel_id: channelId,
        wilaya_ids: wilaya_ids || [],
        categories: categories || [],
        user_location: user_location || null,
        created_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify({
          channel_id: channelId,
          subscription: subscriptionData,
          realtime_channel: `geographic_listing_events:${channelId}`
        }),
        { headers: corsHeaders }
      )
    }

    // Update listing with geographic data
    else if (path === '/update-location' && req.method === 'POST') {
      const { listing_id, latitude, longitude, wilaya_name } = await req.json()

      if (!listing_id || !latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'listing_id, latitude, and longitude are required' }),
          { status: 400, headers: corsHeaders }
        )
      }

      // Find wilaya ID if wilaya_name is provided
      let wilaya_id = null
      if (wilaya_name) {
        const { data: wilayaData } = await supabaseClient
          .from('wilayas')
          .select('id')
          .or(`name_en.eq.${wilaya_name},name_ar.eq.${wilaya_name}`)
          .single()

        if (wilayaData) {
          wilaya_id = wilayaData.id
        }
      }

      // Update listing with geographic data
      const { data, error } = await supabaseClient
        .from('listings')
        .update({
          location_point: `POINT(${longitude} ${latitude})`,
          wilaya_id: wilaya_id
        })
        .eq('id', listing_id)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ updated_listing: data[0] }),
        { headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Geographic Listings Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

// Helper function to create SQL for radius search
function createRadiusSearchSQL(centerLat: number, centerLng: number, radiusKm: number): string {
  return `
    ST_DWithin(
      location_point,
      ST_Point(${centerLng}, ${centerLat}, 4326)::geography,
      ${radiusKm * 1000}
    )
  `
}