#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('🔍 Checking search_vector column...\n');

  // Check if column exists
  const { data: columns, error: e1 } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'listings'
        AND column_name = 'search_vector';
      `
    });

  if (e1) {
    console.log('❌ Error checking column:', e1.message);
    console.log('Trying alternative method...\n');

    // Try selecting the column directly
    const { data: test, error: e2 } = await supabase
      .from('listings')
      .select('id, title, search_vector')
      .limit(1);

    if (e2) {
      console.log('❌ search_vector column does NOT exist');
      console.log('Error:', e2.message);
    } else {
      console.log('✅ search_vector column exists');
      console.log('Sample:', test);
    }
  } else {
    if (columns && columns.length > 0) {
      console.log('✅ search_vector column exists');
      console.log('Details:', columns);
    } else {
      console.log('❌ search_vector column does NOT exist');
    }
  }

  console.log('\n✅ Check complete');
}

main().catch(console.error);
