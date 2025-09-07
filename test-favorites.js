// Quick test to check favorites in database
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testFavorites() {
  console.log('🔍 Testing favorites database...')
  
  try {
    // Check all favorites
    const { data: allFavorites, error: allError } = await supabase
      .from('favorites')
      .select('*')
    
    console.log('All favorites:', allFavorites?.length || 0, allError)
    
    // Check favorites with listings
    const { data: favoritesWithListings, error: listingsError } = await supabase
      .from('favorites')
      .select(`
        id,
        user_id,
        created_at,
        listings (
          id,
          title,
          status
        )
      `)
    
    console.log('Favorites with listings:', favoritesWithListings?.length || 0, listingsError)
    
    // Check active listings favorites
    const { data: activeFavorites, error: activeError } = await supabase
      .from('favorites')
      .select(`
        id,
        user_id,
        created_at,
        listings!inner (
          id,
          title,
          status
        )
      `)
      .eq('listings.status', 'active')
    
    console.log('Active favorites:', activeFavorites?.length || 0, activeError)
    
    console.log('Raw data:', JSON.stringify(favoritesWithListings, null, 2))
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

testFavorites()
