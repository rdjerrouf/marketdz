#!/usr/bin/env node
/**
 * Seed subcategory test data — local Supabase only
 * 1. Creates user1@email.com … user10@email.com (password123)
 * 2. Uploads photos from test_photos/ subdirs to listing-photos bucket
 * 3. Creates listings covering every major subcategory (for_sale + for_rent)
 * 4. Prints a verification summary
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Config ────────────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'test_photos');

const env = {};
fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8')
  .split('\n')
  .forEach(line => {
    if (line && !line.startsWith('#')) {
      const [k, ...v] = line.split('=');
      if (k) env[k.trim()] = v.join('=').trim();
    }
  });

const SUPABASE_URL = env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY missing from .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const WILAYAS = [
  'Algiers','Oran','Constantine','Annaba','Blida',
  'Batna','Setif','Tlemcen','Tizi Ouzou','Béjaïa',
];

async function readPhotos(subdir) {
  const dir = path.join(PHOTOS_DIR, subdir);
  try {
    return fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      .map(f => path.join(dir, f));
  } catch {
    // fall back to root test_photos
    return fs.readdirSync(PHOTOS_DIR)
      .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
      .slice(0, 3)
      .map(f => path.join(PHOTOS_DIR, f));
  }
}

async function uploadPhotos(filePaths, label) {
  const urls = [];
  for (const fp of filePaths.slice(0, 3)) {
    const buf = fs.readFileSync(fp);
    const ext = path.extname(fp);
    const name = `test/${label}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const { data, error } = await supabase.storage
      .from('listing-photos')
      .upload(name, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.warn(`   ⚠ upload failed (${path.basename(fp)}): ${error.message}`); continue; }
    const { data: pub } = supabase.storage.from('listing-photos').getPublicUrl(data.path);
    urls.push(pub.publicUrl);
  }
  return urls;
}

// ── Step 1 — Create users ─────────────────────────────────────────────────────
async function createUsers() {
  console.log('\n👤 Creating 10 test users…');
  const users = [];

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@email.com`;
    // Try to create; if already exists, fetch existing
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { first_name: `User${i}`, last_name: 'Test' },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        // Fetch existing user id via admin list
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
        const existing = list?.users?.find(u => u.email === email);
        if (existing) {
          users.push({ id: existing.id, email, wilaya: WILAYAS[i - 1] });
          console.log(`   ✓ ${email} (already exists)`);
          continue;
        }
      }
      console.warn(`   ⚠ ${email}: ${error.message}`);
      continue;
    }
    users.push({ id: data.user.id, email, wilaya: WILAYAS[i - 1] });
    console.log(`   ✅ ${email}`);
  }

  console.log(`   → ${users.length} users ready`);
  return users;
}

// ── Step 2 — Create listings ──────────────────────────────────────────────────
async function createListing(row) {
  const { data, error } = await supabase.from('listings').insert(row).select('id,category,subcategory').single();
  if (error) {
    console.warn(`   ⚠ insert failed (${row.subcategory}): ${error.message}`);
    return null;
  }
  return data;
}

async function seedListings(users) {
  console.log('\n📝 Seeding listings…');
  const created = [];
  const uid = (i) => users[i % users.length].id;
  const wilaya = (i) => users[i % users.length].wilaya;

  // ── FOR SALE ──────────────────────────────────────────────────────────────

  // 1. Cars (Vehicles)
  {
    const photos = await uploadPhotos(await readPhotos('cars'), 'car');
    const r = await createListing({
      user_id: uid(0), category: 'for_sale', subcategory: 'Vehicles',
      title: 'Toyota Corolla 2019 — excellent condition',
      description: 'Well-maintained family sedan, single owner.',
      price: 2800000,
      location_wilaya: wilaya(0),
      status: 'active',
      photos,
      vehicle_make: 'Toyota', vehicle_model: 'Corolla', vehicle_year: 2019,
      vehicle_mileage: 85000, vehicle_transmission: 'automatic',
      vehicle_fuel_type: 'petrol', vehicle_body_type: 'sedan',
    });
    if (r) { created.push(r); console.log(`   ✅ Cars: ${r.id}`); }
  }

  // 2. Motorcycles
  {
    const photos = await uploadPhotos(await readPhotos('motorcycles'), 'moto');
    const r = await createListing({
      user_id: uid(1), category: 'for_sale', subcategory: 'Motorcycles',
      title: 'Yamaha MT-07 2021',
      description: '700cc naked street bike, low mileage.',
      price: 580000,
      location_wilaya: wilaya(1),
      status: 'active',
      photos,
      listing_details: { moto_type: 'naked', engine_cc: 689 },
    });
    if (r) { created.push(r); console.log(`   ✅ Motorcycles: ${r.id}`); }
  }

  // 3. Auto & Motorcycle Parts
  {
    const photos = await uploadPhotos(await readPhotos('auto_parts'), 'part');
    const r = await createListing({
      user_id: uid(2), category: 'for_sale', subcategory: 'Auto & Motorcycle Parts',
      title: 'Front bumper Toyota Corolla 2018-2022',
      description: 'OEM replacement, minor scratch.',
      price: 18000,
      location_wilaya: wilaya(2),
      status: 'active',
      photos,
      listing_details: { part_category: 'body' },
    });
    if (r) { created.push(r); console.log(`   ✅ Auto Parts: ${r.id}`); }
  }

  // 4. Construction Vehicles & Trucks
  {
    const photos = await uploadPhotos(await readPhotos('trucks'), 'truck');
    const r = await createListing({
      user_id: uid(3), category: 'for_sale', subcategory: 'Construction Vehicles & Trucks',
      title: 'Renault Trucks T 480 — tipper',
      description: '2020 model, 3 axles, ready to work.',
      price: 8500000,
      location_wilaya: wilaya(3),
      status: 'active',
      photos,
      listing_details: { truck_type: 'tipper', payload_capacity_kg: 26000 },
    });
    if (r) { created.push(r); console.log(`   ✅ Trucks: ${r.id}`); }
  }

  // 5. Heavy Equipment & Machinery
  {
    const photos = await uploadPhotos(await readPhotos('construction_machines'), 'machine');
    const r = await createListing({
      user_id: uid(4), category: 'for_sale', subcategory: 'Heavy Equipment & Machinery',
      title: 'Caterpillar 320 Excavator 2018',
      description: '5000 hours, well-serviced.',
      price: 15000000,
      location_wilaya: wilaya(4),
      status: 'active',
      photos,
      listing_details: { equipment_type: 'excavator', hours_used: 5000, engine_power_kw: 103 },
    });
    if (r) { created.push(r); console.log(`   ✅ Heavy Equipment: ${r.id}`); }
  }

  // 6. Construction Materials & Supplies
  {
    const photos = await uploadPhotos(await readPhotos('construction_machines'), 'material');
    const r = await createListing({
      user_id: uid(5), category: 'for_sale', subcategory: 'Construction Materials & Supplies',
      title: 'Portland cement — 500 bags',
      description: 'Brand new, factory sealed.',
      price: 450000,
      location_wilaya: wilaya(5),
      status: 'active',
      photos,
      listing_details: { material_type: 'cement', brand: 'Lafarge', unit: 'bag' },
    });
    if (r) { created.push(r); console.log(`   ✅ Construction Materials: ${r.id}`); }
  }

  // 7. Tools & Equipment
  {
    const photos = await uploadPhotos(await readPhotos('tools'), 'tool');
    const r = await createListing({
      user_id: uid(6), category: 'for_sale', subcategory: 'Tools & Equipment',
      title: 'Bosch GBH 2-26 Rotary Hammer',
      description: '800W, SDS-plus, with case.',
      price: 12500,
      location_wilaya: wilaya(6),
      status: 'active',
      photos,
      listing_details: { brand: 'Bosch', tool_type: 'drill', power_source: 'electric' },
    });
    if (r) { created.push(r); console.log(`   ✅ Tools: ${r.id}`); }
  }

  // 8. Real Estate (sale)
  {
    const photos = await uploadPhotos(await readPhotos('cars'), 'realestate'); // reuse generic photos
    const r = await createListing({
      user_id: uid(7), category: 'for_sale', subcategory: 'Real Estate',
      title: 'F4 apartment — Hydra, Algiers',
      description: '120 m², renovated, panoramic view.',
      price: 22000000,
      location_wilaya: wilaya(7),
      status: 'active',
      photos,
      listing_details: {
        property_type: 'apartment', bedrooms: 4, bathrooms: 2,
        size_sqm: 120, floor: 3, furnished: 'no', parking: 'yes', finishing: 'renovated',
      },
    });
    if (r) { created.push(r); console.log(`   ✅ Real Estate (sale): ${r.id}`); }
  }

  // ── FOR RENT ──────────────────────────────────────────────────────────────

  // 9. Apartments / Houses (rent)
  {
    const photos = await uploadPhotos(await readPhotos('cars'), 'apt-rent');
    const r = await createListing({
      user_id: uid(8), category: 'for_rent', subcategory: 'Apartments',
      title: 'Studio furnished — Bab Ezzouar',
      description: 'All utilities included.',
      price: 35000,
      location_wilaya: wilaya(8),
      status: 'active',
      photos,
      listing_details: {
        property_type: 'studio', furnished: 'yes', bedrooms: 1, bathrooms: 1,
        size_sqm: 42, floor: 2, parking: 'no',
      },
    });
    if (r) { created.push(r); console.log(`   ✅ Apt Rent: ${r.id}`); }
  }

  // 10. Offices / Commercial (rent)
  {
    const photos = await uploadPhotos(await readPhotos('trucks'), 'office-rent');
    const r = await createListing({
      user_id: uid(9), category: 'for_rent', subcategory: 'Offices',
      title: 'Office space — Hai Tarek, Oran',
      description: '80 m² open-plan, fibre, parking.',
      price: 55000,
      location_wilaya: wilaya(9),
      status: 'active',
      photos,
      listing_details: { usage_type: 'office', size_sqm: 80, floor: 1, parking: 'yes' },
    });
    if (r) { created.push(r); console.log(`   ✅ Office Rent: ${r.id}`); }
  }

  // 11. Vehicles (rent)
  {
    const photos = await uploadPhotos(await readPhotos('cars'), 'car-rent');
    const r = await createListing({
      user_id: uid(0), category: 'for_rent', subcategory: 'Vehicles',
      title: 'Dacia Logan rental — Algiers',
      description: 'Daily/weekly rental, insured.',
      price: 4500,
      location_wilaya: wilaya(0),
      status: 'active',
      photos,
      listing_details: { rate_unit: 'per-day', deposit_required: 'yes', driver_included: 'no', mileage_limit_km: 300 },
    });
    if (r) { created.push(r); console.log(`   ✅ Vehicle Rent: ${r.id}`); }
  }

  // 12. Equipment (rent)
  {
    const photos = await uploadPhotos(await readPhotos('tools'), 'equip-rent');
    const r = await createListing({
      user_id: uid(1), category: 'for_rent', subcategory: 'Equipment',
      title: 'Concrete mixer rental — daily',
      description: '200L drum, petrol engine, delivery available.',
      price: 3500,
      location_wilaya: wilaya(1),
      status: 'active',
      photos,
      listing_details: { equipment_type: 'concrete-mixer', brand: 'Altrad', rate_unit: 'per-day', deposit_required: 'yes' },
    });
    if (r) { created.push(r); console.log(`   ✅ Equipment Rent: ${r.id}`); }
  }

  console.log(`\n   → ${created.length} listings created`);
  return created;
}

// ── Step 3 — Verify ───────────────────────────────────────────────────────────
async function verify(listings) {
  console.log('\n🔍 Verifying listings in DB…\n');
  const ids = listings.map(l => l.id);
  const { data, error } = await supabase
    .from('listings')
    .select('id,category,subcategory,listing_details,vehicle_make,vehicle_model,vehicle_year,photos,status')
    .in('id', ids);

  if (error) { console.error('❌  verify query failed:', error.message); return; }

  let pass = 0, fail = 0;
  for (const row of data) {
    const hasPhoto = row.photos?.length > 0;
    const hasDetails = row.vehicle_make || row.listing_details;
    const ok = hasPhoto && hasDetails;
    ok ? pass++ : fail++;
    const icon = ok ? '✅' : '❌';
    console.log(
      `${icon}  [${row.category}] ${row.subcategory?.padEnd(35)} ` +
      `photos:${row.photos?.length ?? 0}  ` +
      `details:${JSON.stringify(row.listing_details ?? { vehicle: row.vehicle_make }).slice(0, 60)}`
    );
  }

  console.log(`\n${pass === data.length ? '🎉' : '⚠'} ${pass}/${data.length} listings passed verification`);
  if (fail > 0) console.log(`   ${fail} listings missing photos or subcategory details — check warnings above`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 DlalaDZ — subcategory test seed\n');
  console.log(`   Supabase: ${SUPABASE_URL}`);

  const users = await createUsers();
  if (users.length === 0) { console.error('❌  No users — aborting'); process.exit(1); }

  const listings = await seedListings(users);
  await verify(listings);

  console.log('\n✅ Done. Next steps:');
  console.log('   1. npm run dev (if not already running)');
  console.log('   2. npx playwright test tests/subcategory.spec.ts  ← run subcategory tests');
  console.log(`   3. Studio: http://127.0.0.1:54323\n`);
}

main().catch(err => { console.error('\n💥', err); process.exit(1); });
