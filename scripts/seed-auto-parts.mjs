#!/usr/bin/env node
// Replace the existing "Auto & Motorcycle Parts" listings for the 20 test
// users with ~1000 realistic Algerian-market parts listings.
//
// Categories follow the existing part_category enum in subcategory-fields.ts
// (engine, electrical, body, suspension, brakes, interior, lighting,
// tires-wheels, exhaust, transmission, other), so no registry change.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ID = 'vrlzwxoiglzwmhndpolj'
const CLOUD_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY required (source .env.cloud)')
  process.exit(1)
}

const TOTAL = Number(process.env.TOTAL_PARTS) || 1000
const BATCH_SIZE = 500
const TEST_PHOTOS_DIR = path.join(__dirname, '../test_photos/auto_parts')
const PHOTO_BASE = `${CLOUD_URL}/storage/v1/object/public/listing-photos/test_photos/auto_parts`

// Pre-fetched IDs of user1..user20@email.com
const TEST_USER_IDS = [
  '2f8fa8eb-21d9-4e0e-95d2-bd769e523771', 'bfe8fe6f-182f-46ab-9981-2d817297cd02',
  'c73ba888-4420-4318-8350-e6e43df73e93', '979d5bb7-e906-4947-87e4-996da0193a4e',
  '6e5ba67f-3f6a-4db0-9029-c20030dfb7dd', '24829cb1-ea0c-45d7-b6dc-3e3272ee3c27',
  '5417a287-4f72-4c73-8d3b-52bac472ac73', 'c1b326a6-afff-45b9-a416-f1cbb2ba7197',
  '750eeb1b-a59a-4863-bcf2-5256e4dda80a', '60a9c9ec-687b-4396-bf23-868137ceab5d',
  '8e9b7bd5-08db-4856-8e85-04109dabb5b8', '47af8776-9287-476c-be69-12e945289bfa',
  '0ac36ed2-dd77-4917-ac4d-0f5d3d4a0b36', 'f34d5a12-1fe2-4d75-a5b3-6de94dbcf86c',
  '2704c5ae-9ec2-4703-a7af-cf0c6d9d168b', '01109709-325a-4739-9371-b7bd0c51e752',
  '436d0005-127c-486e-a530-ee7421670072', 'e7a3f1dc-b5e7-47d4-b923-9b4b67f8ed61',
  'a463537d-fd54-4aad-9605-39ef5d195c9f', '39290948-70f5-46e0-87b8-44c438d640b6',
]

const WILAYAS = [
  'Algiers', 'Blida', 'Oran', 'Constantine', 'Annaba', 'Setif', 'Tamanrasset',
  'Tlemcen', 'Kabylie', 'Batna', 'Bejaia', 'Jijel', 'Skikda', 'Saida', 'Tiaret',
  'Guelma', 'Chlef', 'Medea', 'Illizi', 'El Bayadh',
]
const CITY_BY_WILAYA = {
  Algiers: ['Algiers Center', 'Kouba', 'Hydra', 'Bab el Oued', 'El Hamiz'],
  Oran: ['Oran Center', 'Bir El Djir', 'Misserghine'],
  Constantine: ['Constantine Center', 'Benachiba'],
  Annaba: ['Annaba Center', 'Seraidi', 'El Hadjar'],
  Setif: ['Setif Center', 'El Eulma'],
}

const COMMON_CAR_MAKES = ['Toyota', 'Renault', 'Peugeot', 'Hyundai', 'Kia', 'Volkswagen', 'Dacia', 'Citroën', 'Mercedes', 'BMW']
const COMMON_MOTO_MAKES = ['Honda', 'Yamaha', 'Suzuki', 'Bajaj', 'TVS', 'Vespa', 'Sym']

