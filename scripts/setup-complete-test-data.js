#!/usr/bin/env node
/**
 * Complete test data setup: Create users + listings with photos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const USERS = Array.from({ length: 10 }, (_, i) => ({
  email: `test${i + 1}@example.com`,
  password: 'password123',
  firstName: 'Test',
  lastName: `User ${i + 1}`
}));

async function createUsers() {
  console.log('👥 Creating test users...\n');

  for (const user of USERS) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ℹ️  ${user.email} already exists`);
        } else {
          console.error(`   ❌ Error creating ${user.email}:`, error.message);
        }
      } else {
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName
        });
        console.log(`   ✅ Created ${user.email}`);
      }
    } catch (err) {
      console.error(`   ❌ Unexpected error for ${user.email}:`, err.message);
    }
  }

  console.log('\n✅ User creation complete!\n');
}

async function main() {
  console.log('🚀 MarketDZ Complete Test Data Setup\n');

  await createUsers();

  console.log('📝 Now run: npm run listings:create');
  console.log('   This will create 2000 listings with photos\n');
}

main().catch(console.error);
