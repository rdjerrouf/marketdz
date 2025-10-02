// Debug script to test favorites functionality
// Run this in your browser console on a listing page

async function debugFavoritesAPI() {
  console.log('🔍 Testing favorites API...');

  // Get a sample listing ID from the page
  const listingId = window.location.pathname.split('/').pop();
  console.log('📋 Testing with listing ID:', listingId);

  try {
    // Test adding to favorites
    console.log('🔍 Attempting to add to favorites...');
    const response = await fetch('/api/favorites', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ listingId })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📋 Response data:', data);

    if (!response.ok) {
      console.error('❌ Error response:', data);
    } else {
      console.log('✅ Success!', data);
    }

  } catch (error) {
    console.error('🚨 Network error:', error);
  }
}

// Also test authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/favorites', {
      method: 'GET',
      credentials: 'same-origin'
    });

    console.log('🔐 Auth check status:', response.status);
    const data = await response.json();
    console.log('🔐 Auth check data:', data);

  } catch (error) {
    console.error('🚨 Auth check failed:', error);
  }
}

console.log('Run: debugFavoritesAPI() to test adding favorites');
console.log('Run: checkAuth() to test authentication');