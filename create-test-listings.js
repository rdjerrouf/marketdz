const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const listings = [
  {
    title: 'iPhone 14 Pro Max 256GB',
    description: 'Brand new iPhone 14 Pro Max, sealed box, 256GB storage. Deep Purple color.',
    price: 150000,
    category: 'for_sale',
    condition: 'new',
    location_wilaya: 'Alger',
    location_city: 'Bab Ezzouar',
    status: 'active'
  },
  {
    title: 'Toyota Corolla 2020',
    description: 'Toyota Corolla 2020, excellent condition, low mileage, full service history.',
    price: 2500000,
    category: 'for_sale',
    condition: 'like_new',
    location_wilaya: 'Oran',
    location_city: 'Oran Centre',
    status: 'active'
  },
  {
    title: 'F3 Apartment for Rent',
    description: '3-bedroom apartment, 95m², 5th floor, elevator, modern kitchen, parking included.',
    price: 35000,
    category: 'for_rent',
    location_wilaya: 'Constantine',
    location_city: 'Nouvelle Ville',
    status: 'active'
  },
  {
    title: 'Modern Sofa Set',
    description: 'Beautiful 3-seater sofa with 2 armchairs, grey fabric, excellent condition.',
    price: 45000,
    category: 'for_sale',
    condition: 'like_new',
    location_wilaya: 'Blida',
    location_city: 'Blida Centre',
    status: 'active'
  },
  {
    title: 'Adidas Running Shoes',
    description: 'Adidas Ultraboost 22, size 42, worn twice, almost new condition.',
    price: 8500,
    category: 'for_sale',
    condition: 'like_new',
    location_wilaya: 'Alger',
    location_city: 'Hydra',
    status: 'active'
  },
  {
    title: 'Programming Books Collection',
    description: 'Collection of 10 programming books including Clean Code, Design Patterns, etc.',
    price: 12000,
    category: 'for_sale',
    condition: 'good',
    location_wilaya: 'Sétif',
    location_city: 'Sétif Centre',
    status: 'active'
  },
  {
    title: 'Software Developer Position',
    description: 'Looking for experienced Full-Stack Developer. React, Node.js, PostgreSQL required.',
    price: 0,
    category: 'job',
    location_wilaya: 'Alger',
    location_city: 'Cheraga',
    status: 'active',
    salary_min: 80000,
    salary_max: 120000
  },
  {
    title: 'Gaming Laptop MSI',
    description: 'MSI Gaming Laptop, RTX 3060, i7-11800H, 16GB RAM, 512GB SSD, excellent for gaming.',
    price: 180000,
    category: 'for_sale',
    condition: 'like_new',
    location_wilaya: 'Oran',
    location_city: 'Es Senia',
    status: 'active'
  },
  {
    title: 'Web Development Service',
    description: 'Professional web development services. React, Next.js, responsive design.',
    price: 50000,
    category: 'service',
    location_wilaya: 'Alger',
    location_city: 'Kouba',
    status: 'active'
  },
  {
    title: 'Samsung Galaxy S23 Ultra',
    description: 'Samsung S23 Ultra, 512GB, Phantom Black, 3 months old, with original box.',
    price: 140000,
    category: 'for_sale',
    condition: 'like_new',
    location_wilaya: 'Alger',
    location_city: 'Ben Aknoun',
    status: 'active'
  }
];

async function createTestListings() {
  console.log('Creating test listings...\n');

  // Get first test user
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('❌ No users found. Please create users first.');
    return;
  }

  const userId = users[0].id;
  console.log(`Using user ID: ${userId}\n`);

  for (const listing of listings) {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        ...listing,
        user_id: userId
      })
      .select('id, title')
      .single();

    if (error) {
      console.error(`❌ Error creating "${listing.title}":`, error.message);
    } else {
      console.log(`✅ Created: ${listing.title}`);
    }
  }

  console.log('\n✅ Done! Test listings created.');
  console.log('Visit http://localhost:3000/browse to see them.');
}

createTestListings().catch(console.error);
