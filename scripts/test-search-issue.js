// Test search issue with "phone" vs "Iphone"
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSearch() {
  console.log('🔍 Testing search patterns...\n');

  // Test 1: Search for "phone"
  const { data: phoneResults, error: phoneError } = await supabase
    .from('listings')
    .select('id, title, description')
    .or(`title.ilike.%phone%,description.ilike.%phone%`)
    .eq('status', 'active')
    .limit(5);

  console.log('1️⃣ Search for "phone":');
  console.log(`   Found: ${phoneResults?.length || 0} results`);
  phoneResults?.forEach(listing => {
    console.log(`   - ${listing.title}`);
  });
  console.log('');

  // Test 2: Search for "Iphone"
  const { data: iphoneResults, error: iphoneError } = await supabase
    .from('listings')
    .select('id, title, description')
    .or(`title.ilike.%Iphone%,description.ilike.%Iphone%`)
    .eq('status', 'active')
    .limit(5);

  console.log('2️⃣ Search for "Iphone":');
  console.log(`   Found: ${iphoneResults?.length || 0} results`);
  iphoneResults?.forEach(listing => {
    console.log(`   - ${listing.title}`);
  });
  console.log('');

  // Test 3: Check the actual listing data
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, title, description')
    .eq('status', 'active')
    .limit(10);

  console.log('3️⃣ Sample of all active listings:');
  allListings?.forEach(listing => {
    console.log(`   - "${listing.title}"`);
  });
}

testSearch().catch(console.error);
