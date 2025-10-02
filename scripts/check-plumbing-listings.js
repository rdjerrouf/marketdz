#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function main() {
  console.log('🔍 Checking for "plumbing" listings...\n');

  // Check direct match in title/description
  const { data: directMatch, error: e1 } = await supabase
    .from('listings')
    .select('id, title, description, category, subcategory')
    .or('title.ilike.%plumbing%,description.ilike.%plumbing%')
    .limit(5);

  console.log('📊 Direct ILIKE match:');
  if (e1) console.error('Error:', e1);
  else console.log('Found:', directMatch?.length || 0, 'listings');
  if (directMatch && directMatch.length > 0) {
    directMatch.forEach(l => console.log(`  - ${l.title} (${l.category}/${l.subcategory})`));
  }

  // Check service category with plumbing subcategory
  console.log('\n📊 Service category with plumbing subcategory:');
  const { data: serviceMatch, error: e2 } = await supabase
    .from('listings')
    .select('id, title, description, category, subcategory')
    .eq('category', 'service')
    .eq('subcategory', 'plumbing')
    .limit(5);

  if (e2) console.error('Error:', e2);
  else console.log('Found:', serviceMatch?.length || 0, 'listings');
  if (serviceMatch && serviceMatch.length > 0) {
    serviceMatch.forEach(l => console.log(`  - ${l.title} (${l.subcategory})`));
  }

  // Test the search API endpoint
  console.log('\n📊 Testing /api/search endpoint:');
  try {
    const response = await fetch('http://localhost:3000/api/search?q=plumbing&limit=5');
    const data = await response.json();
    console.log('API Response:', data);
    console.log('Found:', data.listings?.length || 0, 'listings');
    if (data.listings && data.listings.length > 0) {
      data.listings.forEach(l => console.log(`  - ${l.title}`));
    }
  } catch (error) {
    console.error('API Error:', error.message);
  }

  console.log('\n✅ Check complete');
}

main().catch(console.error);