// ─── Realistic Algerian-market parts pool ─────────────────────────────────
// Each entry: { name, brands, category, fitsCar, fitsMoto, price: [min, max], weight }
// weight = popularity multiplier; engine/brakes/suspension dominate.
const PARTS = [
  // Engine — filtration, cooling, ignition, drivetrain accessories
  { name: 'Oil Filter',                brands: ['Bosch', 'Mann-Filter', 'Mahle', 'Hengst', 'Valeo'], category: 'engine', fitsCar: true, fitsMoto: true,  price: [600, 2500],   weight: 8 },
  { name: 'Air Filter',                brands: ['Bosch', 'Mann-Filter', 'K&N', 'Mahle', 'Valeo'],    category: 'engine', fitsCar: true, fitsMoto: true,  price: [800, 3000],   weight: 8 },
  { name: 'Fuel Filter',               brands: ['Bosch', 'Mann-Filter', 'Mahle', 'Hengst'],          category: 'engine', fitsCar: true, fitsMoto: false, price: [900, 3500],   weight: 6 },
  { name: 'Cabin / Pollen Filter',     brands: ['Bosch', 'Mann-Filter', 'Mahle'],                    category: 'engine', fitsCar: true, fitsMoto: false, price: [700, 2500],   weight: 4 },
  { name: 'Spark Plugs (set of 4)',    brands: ['Bosch', 'NGK', 'Champion', 'Denso'],                category: 'engine', fitsCar: true, fitsMoto: false, price: [1600, 6000],  weight: 6 },
  { name: 'Spark Plug',                brands: ['NGK', 'Bosch', 'Denso'],                            category: 'engine', fitsCar: false, fitsMoto: true, price: [400, 1500],   weight: 4 },
  { name: 'Radiator',                  brands: ['Denso', 'Valeo', 'TYC', 'Nissens', 'Behr'],         category: 'engine', fitsCar: true, fitsMoto: false, price: [12000, 45000], weight: 6 },
  { name: 'Expansion Tank',            brands: ['Valeo', 'Mahle', 'Behr'],                           category: 'engine', fitsCar: true, fitsMoto: false, price: [3500, 12000], weight: 4 },
  { name: 'Water Pump',                brands: ['Bosch', 'Gates', 'SKF', 'Aisin'],                   category: 'engine', fitsCar: true, fitsMoto: false, price: [8000, 25000], weight: 5 },
  { name: 'Cooling Fan',               brands: ['Bosch', 'Valeo', 'Behr', 'Denso'],                  category: 'engine', fitsCar: true, fitsMoto: false, price: [7000, 22000], weight: 4 },
  { name: 'Thermostat',                brands: ['Wahler', 'Behr', 'Valeo'],                          category: 'engine', fitsCar: true, fitsMoto: false, price: [1500, 6000],  weight: 3 },
  { name: 'Timing Belt Kit',           brands: ['Gates', 'Contitech', 'INA'],                        category: 'engine', fitsCar: true, fitsMoto: false, price: [8000, 28000], weight: 5 },
  { name: 'Serpentine Drive Belt',     brands: ['Gates', 'Contitech', 'Dayco'],                      category: 'engine', fitsCar: true, fitsMoto: false, price: [1800, 7000],  weight: 4 },
  { name: 'Piston Set',                brands: ['Mahle', 'KS', 'Federal-Mogul'],                     category: 'engine', fitsCar: true, fitsMoto: true,  price: [15000, 70000], weight: 2 },

  // Brakes — massive turnover per the research
  { name: 'Brake Pads (Front)',        brands: ['Bosch', 'ATE', 'TRW', 'Brembo', 'Ferodo', 'Textar'], category: 'brakes', fitsCar: true, fitsMoto: false, price: [3000, 12000], weight: 9 },
  { name: 'Brake Pads (Rear)',         brands: ['Bosch', 'ATE', 'TRW', 'Brembo', 'Ferodo'],          category: 'brakes', fitsCar: true, fitsMoto: false, price: [2500, 9500],  weight: 7 },
  { name: 'Brake Discs / Rotors (Front, pair)', brands: ['Bosch', 'ATE', 'Brembo', 'Textar'],        category: 'brakes', fitsCar: true, fitsMoto: false, price: [6000, 22000], weight: 7 },
  { name: 'Brake Discs / Rotors (Rear, pair)',  brands: ['Bosch', 'ATE', 'Brembo'],                  category: 'brakes', fitsCar: true, fitsMoto: false, price: [5500, 18000], weight: 5 },
  { name: 'Brake Shoes',               brands: ['Bosch', 'ATE', 'TRW'],                              category: 'brakes', fitsCar: true, fitsMoto: true,  price: [2200, 8500],  weight: 6 },
  { name: 'Brake Fluid DOT4 (1L)',     brands: ['Bosch', 'ATE'],                                     category: 'brakes', fitsCar: true, fitsMoto: true,  price: [800, 2500],   weight: 4 },
  { name: 'Brake Caliper',             brands: ['Bosch', 'ATE', 'Brembo'],                           category: 'brakes', fitsCar: true, fitsMoto: false, price: [18000, 55000], weight: 3 },
  { name: 'Motorcycle Brake Lever',    brands: ['ASV', 'Pazoma', 'OEM'],                             category: 'brakes', fitsCar: false, fitsMoto: true, price: [600, 2500],   weight: 4 },

  // Suspension — Algerian roads chew through these
  { name: 'Shock Absorber (Front)',    brands: ['KYB', 'Bilstein', 'Sachs', 'Monroe'],               category: 'suspension', fitsCar: true,  fitsMoto: false, price: [8000, 28000], weight: 8 },
  { name: 'Shock Absorber (Rear)',     brands: ['KYB', 'Sachs', 'Monroe'],                           category: 'suspension', fitsCar: true,  fitsMoto: false, price: [7000, 22000], weight: 6 },
  { name: 'Strut Mount',               brands: ['Sachs', 'Lemforder', 'SKF'],                        category: 'suspension', fitsCar: true,  fitsMoto: false, price: [2500, 9500],  weight: 4 },
  { name: 'Control Arm',               brands: ['Lemforder', 'TRW', 'Febi'],                         category: 'suspension', fitsCar: true,  fitsMoto: false, price: [6000, 22000], weight: 5 },
  { name: 'Ball Joint',                brands: ['TRW', 'Lemforder', 'Febi'],                         category: 'suspension', fitsCar: true,  fitsMoto: false, price: [1800, 7000],  weight: 5 },
  { name: 'Stabilizer Bushing',        brands: ['Lemforder', 'Febi'],                                category: 'suspension', fitsCar: true,  fitsMoto: false, price: [1200, 4500],  weight: 4 },
  { name: 'Sway Bar Link',             brands: ['Lemforder', 'TRW', 'Febi'],                         category: 'suspension', fitsCar: true,  fitsMoto: false, price: [1500, 5500],  weight: 4 },
  { name: 'Wheel Bearing Kit',         brands: ['SKF', 'FAG', 'SNR'],                                category: 'suspension', fitsCar: true,  fitsMoto: true,  price: [3500, 15000], weight: 4 },
  { name: 'Coil Spring',               brands: ['Sachs', 'Lesjofors'],                               category: 'suspension', fitsCar: true,  fitsMoto: false, price: [4500, 18000], weight: 3 },

  // Electrical
  { name: 'Battery 12V 60Ah',          brands: ['Bosch', 'Varta', 'Exell', 'Tudor'],                 category: 'electrical', fitsCar: true,  fitsMoto: false, price: [12000, 32000], weight: 6 },
  { name: 'Battery 12V 75Ah',          brands: ['Bosch', 'Varta', 'Exell'],                          category: 'electrical', fitsCar: true,  fitsMoto: false, price: [16000, 42000], weight: 4 },
  { name: 'Motorcycle Battery 12V 9Ah', brands: ['Yuasa', 'Bosch', 'Varta'],                         category: 'electrical', fitsCar: false, fitsMoto: true,  price: [3500, 9500],  weight: 4 },
  { name: 'Alternator',                brands: ['Bosch', 'Valeo', 'Denso', 'Mitsubishi'],            category: 'electrical', fitsCar: true,  fitsMoto: false, price: [22000, 75000], weight: 4 },
  { name: 'Starter Motor',             brands: ['Bosch', 'Valeo', 'Denso'],                          category: 'electrical', fitsCar: true,  fitsMoto: false, price: [18000, 60000], weight: 4 },
  { name: 'Ignition Coil',             brands: ['Bosch', 'NGK', 'Delphi'],                           category: 'electrical', fitsCar: true,  fitsMoto: true,  price: [3500, 12000], weight: 4 },
  { name: 'Throttle Cable',            brands: ['OEM', 'Domino', 'Motion Pro'],                      category: 'electrical', fitsCar: false, fitsMoto: true,  price: [800, 2800],   weight: 4 },
  { name: 'Clutch Cable',              brands: ['OEM', 'Domino', 'Motion Pro'],                      category: 'electrical', fitsCar: false, fitsMoto: true,  price: [900, 3000],   weight: 4 },

  // Transmission
  { name: 'Clutch Kit',                brands: ['Sachs', 'LuK', 'Valeo', 'Aisin'],                   category: 'transmission', fitsCar: true,  fitsMoto: false, price: [18000, 65000], weight: 7 },
  { name: 'Motorcycle Drive Chain',    brands: ['DID', 'Regina', 'RK'],                              category: 'transmission', fitsCar: false, fitsMoto: true,  price: [4500, 15000], weight: 5 },
  { name: 'Sprocket Kit',              brands: ['JT', 'Sunstar'],                                    category: 'transmission', fitsCar: false, fitsMoto: true,  price: [3000, 9500],  weight: 4 },
  { name: 'CV Joint Kit',              brands: ['GKN', 'SKF'],                                       category: 'transmission', fitsCar: true,  fitsMoto: false, price: [6500, 22000], weight: 4 },
  { name: 'Drive Belt (scooter)',      brands: ['Malossi', 'Polini', 'OEM'],                         category: 'transmission', fitsCar: false, fitsMoto: true,  price: [1800, 5500],  weight: 4 },

  // Tires & Wheels
  { name: 'Tire 175/65R14',            brands: ['Michelin', 'Continental', 'Bridgestone', 'Goodyear', 'Pirelli', 'Kumho', 'Hankook'], category: 'tires-wheels', fitsCar: true,  fitsMoto: false, price: [12000, 22000], weight: 6 },
  { name: 'Tire 195/65R15',            brands: ['Michelin', 'Continental', 'Bridgestone', 'Pirelli'], category: 'tires-wheels', fitsCar: true,  fitsMoto: false, price: [14000, 28000], weight: 6 },
  { name: 'Tire 205/55R16',            brands: ['Michelin', 'Continental', 'Pirelli'],               category: 'tires-wheels', fitsCar: true,  fitsMoto: false, price: [16000, 34000], weight: 5 },
  { name: 'Motorcycle Tire 100/80-17', brands: ['Michelin', 'Pirelli', 'Dunlop'],                    category: 'tires-wheels', fitsCar: false, fitsMoto: true,  price: [6000, 14000], weight: 5 },
  { name: 'Inner Tube (motorcycle)',   brands: ['Michelin', 'Bridgestone'],                          category: 'tires-wheels', fitsCar: false, fitsMoto: true,  price: [800, 2200],   weight: 4 },
  { name: 'Alloy Wheels Set',          brands: ['BBS', 'Enkei', 'OZ'],                               category: 'tires-wheels', fitsCar: true,  fitsMoto: false, price: [45000, 180000], weight: 2 },

  // Body
  { name: 'Headlight Assembly',        brands: ['Depo', 'Hella', 'Valeo'],                           category: 'body', fitsCar: true, fitsMoto: false, price: [14000, 65000], weight: 4 },
  { name: 'Tail Light',                brands: ['Depo', 'Hella'],                                    category: 'body', fitsCar: true, fitsMoto: false, price: [8000, 28000], weight: 3 },
  { name: 'Side Mirror',               brands: ['Valeo', 'Depo', 'OEM'],                             category: 'body', fitsCar: true, fitsMoto: false, price: [5500, 22000], weight: 3 },
  { name: 'Front Bumper Cover',        brands: ['OEM Equivalent'],                                   category: 'body', fitsCar: true, fitsMoto: false, price: [18000, 55000], weight: 2 },

  // Lighting
  { name: 'H4 Halogen Bulb (pair)',    brands: ['Osram', 'Philips', 'Bosch'],                        category: 'lighting', fitsCar: true, fitsMoto: true, price: [1200, 4500], weight: 5 },
  { name: 'H7 Halogen Bulb (pair)',    brands: ['Osram', 'Philips'],                                 category: 'lighting', fitsCar: true, fitsMoto: false, price: [1400, 5500], weight: 4 },
  { name: 'LED Headlight Conversion Kit', brands: ['Philips', 'Osram', 'Aozoom'],                    category: 'lighting', fitsCar: true, fitsMoto: true, price: [6500, 22000], weight: 3 },

  // Exhaust
  { name: 'Catalytic Converter',       brands: ['Bosal', 'Walker'],                                  category: 'exhaust', fitsCar: true, fitsMoto: false, price: [22000, 95000], weight: 2 },
  { name: 'Exhaust Muffler',           brands: ['Bosal', 'Walker'],                                  category: 'exhaust', fitsCar: true, fitsMoto: false, price: [8500, 28000], weight: 3 },
  { name: 'Exhaust Pipe',              brands: ['Bosal', 'Walker'],                                  category: 'exhaust', fitsCar: true, fitsMoto: false, price: [4500, 15000], weight: 2 },

  // Interior — e-commerce-driven niche
  { name: 'Car Seat Gap Organizer',    brands: ['Baseus', 'Generic', 'Premium PU'],                  category: 'interior', fitsCar: true, fitsMoto: false, price: [1200, 3500], weight: 4 },
  { name: 'Magnetic Phone Holder',     brands: ['Baseus', 'Joyroom'],                                category: 'interior', fitsCar: true, fitsMoto: false, price: [800, 2500],  weight: 5 },
  { name: 'Dashboard Phone Mount',     brands: ['Baseus', 'iOttie', 'Generic'],                      category: 'interior', fitsCar: true, fitsMoto: false, price: [1500, 4500], weight: 4 },
  { name: 'Seat Covers (full set)',    brands: ['Generic Leather', 'Premium PU'],                    category: 'interior', fitsCar: true, fitsMoto: false, price: [4500, 18000], weight: 3 },

  // Other — Algerian COD bestsellers
  { name: 'Heated Winter Riding Gloves', brands: ['Generic', 'Pro-Biker'],                           category: 'other', fitsCar: false, fitsMoto: true, price: [1500, 4500], weight: 4 },
  { name: 'Motorcycle Rain Cover',     brands: ['Generic', 'Oxford'],                                category: 'other', fitsCar: false, fitsMoto: true, price: [2500, 7500], weight: 3 },
  { name: 'Anti-Theft Disc Lock',      brands: ['Master Lock', 'Xena', 'Generic'],                   category: 'other', fitsCar: false, fitsMoto: true, price: [1200, 4500], weight: 3 },
]

