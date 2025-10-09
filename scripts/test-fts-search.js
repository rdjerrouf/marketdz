// Test Full-Text Search implementation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFTSSearch() {
  console.log('🔍 Testing Full-Text Search Implementation\n');

  // Test 1: Check if search vectors exist
  console.log('1️⃣ Checking if search vector columns exist...');
  const { data: columns, error: columnsError } = await supabase
    .from('listings')
    .select('id, title, description, search_vector_ar, search_vector_fr')
    .limit(1);

  if (columnsError) {
    console.error('❌ Error checking columns:', columnsError.message);
    if (columnsError.message.includes('column') && columnsError.message.includes('does not exist')) {
      console.error('⚠️  Search vector columns not found! Migration may not have run.');
      return;
    }
  } else {
    console.log('✅ Search vector columns exist\n');
  }

  // Test 2: Old ILIKE search (for comparison)
  console.log('2️⃣ Testing OLD method (ILIKE) with "phone"...');
  const startIlike = Date.now();
  const { data: ilikeResults, error: ilikeError } = await supabase
    .from('listings')
    .select('id, title, description')
    .or('title.ilike.%phone%,description.ilike.%phone%')
    .eq('status', 'active');

  const ilikeTime = Date.now() - startIlike;
  console.log(`   Found: ${ilikeResults?.length || 0} results in ${ilikeTime}ms`);
  if (ilikeError) console.error('   Error:', ilikeError);
  ilikeResults?.forEach(r => console.log(`   - "${r.title}"`));
  console.log('');

  // Test 3: New FTS search
  console.log('3️⃣ Testing NEW method (FTS) with "phone"...');
  const startFts = Date.now();
  const { data: ftsResults, error: ftsError } = await supabase
    .from('listings')
    .select('id, title, description')
    .or('search_vector_ar.fts.phone,search_vector_fr.fts.phone')
    .eq('status', 'active');

  const ftsTime = Date.now() - startFts;
  console.log(`   Found: ${ftsResults?.length || 0} results in ${ftsTime}ms`);
  if (ftsError) {
    console.error('   ❌ Error:', ftsError);
    console.log('   ⚠️  FTS search failed - may need to check migration status');
  } else {
    ftsResults?.forEach(r => console.log(`   - "${r.title}"`));

    if (ftsTime < ilikeTime) {
      console.log(`   ⚡ FTS is ${(ilikeTime / ftsTime).toFixed(1)}x faster!`);
    }
  }
  console.log('');

  // Test 4: Test with "iphone" (after typo fix)
  console.log('4️⃣ Testing with "iphone" (case-insensitive)...');
  const { data: iphoneResults, error: iphoneError } = await supabase
    .from('listings')
    .select('id, title, description')
    .or('search_vector_ar.fts.iphone,search_vector_fr.fts.iphone')
    .eq('status', 'active');

  console.log(`   Found: ${iphoneResults?.length || 0} results`);
  if (iphoneError) console.error('   Error:', iphoneError);
  iphoneResults?.forEach(r => console.log(`   - "${r.title}" - ${r.description?.substring(0, 50)}`));
  console.log('');

  // Test 5: Sample some listings to verify vector population
  console.log('5️⃣ Checking if vectors are populated for existing listings...');
  const { data: sampleListings } = await supabase
    .from('listings')
    .select('id, title')
    .limit(5);

  console.log(`   Sample of ${sampleListings?.length || 0} listings found`);
  console.log('   (Note: Cannot directly view tsvector values via API)');
  console.log('   Recommendation: Run SQL query in Supabase dashboard:\n');
  console.log('   SELECT id, title, search_vector_ar IS NOT NULL as has_ar, search_vector_fr IS NOT NULL as has_fr FROM listings LIMIT 5;');
}

testFTSSearch().catch(console.error);
