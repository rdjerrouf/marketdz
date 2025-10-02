#!/usr/bin/env node
/**
 * Quick setup using signup API
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function createUsers() {
  console.log('👥 Creating test users...\n');

  for (let i = 1; i <= 10; i++) {
    const email = `test${i}@example.com`;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: {
          data: {
            first_name: 'Test',
            last_name: `User ${i}`
          }
        }
      });

      if (error) {
        console.log(`   ℹ️  ${email}: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${email}`);
      }
    } catch (err) {
      console.error(`   ❌ ${email}:`, err.message);
    }
  }

  console.log('\n✅ Complete! Now run: npm run listings:create\n');
}

createUsers().catch(console.error);
