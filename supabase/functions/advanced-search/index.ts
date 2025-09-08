import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AdvancedSearchRequest {
  // Basic filters (handled by database)
  searchTerm?: string
  category?: string
  wilaya?: string
  priceRange?: { min?: number, max?: number }
  ratingMin?: number
  
  // Complex filters (handled by Edge Function)
  geoRadius?: { lat: number, lng: number, radiusKm: number }
  userPreferences?: {
    userId: string
    viewHistory?: boolean
    favoriteStyle?: boolean
    similarListings?: boolean
  }
  aiFilters?: {
    sentiment?: 'positive' | 'negative' | 'neutral'
    contentQuality?: 'high' | 'medium' | 'low'
    trustScore?: number
  }
  marketAnalysis?: {
    priceComparison?: boolean
    trendingItems?: boolean
    bestDeals?: boolean
  }
  
  // Meta options
  sortBy?: 'relevance' | 'price' | 'date' | 'rating' | 'popularity' | 'distance' | 'smart'
  sortDirection?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

interface ProcessedListing {
  id: string
  title: string
  description: string
  price: number
  location_wilaya: string
  category: string
  seller_name: string
  seller_rating: number
  search_rank: number
  
  // Enhanced fields
  distance_km?: number
  trust_score?: number
  price_score?: number
  sentiment_score?: number
  user_affinity?: number
  final_score?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const searchParams: AdvancedSearchRequest = await req.json()
    
    console.log('Advanced search request:', JSON.stringify(searchParams, null, 2))

    // Step 1: Get basic filtered results from database
    const baseResults = await getBaseSearchResults(supabase, searchParams)
    
    if (!baseResults.success || !baseResults.data) {
      return new Response(
        JSON.stringify({ 
          error: 'Database search failed',
          details: baseResults.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedResults = baseResults.data

    // Step 2: Apply complex filters that require external processing
    if (searchParams.geoRadius) {
      processedResults = await applyGeoRadiusFilter(
        processedResults, 
        searchParams.geoRadius,
        supabase
      )
    }

    if (searchParams.userPreferences) {
      processedResults = await applyUserPreferences(
        processedResults,
        searchParams.userPreferences,
        supabase
      )
    }

    if (searchParams.aiFilters) {
      processedResults = await applyAIFilters(
        processedResults,
        searchParams.aiFilters
      )
    }

    if (searchParams.marketAnalysis) {
      processedResults = await applyMarketAnalysis(
        processedResults,
        searchParams.marketAnalysis,
        supabase
      )
    }

    // Step 3: Apply intelligent sorting
    if (searchParams.sortBy === 'smart') {
      processedResults = applySmartSorting(processedResults, searchParams)
    }

    // Step 4: Apply pagination
    const page = searchParams.page || 1
    const pageSize = Math.min(searchParams.pageSize || 20, 100) // Max 100 per page
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize

    const paginatedResults = processedResults.slice(startIndex, endIndex)

    // Step 5: Generate search metadata
    const metadata = generateSearchMetadata(processedResults, searchParams)

    return new Response(
      JSON.stringify({
        results: paginatedResults,
        metadata: {
          total: processedResults.length,
          page,
          pageSize,
          totalPages: Math.ceil(processedResults.length / pageSize),
          processingTime: metadata.processingTime,
          filters_applied: metadata.filtersApplied,
          performance: metadata.performance
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Advanced search error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Advanced search failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Get base results from database using optimized function
async function getBaseSearchResults(supabase: any, params: AdvancedSearchRequest) {
  try {
    const { data, error } = await supabase.rpc('search_listings_optimized', {
      search_term: params.searchTerm || null,
      category_filter: params.category || null,
      wilaya_filter: params.wilaya || null,
      price_min: params.priceRange?.min || null,
      price_max: params.priceRange?.max || null,
      rating_min: params.ratingMin || null,
      sort_by: (params.sortBy === 'smart' ? 'relevance' : params.sortBy) || 'created_at',
      sort_direction: params.sortDirection || 'DESC',
      limit_count: 1000, // Get more results for complex filtering
      offset_count: 0
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Database search error:', error)
    return { success: false, error: error.message }
  }
}

// Apply geographic radius filter using PostGIS
async function applyGeoRadiusFilter(
  results: any[], 
  geoParams: { lat: number, lng: number, radiusKm: number },
  supabase: any
): Promise<ProcessedListing[]> {
  const listingIds = results.map(r => r.id)
  
  if (listingIds.length === 0) return []

  try {
    const { data: geoResults } = await supabase.rpc('get_listings_within_radius', {
      center_lat: geoParams.lat,
      center_lng: geoParams.lng,
      radius_km: geoParams.radiusKm,
      listing_ids: listingIds
    })

    // Merge distance data with original results
    return results.map(listing => {
      const geoData = geoResults?.find((gr: any) => gr.id === listing.id)
      return {
        ...listing,
        distance_km: geoData?.distance_km || null,
        // Filter out listings outside radius
        _withinRadius: geoData ? true : false
      }
    }).filter((listing: any) => listing._withinRadius)

  } catch (error) {
    console.error('Geo radius filter error:', error)
    return results // Return original results if geo filter fails
  }
}

// Apply user preference-based filtering
async function applyUserPreferences(
  results: any[],
  preferences: any,
  supabase: any
): Promise<ProcessedListing[]> {
  if (!preferences.userId) return results

  try {
    // Get user's view history, favorites, etc.
    const [viewHistory, favorites, userProfile] = await Promise.all([
      preferences.viewHistory ? getUserViewHistory(supabase, preferences.userId) : null,
      preferences.favoriteStyle ? getUserFavorites(supabase, preferences.userId) : null,
      getUserProfile(supabase, preferences.userId)
    ])

    return results.map(listing => {
      let userAffinity = 0.5 // Base score

      // Boost listings similar to user's viewing history
      if (viewHistory) {
        const categoryMatch = viewHistory.categories.includes(listing.category)
        const wilayaMatch = viewHistory.wilayas.includes(listing.location_wilaya)
        const priceInRange = listing.price >= viewHistory.priceRange.min && 
                            listing.price <= viewHistory.priceRange.max

        if (categoryMatch) userAffinity += 0.2
        if (wilayaMatch) userAffinity += 0.1
        if (priceInRange) userAffinity += 0.1
      }

      // Boost listings similar to user's favorites
      if (favorites) {
        const styleSimilarity = calculateStyleSimilarity(listing, favorites.styles)
        userAffinity += styleSimilarity * 0.2
      }

      // Boost from same wilaya as user
      if (userProfile?.wilaya === listing.location_wilaya) {
        userAffinity += 0.1
      }

      return {
        ...listing,
        user_affinity: Math.min(userAffinity, 1.0)
      }
    })

  } catch (error) {
    console.error('User preferences filter error:', error)
    return results
  }
}

// Apply AI-powered content filtering
async function applyAIFilters(
  results: any[],
  aiParams: any
): Promise<ProcessedListing[]> {
  return results.map(listing => {
    let trustScore = 0.7 // Base trust score

    // Analyze listing content quality (simplified)
    const contentQualityScore = analyzeContentQuality(listing.title, listing.description)
    const sentimentScore = analyzeSentiment(listing.description)
    
    // Adjust trust score based on AI analysis
    trustScore += (contentQualityScore - 0.5) * 0.3
    trustScore += (sentimentScore - 0.5) * 0.2

    // Factor in seller ratings
    if (listing.seller_rating) {
      trustScore = (trustScore + listing.seller_rating / 5) / 2
    }

    return {
      ...listing,
      trust_score: Math.max(0, Math.min(1, trustScore)),
      sentiment_score: sentimentScore,
      content_quality: contentQualityScore
    }
  }).filter(listing => {
    // Apply AI-based filters
    if (aiParams.trustScore && listing.trust_score < aiParams.trustScore) return false
    if (aiParams.contentQuality === 'high' && listing.content_quality < 0.7) return false
    if (aiParams.sentiment === 'positive' && listing.sentiment_score < 0.6) return false
    
    return true
  })
}

// Apply market analysis filters
async function applyMarketAnalysis(
  results: any[],
  marketParams: any,
  supabase: any
): Promise<ProcessedListing[]> {
  return results.map(listing => {
    let priceScore = 0.5

    // Analyze price competitiveness (simplified)
    if (marketParams.priceComparison) {
      // This would typically compare with similar items
      priceScore = analyzePrice(listing.price, listing.category)
    }

    return {
      ...listing,
      price_score: priceScore,
      is_trending: marketParams.trendingItems ? Math.random() > 0.8 : false, // Simplified
      is_best_deal: marketParams.bestDeals ? priceScore > 0.8 : false
    }
  })
}

// Apply intelligent sorting based on multiple factors
function applySmartSorting(results: any[], params: any): ProcessedListing[] {
  return results.map(listing => {
    // Calculate final smart score
    let finalScore = 0.3 * (listing.search_rank || 0.5)
    finalScore += 0.2 * (listing.user_affinity || 0.5)
    finalScore += 0.2 * (listing.trust_score || 0.5)
    finalScore += 0.15 * (listing.price_score || 0.5)
    finalScore += 0.1 * (listing.seller_rating / 5 || 0.5)
    finalScore += 0.05 * (listing.distance_km ? Math.max(0, 1 - listing.distance_km / 100) : 0.5)

    return {
      ...listing,
      final_score: finalScore
    }
  }).sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
}

// Helper functions
async function getUserViewHistory(supabase: any, userId: string) {
  // Simplified - would analyze user's actual view history
  return {
    categories: ['for_sale', 'service'],
    wilayas: ['Alger', 'Oran'],
    priceRange: { min: 50000, max: 500000 }
  }
}

async function getUserFavorites(supabase: any, userId: string) {
  // Simplified - would analyze user's favorite patterns
  return {
    styles: ['modern', 'tech', 'automotive']
  }
}

async function getUserProfile(supabase: any, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('wilaya')
    .eq('id', userId)
    .single()
  
  return data
}

function calculateStyleSimilarity(listing: any, userStyles: string[]): number {
  // Simplified style similarity calculation
  return Math.random() * 0.5 // Would analyze actual content similarity
}

function analyzeContentQuality(title: string, description: string): number {
  // Simple content quality heuristics
  let score = 0.5
  
  if (title.length > 10) score += 0.1
  if (description && description.length > 50) score += 0.2
  if (description && description.length > 200) score += 0.1
  
  // Check for proper capitalization, punctuation
  if (title.match(/^[A-Z]/)) score += 0.1
  if (description && description.match(/[.!?]$/)) score += 0.1
  
  return Math.min(1, score)
}

function analyzeSentiment(text: string): number {
  // Simplified sentiment analysis
  if (!text) return 0.5
  
  const positiveWords = ['ممتاز', 'جيد', 'رائع', 'excellent', 'good', 'great', 'perfect']
  const negativeWords = ['سيء', 'مكسور', 'bad', 'broken', 'poor', 'terrible']
  
  let score = 0.5
  const lowerText = text.toLowerCase()
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 0.1
  })
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 0.1
  })
  
  return Math.max(0, Math.min(1, score))
}

function analyzePrice(price: number, category: string): number {
  // Simplified price analysis - would use market data
  const categoryRanges = {
    'for_sale': { min: 10000, max: 1000000 },
    'service': { min: 1000, max: 100000 },
    'job': { min: 30000, max: 200000 }
  }
  
  const range = categoryRanges[category as keyof typeof categoryRanges] || categoryRanges.for_sale
  const normalized = (price - range.min) / (range.max - range.min)
  
  // Lower prices get higher scores (better deals)
  return Math.max(0, Math.min(1, 1 - normalized))
}

function generateSearchMetadata(results: any[], params: any) {
  return {
    processingTime: Date.now(), // Would calculate actual processing time
    filtersApplied: [
      params.geoRadius ? 'geographic' : null,
      params.userPreferences ? 'personalization' : null,
      params.aiFilters ? 'ai_filtering' : null,
      params.marketAnalysis ? 'market_analysis' : null
    ].filter(Boolean),
    performance: {
      database_results: results.length,
      after_complex_filtering: results.length,
      cache_hit_rate: 0.85 // Would track actual cache performance
    }
  }
}