// Pre-build the weighted index so random pick is O(1)
const WEIGHTED_INDEX = PARTS.flatMap((p, i) => Array(p.weight).fill(i))

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

const PHOTOS = fs.readdirSync(TEST_PHOTOS_DIR)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .map(f => `${PHOTO_BASE}/${f}`)
console.log(`📸 ${PHOTOS.length} parts photos loaded`)

function pickPhotos() {
  const count = randInt(1, 3)
  const out = []
  for (let i = 0; i < count; i++) out.push(rand(PHOTOS))
  return out
}

function generatePartListing() {
  const part = PARTS[rand(WEIGHTED_INDEX)]
  const brand = rand(part.brands)
  const condition = Math.random() < 0.7 ? 'new' : 'good'
  const quality = condition === 'new' ? rand(['Original', 'OEM Equivalent', 'Aftermarket']) : 'Used (Working)'
  const price = randInt(part.price[0], part.price[1])

  // Compatible vehicle hint — boosts make/model search hits
  let compatHint = ''
  let descMakeMention = ''
  if (part.fitsCar && (!part.fitsMoto || Math.random() < 0.7)) {
    const make = rand(COMMON_CAR_MAKES)
    compatHint = ` — for ${make}`
    descMakeMention = `Compatible with most ${make} models. `
  } else if (part.fitsMoto) {
    const make = rand(COMMON_MOTO_MAKES)
    compatHint = ` — for ${make}`
    descMakeMention = `Fits ${make} scooters and motorcycles. `
  }

  const title = `${part.name} - ${brand} - ${quality}${compatHint}`
  const description = `${part.name} by ${brand}. Quality: ${quality}. ${descMakeMention}` +
    `${condition === 'new' ? 'Brand new, unopened, original packaging.' : 'Used part in good working condition, tested.'} ` +
    `Available for pickup at our shop or delivery via Yalidine/Maystro across Algeria. Cash on delivery accepted.`

  const wilaya = rand(WILAYAS)
  const city = rand(CITY_BY_WILAYA[wilaya] || [`${wilaya} Center`])

  return {
    user_id: rand(TEST_USER_IDS),
    category: 'for_sale',
    subcategory: 'Auto & Motorcycle Parts',
    title,
    description,
    price,
    status: 'active',
    photos: pickPhotos(),
    location_wilaya: wilaya,
    location_city: city,
    condition,
    listing_details: {
      part_category: part.category,
      brand,
    },
    is_hot_deal: Math.random() < 0.08,
  }
}

// ─── Main ───────────────────────────────────────────────────────────────
const supabase = createClient(CLOUD_URL, SERVICE_KEY, { auth: { persistSession: false } })

console.log(`🗑️  Deleting existing parts listings for the 20 test users...`)
const { error: delErr, count: deleted } = await supabase
  .from('listings')
  .delete({ count: 'exact' })
  .eq('subcategory', 'Auto & Motorcycle Parts')
  .in('user_id', TEST_USER_IDS)
if (delErr) { console.error('delete failed:', delErr.message); process.exit(1) }
console.log(`✅ Deleted ${deleted ?? '?'} old parts listings`)

console.log(`\n🚀 Generating ${TOTAL.toLocaleString()} realistic parts listings...`)
let inserted = 0
const startTime = Date.now()
for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
  const batchSize = Math.min(BATCH_SIZE, TOTAL - i)
  const batch = Array.from({ length: batchSize }, generatePartListing)
  const { error } = await supabase.from('listings').insert(batch)
  if (error) {
    console.error(`  ❌ batch failed:`, error.message)
    continue
  }
  inserted += batchSize
  console.log(`  ✓ ${inserted}/${TOTAL}`)
}
console.log(`\n✅ Done. ${inserted} listings in ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
