#!/usr/bin/env node

/**
 * Final Mock Data Generator for MarketDZ Performance Testing
 * Simple approach using batched inserts with proper foreign key handling
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

let supabase;

// Algeria data
const WILAYAS = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Sétif', 'Tlemcen', 'Béjaïa', 'Tizi Ouzou'];
const CITIES = {
  'Alger': ['Alger Centre', 'Bab El Oued', 'El Harrach', 'Birtouta'],
  'Oran': ['Oran Centre', 'Es Senia', 'Bir El Djir'],
  'Constantine': ['Constantine Centre', 'Ali Mendjeli']
};

const ARABIC_NAMES = {
  male: ['Mohamed', 'Ahmed', 'Ali', 'Omar', 'Youcef', 'Karim', 'Amine'],
  female: ['Fatima', 'Aicha', 'Khadija', 'Zahra', 'Amina', 'Sarah']
};
const LAST_NAMES = ['Benaissa', 'Benali', 'Boumediene', 'Brahimi', 'Medjad', 'Hamidi'];

function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  console.log('✅ Supabase initialized');
}

function generateUser() {
  const isMale = Math.random() > 0.5;
  const firstName = faker.helpers.arrayElement(
    isMale ? ARABIC_NAMES.male : ARABIC_NAMES.female
  );
  const lastName = faker.helpers.arrayElement(LAST_NAMES);
  const wilaya = faker.helpers.arrayElement(WILAYAS);
  const cities = CITIES[wilaya] || [wilaya + ' Centre'];
  
  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: '06' + faker.string.numeric(8),
    city: faker.helpers.arrayElement(cities),
    wilaya: wilaya,
    bio: Math.random() > 0.7 ? faker.lorem.sentence() : null,
    rating: Number((Math.random() * 5).toFixed(1)),
    review_count: faker.number.int({ min: 0, max: 25 }),
    is_verified: Math.random() > 0.8,
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
}

function generateListing(userId, userWilaya, userCity) {
  const categories = ['for_sale', 'job', 'service', 'for_rent'];
  const category = faker.helpers.arrayElement(categories);
  
  const subcategories = {
    for_sale: ['Electronics', 'Vehicles', 'Furniture', 'Clothing'],
    job: ['IT', 'Engineering', 'Healthcare', 'Education'],
    service: ['Cleaning', 'Repair', 'Tutoring', 'Transportation'],
    for_rent: ['Apartments', 'Houses', 'Offices', 'Vehicles']
  };
  
  const subcategory = faker.helpers.arrayElement(subcategories[category]);
  
  const listing = {
    id: faker.string.uuid(),
    user_id: userId,
    category: category,
    subcategory: subcategory,
    title: `${subcategory} - ${faker.lorem.words(2)}`,
    description: faker.lorem.paragraph(),
    price: category === 'job' ? null : faker.number.int({ min: 1000, max: 100000 }),
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'sold']),
    location_city: userCity,
    location_wilaya: userWilaya,
    photos: [faker.image.url()],
    metadata: { source: 'mock' },
    views_count: faker.number.int({ min: 0, max: 500 }),
    favorites_count: faker.number.int({ min: 0, max: 50 }),
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
  
  // Add category-specific fields
  if (category === 'for_sale') {
    listing.condition = faker.helpers.arrayElement(['new', 'used', 'refurbished']);
  } else if (category === 'job') {
    listing.salary_min = faker.number.int({ min: 40000, max: 80000 });
    listing.salary_max = listing.salary_min + 20000;
    listing.job_type = faker.helpers.arrayElement(['full-time', 'part-time', 'contract']);
    listing.company_name = faker.company.name();
  } else if (category === 'for_rent') {
    listing.available_from = faker.date.future().toISOString().split('T')[0];
    listing.rental_period = faker.helpers.arrayElement(['daily', 'weekly', 'monthly']);
  }
  
  return listing;
}

async function createMockUsers(userCount) {
  console.log(`👥 Creating ${userCount} mock users (with auth entries)...`);
  
  const users = [];
  const authUsers = [];
  
  for (let i = 0; i < userCount; i++) {
    const user = generateUser();
    users.push(user);
    
    // Create corresponding auth user
    authUsers.push({
      id: user.id,
      email: user.email,
      encrypted_password: '$2a$10$mockpasswordhashforperformancetesting',
      email_confirmed_at: user.created_at.toISOString(),
      created_at: user.created_at.toISOString(),
      updated_at: user.created_at.toISOString(),
      raw_user_meta_data: JSON.stringify({
        first_name: user.first_name,
        last_name: user.last_name
      }),
      role: 'authenticated',
      aud: 'authenticated'
    });
  }
  
  // Create auth users first (in smaller batches)
  console.log('📝 Creating auth.users entries...');
  const authBatchSize = 100; // Smaller batches for auth
  for (let i = 0; i < authUsers.length; i += authBatchSize) {
    const batch = authUsers.slice(i, i + authBatchSize);
    
    // Convert to SQL values
    const values = batch.map(user => 
      `('${user.id}', '${user.email}', '${user.encrypted_password}', '${user.email_confirmed_at}', '${user.created_at}', '${user.updated_at}', '${user.raw_user_meta_data}', '${user.role}', '${user.aud}')`
    ).join(',\\n');
    
    const sql = `
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role, aud)
      VALUES ${values}
      ON CONFLICT (email) DO NOTHING;
    `;
    
    const { error } = await supabase.rpc('exec', { sql });
    if (error) {
      console.error(`❌ Auth batch ${i / authBatchSize + 1} failed:`, error.message);
      // Continue anyway
    }
    
    if (i % 1000 === 0) {
      console.log(`Auth users created: ${Math.min(i + authBatchSize, authUsers.length)}/${authUsers.length}`);
    }
  }
  
  // Create profile users (larger batches)
  console.log('📝 Creating profiles...');
  const profileBatchSize = 500;
  for (let i = 0; i < users.length; i += profileBatchSize) {
    const batch = users.slice(i, i + profileBatchSize);
    
    const { error } = await supabase
      .from('profiles')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Profile batch ${i / profileBatchSize + 1} failed:`, error);
      throw error;
    }
    
    console.log(`✅ Profiles created: ${Math.min(i + profileBatchSize, users.length)}/${users.length}`);
  }
  
  return users;
}

async function createMockListings(users, listingsPerUser = 3) {
  console.log(`📋 Creating ~${users.length * listingsPerUser} listings...`);
  
  const allListings = [];
  
  for (const user of users) {
    const numListings = faker.number.int({ min: 1, max: listingsPerUser + 1 });
    for (let j = 0; j < numListings; j++) {
      allListings.push(generateListing(user.id, user.wilaya, user.city));
    }
  }
  
  // Insert listings in batches
  const batchSize = 1000;
  for (let i = 0; i < allListings.length; i += batchSize) {
    const batch = allListings.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('listings')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Listing batch ${Math.floor(i / batchSize) + 1} failed:`, error);
      throw error;
    }
    
    console.log(`✅ Listings created: ${Math.min(i + batchSize, allListings.length)}/${allListings.length}`);
  }
  
  return allListings;
}

async function generateStats() {
  console.log('📊 Generating final statistics...');
  
  const [userCount, listingCount, categoryStats] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('category, count(*)', { count: 'exact' })
  ]);
  
  console.log(`📈 Final Results:`);
  console.log(`   👥 Total Users: ${userCount.count}`);
  console.log(`   📋 Total Listings: ${listingCount.count}`);
  console.log(`   📊 By Category:`, categoryStats.data);
}

async function main(userCount = 1000, listingsPerUser = 3) {
  const startTime = Date.now();
  
  console.log('🚀 MarketDZ Mock Data Generator');
  console.log(`📊 Target: ${userCount} users, ~${userCount * listingsPerUser} listings`);
  
  initSupabase();
  
  try {
    const users = await createMockUsers(userCount);
    const listings = await createMockListings(users, listingsPerUser);
    
    await generateStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🎉 Generation complete in ${duration}s`);
    console.log(`📈 Performance: ${(users.length / duration).toFixed(0)} users/sec, ${(listings.length / duration).toFixed(0)} listings/sec`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || 'test';
  
  if (mode === 'test') {
    main(1000, 3).catch(console.error);
  } else if (mode === 'medium') {
    main(10000, 3).catch(console.error);
  } else if (mode === 'full') {
    main(200000, 3).catch(console.error);
  } else {
    console.log('Usage: node generate-mock-data-final.js [test|medium|full]');
    console.log('  test:   1,000 users (~3,000 listings)');
    console.log('  medium: 10,000 users (~30,000 listings)');  
    console.log('  full:   200,000 users (~600,000 listings)');
  }
}