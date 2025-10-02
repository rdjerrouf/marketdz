#!/usr/bin/env node

// Test admin API after authentication fix
const http = require('http');

async function testAdminAPI() {
  console.log('🔍 Testing Admin API After Authentication Fix');
  console.log('===============================================');

  // Test 1: Basic server health
  console.log('\n1. Testing server health...');
  try {
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ Server is healthy');
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return;
  }

  console.log('\n2. Instructions for manual testing:');
  console.log('📝 Open browser to: http://localhost:3000');
  console.log('🔐 Sign in with: test@example.com / password123');
  console.log('🔗 Navigate to: http://localhost:3000/admin/users');
  console.log('');
  console.log('🔍 Or test in browser console:');
  console.log('   fetch("/api/admin/check-status")');
  console.log('     .then(r => r.json())');
  console.log('     .then(data => console.log("Admin Status:", data))');
  console.log('');
  console.log('   fetch("/api/admin/user-management")');
  console.log('     .then(r => r.json())');
  console.log('     .then(data => console.log("User Management:", data))');

  console.log('\n3. Expected results after fix:');
  console.log('   ✅ /api/admin/check-status should return {isAdmin: true}');
  console.log('   ✅ /api/admin/user-management should return users list');
  console.log('   ✅ Admin users page should load without "Not authenticated" error');

  console.log('\n4. If still getting errors:');
  console.log('   🔄 Try refreshing the page');
  console.log('   🚪 Sign out and sign back in');
  console.log('   🧹 Clear browser cache/cookies');
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 400) {
            const error = new Error(`HTTP ${res.statusCode}: ${jsonData.error || 'Unknown error'}`);
            error.statusCode = res.statusCode;
            reject(error);
          } else {
            resolve(jsonData);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

testAdminAPI().catch(console.error);