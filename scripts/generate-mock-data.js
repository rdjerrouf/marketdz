#!/usr/bin/env node

/**
 * Mock Data Generator for MarketDZ Performance Testing
 * Generates 200,000+ mock users and listings for Algeria marketplace
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

// Supabase setup - will be loaded from environment
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
  'Alger': ['Alger Centre', 'Bab El Oued', 'El Harrach', 'Birtouta', 'Zeralda', 'Dely Ibrahim'],
  'Oran': ['Oran Centre', 'Es Senia', 'Bir El Djir', 'Sidi Chahmi', 'Gdyel'],
  'Constantine': ['Constantine Centre', 'Ali Mendjeli', 'Zouaghi Slimane', 'El Khroub'],
  'Annaba': ['Annaba Centre', 'El Bouni', 'Sidi Amar', 'El Hadjar'],
  'Blida': ['Blida Centre', 'Boufarik', 'Larbaa', 'Soumaa'],
  'Batna': ['Batna Centre', 'Ain Touta', 'Barika', 'Arris'],
  'Sétif': ['Sétif Centre', 'El Eulma', 'Ain Oulmene', 'Bougaa'],
  'Tlemcen': ['Tlemcen Centre', 'Maghnia', 'Remchi', 'Sebdou'],
};

// Categories and subcategories
const CATEGORIES = {
  'for_sale': {
    subcategories: ['Electronics', 'Vehicles', 'Real Estate', 'Furniture', 'Clothing', 
                   'Sports & Leisure', 'Books & Media', 'Garden & DIY', 'Baby & Kids', 'Animals'],
    conditions: ['new', 'used', 'refurbished']
  },
  'job': {
    subcategories: ['Information Technology', 'Engineering', 'Healthcare', 'Education', 
                   'Sales & Marketing', 'Administration', 'Construction', 'Transportation', 
                   'Hospitality', 'Crafts', 'Agriculture'],
    jobTypes: ['full-time', 'part-time', 'contract', 'temporary', 'internship'],
    companies: ['Sonatrach', 'Algérie Télécom', 'Air Algérie', 'Banque d\'Algérie', 
               'CEVITAL', 'Danone Djurdjura', 'Lafarge Algérie', 'Ooredoo', 'Mobilis']
  },
  'service': {
    subcategories: ['Cleaning', 'Repair & Maintenance', 'Tutoring', 'Transportation', 
                   'Gardening', 'Plumbing', 'Electrical', 'Painting', 'Beauty & Hair', 
                   'Translation', 'Photography']
  },
  'for_rent': {
    subcategories: ['Apartments', 'Houses', 'Offices', 'Commercial Space', 'Vehicles', 
                   'Equipment', 'Event Halls'],
    rentalPeriods: ['daily', 'weekly', 'monthly', 'yearly']
  }
};

// Arabic names for realistic Algerian users
const ARABIC_FIRST_NAMES = {
  male: ['Mohamed', 'Ahmed', 'Ali', 'Abdelkader', 'Omar', 'Youcef', 'Karim', 'Amine', 'Rachid', 'Samir', 'Tarek', 'Farid', 'Nabil', 'Khaled', 'Sofiane', 'Bilal'],
  female: ['Fatima', 'Aicha', 'Khadija', 'Zahra', 'Amina', 'Sarah', 'Nadia', 'Samia', 'Leila', 'Widad', 'Houria', 'Yamina', 'Malika', 'Zohra', 'Soraya', 'Djamila']
};

const ARABIC_LAST_NAMES = ['Benaissa', 'Benali', 'Boumediene', 'Brahimi', 'Medjad', 'Hamidi', 'Zerrouki', 'Khelifi', 'Ouali', 'Messaoudi', 'Belabes', 'Amrane', 'Saidi', 'Boukhari', 'Tlemcani'];

/**
 * Initialize Supabase client with service role
 */
function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
    process.exit(1);
  }
  
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('✅ Supabase client initialized');
}

/**
 * Generate a realistic Algerian user profile
 */
function generateUser() {
  const isFirstNameArabic = Math.random() > 0.3; // 70% Arabic names
  const isMale = Math.random() > 0.5;
  
  let firstName, lastName;
  
  if (isFirstNameArabic) {
    firstName = isMale ? 
      faker.helpers.arrayElement(ARABIC_FIRST_NAMES.male) : 
      faker.helpers.arrayElement(ARABIC_FIRST_NAMES.female);
    lastName = faker.helpers.arrayElement(ARABIC_LAST_NAMES);
  } else {
    firstName = isMale ? faker.person.firstName('male') : faker.person.firstName('female');
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
    avatar_url: Math.random() > 0.6 ? faker.image.avatar() : null,
    rating: Number((Math.random() * 5).toFixed(1)),
    review_count: faker.number.int({ min: 0, max: 50 }),
    is_verified: Math.random() > 0.8,
    created_at: faker.date.between({ 
      from: '2023-01-01', 
      to: new Date() 
    }).toISOString(),
  };
}

