#!/usr/bin/env node
/**
 * Create Test Users with Listings
 * Creates 10 test users (test1-test10@example.com) with 5 listings each per category
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Creating test users with listings...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const wilayas = ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Setif', 'Tlemcen'];
const cities = {
  'Algiers': ['Bab Ezzouar', 'Hydra', 'Cheraga', 'Kouba'],
  'Oran': ['Es Senia', 'Bir El Djir', 'Oran Centre'],
  'Constantine': ['Constantine Centre', 'Zouaghi', 'Ciloc'],
  'Annaba': ['Annaba Centre', 'Seraidi', 'El Bouni'],
  'Blida': ['Blida Centre', 'Boufarik', 'Bougara'],
  'Batna': ['Batna Centre', 'Arris', 'Merouana'],
  'Setif': ['Setif Centre', 'El Eulma', 'Bejaia'],
  'Tlemcen': ['Tlemcen Centre', 'Maghnia', 'Remchi']
};

const categories = ['for_sale', 'job', 'service', 'for_rent'];

const titles = {
  for_sale: [
    'جهاز كمبيوتر محمول Dell للبيع',
    'سيارة Renault Symbol 2018',
    'هاتف iPhone 13 Pro Max',
    'دراجة نارية Yamaha',
    'طاولة طعام خشبية'
  ],
  job: [
    'مطلوب مهندس برمجيات',
    'وظيفة محاسب في شركة',
    'مطلوب مدرس لغة إنجليزية',
    'فرصة عمل مندوب مبيعات',
    'وظيفة سائق خاص'
  ],
  service: [
    'خدمات سباكة وتصليح',
    'تصليح أجهزة كمبيوتر',
    'خدمات تنظيف منازل',
    'دروس خصوصية في الرياضيات',
    'خدمات كهرباء منزلية'
  ],
  for_rent: [
    'شقة للإيجار 3 غرف',
    'محل تجاري للإيجار',
    'سيارة للإيجار مع سائق',
    'فيلا للإيجار الصيفي',
    'مكتب للإيجار في المركز'
  ]
};

const descriptions = {
  for_sale: 'منتج عالي الجودة في حالة ممتازة. السعر قابل للتفاوض. للاستفسار يرجى الاتصال.',
  job: 'نبحث عن موظف ذو خبرة جيدة. راتب مجزي وبيئة عمل ممتازة. يرجى إرسال السيرة الذاتية.',
  service: 'خدمة احترافية بأسعار منافسة. خبرة طويلة في المجال. نضمن جودة العمل.',
  for_rent: 'عقار في موقع ممتاز. نظيف ومجهز بالكامل. السعر شامل جميع الخدمات.'
};

async function createTestUsers() {
  const userIds = [];

  console.log('1️⃣  Creating 10 test users...\n');

  for (let i = 1; i <= 10; i++) {
    const email = `test${i}@example.com`;
    const firstName = `Test${i}`;
    const lastName = 'User';
    const wilaya = wilayas[Math.floor(Math.random() * wilayas.length)];
    const city = cities[wilaya][Math.floor(Math.random() * cities[wilaya].length)];

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: 'test123',
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });

      if (authError) {
        console.error(`❌ Error creating ${email}:`, authError.message);
        continue;
      }

      userIds.push({
        id: authData.user.id,
        email,
        firstName,
        lastName,
        wilaya,
        city
      });

      console.log(`✅ Created user: ${email} (${wilaya}, ${city})`);
    } catch (error) {
      console.error(`❌ Unexpected error creating ${email}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${userIds.length} users\n`);
  return userIds;
}

async function createListingsForUsers(users) {
  console.log('2️⃣  Creating listings for each user (5 per category)...\n');

  let totalListings = 0;

  for (const user of users) {
    console.log(`Creating listings for ${user.email}...`);

    for (const category of categories) {
      const categoryTitles = titles[category];
      const description = descriptions[category];

      for (let i = 0; i < 5; i++) {
        const title = categoryTitles[i % categoryTitles.length] + ` - ${i + 1}`;
        const price = category === 'for_sale' || category === 'for_rent'
          ? Math.floor(Math.random() * 50000) + 5000
          : null;

        // Get photos for this listing
        const photoIndex = (totalListings % 5) + 1; // Cycle through photos 1-5
        const photos = [`/uploads/photo${photoIndex}.jpg`];

        const listing = {
          user_id: user.id,
          category,
          title,
          description: `${description} رقم ${i + 1}`,
          price,
          status: 'active',
          location_city: user.city,
          location_wilaya: user.wilaya,
          photos,
          metadata: {}
        };

        // Add category-specific fields
        if (category === 'job') {
          listing.salary_min = 30000 + (i * 5000);
          listing.salary_max = 50000 + (i * 10000);
          listing.job_type = i % 2 === 0 ? 'full-time' : 'part-time';
          listing.company_name = `شركة الاختبار ${i + 1}`;
        } else if (category === 'for_rent') {
          listing.rental_period = i % 3 === 0 ? 'daily' : i % 3 === 1 ? 'monthly' : 'yearly';
          const today = new Date();
          listing.available_from = today.toISOString().split('T')[0];
          const futureDate = new Date(today);
          futureDate.setMonth(futureDate.getMonth() + 6);
          listing.available_to = futureDate.toISOString().split('T')[0];
        } else if (category === 'for_sale') {
          listing.condition = i % 2 === 0 ? 'new' : 'used';
        }

        try {
          const { error } = await supabase
            .from('listings')
            .insert(listing);

          if (error) {
            console.error(`  ❌ Error creating listing: ${error.message}`);
          } else {
            totalListings++;
          }
        } catch (error) {
          console.error(`  ❌ Unexpected error:`, error.message);
        }
      }
    }

    console.log(`  ✅ Created 20 listings for ${user.email} (5 per category)\n`);
  }

  console.log(`\n✅ Total listings created: ${totalListings}\n`);
}

async function main() {
  try {
    const users = await createTestUsers();

    if (users.length === 0) {
      console.error('❌ No users created, aborting listing creation');
      process.exit(1);
    }

    await createListingsForUsers(users);

    console.log('═══════════════════════════════════════');
    console.log('🎉 Test Data Created Successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Listings per user: 20 (5 per category)`);
    console.log(`   Total listings: ${users.length * 20}`);
    console.log(`   Categories: ${categories.join(', ')}`);
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Email: test1@example.com to test10@example.com`);
    console.log(`   Password: test123`);
    console.log(`\n📸 Photos used: /uploads/photo1.jpg through photo5.jpg`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
