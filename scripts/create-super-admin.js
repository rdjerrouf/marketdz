#!/usr/bin/env node
/**
 * Create Super Admin User
 * Usage: node scripts/create-super-admin.js [email]
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  }
);

async function createSuperAdmin(email) {
  console.log('🚀 Creating Super Admin for:', email);

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

      // Upgrade to super_admin
      const { error: upgradeError } = await supabase
        .from('admin_users')
        .update({ role: 'super_admin' })
        .eq('id', existingAdmin.id);

      if (upgradeError) {
        console.error('❌ Error upgrading:', upgradeError.message);
        process.exit(1);
      }

      console.log('✅ Upgraded to super_admin!');
      return;
    }

    // Create admin user
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: profile.id,
        role: 'super_admin',
        notes: 'Initial super admin',
        is_active: true
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin:', adminError.message);
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS!');
    console.log('Email:', email);
    console.log('Role: super_admin');
    console.log('Admin ID:', admin.id);
    console.log('\nYou can now access /admin');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2] || 'test1@example.com';
createSuperAdmin(email).catch(console.error);
