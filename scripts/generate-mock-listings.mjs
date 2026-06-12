#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Configuration ─────────────────────────────────────────────────────────

const PROJECT_ID = 'vrlzwxoiglzwmhndpolj'
const CLOUD_URL = `https://${PROJECT_ID}.supabase.co`
const TOTAL_LISTINGS = Number(process.env.TOTAL_LISTINGS) || 10000
const BATCH_SIZE = 500
// 20 pre-created cloud test users (user1..user20@email.com). Fetched via SQL once;
// hardcoded here because auth.admin.listUsers paginates inconsistently with the
// current cloud service-role token.
const TEST_USERS = [
  { email: 'user1@email.com',  id: '2f8fa8eb-21d9-4e0e-95d2-bd769e523771' },
  { email: 'user2@email.com',  id: 'bfe8fe6f-182f-46ab-9981-2d817297cd02' },
  { email: 'user3@email.com',  id: 'c73ba888-4420-4318-8350-e6e43df73e93' },
  { email: 'user4@email.com',  id: '979d5bb7-e906-4947-87e4-996da0193a4e' },
  { email: 'user5@email.com',  id: '6e5ba67f-3f6a-4db0-9029-c20030dfb7dd' },
  { email: 'user6@email.com',  id: '24829cb1-ea0c-45d7-b6dc-3e3272ee3c27' },
  { email: 'user7@email.com',  id: '5417a287-4f72-4c73-8d3b-52bac472ac73' },
  { email: 'user8@email.com',  id: 'c1b326a6-afff-45b9-a416-f1cbb2ba7197' },
  { email: 'user9@email.com',  id: '750eeb1b-a59a-4863-bcf2-5256e4dda80a' },
  { email: 'user10@email.com', id: '60a9c9ec-687b-4396-bf23-868137ceab5d' },
  { email: 'user11@email.com', id: '8e9b7bd5-08db-4856-8e85-04109dabb5b8' },
  { email: 'user12@email.com', id: '47af8776-9287-476c-be69-12e945289bfa' },
  { email: 'user13@email.com', id: '0ac36ed2-dd77-4917-ac4d-0f5d3d4a0b36' },
  { email: 'user14@email.com', id: 'f34d5a12-1fe2-4d75-a5b3-6de94dbcf86c' },
  { email: 'user15@email.com', id: '2704c5ae-9ec2-4703-a7af-cf0c6d9d168b' },
  { email: 'user16@email.com', id: '01109709-325a-4739-9371-b7bd0c51e752' },
  { email: 'user17@email.com', id: '436d0005-127c-486e-a530-ee7421670072' },
  { email: 'user18@email.com', id: 'e7a3f1dc-b5e7-47d4-b923-9b4b67f8ed61' },
  { email: 'user19@email.com', id: 'a463537d-fd54-4aad-9605-39ef5d195c9f' },
  { email: 'user20@email.com', id: '39290948-70f5-46e0-87b8-44c438d640b6' },
]
const WILAYAS_FOR_PROFILES = ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Setif', 'Blida', 'Batna', 'Bejaia']

// Subcategory → photo subfolder mapping (anything not listed falls back to the flat pool)
const SUBCATEGORY_PHOTO_FOLDERS = {
  'Vehicles': 'cars',
  'Vehicles (rent)': 'cars',
  'Motorcycles': 'motorcycles',
  'Auto & Motorcycle Parts': 'auto_parts',
  'Heavy Equipment & Machinery': 'construction_machines',
  'Equipment (rent)': 'construction_machines',
  'Construction Vehicles & Trucks': 'trucks',
  'Tools & Equipment': 'tools',
}

// Algerian Wilayas and Cities
const WILAYAS = [
  'Algiers', 'Blida', 'Oran', 'Constantine', 'Annaba',
  'Setif', 'Tamanrasset', 'Tlemcen', 'Kabylie', 'Batna',
  'Bejaia', 'Jijel', 'Skikda', 'Saida', 'Tiaret',
  'Guelma', 'Chlef', 'Medea', 'Illizi', 'El Bayadh',
]

