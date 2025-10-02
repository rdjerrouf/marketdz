#!/usr/bin/env node
/**
 * Upload test photos to MarketDZ listings
 * Tests compression and database flow with real photos
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const PHOTOS_DIR = path.join(__dirname, '..', 'test_photos');
const MAX_UPLOADS = 50; // Limit number of photos to upload per listing

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('   Run: npx supabase status');
  console.error('   Then copy the service_role key to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestPhotos() {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    return files.filter(f => f.endsWith('.jpg')).slice(0, MAX_UPLOADS);
  } catch (error) {
    console.error(`❌ Error reading photos directory: ${error.message}`);
    console.error(`   Make sure to run: python3 scripts/download-test-photos.py first`);
    process.exit(1);
  }
}

async function uploadPhotoToStorage(filePath, fileName) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileExt = path.extname(fileName);
    const uniqueName = `test-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;

    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(uniqueName, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (error) throw error;

    return data.path;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}: ${error.message}`);
    return null;
  }
}

async function createTestListing(photoUrls, index) {
  const categories = ['vehicles', 'real_estate', 'electronics', 'furniture', 'clothing'];
  const wilayas = ['16', '31', '9', '25', '13']; // Algiers, Oran, Blida, Constantine, Tlemcen

  const category = categories[index % categories.length];
  const wilaya = wilayas[index % wilayas.length];

  const listing = {
    title: `Test Listing ${index + 1} - Photo Compression Test`,
    title_ar: `قائمة اختبار ${index + 1} - اختبار ضغط الصور`,
    description: `This is a test listing with ${photoUrls.length} high-resolution photos to test compression and database flow.`,
    description_ar: `هذه قائمة اختبارية تحتوي على ${photoUrls.length} صورة عالية الدقة لاختبار الضغط وتدفق قاعدة البيانات.`,
    price: Math.floor(Math.random() * 1000000) + 10000,
    category: category,
    wilaya: wilaya,
    photos: photoUrls,
    status: 'active',
  };

  try {
    const { data, error } = await supabase
      .from('listings')
      .insert(listing)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Created listing #${index + 1}: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creating listing #${index + 1}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting test photo upload...\n');

  // Get test photos
  console.log('📸 Reading test photos...');
  const photoFiles = await getTestPhotos();
  console.log(`   Found ${photoFiles.length} photos\n`);

  if (photoFiles.length === 0) {
    console.error('❌ No photos found. Run: python3 scripts/download-test-photos.py');
    process.exit(1);
  }

  // Upload photos in batches
  console.log('☁️  Uploading photos to Supabase Storage...');
  const photoUrls = [];

  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i];
    const filePath = path.join(PHOTOS_DIR, file);
    process.stdout.write(`   Uploading ${i + 1}/${photoFiles.length}: ${file}...`);

    const url = await uploadPhotoToStorage(filePath, file);
    if (url) {
      photoUrls.push(url);
      console.log(' ✅');
    } else {
      console.log(' ❌');
    }
  }

  console.log(`\n📊 Upload Summary:`);
  console.log(`   ✅ Successfully uploaded: ${photoUrls.length}/${photoFiles.length}`);

  // Create test listings with photos
  const photosPerListing = 5;
  const numListings = Math.ceil(photoUrls.length / photosPerListing);

  console.log(`\n📝 Creating ${numListings} test listings with photos...\n`);

  for (let i = 0; i < numListings; i++) {
    const start = i * photosPerListing;
    const end = Math.min(start + photosPerListing, photoUrls.length);
    const listingPhotos = photoUrls.slice(start, end);

    await createTestListing(listingPhotos, i);
  }

  console.log('\n🎉 Test photo upload complete!');
  console.log(`   📸 Total photos uploaded: ${photoUrls.length}`);
  console.log(`   📝 Total listings created: ${numListings}`);
  console.log(`   🔗 View at: ${supabaseUrl.replace('54321', '54323')}`);
}

main().catch(console.error);
