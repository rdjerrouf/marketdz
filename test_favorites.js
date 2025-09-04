#!/usr/bin/env node

/**
 * Quick test script to verify the favorites system is working
 * Run this with: node test_favorites.js
 */

const BASE_URL = 'http://localhost:3000'

async function testFavoritesAPI() {
  console.log('🧪 Testing MarketDZ Favorites System...\n')

  try {
    // Test 1: Check favorites endpoint exists
    console.log('1. Testing GET /api/favorites endpoint...')
    const favoritesResponse = await fetch(`${BASE_URL}/api/favorites`)
    console.log(`   Status: ${favoritesResponse.status}`)
    
    if (favoritesResponse.status === 401) {
      console.log('   ✅ Correctly requires authentication')
    } else if (favoritesResponse.status === 200) {
      const data = await favoritesResponse.json()
      console.log(`   ✅ Endpoint working, returned ${data.favorites?.length || 0} favorites`)
    }

    // Test 2: Test pages exist
    console.log('\n2. Testing favorites page...')
    const pageResponse = await fetch(`${BASE_URL}/favorites`)
    console.log(`   Status: ${pageResponse.status}`)
    
    if (pageResponse.status === 200) {
      console.log('   ✅ Favorites page loads successfully')
    }

    // Test 3: Check if API routes are properly structured
    console.log('\n3. Testing API route structure...')
    
    const testRoutes = [
      '/api/favorites',
      '/api/favorites/test-id'
    ]

    for (const route of testRoutes) {
      const response = await fetch(`${BASE_URL}${route}`)
      console.log(`   ${route}: ${response.status}`)
    }

    console.log('\n✅ Favorites system tests completed!')
    console.log('\nNext steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Sign in to test favorites functionality')
    console.log('3. Try adding/removing favorites from listing cards')
    console.log('4. Visit /favorites to see your saved items')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\nMake sure your development server is running on port 3000')
  }
}

// Only run if called directly
if (require.main === module) {
  testFavoritesAPI()
}

module.exports = { testFavoritesAPI }
