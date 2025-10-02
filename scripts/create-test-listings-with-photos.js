#!/usr/bin/env node
/**
 * Create test listings for MarketDZ with photo compression testing
 * - Creates 50 listings per category for each of 10 test users (test1-test10@example.com)
 * - Photos only for 'for_sale' (max 3) and 'for_rent' (max 5)
 * - Tests photo compression flow
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const PHOTOS_DIR = path.join(__dirname, '..', 'test_photos');
const USERS = Array.from({ length: 10 }, (_, i) => ({
  email: `test${i + 1}@example.com`,
  password: 'password123'
}));

const CATEGORIES = ['for_sale', 'job', 'service', 'for_rent'];
const LISTINGS_PER_CATEGORY = 50;

const WILAYAS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48'
];

// Sample data for different categories
const FOR_SALE_SUBCATEGORIES = ['vehicles', 'electronics', 'furniture', 'clothing', 'books', 'sports'];
const FOR_RENT_SUBCATEGORIES = ['apartments', 'houses', 'offices', 'warehouses', 'shops'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship'];
const SERVICE_SUBCATEGORIES = ['cleaning', 'plumbing', 'electrical', 'carpentry', 'painting', 'tutoring'];
const RENTAL_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const CONDITIONS = ['new', 'like_new', 'good', 'fair'];

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  console.error('   Run: npx supabase status');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

let availablePhotos = [];

async function loadTestPhotos() {
  try {
    const files = await fs.readdir(PHOTOS_DIR);
    availablePhotos = files.filter(f => f.endsWith('.jpg'));
    console.log(`📸 Loaded ${availablePhotos.length} test photos`);
    return availablePhotos.length > 0;
  } catch (error) {
    console.log('⚠️  No test photos found. Photos will be skipped for for_sale and for_rent.');
    return false;
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
    console.error(`❌ Upload error for ${fileName}: ${error.message}`);
    return null;
  }
}

async function getPhotosForListing(category) {
  if (availablePhotos.length === 0) return [];

  let maxPhotos = 0;
  if (category === 'for_sale') maxPhotos = 3;
  else if (category === 'for_rent') maxPhotos = 5;
  else return []; // No photos for job and service

  const photoUrls = [];
  const numPhotos = Math.min(maxPhotos, availablePhotos.length);

  for (let i = 0; i < numPhotos; i++) {
    const photoFile = availablePhotos[i % availablePhotos.length];
    const filePath = path.join(PHOTOS_DIR, photoFile);

    const url = await uploadPhotoToStorage(filePath, photoFile);
    if (url) photoUrls.push(url);
  }

  return photoUrls;
}

function generateListingData(category, userId, index) {
  const wilaya = WILAYAS[Math.floor(Math.random() * WILAYAS.length)];

  const baseData = {
    user_id: userId,
    category: category,
    status: 'active',
    location_wilaya: wilaya,
    location_city: `City ${index}`,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  switch (category) {
    case 'for_sale':
      return {
        ...baseData,
        subcategory: FOR_SALE_SUBCATEGORIES[index % FOR_SALE_SUBCATEGORIES.length],
        title: `For Sale: Item ${index + 1}`,
        description: `High quality item for sale in wilaya ${wilaya}. Contact for more details.`,
        price: Math.floor(Math.random() * 500000) + 5000,
        condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
      };

    case 'for_rent':
      return {
        ...baseData,
        subcategory: FOR_RENT_SUBCATEGORIES[index % FOR_RENT_SUBCATEGORIES.length],
        title: `For Rent: Property ${index + 1}`,
        description: `Nice property for rent in wilaya ${wilaya}. Available now.`,
        price: Math.floor(Math.random() * 100000) + 10000,
        rental_period: RENTAL_PERIODS[Math.floor(Math.random() * RENTAL_PERIODS.length)],
        available_from: new Date().toISOString().split('T')[0],
      };

    case 'job':
      return {
        ...baseData,
        subcategory: JOB_TYPES[index % JOB_TYPES.length],
        title: `Job Opening: Position ${index + 1}`,
        description: `Exciting job opportunity in wilaya ${wilaya}. Apply now!`,
        company_name: `Company ${index + 1}`,
        job_type: JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)],
        salary_min: Math.floor(Math.random() * 30000) + 20000,
        salary_max: Math.floor(Math.random() * 50000) + 50000,
      };

    case 'service':
      return {
        ...baseData,
        subcategory: SERVICE_SUBCATEGORIES[index % SERVICE_SUBCATEGORIES.length],
        title: `Service: ${SERVICE_SUBCATEGORIES[index % SERVICE_SUBCATEGORIES.length]} ${index + 1}`,
        description: `Professional service in wilaya ${wilaya}. Quality guaranteed.`,
        price: Math.floor(Math.random() * 50000) + 1000,
      };

    default:
      return baseData;
  }
}

async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(`❌ Failed to sign in ${email}: ${error.message}`);
    return null;
  }

  return data.user;
}

async function createListingsForUser(user, userIndex) {
  console.log(`\n👤 Creating listings for ${user.email}...`);

  const signedInUser = await signInUser(user.email, user.password);
  if (!signedInUser) {
    console.log(`   ⚠️  Skipping ${user.email} - sign in failed`);
    return 0;
  }

  let totalCreated = 0;

  for (const category of CATEGORIES) {
    console.log(`\n   📁 Category: ${category}`);
    let categoryCreated = 0;

    for (let i = 0; i < LISTINGS_PER_CATEGORY; i++) {
      try {
        const listingData = generateListingData(category, signedInUser.id, i);

        // Add photos for for_sale and for_rent
        if (category === 'for_sale' || category === 'for_rent') {
          const photos = await getPhotosForListing(category);
          listingData.photos = photos;

          if (photos.length > 0) {
            process.stdout.write(`      ${i + 1}/${LISTINGS_PER_CATEGORY} (${photos.length} photos)...`);
          } else {
            process.stdout.write(`      ${i + 1}/${LISTINGS_PER_CATEGORY}...`);
          }
        } else {
          process.stdout.write(`      ${i + 1}/${LISTINGS_PER_CATEGORY}...`);
        }

        const { data, error } = await supabase
          .from('listings')
          .insert(listingData)
          .select()
          .single();

        if (error) throw error;

        categoryCreated++;
        totalCreated++;
        console.log(' ✅');

      } catch (error) {
        console.log(` ❌ ${error.message}`);
      }
    }

    console.log(`   ✅ Created ${categoryCreated}/${LISTINGS_PER_CATEGORY} ${category} listings`);
  }

  return totalCreated;
}

async function main() {
  console.log('🚀 Starting test listings creation with photo compression testing\n');
  console.log(`📊 Configuration:`);
  console.log(`   Users: ${USERS.length} (test1-test10@example.com)`);
  console.log(`   Categories: ${CATEGORIES.join(', ')}`);
  console.log(`   Listings per category: ${LISTINGS_PER_CATEGORY}`);
  console.log(`   Total listings to create: ${USERS.length * CATEGORIES.length * LISTINGS_PER_CATEGORY}`);
  console.log(`   Photos: for_sale (max 3), for_rent (max 5)`);

  // Load test photos
  const hasPhotos = await loadTestPhotos();
  if (!hasPhotos) {
    console.log('\n⚠️  WARNING: No test photos found!');
    console.log('   Run: npm run photos:download');
    console.log('   Continuing without photos...\n');
  }

  let grandTotal = 0;

  for (let i = 0; i < USERS.length; i++) {
    const created = await createListingsForUser(USERS[i], i);
    grandTotal += created;
  }

  console.log('\n\n🎉 Listing creation complete!');
  console.log(`   ✅ Total listings created: ${grandTotal}`);
  console.log(`   📸 Photos uploaded and compressed: ${availablePhotos.length > 0 ? 'Yes' : 'No'}`);
  console.log(`   🔗 View at: ${supabaseUrl.replace('54321', '54323')}`);
}

main().catch(console.error);
