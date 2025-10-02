#!/usr/bin/env node
/**
 * Test Admin System
 * Creates a test user and promotes them to super_admin
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.error('Available keys:', Object.keys(envVars));
  process.exit(1);
}

console.log('🔧 Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminSystem() {
  console.log('🧪 Testing Admin System\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣  Creating test user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@marketdz.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      process.exit(1);
    }

    console.log('✅ User created:', authData.user.email);
    console.log('   User ID:', authData.user.id);

    // Step 2: Create profile
    console.log('\n2️⃣  Creating user profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@marketdz.com'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      // Continue anyway - profile might be auto-created by trigger
    } else {
      console.log('✅ Profile created');
    }

    // Step 3: Create admin user
    console.log('\n3️⃣  Promoting to super_admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        role: 'super_admin',
        notes: 'Test super admin created by test script',
        is_active: true
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin:', adminError.message);
      process.exit(1);
    }

    console.log('✅ Admin account created');
    console.log('   Admin ID:', adminData.id);
    console.log('   Role:', adminData.role);

    // Step 4: Test the RPC function
    console.log('\n4️⃣  Testing check_admin_status RPC function...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_admin_status', { check_user_id: authData.user.id });

    if (rpcError) {
      console.error('❌ RPC function error:', rpcError.message);
      process.exit(1);
    }

    if (rpcData && rpcData.length > 0) {
      console.log('✅ RPC function working!');
      console.log('   Returned admin:', rpcData[0]);
    } else {
      console.error('❌ RPC function returned no data');
      process.exit(1);
    }

    // Success!
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Admin System Test PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: admin@marketdz.com');
    console.log('   Password: admin123');
    console.log('\n🔗 Access admin panel:');
    console.log('   http://localhost:3000/admin');
    console.log('\n✨ All admin features are ready to use!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminSystem().catch(console.error);
