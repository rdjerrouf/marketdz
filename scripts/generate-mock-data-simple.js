#!/usr/bin/env node

/**
 * Simplified Mock Data Generator for MarketDZ Performance Testing
 * Direct SQL approach to bypass auth.users constraints
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

let supabase;

// Algeria-specific data
const ALGERIA_WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
  'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
  'Ghardaïa', 'Relizane'
];

const CITIES_BY_WILAYA = {
  'Alger': ['Alger Centre', 'Bab El Oued', 'El Harrach', 'Birtouta', 'Zeralda'],
  'Oran': ['Oran Centre', 'Es Senia', 'Bir El Djir', 'Sidi Chahmi'],
  'Constantine': ['Constantine Centre', 'Ali Mendjeli', 'Zouaghi Slimane'],
  'Annaba': ['Annaba Centre', 'El Bouni', 'Sidi Amar'],
  'Blida': ['Blida Centre', 'Boufarik', 'Larbaa'],
};

const ARABIC_FIRST_NAMES = {
  male: ['Mohamed', 'Ahmed', 'Ali', 'Abdelkader', 'Omar', 'Youcef', 'Karim', 'Amine', 'Rachid', 'Samir'],
  female: ['Fatima', 'Aicha', 'Khadija', 'Zahra', 'Amina', 'Sarah', 'Nadia', 'Samia', 'Leila', 'Widad']
};

const ARABIC_LAST_NAMES = ['Benaissa', 'Benali', 'Boumediene', 'Brahimi', 'Medjad', 'Hamidi', 'Zerrouki', 'Khelifi'];

function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  console.log('✅ Supabase client initialized');
}

/**
 * Disable foreign key constraints temporarily
 */
async function disableConstraints() {
  console.log('🔓 Temporarily disabling foreign key constraints...');
  
  const { error } = await supabase.rpc('exec', {
    sql: `
      ALTER TABLE profiles DISABLE TRIGGER ALL;
      SET session_replication_role = replica;
    `
  });
  
  if (error) {
    console.log('⚠️ Could not disable constraints, proceeding anyway...');
  }
}

/**
 * Re-enable foreign key constraints
 */
async function enableConstraints() {
  console.log('🔐 Re-enabling foreign key constraints...');
  
  const { error } = await supabase.rpc('exec', {
    sql: `
      SET session_replication_role = DEFAULT;
      ALTER TABLE profiles ENABLE TRIGGER ALL;
    `
  });
  
  if (error) {
    console.log('⚠️ Could not re-enable constraints');
  }
}

/**
 * Generate realistic user data
 */
function generateUser() {
  const isMale = Math.random() > 0.5;
  const isArabicName = Math.random() > 0.3;
  
  let firstName, lastName;
  if (isArabicName) {
    firstName = isMale ? 
      faker.helpers.arrayElement(ARABIC_FIRST_NAMES.male) : 
      faker.helpers.arrayElement(ARABIC_FIRST_NAMES.female);
    lastName = faker.helpers.arrayElement(ARABIC_LAST_NAMES);
  } else {
    firstName = faker.person.firstName();
    lastName = faker.person.lastName();
  }
  
  const wilaya = faker.helpers.arrayElement(ALGERIA_WILAYAS);
  const cities = CITIES_BY_WILAYA[wilaya] || [wilaya + ' Centre'];
  const city = faker.helpers.arrayElement(cities);
  
  return {
    id: faker.string.uuid(),
    first_name: firstName,
    last_name: lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.helpers.arrayElement(['05', '06', '07']) + faker.string.numeric(8),
    city: city,
    wilaya: wilaya,
    bio: Math.random() > 0.7 ? faker.lorem.sentences(2) : null,
    rating: Number((Math.random() * 5).toFixed(1)),
    review_count: faker.number.int({ min: 0, max: 50 }),
    is_verified: Math.random() > 0.8,
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
}

/**
 * Generate realistic listing
 */
function generateListing(userId, userWilaya, userCity) {
  const category = faker.helpers.arrayElement(['for_sale', 'job', 'service', 'for_rent']);
  const subcategories = {
    for_sale: ['Electronics', 'Vehicles', 'Real Estate', 'Furniture', 'Clothing'],
    job: ['Information Technology', 'Engineering', 'Healthcare', 'Education', 'Sales & Marketing'],
    service: ['Cleaning', 'Repair & Maintenance', 'Tutoring', 'Transportation', 'Gardening'],
    for_rent: ['Apartments', 'Houses', 'Offices', 'Commercial Space', 'Vehicles']
  };
  
  const subcategory = faker.helpers.arrayElement(subcategories[category]);
  
  const listing = {
    id: faker.string.uuid(),
    user_id: userId,
    category: category,
    subcategory: subcategory,
    title: `${subcategory} - ${faker.lorem.words(3)}`,
    description: faker.lorem.paragraphs(2),
    price: category === 'job' ? null : faker.number.int({ min: 5000, max: 500000 }),
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'sold']),
    location_city: userCity,
    location_wilaya: userWilaya,
    photos: [faker.image.url(), faker.image.url()],
    metadata: { source: 'mock-generator' },
    views_count: faker.number.int({ min: 0, max: 1000 }),
    favorites_count: faker.number.int({ min: 0, max: 100 }),
    created_at: faker.date.between({ from: '2023-01-01', to: new Date() }),
  };
  
  // Add category-specific fields
  if (category === 'for_sale') {
    listing.condition = faker.helpers.arrayElement(['new', 'used', 'refurbished']);
  } else if (category === 'job') {
    listing.salary_min = faker.number.int({ min: 30000, max: 80000 });
    listing.salary_max = listing.salary_min + faker.number.int({ min: 10000, max: 50000 });
    listing.job_type = faker.helpers.arrayElement(['full-time', 'part-time', 'contract']);
    listing.company_name = faker.company.name();
  } else if (category === 'for_rent') {
    listing.available_from = faker.date.future().toISOString().split('T')[0];
    listing.rental_period = faker.helpers.arrayElement(['daily', 'weekly', 'monthly']);
  }
  
  return listing;
}

