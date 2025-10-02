#!/usr/bin/env node

// Comprehensive authentication diagnostic tool
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybHp3eG9pZ2x6d21obmRwb2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3Mjg3MDAsImV4cCI6MjA0MTMwNDcwMH0.YvA_AW6TdsHKVuLKZajuAf3gYdoXJgVYJxKg4t6D1_A';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runComprehensiveDiagnostic() {
  console.log('🔍 COMPREHENSIVE AUTHENTICATION DIAGNOSTIC');
  console.log('==========================================');

  // 1. Environment Check
  console.log('\n1. ENVIRONMENT CONFIGURATION:');
  console.log('   SUPABASE_URL:', SUPABASE_URL ? '✅ SET' : '❌ MISSING');
  console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
  console.log('   SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING');

  // 2. Supabase Connection Test
  console.log('\n2. SUPABASE CONNECTION TEST:');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Test basic connectivity
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('   ✅ Connection successful');
      console.log('   Profiles count:', data);
    }
  } catch (error) {
    console.log('   ❌ Connection error:', error.message);
  }

  // 3. Check if test accounts exist
  console.log('\n3. USER ACCOUNT VERIFICATION:');

  if (SERVICE_ROLE_KEY) {
    try {
      const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

      // Check auth.users
      const testEmails = ['test@example.com', 'rdjerrouf@gmail.com'];

      for (const email of testEmails) {
        try {
          const { data: users, error } = await adminSupabase.auth.admin.listUsers();

          if (error) {
            console.log(`   ❌ Cannot check auth.users: ${error.message}`);
          } else {
            const user = users.users.find(u => u.email === email);
            if (user) {
              console.log(`   ✅ ${email} exists in auth.users`);
              console.log(`      ID: ${user.id}`);
              console.log(`      Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
              console.log(`      Created: ${user.created_at}`);
            } else {
              console.log(`   ❌ ${email} NOT found in auth.users`);
            }
          }
        } catch (err) {
          console.log(`   ❌ Error checking ${email}:`, err.message);
        }
      }

      // Check profiles table
      console.log('\n   PROFILES TABLE CHECK:');
      const { data: profiles, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('id, email, created_at')
        .in('email', testEmails);

      if (profilesError) {
        console.log('   ❌ Profiles check failed:', profilesError.message);
      } else {
        testEmails.forEach(email => {
          const profile = profiles.find(p => p.email === email);
          if (profile) {
            console.log(`   ✅ ${email} exists in profiles`);
          } else {
            console.log(`   ❌ ${email} NOT found in profiles`);
          }
        });
      }

    } catch (error) {
      console.log('   ❌ Admin queries failed:', error.message);
    }
  } else {
    console.log('   ⚠️ SERVICE_ROLE_KEY not set - cannot check user existence');
  }

  // 4. Test Application Endpoints
  console.log('\n4. APPLICATION ENDPOINT TESTS:');

  const endpoints = [
    { path: '/', name: 'Home' },
    { path: '/signin', name: 'Signin' },
    { path: '/api/health', name: 'Health API' },
    { path: '/api/admin/check-status', name: 'Admin Check API' }
  ];

  for (const endpoint of endpoints) {
    try {
      const status = await testEndpoint(endpoint.path);
      console.log(`   ${status >= 200 && status < 300 ? '✅' : '❌'} ${endpoint.name}: HTTP ${status}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }

  // 5. Authentication Flow Analysis
  console.log('\n5. AUTHENTICATION FLOW ANALYSIS:');
  console.log('   📊 Based on logs, the issue appears to be:');
  console.log('      • App loads successfully (GET /signin 200)');
  console.log('      • Admin page loads (GET /admin 200)');
  console.log('      • Admin layout calls API (GET /api/admin/check-status)');
  console.log('      • API returns "no user" → 401 Unauthorized');
  console.log('      • This suggests: USER IS NOT ACTUALLY SIGNED IN');

  // 6. Recommended Next Steps
  console.log('\n6. RECOMMENDED DIAGNOSTIC STEPS:');
  console.log('   🔍 A. Check if accounts actually exist:');
  if (!SERVICE_ROLE_KEY) {
    console.log('      → Set SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('      → Re-run this diagnostic');
  }

  console.log('   🔍 B. Test manual account creation:');
  console.log('      → Go to http://localhost:3003/signup');
  console.log('      → Create test@example.com with password123');
  console.log('      → Try signing in immediately after');

  console.log('   🔍 C. Check Supabase dashboard:');
  console.log('      → Visit https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj');
  console.log('      → Go to Authentication > Users');
  console.log('      → Check if test accounts exist');

  console.log('   🔍 D. Browser debugging:');
  console.log('      → Open browser dev tools');
  console.log('      → Go to Network tab');
  console.log('      → Try signing in and watch for failed requests');
  console.log('      → Check Application tab > Cookies for auth cookies');

  console.log('\n7. SUPABASE AI CONSULTATION NEEDED:');
  console.log('   📋 Questions for Supabase AI:');
  console.log('      1. Why would supabase.auth.getUser() return null even after signin?');
  console.log('      2. How to debug authentication cookie/session issues?');
  console.log('      3. What are common causes of "INITIAL_SESSION no session" logs?');
  console.log('      4. How to verify if user actually exists in auth.users?');

  console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
  console.log('   1. Check SERVICE_ROLE_KEY configuration');
  console.log('   2. Verify user accounts exist in Supabase dashboard');
  console.log('   3. Try creating fresh test account via signup');
  console.log('   4. Monitor browser network requests during signin');
}

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003, // Use the current port
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run diagnostic
runComprehensiveDiagnostic().catch(console.error);