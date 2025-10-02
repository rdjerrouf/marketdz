#!/usr/bin/env node
/**
 * Verify listings creation and photo compression
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔍 Verifying listings and photo compression...\n');

  // Get total count by category
  const { data: categoryStats, error: categoryError } = await supabase
    .from('listings')
    .select('category');

  if (categoryError) {
    console.error('❌ Error:', categoryError.message);
    return;
  }

  const stats = categoryStats.reduce((acc, listing) => {
    acc[listing.category] = (acc[listing.category] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Listings by Category:');
  Object.entries(stats).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`);
  });
  console.log(`   TOTAL: ${categoryStats.length}\n`);

  // Get photo stats
  const { data: forSaleWithPhotos } = await supabase
    .from('listings')
    .select('id, photos')
    .eq('category', 'for_sale')
    .not('photos', 'is', null);

  const { data: forRentWithPhotos } = await supabase
    .from('listings')
    .select('id, photos')
    .eq('category', 'for_rent')
    .not('photos', 'is', null);

  const forSalePhotoCounts = forSaleWithPhotos?.filter(l => l.photos && l.photos.length > 0) || [];
  const forRentPhotoCounts = forRentWithPhotos?.filter(l => l.photos && l.photos.length > 0) || [];

  console.log('📸 Photo Statistics:');
  console.log(`   for_sale listings with photos: ${forSalePhotoCounts.length}`);
  if (forSalePhotoCounts.length > 0) {
    const avgPhotos = forSalePhotoCounts.reduce((sum, l) => sum + l.photos.length, 0) / forSalePhotoCounts.length;
    console.log(`   Average photos per for_sale: ${avgPhotos.toFixed(1)}`);
  }

  console.log(`   for_rent listings with photos: ${forRentPhotoCounts.length}`);
  if (forRentPhotoCounts.length > 0) {
    const avgPhotos = forRentPhotoCounts.reduce((sum, l) => sum + l.photos.length, 0) / forRentPhotoCounts.length;
    console.log(`   Average photos per for_rent: ${avgPhotos.toFixed(1)}`);
  }

  // Check storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('listing-photos')
    .list();

  if (!storageError && storageFiles) {
    console.log(`\n☁️  Storage:` );
    console.log(`   Files in listing-photos bucket: ${storageFiles.length}`);

    if (storageFiles.length > 0) {
      const totalSize = storageFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const avgSize = totalSize / storageFiles.length;
      console.log(`   Total storage used: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`   Average file size: ${(avgSize / 1024).toFixed(2)} KB`);
    }
  }

  console.log('\n✅ Verification complete!');
}

main().catch(console.error);