/**
 * Insert data using raw SQL for better performance
 */
async function insertUsersSQL(users) {
  console.log(`📥 Inserting ${users.length} users using SQL...`);
  
  // First, insert into auth.users
  const authValues = users.map(user => 
    `('${user.id}', '${user.email}', NULL, '${user.created_at.toISOString()}', '${user.created_at.toISOString()}', '{}', 'authenticated', 'authenticated')`
  ).join(',\n');
  
  const authSQL = `
    INSERT INTO auth.users (
      id, email, encrypted_password, created_at, updated_at, 
      raw_user_meta_data, role, aud
    ) VALUES 
    ${authValues}
    ON CONFLICT (id) DO NOTHING;
  `;
  
  const { error: authError } = await supabase.rpc('exec', { sql: authSQL });
  if (authError) {
    console.log('⚠️ Auth user creation failed, trying profiles anyway...', authError.message);
  }
  
  // Then insert into profiles
  const profileValues = users.map(user => 
    `('${user.id}', '${user.first_name.replace(/'/g, "''")}', '${user.last_name.replace(/'/g, "''")}', '${user.email}', '${user.phone}', '${user.city.replace(/'/g, "''")}', '${user.wilaya.replace(/'/g, "''")}', ${user.bio ? `'${user.bio.replace(/'/g, "''")}'` : 'NULL'}, ${user.rating}, ${user.review_count}, ${user.is_verified}, '${user.created_at.toISOString()}', '${user.created_at.toISOString()}')`
  ).join(',\n');
  
  const profileSQL = `
    INSERT INTO profiles (
      id, first_name, last_name, email, phone, city, wilaya, 
      bio, rating, review_count, is_verified, created_at, updated_at
    ) VALUES 
    ${profileValues}
    ON CONFLICT (id) DO NOTHING;
  `;
  
  const { error: profileError } = await supabase.rpc('exec', { sql: profileSQL });
  
  if (profileError) {
    console.error('❌ Error inserting profiles:', profileError);
    throw profileError;
  }
  
  console.log('✅ Users inserted successfully');
}

/**
 * Insert listings using batches
 */
async function insertListings(listings) {
  console.log(`📥 Inserting ${listings.length} listings in batches...`);
  
  const batchSize = 1000;
  for (let i = 0; i < listings.length; i += batchSize) {
    const batch = listings.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('listings')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting listing batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
    
    console.log(`✅ Inserted listing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listings.length / batchSize)}`);
  }
}

/**
 * Main generation function
 */
async function generateMockData(userCount = 1000, listingsPerUser = 3) {
  console.log('🚀 Starting MarketDZ mock data generation...');
  console.log(`📊 Target: ${userCount} users, ~${userCount * listingsPerUser} listings`);
  
  initSupabase();
  await disableConstraints();
  
  try {
    // Generate users
    console.log('👥 Generating users...');
    const users = [];
    for (let i = 0; i < userCount; i++) {
      users.push(generateUser());
      if (i % 10000 === 0 && i > 0) {
        console.log(`Generated ${i}/${userCount} users...`);
      }
    }
    
    // Insert users
    await insertUsersSQL(users);
    
    // Generate listings
    console.log('📋 Generating listings...');
    const listings = [];
    for (const user of users) {
      const numListings = faker.number.int({ min: 1, max: listingsPerUser + 2 });
      for (let j = 0; j < numListings; j++) {
        listings.push(generateListing(user.id, user.wilaya, user.city));
      }
    }
    
    // Insert listings
    await insertListings(listings);
    
    console.log(`🎉 Mock data generation complete!`);
    console.log(`👥 Users: ${users.length}`);
    console.log(`📋 Listings: ${listings.length}`);
    
    // Show some stats
    const { data: userStats } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact' });
    
    const { data: listingStats } = await supabase
      .from('listings')
      .select('count(*)', { count: 'exact' });
      
    console.log(`📈 Database totals - Users: ${userStats?.length || 0}, Listings: ${listingStats?.length || 0}`);
    
  } finally {
    await enableConstraints();
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'test';
  
  if (mode === 'test') {
    console.log('🧪 Running in test mode (1000 users, ~3000 listings)...');
    generateMockData(1000, 3).catch(console.error);
  } else if (mode === 'full') {
    console.log('🔥 Running FULL mode (200,000 users, ~600,000 listings)...');
    generateMockData(200000, 3).catch(console.error);
  } else {
    console.log('Usage: node generate-mock-data-simple.js [test|full]');
  }
}