const CITIES_BY_WILAYA = {
  'Algiers': ['Algiers Center', 'Kouba', 'Hydra', 'Bab el Oued'],
  'Oran': ['Oran Center', 'Bir El Djir', 'Misserghine'],
  'Constantine': ['Constantine Center', 'Benachiba'],
  'Annaba': ['Annaba Center', 'Seraidi', 'El Hadjar'],
  'Setif': ['Setif Center', 'Béni Ourtilane'],
}

// Subcategories per category
const SUBCATEGORIES = {
  'for_sale': [
    'Vehicles', 'Motorcycles', 'Auto & Motorcycle Parts',
    'Construction Vehicles & Trucks', 'Heavy Equipment & Machinery',
    'Construction Materials & Supplies', 'Real Estate (sale)',
    'Phones & Accessories', 'Electronics & Computers', 'Home Appliances',
    'Furniture & Home Decor', 'Fashion & Clothing', 'Baby & Kids',
    'Sports & Outdoors', 'Books & Media', 'Tools & Equipment', 'Agriculture'
  ],
  'for_rent': [
    'Apartments / Houses (rent)', 'Offices / Commercial (rent)',
    'Event Halls (rent)', 'Vehicles (rent)', 'Equipment (rent)'
  ]
}

// Test photos directory
const TEST_PHOTOS_DIR = path.join(__dirname, '../test_photos')

