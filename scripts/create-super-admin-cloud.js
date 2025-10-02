#!/usr/bin/env node
/**
 * Create Super Admin User for Cloud Supabase
 * Usage: node scripts/create-super-admin-cloud.js [email]
 */

const { createClient } = require('@supabase/supabase-js');

// Use your cloud Supabase credentials directly
const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybHp3eG9pZ2x6d21obmRwb2xqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY2OTQ3NiwiZXhwIjoyMDcyMjQ1NDc2fQ.VxNa2WISH0Sr6eY_Y9UAckC8LxXcO_UtgKTQ0wVdjT8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function createSuperAdmin(email) {
  console.log('🚀 Creating Super Admin for Cloud Supabase:', email);
  console.log('🌐 Cloud URL:', supabaseUrl);

  try {
    // Find user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ User not found');
      console.error('Error:', profileError?.message || 'User does not exist');
      console.log('\n💡 Make sure the user has signed up first!');
      process.exit(1);
    }

    console.log('✅ Found user:', profile.first_name, profile.last_name);
    console.log('   User ID:', profile.id);

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (existingAdmin) {
      console.log('⚠️  User is already an admin');
      console.log('   Role:', existingAdmin.role);

      if (existingAdmin.role === 'super_admin') {
        console.log('✅ Already a super_admin. Nothing to do!');
        return;
      }

      // Update existing admin to super_admin
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id);

      if (updateError) {
        console.error('❌ Failed to update admin role:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Successfully upgraded to super_admin!');
      return;
    }

    // Create new super admin with minimal required fields
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_users')
      .insert([{
        user_id: profile.id,
        role: 'super_admin',
        status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create super admin:', createError.message);
      process.exit(1);
    }

    console.log('🎉 Successfully created super admin!');
    console.log('   Admin ID:', newAdmin.id);
    console.log('   Role:', newAdmin.role);
    console.log('   Status:', newAdmin.status);

    // Test admin access
    console.log('\n🧪 Testing admin access...');
    const { data: adminTest, error: testError } = await supabase
      .rpc('admin_secure.get_user_role', { p_user_id: profile.id });

    if (testError) {
      console.warn('⚠️  Warning: Could not test admin access:', testError.message);
    } else {
      console.log('✅ Admin access test successful. Role:', adminTest);
    }

    console.log('\n🎯 Next steps:');
    console.log('1. Visit /admin in your app');
    console.log('2. Sign in with:', email);
    console.log('3. You should have full admin access');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Email required');
  console.error('Usage: node scripts/create-super-admin-cloud.js <email>');
  console.error('Example: node scripts/create-super-admin-cloud.js admin@marketdz.com');
  process.exit(1);
}

// Validate email format
if (!email.includes('@')) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

createSuperAdmin(email);