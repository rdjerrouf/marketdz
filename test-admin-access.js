#!/usr/bin/env node

// Test script to verify admin access
// Run with: node test-admin-access.js

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test admin API endpoints
async function testAdminAccess() {
  console.log('🔍 Testing Admin Access');
  console.log('======================');

  // Test 1: Check if server is running
  console.log('\n1. Testing server connectivity...');
  try {
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ Server is running');
    console.log('📊 Health check:', JSON.stringify(healthResponse, null, 2));
  } catch (error) {
    console.log('❌ Server not running or health endpoint failed');
    console.log('Error:', error.message);
    return;
  }

  // Test 2: Test admin route (should return 401)
  console.log('\n2. Testing admin route without auth...');
  try {
    const adminResponse = await makeRequest('/api/admin/check-status');
    console.log('⚠️ Unexpected success - admin route should require auth');
    console.log('Response:', JSON.stringify(adminResponse, null, 2));
  } catch (error) {
    if (error.statusCode === 401) {
      console.log('✅ Admin route correctly requires authentication (401)');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 3: List available admin API routes
  console.log('\n3. Available admin API routes:');
  console.log('   - GET /api/admin/check-status');
  console.log('   - GET /api/admin/users');
  console.log('   - GET /api/admin/stats');
  console.log('   - GET /api/admin/user-management');

  // Test 4: Admin pages to try in browser
  console.log('\n4. Admin pages to test in browser:');
  console.log('   🌐 Main admin: http://localhost:3000/admin');
  console.log('   👥 Users: http://localhost:3000/admin/users');
  console.log('   📊 Analytics: http://localhost:3000/admin/analytics');
  console.log('   📝 Logs: http://localhost:3000/admin/logs');

  console.log('\n5. Manual testing steps:');
  console.log('   1. Open browser to http://localhost:3000');
  console.log('   2. Sign in with: test@example.com / password123');
  console.log('   3. Navigate to http://localhost:3000/admin');
  console.log('   4. Try admin API in browser console:');
  console.log('      fetch("/api/admin/check-status").then(r=>r.json()).then(console.log)');
}

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + path;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Admin-Test-Script'
      }
    };

    const req = http.request(url, options, (res) => {
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

// Run the test
testAdminAccess().catch(console.error);