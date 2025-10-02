#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function main() {
  console.log('🔍 Verifying listings...\n');

  const { data, error, count } = await supabase
    .from('listings')
    .select('category', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const stats = {};
  data.forEach(l => {
    stats[l.category] = (stats[l.category] || 0) + 1;
  });

  console.log('📊 Listings Created:');
  Object.entries(stats).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
  console.log(`   TOTAL: ${data.length}\n`);

  // Check for_sale with photos
  const { data: forSale } = await supabase
    .from('listings')
    .select('photos')
    .eq('category', 'for_sale')
    .limit(10);

  const avgForSale = forSale?.reduce((sum, l) => sum + (l.photos?.length || 0), 0) / forSale.length;

  // Check for_rent with photos
  const { data: forRent } = await supabase
    .from('listings')
    .select('photos')
    .eq('category', 'for_rent')
    .limit(10);

  const avgForRent = forRent?.reduce((sum, l) => sum + (l.photos?.length || 0), 0) / forRent.length;

  console.log('📸 Photo Compression Test:');
  console.log(`   for_sale avg photos (sample): ${avgForSale?.toFixed(1)}/3 max`);
  console.log(`   for_rent avg photos (sample): ${avgForRent?.toFixed(1)}/5 max`);
  console.log('\n✅ Test complete!');
}

main();