/**
 * Generate a realistic listing
 */
function generateListing(userId, userWilaya, userCity) {
  const category = faker.helpers.arrayElement(['for_sale', 'job', 'service', 'for_rent']);
  const categoryConfig = CATEGORIES[category];
  const subcategory = faker.helpers.arrayElement(categoryConfig.subcategories);
  
  // Base listing data
  const listing = {
    id: faker.string.uuid(),
    user_id: userId,
    category: category,
    subcategory: subcategory,
    title: generateListingTitle(category, subcategory),
    description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
    price: generatePrice(category, subcategory),
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'sold', 'rented']), // 60% active
    location_city: userCity,
    location_wilaya: userWilaya,
    photos: generatePhotoUrls(),
    metadata: generateMetadata(category),
    views_count: faker.number.int({ min: 0, max: 1000 }),
    favorites_count: faker.number.int({ min: 0, max: 100 }),
    created_at: faker.date.between({ 
      from: '2023-01-01', 
      to: new Date() 
    }).toISOString(),
  };
  
  // Add category-specific fields
  if (category === 'for_sale') {
    listing.condition = faker.helpers.arrayElement(categoryConfig.conditions);
  } else if (category === 'job') {
    listing.salary_min = faker.number.int({ min: 30000, max: 80000 });
    listing.salary_max = listing.salary_min + faker.number.int({ min: 10000, max: 50000 });
    listing.job_type = faker.helpers.arrayElement(categoryConfig.jobTypes);
    listing.company_name = faker.helpers.arrayElement(categoryConfig.companies);
  } else if (category === 'for_rent') {
    listing.available_from = faker.date.future({ years: 1 }).toISOString().split('T')[0];
    listing.available_to = faker.date.future({ years: 2 }).toISOString().split('T')[0];
    listing.rental_period = faker.helpers.arrayElement(categoryConfig.rentalPeriods);
  }
  
  return listing;
}

/**
 * Generate realistic listing titles
 */
function generateListingTitle(category, subcategory) {
  const templates = {
    for_sale: {
      'Electronics': ['iPhone 13 Pro Max 256GB', 'Samsung Galaxy S22', 'MacBook Pro M2', 'PlayStation 5', 'Dell XPS 13'],
      'Vehicles': ['Peugeot 308 2019', 'Renault Clio 2020', 'Dacia Logan 2021', 'Toyota Corolla 2018'],
      'Real Estate': ['Appartement F3 Alger Centre', 'Villa R+1 Hydra', 'Local Commercial Oran'],
      'Furniture': ['Salon Moderne 7 Places', 'Chambre à Coucher Complète', 'Table à Manger 6 Places'],
    },
    job: {
      'Information Technology': ['Développeur Full Stack', 'Ingénieur DevOps', 'Chef de Projet IT'],
      'Engineering': ['Ingénieur Civil', 'Ingénieur Mécanique', 'Architecte'],
      'Healthcare': ['Médecin Généraliste', 'Infirmier', 'Pharmacien'],
    },
    service: {
      'Cleaning': ['Nettoyage Bureaux', 'Ménage à Domicile', 'Nettoyage Post-Construction'],
      'Tutoring': ['Cours de Mathématiques', 'Soutien Scolaire', 'Cours de Langues'],
    },
    for_rent: {
      'Apartments': ['F2 Meublé Didouche Mourad', 'F3 Moderne Hydra', 'Studio Centre Ville'],
      'Vehicles': ['Renault Symbol Location', 'Hyundai i10 Journalière'],
    }
  };
  
  const categoryTemplates = templates[category];
  if (categoryTemplates && categoryTemplates[subcategory]) {
    return faker.helpers.arrayElement(categoryTemplates[subcategory]);
  }
  
  return `${subcategory} - ${faker.lorem.words(3)}`;
}

/**
 * Generate realistic prices
 */
function generatePrice(category, subcategory) {
  const priceRanges = {
    for_sale: {
      'Electronics': [20000, 300000],
      'Vehicles': [800000, 5000000],
      'Real Estate': [5000000, 50000000],
      'Furniture': [15000, 200000],
    },
    service: [5000, 50000],
    for_rent: {
      'Apartments': [25000, 100000],
      'Houses': [40000, 150000],
      'Vehicles': [3000, 15000],
    }
  };
  
  if (category === 'job') return null; // Jobs don't have price
  
  let range = priceRanges[category];
  if (typeof range === 'object' && range[subcategory]) {
    range = range[subcategory];
  } else if (typeof range === 'object') {
    range = [10000, 100000]; // Default
  }
  
  return faker.number.int({ min: range[0], max: range[1] });
}

/**
 * Generate photo URLs
 */
