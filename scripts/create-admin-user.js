#!/usr/bin/env node
/**
 * Create Admin User
 * Creates an admin user in the database for testing
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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating admin user...\n');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    // Step 1: Create auth user
    console.log('1️⃣  Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@marketdz.com',
      password: 'admin123',
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created');
    console.log('   User ID:', authData.user.id);

    // Step 2: Create profile
    console.log('\n2️⃣  Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: 'admin@marketdz.com',
        first_name: 'Admin',
        last_name: 'User',
        status: 'active'
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Profile created');

    // Step 3: Create admin user entry
    console.log('\n3️⃣  Creating admin user entry...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        role: 'super_admin',
        permissions: {},
        is_active: true,
        notes: 'Initial super admin user created via script'
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Admin user error:', adminError.message);
      process.exit(1);
    }

    console.log('✅ Admin user created');
    console.log('   Admin ID:', adminData.id);
    console.log('   Role:', adminData.role);

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Admin User Created Successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\n📧 Email: admin@marketdz.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: super_admin');
    console.log('\n🔗 Login at: http://localhost:3004/admin');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdminUser().catch(console.error);
