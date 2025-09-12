#!/usr/bin/env node

/**
 * Cloud Mock Data Generator for MarketDZ
 * Uses Supabase Auth to create real users, then adds listings
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
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      }
    }
  );
  console.log('✅ Cloud Supabase initialized');
}

function generateUser() {
  const isMale = Math.random() > 0.5;
  const firstName = faker.helpers.arrayElement(isMale ? ARABIC_NAMES.male : ARABIC_NAMES.female);
  const lastName = faker.helpers.arrayElement(LAST_NAMES);
  const wilaya = faker.helpers.arrayElement(WILAYAS);
  
  return {
    firstName: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${faker.number.int({min:1,max:999999})}@example.com`,
    password: 'Test123!',
    phone: '06' + faker.string.numeric(8),
    city: wilaya + ' Centre',
    wilaya: wilaya,
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
    metadata: { source: 'cloud-mock' },
    views_count: faker.number.int({ min: 0, max: 100 }),
    favorites_count: faker.number.int({ min: 0, max: 20 }),
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
  
  return listing;
}

async function createCloudUsers(count = 1000) {
  console.log(`👥 Creating ${count} users with Supabase Auth...`);
  const users = [];
  const batchSize = 10; // Small batches for auth
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    
    // Generate batch
    for (let j = 0; j < Math.min(batchSize, count - i); j++) {
      batch.push(generateUser());
    }
    
    // Create users with auth
    const results = await Promise.allSettled(
      batch.map(async (userData) => {
        try {
          const { data, error } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone: userData.phone,
              city: userData.city,
              wilaya: userData.wilaya
            }
          });
          
          if (error) {
            console.log(`⚠️ User creation failed: ${error.message}`);
            return null;
          }
          
          return {
            id: data.user.id,
            ...userData
          };
        } catch (err) {
          console.log(`⚠️ User creation error: ${err.message}`);
          return null;
        }
      })
    );
    
    // Collect successful users
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        users.push(result.value);
      }
    });
    
    console.log(`✅ Created users: ${users.length}/${count} (batch ${Math.floor(i / batchSize) + 1})`);
    
    // Rate limiting
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return users;
}

async function createListings(users, listingsPerUser = 3) {
  console.log(`📋 Creating listings for ${users.length} users...`);
  
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
    
    console.log(`✅ Listings: ${Math.min(i + batchSize, allListings.length)}/${allListings.length}`);
  }
  
  return allListings;
}

async function generateStats() {
  console.log('📊 Generating final statistics...');
  
  const [userCount, listingCount] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true })
  ]);
  
  console.log(`📈 Final Results:`);
  console.log(`   👥 Total Users: ${userCount.count}`);
  console.log(`   📋 Total Listings: ${listingCount.count}`);
}

async function main(userCount = 1000) {
  const startTime = Date.now();
  
  console.log('🚀 Cloud MarketDZ Mock Data Generator');
  console.log(`📊 Target: ${userCount} users with real authentication`);
  
  initSupabase();
  
  try {
    // Create users with real auth
    const users = await createCloudUsers(userCount);
    console.log(`✅ Successfully created ${users.length} authenticated users`);
    
    // Create listings
    const listings = await createListings(users, 3);
    console.log(`✅ Successfully created ${listings.length} listings`);
    
    await generateStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🎉 Generation complete in ${duration}s`);
    console.log(`📈 Performance: ${(users.length / duration).toFixed(1)} users/sec`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  const mode = process.argv[2] || 'test';
  
  switch (mode) {
    case 'test':
      main(500).catch(console.error); // Start smaller for cloud
      break;
    case 'medium':
      main(5000).catch(console.error);
      break;
    case 'large':
      main(25000).catch(console.error);
      break;
    default:
      console.log('Usage: node cloud-mock-data.js [test|medium|large]');
      console.log('  test:   500 users (~1,500 listings)');
      console.log('  medium: 5,000 users (~15,000 listings)');  
      console.log('  large:  25,000 users (~75,000 listings)');
      break;
  }
}