// ─── Mock data generators ─────────────────────────────────────────────────

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomPrice(min = 5000, max = 2000000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomPhotos(photoPools, subcategory) {
  const folder = SUBCATEGORY_PHOTO_FOLDERS[subcategory]
  const pool = (folder && photoPools[folder]?.length) ? photoPools[folder] : photoPools.flat
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 photos
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return out
}

// ─── Realistic data generators ─────────────────────────────────────────────

const VEHICLE_MAKES = ['Toyota', 'BMW', 'Mercedes', 'Hyundai', 'Peugeot', 'Renault', 'Volkswagen', 'Opel', 'Nissan', 'Honda', 'Mazda', 'Kia']
const VEHICLE_MODELS = {
  'Toyota': ['Corolla', 'Camry', 'Yaris', 'Auris', 'Avensis'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
  'Mercedes': ['C-Class', 'E-Class', 'GLC', 'GLK'],
  'Hyundai': ['i30', 'i35', 'Elantra', 'Tucson'],
  'Peugeot': ['308', '3008', '208', '2008'],
  'Renault': ['Megane', 'Scenic', 'Clio', 'Duster'],
  'Volkswagen': ['Golf', 'Passat', 'Polo', 'Tiguan'],
  'Opel': ['Astra', 'Vectra', 'Corsa', 'Zafira'],
  'Nissan': ['Qashqai', 'X-Trail', 'Altima'],
  'Honda': ['Civic', 'Accord', 'CR-V'],
  'Mazda': ['CX-5', 'Mazda3', 'Mazda6'],
  'Kia': ['Sportage', 'Sorento', 'K5']
}

const MOTO_BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'KTM', 'Bajaj']
const MOTO_MODELS = {
  'Honda': ['CB125', 'CB500', 'CRF250', 'PCX'],
  'Yamaha': ['YZF-R3', 'YZF-R15', 'MT-07'],
  'Suzuki': ['GSX-S125', 'GSX-R125'],
  'Kawasaki': ['Ninja 125', 'Z125'],
  'KTM': ['Duke 125', 'Duke 390'],
  'Bajaj': ['Pulsar 150', 'Dominar 400']
}

const AUTO_PARTS = [
  { name: 'Brake Pads', brand: ['Bosch', 'ATE', 'TRW', 'Brembo'] },
  { name: 'Tires', brand: ['Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli'] },
  { name: 'Oil Filter', brand: ['Bosch', 'Mahle', 'Mann-Filter'] },
  { name: 'Air Filter', brand: ['Bosch', 'Mann-Filter', 'K&N'] },
  { name: 'Battery', brand: ['Bosch', 'Exell', 'Varta'] },
  { name: 'Shock Absorber', brand: ['KYB', 'Bilstein', 'Sachs'] },
  { name: 'Spark Plugs', brand: ['Bosch', 'NGK', 'Champion'] },
  { name: 'Radiator', brand: ['Denso', 'Valeo', 'TYC'] },
  { name: 'Starter Motor', brand: ['Bosch', 'Valeo'] },
  { name: 'Alternator', brand: ['Bosch', 'Valeo', 'Denso'] }
]

const ELECTRONICS_BRANDS = ['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Xiaomi', 'OnePlus']
const ELECTRONICS = [
  { type: 'Laptop', models: ['MacBook Air', 'MacBook Pro', 'ThinkPad X1', 'Dell XPS'] },
  { type: 'Smartphone', models: ['iPhone 13', 'Galaxy S21', 'Xiaomi 11', 'OnePlus 9'] },
  { type: 'Tablet', models: ['iPad', 'Galaxy Tab', 'Xiaomi Pad'] },
]

const APPLIANCE_TYPES = [
  'Washing Machine', 'Refrigerator', 'Oven', 'Dishwasher', 'Microwave', 'Air Conditioner', 'Vacuum Cleaner'
]

const FURNITURE_TYPES = ['Sofa', 'Dining Table', 'Bed', 'Office Chair', 'Bookshelf', 'TV Cabinet']
const FURNITURE_MATERIALS = ['Wood', 'Leather', 'Fabric', 'Metal', 'Glass']

const FASHION_BRANDS = ['Nike', 'Adidas', 'Puma', 'H&M', 'Zara', 'Tommy Hilfiger', 'Ralph Lauren']
const CLOTHING_TYPES = ['T-shirt', 'Jeans', 'Jacket', 'Dress', 'Sweater', 'Shorts']

const CONSTRUCTION_EQUIPMENT = ['Excavator', 'Bulldozer', 'Wheel Loader', 'Grader', 'Backhoe', 'Crane']
const TRUCK_TYPES = ['Flatbed', 'Tipper', 'Cement Mixer', 'Refrigerated', 'Tanker', 'Box Truck']

const REAL_ESTATE_FEATURES = {
  'apartment': { bedrooms: [1, 2, 3, 4], size_sqm: [50, 100, 150, 200] },
  'house': { bedrooms: [2, 3, 4, 5], size_sqm: [120, 200, 300, 500] },
  'villa': { bedrooms: [3, 4, 5, 6], size_sqm: [300, 500, 700, 1000] },
  'land': { size_sqm: [100, 500, 1000, 5000] }
}

function generateListingTitle(category, subcategory, details = {}) {
  switch (subcategory) {
    case 'Vehicles': {
      const transmission = details.vehicle_transmission === 'automatic' ? 'Automatic' : 'Manual'
      return `${details.vehicle_make} ${details.vehicle_model} ${details.vehicle_year} - ${transmission} - Excellent Condition`
    }

    case 'Motorcycles': {
      return `${details.vehicle_make} ${details.vehicle_model} ${details.vehicle_year} - Low Mileage`
    }

    case 'Auto & Motorcycle Parts': {
      const partName = (details.part_category || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Spare Part'
      return `${partName} - ${details.brand} - Original Quality`
    }

    case 'Electronics & Computers': {
      const type = getRandomElement(ELECTRONICS)
      return `${details.brand} ${details.model_name} - ${type.type} - Like New Condition`
    }

    case 'Phones & Accessories': {
      return `${details.brand} ${details.model_name} - Unlocked - Perfect Condition`
    }

    case 'Home Appliances': {
      const typeReadable = (details.appliance_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Appliance'
      return `${details.brand} ${typeReadable} - Modern - Energy Efficient`
    }

    case 'Furniture & Home Decor': {
      const type = getRandomElement(FURNITURE_TYPES)
      return `${type} - ${details.material} - Modern Design - Like New`
    }

    case 'Fashion & Clothing': {
      const type = getRandomElement(CLOTHING_TYPES)
      return `${details.brand} ${type} - Size ${details.size} - Authentic`
    }

    case 'Baby & Kids': {
      const items = ['Baby Stroller', 'Crib', 'High Chair', 'Play Mat', 'Baby Monitor']
      return `${details.brand} ${getRandomElement(items)} - Safe & Clean`
    }

    case 'Sports & Outdoors': {
      const sportReadable = (details.sport_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${details.brand} ${sportReadable} Gear - Professional Grade`
    }

    case 'Books & Media': {
      return `${details.genre} Book Collection - ${details.book_language} - Good Condition`
    }

    case 'Tools & Equipment': {
      const toolReadable = (details.tool_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      return `${details.brand} ${toolReadable} - Professional Tool`
    }

    case 'Construction Materials & Supplies': {
      const materialReadable = (details.material_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${materialReadable} - ${details.brand} - Bulk Order - Best Prices`
    }

    case 'Agriculture': {
      const productReadable = (details.product_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${details.brand} ${productReadable} - Quality Assured`
    }

    case 'Heavy Equipment & Machinery': {
      const equipReadable = (details.equipment_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${equipReadable} - ${details.hours_used} Hours - Well Maintained`
    }

    case 'Construction Vehicles & Trucks': {
      const truckReadable = (details.truck_type || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const year = 2010 + Math.floor(Math.random() * 10)
      return `${truckReadable} Truck - ${year} Model - Ready for Work`
    }

    case 'Real Estate (sale)': {
      const propReadable = (details.property_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${propReadable} for Sale - ${details.bedrooms} Bedrooms - Modern & Spacious`
    }

    case 'Apartments / Houses (rent)': {
      const propReadable = (details.property_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${propReadable} to Rent - ${details.bedrooms} Bedrooms - ${details.furnished === 'yes' ? 'Furnished' : 'Unfurnished'} & Clean`
    }

    case 'Offices / Commercial (rent)': {
      const usageReadable = (details.usage_type || 'Office').replace(/\b\w/g, c => c.toUpperCase())
      return `${usageReadable} Space for Rent - Prime Location - Fully Equipped`
    }

    case 'Event Halls (rent)': {
      return `Event Hall for Rent - ${details.capacity_persons} People - Modern Amenities`
    }

    case 'Vehicles (rent)': {
      const cars = ['Toyota Corolla', 'BMW 3 Series', 'Mercedes C-Class', 'Hyundai Tucson', 'Renault Clio']
      return `${getRandomElement(cars)} for Rent - Insurance Included`
    }

    case 'Equipment (rent)': {
      const equipReadable = (details.equipment_type || '').replace(/\b\w/g, c => c.toUpperCase())
      return `${details.brand} ${equipReadable} Rental - Professional Service`
    }

    default:
      return `${subcategory} - High Quality`
  }
}

function generateListingDetails(category, subcategory) {
  const details = {}

  switch (subcategory) {
    case 'Vehicles': {
      const make = getRandomElement(VEHICLE_MAKES)
      const model = getRandomElement(VEHICLE_MODELS[make])
      return {
        vehicle_make: make,
        vehicle_model: model,
        vehicle_year: 2015 + Math.floor(Math.random() * 9),
        vehicle_mileage: Math.floor(Math.random() * 250000),
        vehicle_transmission: getRandomElement(['manual', 'automatic']),
        vehicle_fuel_type: getRandomElement(['petrol', 'diesel']),
        vehicle_body_type: getRandomElement(['sedan', 'suv', 'hatchback', 'pickup']),
        engine_spec: `${1200 + Math.floor(Math.random() * 3000)}cc`,
      }
    }

    case 'Motorcycles': {
      const make = getRandomElement(MOTO_BRANDS)
      const model = getRandomElement(MOTO_MODELS[make])
      return {
        vehicle_make: make,
        vehicle_model: model,
        vehicle_year: 2018 + Math.floor(Math.random() * 6),
        vehicle_mileage: Math.floor(Math.random() * 50000),
        moto_type: getRandomElement(['sport', 'cruiser', 'tourer', 'dirt-bike']),
        engine_cc: 100 + Math.floor(Math.random() * 1900),
      }
    }

    case 'Auto & Motorcycle Parts': {
      const part = getRandomElement(AUTO_PARTS)
      return {
        part_category: part.name.toLowerCase().replace(/ /g, '_'),
        brand: getRandomElement(part.brand),
        condition: getRandomElement(['new', 'used']),
      }
    }

    case 'Real Estate (sale)': {
      const propType = getRandomElement(['apartment', 'house', 'villa', 'land'])
      return {
        property_type: propType,
        bedrooms: Math.floor(Math.random() * 6) + 1,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        size_sqm: propType === 'land' ? 100 + Math.floor(Math.random() * 4900) : 50 + Math.floor(Math.random() * 450),
        furnished: getRandomElement(['yes', 'partial', 'no']),
        parking: getRandomElement(['yes', 'no']),
        finishing: getRandomElement(['furnished', 'semi-furnished', 'raw']),
      }
    }

    case 'Electronics & Computers': {
      const brand = getRandomElement(ELECTRONICS_BRANDS)
      return {
        brand,
        model_name: `${brand} ${2020 + Math.floor(Math.random() * 4)} Model`,
        ram_gb: getRandomElement([4, 8, 16, 32, 64]),
        storage_gb: getRandomElement([128, 256, 512, 1024]),
        processor: getRandomElement(['Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2']),
        screen_size: getRandomElement(['13', '14', '15', '17']),
      }
    }

    case 'Phones & Accessories': {
      const brand = getRandomElement(['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Huawei'])
      return {
        brand,
        model_name: `${brand} ${brand === 'Apple' ? 'iPhone 14' : 'Pro Max'}`,
        storage_gb: getRandomElement([64, 128, 256, 512, 1024]),
        color: getRandomElement(['Black', 'White', 'Blue', 'Gold', 'Purple', 'Green']),
      }
    }

    case 'Home Appliances': {
      const type = getRandomElement(APPLIANCE_TYPES)
      return {
        brand: getRandomElement(['LG', 'Samsung', 'Bosch', 'Arçelik', 'Electrolux', 'Siemens']),
        appliance_type: type.toLowerCase().replace(/ /g, '_'),
        capacity: `${50 + Math.floor(Math.random() * 200)}L`,
      }
    }

    case 'Furniture & Home Decor': {
      return {
        brand: getRandomElement(['IKEA', 'Maisons du Monde', 'Local Artisan']),
        material: getRandomElement(['Wood', 'Metal', 'Fabric', 'Leather', 'Glass']),
        color: getRandomElement(['Black', 'White', 'Brown', 'Gray', 'Beige', 'Wood Tone']),
        dimensions: `${150 + Math.floor(Math.random() * 150)}x${80 + Math.floor(Math.random() * 100)}x${40 + Math.floor(Math.random() * 60)}cm`,
      }
    }

    case 'Fashion & Clothing': {
      return {
        brand: getRandomElement(FASHION_BRANDS),
        size: getRandomElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
        gender: getRandomElement(['male', 'female', 'unisex']),
        color: getRandomElement(['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Navy']),
        material: getRandomElement(['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen']),
      }
    }

    case 'Baby & Kids': {
      return {
        brand: getRandomElement(['Safety First', 'Graco', 'Fisher-Price', 'Local Brand']),
        age_range: getRandomElement(['0-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years']),
        condition: 'excellent',
      }
    }

    case 'Sports & Outdoors': {
      return {
        sport_type: getRandomElement(['football', 'basketball', 'tennis', 'cycling', 'camping', 'hiking']),
        brand: getRandomElement(['Nike', 'Adidas', 'Puma', 'Decathlon']),
        condition: getRandomElement(['new', 'like-new', 'lightly-used']),
      }
    }

    case 'Books & Media': {
      return {
        author: 'Various',
        book_language: getRandomElement(['Arabic', 'French', 'English']),
        genre: getRandomElement(['Fiction', 'Non-fiction', 'Educational', 'Children']),
      }
    }

    case 'Tools & Equipment': {
      return {
        tool_type: getRandomElement(['power_drill', 'circular_saw', 'angle_grinder', 'impact_driver']),
        brand: getRandomElement(['Bosch', 'DeWalt', 'Makita', 'Metabo', 'Festool']),
        power_source: getRandomElement(['electric', 'battery', 'cordless']),
      }
    }

    case 'Construction Materials & Supplies': {
      return {
        material_type: getRandomElement(['cement', 'steel', 'wood', 'tiles', 'sand', 'gravel']),
        brand: getRandomElement(['Local Premium', 'Imported', 'Industrial Grade']),
        unit: getRandomElement(['kg', 'ton', 'piece', 'box', 'bag']),
        quantity: Math.floor(Math.random() * 1000) + 100,
      }
    }

    case 'Agriculture': {
      return {
        product_type: getRandomElement(['seeds', 'tools', 'fertilizer', 'pesticide']),
        brand: getRandomElement(['AgroCorp', 'Farmtech', 'Local Supplier']),
      }
    }

    case 'Heavy Equipment & Machinery': {
      return {
        equipment_type: getRandomElement(['excavator', 'bulldozer', 'loader', 'grader', 'crane']),
        hours_used: 500 + Math.floor(Math.random() * 9500),
        engine_power_kw: 50 + Math.floor(Math.random() * 200),
      }
    }

    case 'Construction Vehicles & Trucks': {
      return {
        truck_type: getRandomElement(['flatbed', 'tipper', 'cement-mixer', 'refrigerated', 'tanker']),
        payload_capacity_kg: 2000 + Math.floor(Math.random() * 18000),
      }
    }

    case 'Apartments / Houses (rent)': {
      const propType = getRandomElement(['apartment', 'house'])
      return {
        property_type: propType,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        size_sqm: propType === 'apartment' ? 50 + Math.floor(Math.random() * 150) : 100 + Math.floor(Math.random() * 300),
        furnished: getRandomElement(['yes', 'partial', 'no']),
        parking: getRandomElement(['yes', 'no']),
      }
    }

    case 'Offices / Commercial (rent)': {
      return {
        usage_type: getRandomElement(['office', 'retail', 'warehouse']),
        size_sqm: 50 + Math.floor(Math.random() * 950),
        floor: Math.floor(Math.random() * 15),
        parking: getRandomElement(['yes', 'no']),
      }
    }

    case 'Event Halls (rent)': {
      return {
        capacity_persons: 50 + Math.floor(Math.random() * 450),
        size_sqm: 100 + Math.floor(Math.random() * 1900),
        catering_included: getRandomElement(['yes', 'no']),
      }
    }

    case 'Vehicles (rent)': {
      return {
        rate_unit: getRandomElement(['per-day', 'per-week', 'per-month']),
        mileage_limit_km: 100 + Math.floor(Math.random() * 900),
        driver_included: getRandomElement(['yes', 'no']),
        deposit_required: getRandomElement(['yes', 'no']),
      }
    }

    case 'Equipment (rent)': {
      return {
        equipment_type: getRandomElement(['excavator', 'bulldozer', 'crane']),
        brand: getRandomElement(['CAT', 'Komatsu', 'Volvo', 'Local']),
        rate_unit: getRandomElement(['per-day', 'per-week', 'per-month']),
        deposit_required: getRandomElement(['yes', 'no']),
      }
    }

    default:
      return {}
  }
}

function generateListing(userId, photoPools, index) {
  const category = getRandomElement(['for_sale', 'for_rent'])
  const subcategories = SUBCATEGORIES[category]
  const subcategory = getRandomElement(subcategories)
  const wilaya = getRandomElement(WILAYAS)
  const cityList = CITIES_BY_WILAYA[wilaya] || [wilaya + ' Center']
  const city = getRandomElement(cityList)

  const isVehicleCategory = ['Vehicles', 'Motorcycles'].includes(subcategory)
  const detailsObj = generateListingDetails(category, subcategory)
  const title = generateListingTitle(category, subcategory, detailsObj)

  // Detailed description based on subcategory
  let description = ''
  switch (subcategory) {
    case 'Vehicles':
      description = `Excellent condition ${detailsObj.vehicle_make} ${detailsObj.vehicle_model}. Mileage: ${detailsObj.vehicle_mileage} km. ${detailsObj.vehicle_transmission} transmission, ${detailsObj.vehicle_fuel_type} fuel. Ready for inspection. Call for more info.`
      break
    case 'Motorcycles':
      description = `Beautiful ${detailsObj.vehicle_make} motorcycle. ${detailsObj.engine_cc}cc engine. Well maintained with service history. Must see!`
      break
    case 'Auto & Motorcycle Parts':
      description = `High quality spare parts for vehicles. Original equipment. Competitive prices. Fast delivery available. Contact us for bulk orders.`
      break
    case 'Electronics & Computers':
      description = `Latest model with full specifications. Comes with warranty. Accessories included. Perfect for work and entertainment. Like new condition.`
      break
    case 'Phones & Accessories':
      description = `Unlocked smartphone in perfect working condition. Original charger and accessories included. No scratches or damage.`
      break
    case 'Home Appliances':
      description = `Modern energy-efficient appliance. Barely used. Original packaging and manual included. Full working warranty.`
      break
    case 'Furniture & Home Decor':
      description = `Beautiful and durable furniture piece. Modern design matches any interior. Like new condition. Can deliver.`
      break
    case 'Fashion & Clothing':
      description = `Authentic branded clothing. Original tags attached. Never worn or lightly used. Fast shipping available.`
      break
    case 'Real Estate (sale)':
    case 'Apartments / Houses (rent)':
      description = `Spacious and well-located property. Fully furnished. Good neighborhood with all amenities nearby. Inspection welcome.`
      break
    case 'Tools & Equipment':
      description = `Professional grade tools in excellent condition. Reliable and efficient. Perfect for contractors and DIY enthusiasts.`
      break
    case 'Construction Materials & Supplies':
      description = `Quality construction materials. Best market prices for bulk orders. Reliable delivery service. Contact for quote.`
      break
    case 'Heavy Equipment & Machinery':
      description = `Well-maintained heavy machinery. Regular service history. Ready for immediate use. Inspection available.`
      break
    case 'Construction Vehicles & Trucks':
      description = `Commercial vehicle in working condition. Regular maintenance records. Ready for business use.`
      break
    default:
      description = `High quality item in excellent condition. Inspectable on request. Contact for more details.`
  }

  const listing = {
    user_id: userId,
    category,
    subcategory,
    title,
    description,
    price: category === 'for_sale' ? getRandomPrice() : getRandomPrice(1000, 50000),
    status: 'active',
    photos: getRandomPhotos(photoPools, subcategory),
    location_wilaya: wilaya,
    location_city: city,
    condition: ['for_sale'].includes(category) ? getRandomElement(['new', 'like_new', 'good', 'fair']) : null,
    rental_period: category === 'for_rent' ? getRandomElement(['daily', 'weekly', 'monthly']) : null,
    is_hot_deal: Math.random() < 0.05, // 5% hot deals
  }

  // Add vehicle columns or JSONB details
  if (isVehicleCategory) {
    listing.vehicle_make = detailsObj.vehicle_make || null
    listing.vehicle_model = detailsObj.vehicle_model || null
    listing.vehicle_year = detailsObj.vehicle_year || null
    listing.vehicle_mileage = detailsObj.vehicle_mileage || null
    listing.vehicle_transmission = detailsObj.vehicle_transmission || null
    listing.vehicle_fuel_type = detailsObj.vehicle_fuel_type || null
    listing.vehicle_body_type = detailsObj.vehicle_body_type || null
    if (detailsObj.engine_spec) {
      listing.listing_details = { engine_spec: detailsObj.engine_spec }
    }
    if (detailsObj.moto_type) {
      listing.listing_details = { ...listing.listing_details, moto_type: detailsObj.moto_type, engine_cc: detailsObj.engine_cc }
    }
  } else {
    listing.listing_details = detailsObj
  }

  return listing
}

// ─── Main script ───────────────────────────────────────────────────────────

async function main() {
  // Get cloud credentials from environment (.env.cloud or .env.local)
  let cloudUrl = CLOUD_URL
  let cloudAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_CLOUD_KEY
  let cloudServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_CLOUD_SERVICE_KEY

  if (!cloudAnonKey && !cloudServiceKey) {
    console.error('❌ Cloud credentials not found in environment')
    console.error('   Expected variables from .env.cloud:')
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Use service key if available (better for bulk inserts), fall back to anon key
  const apiKey = cloudServiceKey || cloudAnonKey
  console.log(`🔑 Using ${cloudServiceKey ? 'Service Role' : 'Anon'} key for cloud Supabase`)
  const supabase = createClient(cloudUrl, apiKey, {
    auth: { persistSession: false }
  })

  console.log(`📸 Loading test photos from ${TEST_PHOTOS_DIR}...`)
  const isImage = (f) => /\.(jpg|jpeg|png|webp)$/i.test(f)
  const photoUrlBase = `${cloudUrl}/storage/v1/object/public/listing-photos/test_photos`
  const photoPools = { flat: [] }

  for (const entry of fs.readdirSync(TEST_PHOTOS_DIR, { withFileTypes: true })) {
    if (entry.isFile() && isImage(entry.name)) {
      photoPools.flat.push(`${photoUrlBase}/${entry.name}`)
    } else if (entry.isDirectory()) {
      const folder = entry.name
      photoPools[folder] = fs.readdirSync(path.join(TEST_PHOTOS_DIR, folder))
        .filter(isImage)
        .map(f => `${photoUrlBase}/${folder}/${f}`)
    }
  }

  console.log(`✅ Photo pools: flat=${photoPools.flat.length}, ` +
    Object.entries(photoPools).filter(([k]) => k !== 'flat').map(([k, v]) => `${k}=${v.length}`).join(', '))

  console.log(`\n🔧 Ensuring profile rows exist for the 20 test users...`)
  const profileRows = TEST_USERS.map((u, i) => {
    const wilaya = WILAYAS_FOR_PROFILES[i % WILAYAS_FOR_PROFILES.length]
    return {
      id: u.id,
      first_name: 'User',
      last_name: String(i + 1),
      city: `${wilaya} Center`,
      wilaya,
    }
  })
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(profileRows, { onConflict: 'id' })
  if (profileErr) {
    console.error('❌ Failed to upsert profiles:', profileErr.message)
    process.exit(1)
  }
  console.log(`✅ Profiles ready for ${TEST_USERS.length} users`)
  const userIds = TEST_USERS.map(u => u.id)

  console.log(`\n🚀 Generating ${TOTAL_LISTINGS.toLocaleString()} listings in batches of ${BATCH_SIZE}...`)

  let inserted = 0
  const startTime = Date.now()
  const errors = []

  for (let i = 0; i < TOTAL_LISTINGS; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_LISTINGS - i)
    const batch = []

    for (let j = 0; j < batchSize; j++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)]
      batch.push(generateListing(userId, photoPools, i + j + 1))
    }

    const { error } = await supabase
      .from('listings')
      .insert(batch)

    if (error) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      errors.push({ batch: batchNum, error: error.message })
      console.error(`  ❌ Batch ${batchNum} failed:`, error.message)
    } else {
      inserted += batchSize
      const percent = Math.round((inserted / TOTAL_LISTINGS) * 100)
      const elapsed = Date.now() - startTime
      const perSecond = (inserted / (elapsed / 1000)).toFixed(0)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      console.log(`  ✓ Batch ${batchNum}: ${inserted.toLocaleString()} / ${TOTAL_LISTINGS.toLocaleString()} (${percent}%) [${perSecond} listings/sec]`)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ Done! Inserted ${inserted.toLocaleString()} listings in ${totalTime}s`)
  console.log(`📊 Performance: ${(inserted / Number(totalTime)).toFixed(0)} listings/sec`)

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} batches failed`)
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
