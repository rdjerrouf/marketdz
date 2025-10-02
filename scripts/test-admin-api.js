#!/usr/bin/env node
/**
 * Test Admin API
 * Tests the /api/admin/check-status endpoint
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing Admin API\n');
console.log('🔧 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminAPI() {
  try {
    // Step 1: Sign in
    console.log('1️⃣  Signing in as admin@marketdz.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@marketdz.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Sign in error:', authError.message);
      process.exit(1);
    }

    console.log('✅ Signed in successfully');
    console.log('   User ID:', authData.user.id);
    console.log('   Session token:', authData.session.access_token.substring(0, 20) + '...');

    // Step 2: Check admin status via API
    console.log('\n2️⃣  Calling /api/admin/check-status...');
    const response = await fetch('http://localhost:3004/api/admin/check-status', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    console.log('   Response status:', response.status);
    console.log('   Response data:', JSON.stringify(data, null, 2));

    if (response.ok && data.isAdmin) {
      console.log('\n═══════════════════════════════════════');
      console.log('🎉 Admin API Test PASSED!');
      console.log('═══════════════════════════════════════');
      console.log('\n✅ Admin Status:');
      console.log('   Is Admin:', data.isAdmin);
      console.log('   Role:', data.adminUser?.role);
      console.log('   Method:', data.method);
      console.log('\n🔗 Ready to access:');
      console.log('   http://localhost:3004/admin');
    } else {
      console.error('\n❌ Test FAILED');
      console.error('Expected: Admin status confirmed');
      console.error('Got:', data);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminAPI().catch(console.error);
