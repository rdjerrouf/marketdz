// Debug the search issue
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log('🔍 Debugging search issue...\n');

  // First, let's see what listings exist
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, title, description, status')
    .limit(5);

  console.log('📋 Sample listings:');
  allListings?.forEach(l => {
    console.log(`  ${l.status === 'active' ? '✅' : '❌'} Title: "${l.title}" | Desc: "${l.description?.substring(0, 50)}..."`);
  });
  console.log('');

  // Test 1: Search for "phone" in title
  console.log('🔎 Test 1: title.ilike.%phone%');
  const { data: test1, error: error1 } = await supabase
    .from('listings')
    .select('id, title, description')
    .ilike('title', '%phone%')
    .eq('status', 'active');
  console.log(`   Result: ${test1?.length || 0} matches`);
  test1?.forEach(l => console.log(`   - "${l.title}"`));
  if (error1) console.error('   Error:', error1);
  console.log('');

  // Test 2: Search for "Iphone" in description
  console.log('🔎 Test 2: description.ilike.%Iphone%');
  const { data: test2, error: error2 } = await supabase
    .from('listings')
    .select('id, title, description')
    .ilike('description', '%Iphone%')
    .eq('status', 'active');
  console.log(`   Result: ${test2?.length || 0} matches`);
  test2?.forEach(l => console.log(`   - Title: "${l.title}" | Desc: "${l.description?.substring(0, 50)}"`));
  if (error2) console.error('   Error:', error2);
  console.log('');

  // Test 3: Combined OR search like the API does
  console.log('🔎 Test 3: .or("title.ilike.%Iphone%,description.ilike.%Iphone%")');
  const { data: test3, error: error3 } = await supabase
    .from('listings')
    .select('id, title, description')
    .or('title.ilike.%Iphone%,description.ilike.%Iphone%')
    .eq('status', 'active');
  console.log(`   Result: ${test3?.length || 0} matches`);
  test3?.forEach(l => console.log(`   - Title: "${l.title}" | Desc: "${l.description?.substring(0, 50)}"`));
  if (error3) console.error('   Error:', error3);
  console.log('');

  // Test 4: Check if the listing even exists with "Iphone" in it
  console.log('🔎 Test 4: Find any listing with "Iphone" (any status)');
  const { data: test4 } = await supabase
    .from('listings')
    .select('id, title, description, status')
    .or('title.ilike.%Iphone%,description.ilike.%Iphone%');
  console.log(`   Result: ${test4?.length || 0} matches`);
  test4?.forEach(l => console.log(`   - [${l.status}] Title: "${l.title}" | Desc: "${l.description?.substring(0, 50)}"`));
  console.log('');
}

debug().catch(console.error);
