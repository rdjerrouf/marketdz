// Simple debug script to test auth flow
console.log('🧪 Debug Auth Flow Test');

// Test 1: Check if server is running
fetch('http://localhost:3007/')
  .then(response => {
    console.log('✅ Server is running on port 3007');
    return fetch('http://localhost:3007/api/admin/check-status');
  })
  .then(response => {
    console.log('🔍 Admin check status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Admin check response:', data);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });