#!/usr/bin/env node
/**
 * Create First Super Admin
 *
 * This script promotes a user to super_admin role.
 * Run this once after applying the admin system migration.
 *
 * Usage: node scripts/create-first-admin.js [email]
 * Example: node scripts/create-first-admin.js rdjerrouf@gmail.com
 */

const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createSuperAdmin(email) {
  console.log('🚀 Creating Super Admin Account\n');
  console.log(`📧 Email: ${email}\n`);

  try {
    // Step 1: Find user's profile
    console.log('1️⃣  Looking up user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error: User not found');
      console.error('   Make sure the user has signed up first');
      console.error('   Error:', profileError?.message || 'User does not exist');
      process.exit(1);
    }

    console.log(`✅ Found user: ${profile.first_name} ${profile.last_name}`);
    console.log(`   User ID: ${profile.id}\n`);

    // Step 2: Check if already an admin
    console.log('2️⃣  Checking existing admin status...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (existingAdmin) {
      console.log('⚠️  User is already an admin');
      console.log(`   Current role: ${existingAdmin.role}`);
      console.log(`   Active: ${existingAdmin.is_active}`);

      if (existingAdmin.role === 'super_admin') {
        console.log('\n✅ User is already a super_admin. Nothing to do!');
        return;
      }

      // Upgrade to super_admin
      console.log('\n3️⃣  Upgrading to super_admin...');
      const { error: upgradeError } = await supabase
        .from('admin_users')
        .update({
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAdmin.id);

      if (upgradeError) {
        console.error('❌ Error upgrading admin:', upgradeError.message);
        process.exit(1);
      }

      console.log('✅ Upgraded to super_admin!\n');
      return;
    }

    console.log('✅ User is not an admin yet\n');

    // Step 3: Create admin account
    console.log('3️⃣  Creating super_admin account...');
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_users')
      .insert({
        user_id: profile.id,
        role: 'super_admin',
        notes: 'System founder - created via seed script',
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating admin:', createError.message);
      process.exit(1);
    }

    console.log('✅ Admin account created successfully!\n');

    // Step 4: Log the action
    console.log('4️⃣  Creating audit log entry...');
    const { error: logError } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: newAdmin.id,
        action: 'admin_created',
        target_type: 'admin',
        target_id: newAdmin.id,
        details: {
          role: 'super_admin',
          method: 'seed_script',
          note: 'First super admin created'
        }
      });

    if (logError) {
      console.log('⚠️  Warning: Could not create audit log (non-critical)');
    } else {
      console.log('✅ Audit log created\n');
    }

    // Success summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 SUCCESS! Super Admin Created');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Name: ${profile.first_name} ${profile.last_name}`);
    console.log(`Role: super_admin`);
    console.log(`Admin ID: ${newAdmin.id}`);
    console.log('═══════════════════════════════════════\n');
    console.log('✅ You can now access the admin panel at:');
    console.log('   http://localhost:3000/admin\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Main
const email = process.argv[2] || 'rdjerrouf@gmail.com';

if (!email) {
  console.error('❌ Error: Email required');
  console.error('Usage: node scripts/create-first-admin.js <email>');
  process.exit(1);
}

createSuperAdmin(email).catch(console.error);
