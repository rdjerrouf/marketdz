// Quick test to check search functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch() {
  console.log('🔍 Testing search for "Iphone"...\n');

  // First, check if the listing exists
  const { data: allListings, error: allError } = await supabase
    .from('listings')
    .select('id, title, description, category, status')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allError) {
    console.error('❌ Error fetching all listings:', allError);
  } else {
    console.log('📋 Recent listings:');
    allListings?.forEach(l => {
      console.log(`  - ${l.title} | ${l.description?.substring(0, 50)} | ${l.status}`);
    });
  }

  console.log('\n🔍 Searching for "Iphone" in title or description...\n');

  // Test the actual search query
  const { data: searchResults, error: searchError } = await supabase
    .from('listings')
    .select('id, title, description, category, status')
    .or(`title.ilike.%Iphone%,description.ilike.%Iphone%`)
    .eq('status', 'active');

  if (searchError) {
    console.error('❌ Search error:', searchError);
  } else {
    console.log(`✅ Found ${searchResults?.length || 0} results:`);
    searchResults?.forEach(l => {
      console.log(`  - ${l.title} | ${l.description}`);
    });
  }

  // Also test case-insensitive
  console.log('\n🔍 Searching for "iphone" (lowercase)...\n');
  const { data: lowerResults, error: lowerError } = await supabase
    .from('listings')
    .select('id, title, description, category, status')
    .or(`title.ilike.%iphone%,description.ilike.%iphone%`)
    .eq('status', 'active');

  if (lowerError) {
    console.error('❌ Search error:', lowerError);
  } else {
    console.log(`✅ Found ${lowerResults?.length || 0} results:`);
    lowerResults?.forEach(l => {
      console.log(`  - ${l.title} | ${l.description}`);
    });
  }
}

testSearch().catch(console.error);
