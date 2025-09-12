#!/usr/bin/env node

/**
 * Quick Mock Data Generator - Simple approach
 * Temporarily removes foreign key constraint to insert mock profiles directly
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

let supabase;

const WILAYAS = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen'];
const ARABIC_NAMES = {
  male: ['Mohamed', 'Ahmed', 'Ali', 'Omar', 'Youcef', 'Karim'],
  female: ['Fatima', 'Aicha', 'Khadija', 'Zahra', 'Amina', 'Sarah']
};
const LAST_NAMES = ['Benaissa', 'Benali', 'Boumediene', 'Brahimi', 'Medjad'];

function initSupabase() {
  supabase = createClient(
    process.env.SUPABASE_URL || 'http://localhost:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  console.log('✅ Supabase initialized');
}

async function removeConstraints() {
  console.log('🔓 Removing foreign key constraints...');
  const { error } = await supabase.rpc('exec', { 
    sql: 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;' 
  });
  if (error) console.log('⚠️ Constraint removal warning:', error.message);
}

async function restoreConstraints() {
  console.log('🔐 Restoring foreign key constraints...');
  const { error } = await supabase.rpc('exec', { 
    sql: 'ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);' 
  });
  if (error) console.log('⚠️ Constraint restoration warning:', error.message);
}

function generateUser() {
  const isMale = Math.random() > 0.5;
  const firstName = faker.helpers.arrayElement(isMale ? ARABIC_NAMES.male : ARABIC_NAMES.female);
  const lastName = faker.helpers.arrayElement(LAST_NAMES);
  const wilaya = faker.helpers.arrayElement(WILAYAS);
  
  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({min:1,max:999})}@example.com`,
    phone: '06' + faker.string.numeric(8),
    city: wilaya + ' Centre',
    wilaya: wilaya,
    rating: Number((Math.random() * 5).toFixed(1)),
    review_count: faker.number.int({ min: 0, max: 20 }),
    is_verified: Math.random() > 0.8,
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
}

function generateListing(userId, userWilaya, userCity) {
  const category = faker.helpers.arrayElement(['for_sale', 'job', 'service', 'for_rent']);
  const subcategories = {
    for_sale: ['Electronics', 'Vehicles', 'Furniture'],
    job: ['IT', 'Engineering', 'Healthcare'],
    service: ['Cleaning', 'Repair', 'Tutoring'],
    for_rent: ['Apartments', 'Houses', 'Offices']
  };
  
  const subcategory = faker.helpers.arrayElement(subcategories[category]);
  
  const listing = {
    id: faker.string.uuid(),
    user_id: userId,
    category,
    subcategory,
    title: `${subcategory} - ${faker.lorem.words(2)}`,
    description: faker.lorem.paragraph(),
    price: category === 'job' ? null : faker.number.int({ min: 5000, max: 500000 }),
    status: 'active',
    location_city: userCity,
    location_wilaya: userWilaya,
    photos: [faker.image.url()],
    metadata: { source: 'mock' },
    views_count: faker.number.int({ min: 0, max: 100 }),
    favorites_count: faker.number.int({ min: 0, max: 20 }),
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
  
  // Add category-specific fields
  if (category === 'for_sale') {
    listing.condition = faker.helpers.arrayElement(['new', 'used']);
  } else if (category === 'job') {
    listing.salary_min = 50000;
    listing.salary_max = 100000;
    listing.job_type = 'full-time';
    listing.company_name = faker.company.name();
  } else if (category === 'for_rent') {
    listing.available_from = '2024-01-01';
    listing.rental_period = 'monthly';
  }
  
  return listing;
}

async function insertBatch(table, data, batchSize = 1000) {
  console.log(`📥 Inserting ${data.length} records into ${table}...`);
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    
    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      throw error;
    }
    
    console.log(`✅ ${table}: ${Math.min(i + batchSize, data.length)}/${data.length}`);
  }
}

async function main(userCount = 1000, listingsPerUser = 3) {
  console.log(`🚀 Quick Mock Data Generator`);
  console.log(`📊 Target: ${userCount} users, ~${userCount * listingsPerUser} listings`);
  
  initSupabase();
  
  try {
    await removeConstraints();
    
    // Generate and insert users
    console.log('👥 Generating users...');
    const users = Array.from({ length: userCount }, generateUser);
    await insertBatch('profiles', users);
    
    // Generate and insert listings
    console.log('📋 Generating listings...');
    const listings = [];
    users.forEach(user => {
      const count = faker.number.int({ min: 1, max: listingsPerUser + 1 });
      for (let i = 0; i < count; i++) {
        listings.push(generateListing(user.id, user.wilaya, user.city));
      }
    });
    
    await insertBatch('listings', listings);
    
    // Stats
    const [userStats, listingStats] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true })
    ]);
    
    console.log(`🎉 Generation complete!`);
    console.log(`👥 Total Users: ${userStats.count}`);
    console.log(`📋 Total Listings: ${listingStats.count}`);
    
    // Test search performance
    console.log('⚡ Testing search performance...');
    const start = Date.now();
    const { data: searchResults } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .limit(50);
    const searchTime = Date.now() - start;
    console.log(`🔍 Search took ${searchTime}ms for ${searchResults?.length || 0} results`);
    
  } finally {
    await restoreConstraints();
  }
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || 'test';
  
  switch (mode) {
    case 'test':
      main(1000, 3);
      break;
    case 'medium':
      main(10000, 3);
      break;
    case 'full':
      main(200000, 3);
      break;
    default:
      console.log('Usage: node quick-mock-data.js [test|medium|full]');
      break;
  }
}