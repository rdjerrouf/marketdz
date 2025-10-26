#!/usr/bin/env node
/**
 * Create 10 Test Users
 * Creates user1@email.com through user10@email.com with password123
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

console.log('🔧 Creating 10 test users...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const wilayas = ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Setif', 'Tlemcen', 'Tizi Ouzou', 'Béjaïa'];

async function createTestUsers() {
  const userIds = [];

  console.log('Creating users user1@email.com through user10@email.com...\n');

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@email.com`;
    const firstName = `User${i}`;
    const lastName = 'Test';
    const wilaya = wilayas[(i - 1) % wilayas.length];

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) {
        console.error(`❌ Error creating ${email}:`, authError.message);
        continue;
      }

      userIds.push({
        id: authData.user.id,
        email,
        firstName,
        lastName,
        wilaya
      });

      console.log(`✅ Created user: ${email} (${wilaya})`);
    } catch (error) {
      console.error(`❌ Unexpected error creating ${email}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${userIds.length} users`);
  console.log(`\nCredentials:`);
  console.log(`  Email: user1@email.com to user10@email.com`);
  console.log(`  Password: password123`);

  return userIds;
}

async function main() {
  try {
    const users = await createTestUsers();

    if (users.length === 0) {
      console.error('\n❌ No users were created');
      process.exit(1);
    }

    console.log('\n✅ All users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