function generatePhotoUrls() {
  const photoCount = faker.number.int({ min: 1, max: 6 });
  const photos = [];
  for (let i = 0; i < photoCount; i++) {
    photos.push(faker.image.url({ width: 800, height: 600 }));
  }
  return photos;
}

/**
 * Generate metadata
 */
function generateMetadata(category) {
  const metadata = {
    source: 'mock-generator',
    priority: faker.helpers.arrayElement(['normal', 'featured', 'urgent']),
  };
  
  if (category === 'for_sale' && Math.random() > 0.7) {
    metadata.brand = faker.company.name();
  }
  
  return metadata;
}

/**
 * Insert users in batches - creates both auth.users and profiles
 */
async function insertUsers(users, batchSize = 1000) {
  console.log(`📥 Inserting ${users.length} users in batches of ${batchSize}...`);
  
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    
    // First, insert into auth.users
    const authUsers = batch.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      created_at: user.created_at,
      updated_at: user.created_at,
      raw_user_meta_data: {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        city: user.city,
        wilaya: user.wilaya
      },
      role: 'authenticated',
      aud: 'authenticated'
    }));
    
    // Insert into auth.users using raw SQL
    const authQuery = `
      INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role, aud)
      SELECT * FROM json_populate_recordset(null::auth.users, $1)
      ON CONFLICT (id) DO NOTHING;
    `;
    
    const { error: authError } = await supabase.rpc('exec_sql', {
      sql: authQuery,
      params: [JSON.stringify(authUsers)]
    });
    
    if (authError) {
      console.log('⚠️ Auth user insertion may have failed, trying direct profile insertion...');
    }
    
    // Then insert into profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(batch);
    
    if (profileError) {
      console.error(`❌ Error inserting user batch ${i / batchSize + 1}:`, profileError);
      throw profileError;
    }
    
    console.log(`✅ Inserted user batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
  }
}

/**
 * Insert listings in batches
 */
async function insertListings(listings, batchSize = 1000) {
  console.log(`📥 Inserting ${listings.length} listings in batches of ${batchSize}...`);
  
  for (let i = 0; i < listings.length; i += batchSize) {
    const batch = listings.slice(i, i + batchSize);
    const { error } = await supabase
      .from('listings')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting listing batch ${i / batchSize + 1}:`, error);
      throw error;
    }
    
    console.log(`✅ Inserted listing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listings.length / batchSize)}`);
  }
}

/**
 * Main generation function
 */
async function generateMockData(userCount = 200000, listingsPerUser = 3) {
  console.log('🚀 Starting MarketDZ mock data generation...');
  console.log(`📊 Target: ${userCount} users, ~${userCount * listingsPerUser} listings`);
  
  initSupabase();
  
  // Generate users
  console.log('👥 Generating users...');
  const users = [];
  for (let i = 0; i < userCount; i++) {
    users.push(generateUser());
    if (i % 10000 === 0) {
      console.log(`Generated ${i}/${userCount} users...`);
    }
  }
  
  // Insert users
  await insertUsers(users);
  
  // Generate listings
  console.log('📋 Generating listings...');
  const listings = [];
  for (const user of users) {
    const numListings = faker.number.int({ min: 1, max: listingsPerUser + 2 });
    for (let j = 0; j < numListings; j++) {
      listings.push(generateListing(user.id, user.wilaya, user.city));
    }
    
    if (listings.length % 50000 === 0) {
      console.log(`Generated ${listings.length} listings...`);
    }
  }
  
  // Insert listings
  await insertListings(listings);
  
  console.log(`🎉 Mock data generation complete!`);
  console.log(`👥 Users: ${users.length}`);
  console.log(`📋 Listings: ${listings.length}`);
  
  // Generate some stats
  console.log('📈 Generating statistics...');
  const stats = await generateStats();
  console.log(stats);
}

/**
 * Generate database statistics
 */
async function generateStats() {
  const { data: userStats } = await supabase
    .from('profiles')
    .select('wilaya, count(*)', { count: 'exact' });
  
  const { data: listingStats } = await supabase
    .from('listings')
    .select('category, count(*)', { count: 'exact' });
    
  return {
    usersByWilaya: userStats,
    listingsByCategory: listingStats
  };
}

/**
 * Test mode with smaller dataset
 */
async function testMode() {
  console.log('🧪 Running in test mode (1000 users, ~3000 listings)...');
  await generateMockData(1000, 3);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const mode = args[0] || 'test';
  
  if (mode === 'test') {
    testMode().catch(console.error);
  } else if (mode === 'full') {
    generateMockData(200000, 3).catch(console.error);
  } else {
    console.log('Usage: node generate-mock-data.js [test|full]');
    console.log('  test: Generate 1,000 users and ~3,000 listings');
    console.log('  full: Generate 200,000 users and ~600,000 listings');
  }
}