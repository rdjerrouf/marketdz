const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('Creating test users...\n');
  
  for (let i = 1; i <= 10; i++) {
    const email = `test${i}@example.com`;
    const password = 'password123';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: `User ${i}`
      }
    });
    
    if (error) {
      console.error(`❌ Error creating ${email}:`, error.message);
    } else {
      console.log(`✅ Created ${email} (ID: ${data.user.id.slice(0, 8)}...)`);
    }
  }
  
  console.log('\n✅ Done! All test users created with password: password123');
}

createTestUsers().catch(console.error);
