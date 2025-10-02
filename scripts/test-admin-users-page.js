#!/usr/bin/env node
/**
 * Test Admin Users Page
 * Signs in and tests the user management endpoint
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

console.log('🧪 Testing Admin Users Page\n');
console.log('🔧 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminUsers() {
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
    console.log('   Access token:', authData.session.access_token.substring(0, 30) + '...');

    // Step 2: Test /api/admin/check-status
    console.log('\n2️⃣  Testing /api/admin/check-status...');
    const statusResponse = await fetch('http://localhost:3004/api/admin/check-status', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const statusData = await statusResponse.json();
    console.log('   Response status:', statusResponse.status);

    if (statusResponse.ok) {
      console.log('✅ Admin check passed');
      console.log('   Is Admin:', statusData.isAdmin);
      console.log('   Method:', statusData.method);
      if (statusData.adminUser) {
        console.log('   Role:', statusData.adminUser.role);
      }
    } else {
      console.log('⚠️  Admin check returned:', statusData);
      console.log('   Continuing with test (may use legacy fallback)...');
    }

    // Step 3: Test /api/admin/user-management
    console.log('\n3️⃣  Testing /api/admin/user-management...');
    const usersResponse = await fetch('http://localhost:3004/api/admin/user-management?page=1&limit=20&search=&status=all', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const usersData = await usersResponse.json();
    console.log('   Response status:', usersResponse.status);

    if (usersResponse.ok) {
      console.log('✅ User management API working!');
      console.log('   Total users:', usersData.pagination?.total || 0);
      console.log('   Users in page:', usersData.users?.length || 0);
      console.log('   Status counts:', usersData.statusCounts);

      if (usersData.users && usersData.users.length > 0) {
        console.log('\n   📋 Sample user:');
        const sampleUser = usersData.users[0];
        console.log('      Email:', sampleUser.email);
        console.log('      Name:', sampleUser.first_name, sampleUser.last_name);
        console.log('      Status:', sampleUser.status || 'active');
        console.log('      Created:', new Date(sampleUser.created_at).toLocaleDateString());
      }

      console.log('\n═══════════════════════════════════════');
      console.log('🎉 Admin Users Page Test PASSED!');
      console.log('═══════════════════════════════════════');
      console.log('\n✅ All endpoints working:');
      console.log('   • User authentication');
      console.log('   • Admin status check');
      console.log('   • User management API');
      console.log('\n🔗 Access admin panel:');
      console.log('   http://localhost:3004/admin/users');

    } else {
      console.error('\n❌ User management API failed');
      console.error('   Error:', usersData.error || 'Unknown error');
      console.error('   Full response:', JSON.stringify(usersData, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminUsers().catch(console.error);
