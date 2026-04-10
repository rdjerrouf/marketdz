#!/usr/bin/env node
/**
 * seed-test-data.js
 *
 * Creates:
 *   - user1@email.com … user10@email.com  (password: password123)
 *   - 400 listings per user (100 × for_sale, 100 × for_rent, 100 × service, 100 × job)
 *   - Trilingual content: ~1/3 Arabic, ~1/3 French, ~1/3 English per category per user
 *
 * Usage:
 *   node scripts/seed-test-data.js
 *
 * Requires local Supabase running: npx supabase start
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config — reads from .env.local
// ---------------------------------------------------------------------------
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY  = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---------------------------------------------------------------------------
// Data — wilayas & cities
// ---------------------------------------------------------------------------
const WILAYAS = [
  { code: '01', name: 'Adrar',         city: 'Adrar' },
  { code: '09', name: 'Blida',         city: 'Blida' },
  { code: '16', name: 'Algiers',       city: 'Algiers' },
  { code: '19', name: 'Sétif',         city: 'Sétif' },
  { code: '23', name: 'Annaba',        city: 'Annaba' },
  { code: '25', name: 'Constantine',   city: 'Constantine' },
  { code: '31', name: 'Oran',          city: 'Oran' },
  { code: '34', name: 'Bordj Bou Arréridj', city: 'Bordj Bou Arréridj' },
  { code: '15', name: 'Tizi Ouzou',    city: 'Tizi Ouzou' },
  { code: '06', name: 'Béjaïa',        city: 'Béjaïa' },
];

// ---------------------------------------------------------------------------
// Trilingual listing templates per category
// Each has ~33 English, 33 French, 34 Arabic = 100 total
// ---------------------------------------------------------------------------

// Helpers
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ---------------------------------------------------------------------------
// FOR SALE templates
// ---------------------------------------------------------------------------
const FOR_SALE_EN = [
  { title: 'Samsung Galaxy S23 – Excellent Condition', description: 'Barely used Samsung Galaxy S23, 256GB, black. No scratches, original box included.', price: 85000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'HP Laptop Core i7 – 16GB RAM', description: 'HP EliteBook 840 G8, Intel Core i7-1165G7, 16GB DDR4, 512GB SSD. Perfect for office work.', price: 120000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'LG 55" 4K Smart TV', description: 'LG 55UK6300 4K UHD Smart TV. WebOS, HDR10, excellent picture quality.', price: 75000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'iPhone 14 Pro Max 256GB', description: 'Space black, 256GB, Face ID working perfectly. Light usage, no damage.', price: 160000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'Gaming Chair – Ergonomic', description: 'RESPAWN 110 Racing Style Gaming Chair. Lumbar support, adjustable armrests.', price: 22000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Canon EOS 80D DSLR Camera', description: 'Canon EOS 80D with 18-55mm kit lens. 2000 shutter count, all accessories included.', price: 90000, subcategory: 'Cameras & Photography', condition: 'used' },
  { title: 'Sony PlayStation 5 – Digital Edition', description: 'PS5 Digital Edition with 2 controllers. Mint condition, DualSense included.', price: 65000, subcategory: 'Video Games & Consoles', condition: 'used' },
  { title: 'Yamaha FG800 Acoustic Guitar', description: 'Solid Sitka spruce top, nato back and sides. Great for beginners.', price: 18000, subcategory: 'Musical Instruments', condition: 'used' },
  { title: 'Bosch Washing Machine 7kg', description: 'Bosch Serie 4 WAN28161GC. Front-load, 7kg, 1400 RPM. Used 2 years, excellent condition.', price: 55000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'IKEA Dining Table + 4 Chairs', description: 'IKEA EKEDALEN extendable table 120-180cm + 4 matching chairs. Light wood finish.', price: 28000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'MacBook Pro M2 – 512GB', description: 'Apple MacBook Pro 14" M2 chip, 16GB unified memory, 512GB SSD. Charger included.', price: 195000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'Bicycle Trek FX 3 – 2022', description: 'Trek FX 3 fitness bike, size M, hydraulic disc brakes. Lightly used.', price: 35000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'Nikon D7500 + 18-140mm Lens', description: 'Complete photography kit. 20.9MP, 4K UHD video, Wi-Fi. 1500 actuations.', price: 95000, subcategory: 'Cameras & Photography', condition: 'used' },
  { title: 'Baby Crib – Wooden Convertible', description: 'Convertible crib that grows with your baby. Adjustable mattress height. White finish.', price: 12000, subcategory: 'Baby & Kids', condition: 'used' },
  { title: 'Electric Drill – Makita 18V', description: 'Makita DDF482 18V LXT Brushless. 2 batteries included, carrying case.', price: 16000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'Renault Clio 5 – 2021', description: '2021 Renault Clio 5, 1.0L petrol, 45,000 km. First owner, all papers.', price: 270000, subcategory: 'Vehicles', condition: 'used' },
  { title: 'Air Conditioner Samsung 18000 BTU', description: 'Samsung WindFree 18000 BTU inverter. Installed 1 year ago. Works perfectly.', price: 45000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Men\'s Leather Jacket', description: 'Genuine leather biker jacket, size L, brown. Worn 3 times, like new.', price: 8500, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'Dumbbell Set – 20kg', description: 'Rubber hex dumbbell set: 2×5kg, 2×7.5kg, 2×10kg. Minor wear on rubber.', price: 9000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'Solar Panel 400W Monocrystalline', description: 'Brand new 400W mono solar panel. Never installed. Full manufacturer warranty.', price: 22000, subcategory: 'Other', condition: 'new' },
  { title: 'Refrigerator Brandt 400L', description: 'Brandt BFU482NX 400L no-frost double door. Like new, 6 months old.', price: 68000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Office Desk – Standing Adjustable', description: 'Flexispot E2L electric height-adjustable desk 160cm. Walnut top, 2 motors.', price: 32000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Huawei MatePad Pro 11"', description: '11-inch OLED display, Kirin 9000E, 8GB+256GB, M-Pencil compatible.', price: 58000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'Vintage Collectible Watch – Omega', description: 'Omega Seamaster 1968 vintage. Manual wind, blue dial. Service records available.', price: 180000, subcategory: 'Watches & Jewelry', condition: 'used' },
  { title: 'Kids Scooter – Micro Mini', description: 'Micro Mini 3-in-1 scooter for ages 2-5. Red, adjustable height, light weight.', price: 5500, subcategory: 'Toys & Games', condition: 'used' },
  { title: 'Power Generator 5kW Diesel', description: 'AVR diesel generator 5kW. 10 hours of use total. Perfect backup power.', price: 95000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'Sofa 3-Seater L-Shape', description: 'Gray fabric L-shape corner sofa. Good condition, smoke-free home.', price: 38000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Whirlpool Microwave 25L', description: 'Whirlpool MW25G 25L with grill. 2 years old, clean and working.', price: 7500, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Running Shoes – Adidas Ultra Boost', description: 'Adidas Ultra Boost 22, size 43, black. 3 runs, practically new.', price: 6500, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'Arduino Mega Kit + Components', description: 'Arduino Mega 2560 + breadboard + sensors + motors. Great for learning.', price: 4500, subcategory: 'Electronics', condition: 'new' },
  { title: 'Samsung Galaxy Tab S8', description: 'Galaxy Tab S8 11" 128GB WiFi, silver. S Pen included.', price: 72000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'Road Bike Merida Scultura', description: 'Merida Scultura 100, size 52, Shimano 21-speed. 500km total.', price: 48000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'French Bulldog Puppy', description: 'Pure breed French Bulldog, 3 months, vaccinated. Fawn color with pedigree.', price: 85000, subcategory: 'Other', condition: null },
];

const FOR_SALE_FR = [
  { title: 'Smartphone Samsung Galaxy A54 – État impeccable', description: 'Samsung Galaxy A54 128Go, noir, comme neuf. Garantie constructeur valide 8 mois.', price: 42000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'Ordinateur portable Dell Inspiron i5 – 8Go RAM', description: 'Dell Inspiron 15, Core i5-11e génération, 8Go DDR4, 256Go SSD. Parfait pour études.', price: 65000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'Télévision Samsung 43" QLED', description: 'Samsung QE43Q60A QLED 4K. Smart TV Tizen, HDR10+. Acheté en 2022.', price: 58000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Canapé 3 places – Tissu gris anthracite', description: 'Canapé convertible 3 places, bon état, maison sans animaux ni fumeurs.', price: 25000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Table basse en verre trempé', description: 'Table basse rectangulaire en verre sécurit et pieds chromés. Dimensions: 120×60cm.', price: 8000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Lave-linge Condor 8kg', description: 'Lave-linge frontal Condor 8kg, 1200 tours/min. 3 ans, très bon état.', price: 38000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Appareil photo Canon EOS M50 Mark II', description: 'Canon EOS M50 II nu, 24.1 Mpx, vidéo 4K. 800 déclenchements. Chargeur inclus.', price: 65000, subcategory: 'Cameras & Photography', condition: 'used' },
  { title: 'Guitare électrique Squier Stratocaster', description: 'Squier Affinity Stratocaster, couleur sunburst. Câble et courroie inclus.', price: 22000, subcategory: 'Musical Instruments', condition: 'used' },
  { title: 'Vélo route Decathlon Triban RC100', description: 'Triban RC100 taille M, cadre aluminium, Shimano Claris 8 vitesses. 200km.', price: 28000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'Climatiseur Condor 12000 BTU Inverter', description: 'Climatiseur Condor 12000 BTU Wi-Fi inverter. Installé 18 mois. Fonctionne parfaitement.', price: 32000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Console PS4 Pro 1To + 5 jeux', description: 'PS4 Pro 1To, 2 manettes, FIFA 24, GTA V, Uncharted 4, God of War, Last of Us 2.', price: 40000, subcategory: 'Video Games & Consoles', condition: 'used' },
  { title: 'Poussette bébé Chicco Trio Best Friend', description: 'Pack trio Chicco avec siège auto, nacelle et poussette. Couleur graphite.', price: 35000, subcategory: 'Baby & Kids', condition: 'used' },
  { title: 'Meuble TV avec rangement', description: 'Meuble TV 180cm blanc avec 4 niches de rangement. Très bon état.', price: 12000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Perceuse visseuse Bosch 18V', description: 'Bosch GSR 18V-55. 2 batteries 2Ah, chargeur rapide, coffret. Quasi neuf.', price: 14000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'Montre Casio G-Shock – Résistante', description: 'G-Shock DW-6900, noir, résistance aux chocs et étanche 200m. Comme neuve.', price: 9500, subcategory: 'Watches & Jewelry', condition: 'used' },
  { title: 'Réfrigérateur Brandt 350L No Frost', description: 'Brandt BF635YNX 350L. No Frost, distributeur d\'eau. 1 an, garantie valide.', price: 58000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Machine à café Nespresso Vertuo Plus', description: 'Nespresso Vertuo Plus gris, 1500W. Capsules incluses. Parfait état.', price: 8500, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Manteau en laine pour femme', description: 'Manteau long en laine mélangée camel, taille 38. Porté 2 saisons.', price: 6500, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'Tapis persan 200×300cm', description: 'Tapis oriental en laine, motifs floraux bordeaux et beige. Très bon état.', price: 18000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'iPhone 13 – 128Go – Minuit', description: 'iPhone 13 128Go couleur minuit. Face ID OK, batterie 87%. Boîte d\'origine.', price: 95000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'Chaussures Nike Air Max 90 – T42', description: 'Nike Air Max 90 blanches, pointure 42. Portées 5 fois. Comme neuves.', price: 7200, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'Panneau solaire 300W Monocristallin', description: '300W monocristallin, neuf en boîte. Rendement 21.5%, câblage inclus.', price: 16000, subcategory: 'Other', condition: 'new' },
  { title: 'Tableau décoratif – Peinture à l\'huile', description: 'Peinture à l\'huile originale, paysage algérien, 80×60cm, cadre inclus.', price: 15000, subcategory: 'Art & Collectibles', condition: 'used' },
  { title: 'Aspirateur robot Xiaomi Mijia', description: 'Xiaomi Mi Robot Vacuum Mop Pro. Cartographie laser, 3000Pa. 8 mois d\'utilisation.', price: 22000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Livres de préparation BEM + BEM Blanc', description: 'Lot de 12 livres préparation BEM toutes matières. Éditions 2024.', price: 3500, subcategory: 'Books & Media', condition: 'used' },
  { title: 'Poêle en fonte Le Creuset 26cm', description: 'Poêle Le Creuset signature rouge cerise 26cm. Peu utilisée, parfait état.', price: 12000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Générateur solaire 1000W portable', description: 'Station d\'énergie portable 1kWh LFP. Sortie AC/DC/USB. 50 cycles.', price: 55000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'Jeu de valises Delsey Paris 3 pièces', description: 'Set 3 valises Delsey Chatelet Hard en tissu carbone gris. Trolley 4 roues.', price: 19000, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'Drone DJI Mini 3 Pro', description: 'DJI Mini 3 Pro avec télécommande et 3 batteries. 40 min de vol. Comme neuf.', price: 78000, subcategory: 'Cameras & Photography', condition: 'used' },
  { title: 'Bibliothèque en bois massif', description: 'Bibliothèque 6 étagères en pin massif, 80×200cm. Démontée, prête à emporter.', price: 11000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'Clavier mécanique Keychron K6', description: 'Keychron K6 compact 65%, switches Red, rétroéclairage RGB. Comme neuf.', price: 7500, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'Mixeur plongeant Philips 800W', description: 'Philips HR2662 800W avec accessoires. 3 ans, parfait état de fonctionnement.', price: 4200, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'Skateboard complet – Baker', description: 'Deck Baker 8.0" + trucks Independent 149 + roues Spitfire 52mm. Roulements neufs.', price: 9000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'Cafetière à filtre Bodum 12 tasses', description: 'Cafetière en verre borosilicate 12 tasses avec couvercle. Neuve en boîte.', price: 3200, subcategory: 'Home Appliances', condition: 'new' },
];

const FOR_SALE_AR = [
  { title: 'هاتف سامسونج جلاكسي A53 بحالة ممتازة', description: 'سامسونج جلاكسي A53 128 جيجابايت لون أسود. مستخدم 6 أشهر فقط، لا توجد خدوش، الصندوق الأصلي موجود.', price: 38000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'لابتوب لينوفو ThinkPad Core i5', description: 'لينوفو ThinkPad E14 الجيل الحادي عشر، 8 جيجا رام، 256 جيجا SSD. مثالي للعمل.', price: 58000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'تلفزيون شاشة 50 بوصة UHD 4K سامسونج', description: 'سامسونج 50AU7100، شاشة كريستال 4K، تلفزيون ذكي بنظام Tizen. مستخدم سنة واحدة.', price: 62000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'ثلاجة كوندور 380 لتر نوفروست', description: 'ثلاجة كوندور 380 لتر بابان، نوفروست كاملة. مستخدمة سنتين، حالة ممتازة.', price: 48000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'غسالة أوتوماتيك كوندور 7 كلغ', description: 'غسالة ملابس أوتوماتيك كوندور 7 كلغ، أمامية، 1200 دورة. 3 سنوات، تعمل بشكل مثالي.', price: 35000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'آيفون 12 – 64 جيجا – أزرق', description: 'آيفون 12 64 جيجا لون أزرق. Face ID سليم، بطارية 84%. الغطاء الأصلي موجود.', price: 75000, subcategory: 'Phones & Accessories', condition: 'used' },
  { title: 'مكيف هواء يوريكا 18000 وحدة', description: 'مكيف هواء يوريكا 18000 BTU إنفيرتر. مركب منذ سنتين، في حالة ممتازة.', price: 38000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'دراجة هوائية للكبار – 26 بوصة', description: 'دراجة هوائية 26 بوصة 21 سرعة، إطارات جديدة. مستخدمة قليلاً.', price: 18000, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'أثاث غرفة جلوس – 7 قطع', description: 'طقم صالون 7 قطع قماش رمادي. الأريكة الكبيرة 3 مقاعد + 2 كرسي. حالة جيدة جداً.', price: 45000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'كاميرا سوني A6400 مع عدسة 16-50', description: 'سوني A6400 24.2 ميجابيكسل + عدسة Kit 16-50mm. 1200 لقطة فقط. كل الملحقات موجودة.', price: 88000, subcategory: 'Cameras & Photography', condition: 'used' },
  { title: 'بلايستيشن 4 سليم 500 جيجا + 3 ألعاب', description: 'PS4 Slim 500 جيجا مع يدين تحكم. FIFA 23، PES 2023، Minecraft. حالة ممتازة.', price: 35000, subcategory: 'Video Games & Consoles', condition: 'used' },
  { title: 'سرير أطفال خشب مع مرتبة', description: 'سرير أطفال خشب أبيض قابل للتحويل. ارتفاع المرتبة قابل للتعديل، مع سور أمان.', price: 14000, subcategory: 'Baby & Kids', condition: 'used' },
  { title: 'حذاء رياضي نايك إير ماكس مقاس 42', description: 'نايك إير ماكس 270 لون أسود رمادي. مستخدم مرتين فقط، شبه جديد.', price: 6500, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'لوح شمسي 400 واط أحادي البلورة', description: 'لوح شمسي 400 واط جديد لم يستخدم. كفاءة 21%، ضمان 12 سنة.', price: 22000, subcategory: 'Other', condition: 'new' },
  { title: 'مكتبة خشبية 6 رفوف', description: 'مكتبة خشب صنوبر 6 رفوف، 80×200 سم. حالة ممتازة، سهلة التفكيك.', price: 9500, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'طاولة مكتب بارتفاع قابل للتعديل', description: 'طاولة مكتب كهربائية ارتفاع قابل للتعديل 120 سم. لون خشبي فاتح.', price: 28000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'بلايستيشن 5 – الإصدار الرقمي', description: 'PS5 الإصدار الرقمي + يد DualSense إضافية. مستخدم 3 أشهر فقط.', price: 62000, subcategory: 'Video Games & Consoles', condition: 'used' },
  { title: 'ساعة كاسيو G-Shock أصلية', description: 'كاسيو G-Shock DW-5600E أصلية 100%. مقاومة الصدمات والماء. حالة ممتازة.', price: 9000, subcategory: 'Watches & Jewelry', condition: 'used' },
  { title: 'جهاز مكنسة كارشر K2 للضغط', description: 'كارشر K2 Basic لغسيل السيارات والباحات. مستخدم مرتين، مع الملحقات.', price: 16000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'طقم أدوات بناء ماكيتا', description: 'طقم ماكيتا مثقاب + منشار + مفكات، 18 فولت. حافظة صلبة. شبه جديد.', price: 35000, subcategory: 'Tools & Equipment', condition: 'used' },
  { title: 'مكنسة روبوتية شاومي 2500Pa', description: 'شاومي Mi Robot Vacuum خرائط ذكية، شفط 2500Pa. مستخدمة 6 أشهر.', price: 19000, subcategory: 'Home Appliances', condition: 'used' },
  { title: 'طفاية حريق + علبة إسعافات أولية', description: 'طفاية CO2 3 كلغ جديدة + علبة إسعافات أولية كاملة. مثالية للمنزل أو السيارة.', price: 4500, subcategory: 'Other', condition: 'new' },
  { title: 'حقيبة ظهر ظهر للسفر 60 لتر', description: 'حقيبة ظهر سفر 60 لتر، مقاومة للماء، لون كاكي. مستخدمة مرتين.', price: 5500, subcategory: 'Fashion & Accessories', condition: 'used' },
  { title: 'عود موسيقي ذو جودة عالية', description: 'عود موسيقي مصنوع يدوياً بخشب الجوز. صوت دافئ ومتميز، يُسلَّم مع الحقيبة.', price: 28000, subcategory: 'Musical Instruments', condition: 'used' },
  { title: 'كتب تحضير للبكالوريا شعبة علوم', description: 'مجموعة 15 كتاباً لجميع مواد البكالوريا علوم تجريبية. طبعة 2024.', price: 4000, subcategory: 'Books & Media', condition: 'used' },
  { title: 'مروحة سقفية بريما 56 بوصة', description: 'مروحة سقف بريما 56 بوصة بريموت كنترول، 5 ريش. كهربائي 220V. جديدة.', price: 8500, subcategory: 'Home Appliances', condition: 'new' },
  { title: 'دراجة نارية مونديال 125cc 2023', description: 'مونديال دلتا 125cc موديل 2023، لون أحمر. 8000 كلم فقط، بجميع الأوراق.', price: 165000, subcategory: 'Motorcycles', condition: 'used' },
  { title: 'طابعة إبسون EcoTank L3150', description: 'إبسون L3150 بخزانات حبر دائمة. تطبع وتمسح وتنسخ. 2 سنة، شبه جديدة.', price: 22000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'كنبة مع فرشة 3 مقاعد قابلة للتحويل', description: 'كنبة بد قماش رمادي 3 مقاعد. تتحول لسرير بمقاس 140 سم. حالة جيدة جداً.', price: 32000, subcategory: 'Furniture & Decor', condition: 'used' },
  { title: 'سلة كرة القدم الجزائرية الرسمية', description: 'قميص منتخب الجزائر الرسمي PUMA موديل 2024. مقاس L. جديد بالعلبة.', price: 6500, subcategory: 'Sports & Outdoors', condition: 'new' },
  { title: 'آيباد برو 11" M2 مع قلم', description: 'آيباد برو 11 إنش شريحة M2، 256 جيجا، واي فاي + Apple Pencil الجيل الثاني.', price: 148000, subcategory: 'Computers & Tablets', condition: 'used' },
  { title: 'تلسكوب فلكي 70mm – مثالي للمبتدئين', description: 'تلسكوب عاكس 70mm مع حامل. يرى القمر والكواكب. مثالي للأطفال والمبتدئين.', price: 12000, subcategory: 'Other', condition: 'used' },
  { title: 'ميزان لياقة Xiaomi جسم كامل', description: 'ميزان ذكي Xiaomi Mi Body Composition Scale 2. يقيس 13 مؤشراً صحياً.', price: 3500, subcategory: 'Sports & Outdoors', condition: 'used' },
  { title: 'آلة تصوير فورية Instax Mini 11', description: 'فوجي فيلم Instax Mini 11 بالأبيض. كل الملحقات موجودة + 10 أفلام.', price: 9500, subcategory: 'Cameras & Photography', condition: 'used' },
];

// ---------------------------------------------------------------------------
// FOR RENT templates
// ---------------------------------------------------------------------------
const FOR_RENT_EN = [
  { title: 'Studio Apartment – City Center', description: 'Furnished studio 35m², ground floor, all amenities. Available immediately.', price: 25000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: '2-Bedroom Apartment – Modern Building', description: 'F3 apartment 80m², 2nd floor, elevator, parking. Quiet neighborhood.', price: 45000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Office Space 50m² – Business District', description: 'Fully equipped office, ground floor, air-conditioned, reception area.', price: 60000, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'Commercial Space – Main Street', description: '120m² commercial space on a busy avenue. Ideal for retail or showroom.', price: 80000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Villa with Pool – Summer Rental', description: '4-bedroom villa with garden and pool. Perfect for family vacations.', price: 15000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'Renault Clio 5 – Self-Drive Rental', description: 'Renault Clio 5 2022, petrol, 5 doors. Insurance included. 500 DZD/day fuel limit.', price: 3500, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Wedding Hall 500 Guests', description: 'Fully equipped event hall, air-conditioned, catering kitchen. Saturday dates available.', price: 200000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Excavator – CAT 320 – Daily Hire', description: 'CAT 320 excavator with experienced operator available. Documents provided.', price: 45000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: '3-Bedroom House – Residential Area', description: 'Detached 3-bed house 150m², garden, garage. Long-term preferred.', price: 65000, subcategory: 'Houses', rental_period: 'monthly' },
  { title: 'Pickup Truck Toyota Hilux – Rental', description: 'Toyota Hilux 4×4 double cab. Suitable for construction work, DZD/day.', price: 5500, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Apartment F2 Near University', description: 'Furnished F2, 55m², all utilities included. Students welcome.', price: 30000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Generator 20kW – Industrial Use', description: '20kW diesel generator rental, with or without operator. Weekly/monthly rates.', price: 8000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Co-working Desk – Open Space', description: 'Shared desk in a modern co-working space. Wi-Fi, coffee, printer included.', price: 8000, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'Holiday Apartment – Sea View', description: 'F3 75m² with sea view on 4th floor. Pool access. High season: July-August.', price: 8000, subcategory: 'Apartments', rental_period: 'daily' },
  { title: 'Forklift 3T – Warehouse Use', description: 'Electric forklift Toyota 3-ton capacity. Available daily or weekly.', price: 12000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Private House F4 with Garden', description: 'Independent villa 180m², large garden, 4 bedrooms, modern kitchen.', price: 75000, subcategory: 'Houses', rental_period: 'monthly' },
  { title: 'Conference Room – 20 Seats', description: 'Equipped conference room: projector, whiteboard, Wi-Fi. Half/full day rates.', price: 15000, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'Scaffolding Equipment Set', description: 'Full scaffolding set for construction. Safety certified. Minimum 2 weeks.', price: 3000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Rooftop Terrace – Events', description: 'Private rooftop terrace 200m² with city view. Perfect for private parties.', price: 50000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Peugeot 208 – Weekly Rental', description: 'Peugeot 208 1.2L PureTech, A/C, GPS, Bluetooth. Long-term discounts.', price: 3000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Studio Apartment – Student District', description: 'Cozy 28m² studio, furnished. Close to university and transport.', price: 20000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Warehouse 500m² Industrial Zone', description: 'Industrial warehouse 500m², high ceiling, loading dock. Long-term lease.', price: 120000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Baby Equipment – High Chair + Crib', description: 'Baby package: crib, high chair, stroller. Perfect for visiting families.', price: 500, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Apartments F4 – Executive Area', description: 'Upscale F4 apartment, 130m², swimming pool, gym access, underground parking.', price: 95000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Event Tent 500m² – Modular', description: 'Fully enclosed event tent with flooring, lighting, and sidewalls. Setup included.', price: 80000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Land Rover Defender – Rental', description: 'Land Rover Defender 110 diesel. Off-road capable. Driver available on request.', price: 9000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Retail Shop 30m² – Local Market', description: 'Small shop in a busy local market. Suitable for clothes, electronics, food.', price: 35000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Concrete Mixer – Construction', description: '350L concrete mixer rental. Delivered and picked up free within 30km.', price: 1500, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Penthouse F5 – Panoramic View', description: 'Luxury penthouse 200m² on 12th floor. Panoramic terrace, 5 rooms, 2 bathrooms.', price: 150000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Seminar Room – 50 Seats', description: 'Academic-style seminar room with projector, AC, and catering service available.', price: 25000, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'Hyundai Tucson SUV – Monthly Rental', description: 'Hyundai Tucson 2022, full option, 5 doors. Insured, documents provided.', price: 120000, subcategory: 'Vehicles', rental_period: 'monthly' },
  { title: 'Beachside Bungalow – Summer', description: 'Private bungalow 5m from the beach, 2 rooms, terrace. July/August bookings open.', price: 6000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'Photography Studio – Hourly', description: 'Professional photo studio 60m², white cyc wall, 5 strobe lights, reflectors.', price: 5000, subcategory: 'Offices', rental_period: 'daily' },
];

const FOR_RENT_FR = [
  { title: 'Studio meublé au centre-ville', description: 'Studio 33m² entièrement meublé. Cuisine équipée, Wi-Fi inclus. Disponible immédiatement.', price: 22000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Appartement F3 80m² – Quartier résidentiel', description: 'F3 au 3e étage avec ascenseur, cuisine équipée, 2 chambres, séjour spacieux.', price: 42000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Local commercial 60m² – Avenue principale', description: 'Local en rez-de-chaussée avec vitrine sur avenue passante. Idéal boutique ou agence.', price: 55000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Salle des fêtes 300 personnes – Clé en main', description: 'Salle entièrement équipée, climatisée, avec cuisine traiteur. Réservations week-ends.', price: 150000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Bureau partagé – Espace coworking', description: 'Poste de travail dans espace coworking moderne. Wi-Fi fibre, café, imprimante inclus.', price: 9000, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'Villa 4 pièces avec piscine – Saison estivale', description: '4 chambres, jardin arborisé, piscine chauffée. Location semaine ou mois. Juillet/août.', price: 120000, subcategory: 'Houses', rental_period: 'monthly' },
  { title: 'Véhicule Peugeot 3008 – Location longue durée', description: 'Peugeot 3008 SUV 1.6 HDI. Assurance tous risques incluse. GPS, climatisation.', price: 5000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Appartement F2 meublé – Proche université', description: 'F2 55m² meublé, toutes charges comprises. Étudiant bienvenu. Quartier calme.', price: 28000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Engin de chantier – Pelle hydraulique 20T', description: 'Pelle Komatsu PC200 avec chauffeur. Contrat journalier ou hebdomadaire.', price: 50000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Maison individuelle F5 avec jardin', description: 'Maison indépendante 200m², 5 pièces, grand jardin, garage 2 voitures.', price: 80000, subcategory: 'Houses', rental_period: 'monthly' },
  { title: 'Renault Kangoo utilitaire – Location journée', description: 'Kangoo Express 2022, volume 3.5m³. Idéal déménagement ou livraisons.', price: 3000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Appartement vue mer – Location vacances', description: 'F3 80m² avec panorama mer, 5e étage. Piscine résidence. Réservation été 2026.', price: 9000, subcategory: 'Apartments', rental_period: 'daily' },
  { title: 'Salle de séminaire 50 places', description: 'Salle équipée vidéoprojecteur, tableau blanc interactif, climatisation. Service café.', price: 20000, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'Groupe électrogène 15kW – Location', description: 'Générateur diesel 15kW silencieux. Livraison incluse. Tarif semaine/mois.', price: 6000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Appartement luxueux F4 – Résidence sécurisée', description: 'F4 120m², 3 chambres, piscine et salle sport en accès libre, parking souterrain.', price: 85000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Boutique 25m² – Marché local animé', description: 'Petite boutique dans marché local très fréquenté. Convient prêt-à-porter, alimentation.', price: 30000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Matériel de sonorisation – Soirée', description: 'Pack sono complet: enceintes JBL 2×1000W, mixeur Pioneer, micros, câbles.', price: 8000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Appartement F1 – Bien meublé', description: 'F1 bis 42m², chambre séparée, cuisine équipée, calme, quartier prisé.', price: 25000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Véhicule utilitaire Mercedes Sprinter', description: 'Sprinter 313 CDI 9 places ou cargo. Permis B suffisant. Assurance incluse.', price: 6000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Maison de vacances bord de mer', description: 'Villa 3 chambres, 80m de la plage, terrasse avec vue mer. Juillet–Août.', price: 7000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'Entrepôt 300m² – Zone industrielle', description: 'Entrepôt 300m², hauteur 6m, quai de chargement, électricité triphasée.', price: 90000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'Voiture Toyota Corolla Cross 2023', description: 'Corolla Cross hybride 2023. Boîte auto, climatisation, GPS. Assurance tous risques.', price: 6000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Studio avec terrasse – Location courte durée', description: 'Studio neuf 38m² avec terrasse privée. Proche commerces et transports.', price: 5000, subcategory: 'Apartments', rental_period: 'daily' },
  { title: 'Chapiteau 200m² pour événements', description: 'Grande tente 200m² avec parois, plancher bois, éclairage. Montage et démontage inclus.', price: 60000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Bureau privatif – Centre d\'affaires', description: 'Bureau individuel 20m² dans centre d\'affaires. Domiciliation, secrétariat en option.', price: 35000, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'Appartement F3 – Long séjour', description: 'F3 85m² entièrement rénové. Cuisine moderne, 2 chambres, balcon filant.', price: 48000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Tentes nomades – Désert (agence)', description: 'Nuit en tente saharienne pour groupes. Inclut dîner, petit-déjeuner, guide.', price: 12000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'Camion-grue 25 tonnes – Chantier', description: 'Camion-grue XCMG 25T avec opérateur. Documents conformes, assurance RC.', price: 35000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'Appartement F4 – Cadre de vie agréable', description: 'F4 105m², résidence arborisée, 3 chambres, box garage. Long terme préféré.', price: 65000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'Fourgon Peugeot Expert – Transport', description: 'Expert 2.0 HDI L2H1. Volume 5.8m³, porte latérale. Location journée/semaine.', price: 4000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'Salle polyvalente – Association/Formation', description: 'Salle 100 places avec scène, micro, projecteur. Convient ateliers, formations, AG.', price: 18000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'Studio de photographie professionnel', description: 'Studio 50m² avec cyclorama blanc, 6 lampes flash, trépieds. Tarif à l\'heure.', price: 4000, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'Appartement F5 – Haut standing', description: 'Penthouse 180m² dernier étage. Terrasse panoramique, jacuzzi, cuisine open-space.', price: 130000, subcategory: 'Apartments', rental_period: 'monthly' },
];

const FOR_RENT_AR = [
  { title: 'شقة مفروشة وسط المدينة للإيجار', description: 'شقة 60م² مفروشة بالكامل، الطابق 2، مصعد، خط كل الوسائل. متاحة فوراً.', price: 35000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'محل تجاري 50م² على شارع رئيسي', description: 'محل في الطابق الأرضي واجهة زجاجية على شارع حيوي. مناسب لأي نشاط تجاري.', price: 50000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'قاعة أفراح 400 مقعد جاهزة', description: 'قاعة مجهزة بالكامل، مكيفة، مطبخ احترافي. متاحة نهايات الأسبوع.', price: 180000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'فيلا 4 غرف مع مسبح – صيفي', description: 'فيلا 200م² 4 غرف مع حديقة ومسبح. مثالية لعائلة في الإجازات الصيفية.', price: 12000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'سيارة رينو كليو 5 للكراء اليومي', description: 'رينو كليو 5 2022، مكيفة، 5 أبواب. التأمين شامل. تأجير يومي أو أسبوعي.', price: 3500, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'شقة F2 مفروشة قرب الجامعة', description: 'شقة F2 55م² مفروشة، كل المصاريف مشمولة. خاصة للطلاب. حي هادئ.', price: 28000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'مكتب مشترك – فضاء عمل تشاركي', description: 'مكتب مشترك في فضاء عصري. واي فاي سريع، طابعة، قهوة مجانية.', price: 8500, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'حفار هيدروليكي CAT للإيجار اليومي', description: 'حفار CAT 320 مع سائق محترف. مستندات قانونية متوفرة. تأجير يومي أو أسبوعي.', price: 45000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'شقة بإطلالة بحرية – إيجار صيفي', description: 'شقة F3 75م² بإطلالة مباشرة على البحر. الطابق 5. حمام سباحة. جويلية-أوت.', price: 8000, subcategory: 'Apartments', rental_period: 'daily' },
  { title: 'منزل مستقل 5 غرف مع حديقة', description: 'منزل مستقل 180م² 5 غرف، حديقة كبيرة، مرآب. إيجار طويل الأمد مفضل.', price: 75000, subcategory: 'Houses', rental_period: 'monthly' },
  { title: 'شاحنة رافعة 25 طن مع مشغل', description: 'رافعة 25 طن مع سائق محترف. جميع الوثائق القانونية متوفرة. إيجار يومي.', price: 35000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'شقة فاخرة F4 – حي راقٍ', description: 'شقة 120م² 3 غرف، حمام سباحة وصالة رياضة مشتركة، موقف تحت الأرض.', price: 88000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'سيارة تويوتا هيلوكس 4×4 للكراء', description: 'تويوتا هيلوكس مضاعفة الكابينة 4×4. مناسبة لمواقع البناء. تأجير يومي.', price: 5500, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'خيمة صحراوية – ليالي تحت النجوم', description: 'خيمة تقليدية 6 أشخاص في الصحراء. تشمل العشاء والإفطار والدليل السياحي.', price: 10000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'محل صغير 20م² في سوق شعبية', description: 'محل في سوق شعبي حيوي. مناسب للملابس والأكسسوارات والأغذية.', price: 28000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'مولد كهرباء 15 كيلوواط للإيجار', description: 'مولد ديزل 15 كيلوواط هادئ. التوصيل مشمول. تأجير يومي/أسبوعي/شهري.', price: 5500, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'استوديو تصوير احترافي – بالساعة', description: 'استوديو 60م² خلفية بيضاء 6 إضاءات فلاش. مناسب للمصورين الاحترافيين.', price: 4500, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'شقة عزّاب F1 – موقع مميز', description: 'F1 45م²، مجهزة بالكامل، هادئة، قرب الوسائل والتجارة. للإيجار الشهري.', price: 22000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'حافلة ميني فان 9 مقاعد – يومي', description: 'ميني فان فولكسفاجن T6 9 مقاعد. مكيفة مع سائق. مناسبة للفرق والرحلات.', price: 7000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'مخزن صناعي 400م²', description: 'مخزن 400م² ارتفاع 6م، سقف مزدوج، رصيف تحميل، كهرباء ثلاثي الأطوار.', price: 100000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'شقة للإيجار مقابل الجامعة', description: 'شقة F3 قريبة من الجامعة، 3 غرف، حديقة، موقف. هادئة ومريحة.', price: 42000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'معدات بناء – خلاطة خرسانة', description: 'خلاطة خرسانة 350 لتر. التوصيل والاستلام مجاني في دائرة 30 كلم.', price: 1500, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'قاعة تدريب 50 مقعداً', description: 'قاعة تدريب مجهزة بشاشة عرض وسبورة تفاعلية ومكيف هواء. خدمة قهوة.', price: 18000, subcategory: 'Offices', rental_period: 'daily' },
  { title: 'شقة بنتهاوس – إطلالة بانورامية', description: 'بنتهاوس 180م² الطابق 12. تراس بانورامي، 5 غرف، حوض استحمام.', price: 140000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'خيمة أعراس 500م² متنقلة', description: 'خيمة مغلقة 500م² مع أرضية خشبية وإضاءة وجانبيات. التركيب مشمول.', price: 75000, subcategory: 'Event Halls (Salle des Fêtes)', rental_period: 'daily' },
  { title: 'سيارة هيونداي توكسون 2023 – شهري', description: 'هيونداي توكسون 2023 هايبرد، ناقل أوتوماتيكي، مكيف، GPS. تأمين شامل.', price: 110000, subcategory: 'Vehicles', rental_period: 'monthly' },
  { title: 'محل تجاري 80م² – ركن حيوي', description: 'محل على تقاطع مرور كثيف، 80م². مناسب للمطاعم والمحلات التجارية.', price: 70000, subcategory: 'Commercial Space', rental_period: 'monthly' },
  { title: 'بيت للإيجار الصيفي – قرب الشاطئ', description: 'بيت 3 غرف، 80م من الشاطئ، تراس بإطلالة بحرية. يوليو وأغسطس فقط.', price: 7000, subcategory: 'Houses', rental_period: 'daily' },
  { title: 'شقة F3 مجددة بالكامل', description: 'شقة 85م² محددة بالكامل. مطبخ حديث، غرفتان، شرفة واسعة.', price: 48000, subcategory: 'Apartments', rental_period: 'monthly' },
  { title: 'رافعة شوكية 3 طن – مستودع', description: 'رافعة شوكية كهربائية تويوتا 3 طن. متاحة يومياً أو أسبوعياً.', price: 12000, subcategory: 'Equipment', rental_period: 'daily' },
  { title: 'ليلة فندقية في شقة VIP', description: 'شقة VIP مفروشة فرنسي، 2 غرف، مطبخ مجهز، نت عالي السرعة. للإيجار اليومي.', price: 9000, subcategory: 'Apartments', rental_period: 'daily' },
  { title: 'مكتب مشترك في مركز الأعمال', description: 'مكتب 15م² في مركز أعمال مرموق. توطين، سكرتارية، غرفة اجتماعات مشتركة.', price: 32000, subcategory: 'Offices', rental_period: 'monthly' },
  { title: 'سيارة مرسيدس E200 – للمناسبات', description: 'مرسيدس E200 فضية 2022. مناسبة للمناسبات والحفلات. سائق متاح.', price: 8000, subcategory: 'Vehicles', rental_period: 'daily' },
  { title: 'شقة F2 – إيجار يومي سياحي', description: 'شقة F2 نظيفة ومجهزة. قرب المعالم السياحية والمطاعم. إيجار يومي.', price: 4500, subcategory: 'Apartments', rental_period: 'daily' },
];

// ---------------------------------------------------------------------------
// SERVICE templates
// ---------------------------------------------------------------------------
const SERVICE_EN = [
  { title: 'Professional House Cleaning – Weekly Service', description: 'Thorough house cleaning by a trained team. Supplies included. References available.', price: 3500, subcategory: 'Cleaning' },
  { title: 'Laptop & PC Repair – Same Day', description: 'Windows/macOS repair, virus removal, hardware replacement. Home visits available.', price: 2000, subcategory: 'IT & Tech Support' },
  { title: 'Math & Physics Tutoring – High School', description: 'Bac and BEM preparation by experienced teacher. Proven results. Group/individual sessions.', price: 1500, subcategory: 'Tutoring' },
  { title: 'Plumbing Services – Emergency Available', description: 'Licensed plumber for repairs, installations, and emergency calls. Available 24/7.', price: 3000, subcategory: 'Plumbing' },
  { title: 'Electrical Installation & Repair', description: 'Certified electrician for domestic wiring, panel upgrades, and fault finding.', price: 3500, subcategory: 'Electrical' },
  { title: 'Photography for Weddings & Events', description: 'Professional photographer with 10 years experience. Packages from 20,000 DZD/day.', price: 20000, subcategory: 'Photography' },
  { title: 'Interior Painting – Quality Finish', description: 'Interior painting team. Preparation, primer, and finish coat. Per-room pricing.', price: 5000, subcategory: 'Painting' },
  { title: 'Garden Design & Maintenance', description: 'Garden design, planting, watering systems, and weekly maintenance contracts.', price: 4000, subcategory: 'Gardening' },
  { title: 'English/French Translation – Technical Documents', description: 'Certified translator. Fast turnaround for legal, technical, and business documents.', price: 500, subcategory: 'Translation' },
  { title: 'Moving Service – With Truck', description: 'Full moving service: packing, loading, transport, unloading. Algiers zone.', price: 8000, subcategory: 'Transportation' },
  { title: 'Car Detailing – Interior & Exterior', description: 'Professional car detailing. Ceramic coating available. Home visits on request.', price: 4500, subcategory: 'Repair & Maintenance' },
  { title: 'Catering – Corporate Events', description: 'Corporate catering for 20–500 guests. Buffet, seated dinner, cocktail options.', price: 500, subcategory: 'Catering' },
  { title: 'AC Servicing & Installation', description: 'Aircon deep-clean, gas top-up, new installation. All brands serviced.', price: 2500, subcategory: 'Repair & Maintenance' },
  { title: 'Haircut & Styling – Home Visit', description: 'Female hairdresser offers home visits. Cuts, color, blow-dry. Algiers only.', price: 2000, subcategory: 'Beauty & Hair' },
  { title: 'IT Security Audit for Small Business', description: 'Network security assessment, vulnerability report, and remediation recommendations.', price: 25000, subcategory: 'IT & Tech Support' },
  { title: 'Private French Lessons – All Levels', description: 'French language lessons for kids and adults. Certified teacher, flexible schedule.', price: 1200, subcategory: 'Tutoring' },
  { title: 'Wedding Event Planning – Full Package', description: 'Complete event management: venue, decoration, catering, entertainment coordination.', price: 50000, subcategory: 'Event Planning' },
  { title: 'Physiotherapy – Home Visits', description: 'Registered physiotherapist offers home sessions. Post-op, sports injuries, back pain.', price: 3500, subcategory: 'Physical Therapy' },
  { title: 'Roof Waterproofing & Repair', description: 'Flat roof specialist. Bitumen membrane, liquid coating, leak investigation.', price: 8000, subcategory: 'Repair & Maintenance' },
  { title: 'Arabic Calligraphy – Custom Orders', description: 'Hand-lettered Arabic calligraphy for gifts, certificates, and wall art. A4 to A0.', price: 2500, subcategory: 'Other' },
  { title: 'Personal Training – Fitness at Home', description: 'Certified personal trainer. Weight loss, muscle gain, functional fitness programs.', price: 2000, subcategory: 'Other' },
  { title: 'Senior Home Care – Daily Assistance', description: 'Compassionate care for elderly at home. Daily routines, medication reminders, company.', price: 4000, subcategory: 'Senior Care' },
  { title: 'Tile & Marble Installation', description: 'Expert tiler for kitchens, bathrooms, terraces. Waterproof grouting and cleaning.', price: 6000, subcategory: 'Repair & Maintenance' },
  { title: 'Locksmith – Emergency & Installation', description: '24/7 locksmith. Lock change, emergency open, security upgrade. Fast response.', price: 2500, subcategory: 'Repair & Maintenance' },
  { title: 'Web Design & Development', description: 'Custom WordPress or React websites. Portfolio available. 2-week delivery.', price: 35000, subcategory: 'IT & Tech Support' },
  { title: 'Pest Control – Cockroaches & Rodents', description: 'Licensed pest control for residential and commercial. Safe products used.', price: 4000, subcategory: 'Cleaning' },
  { title: 'Video Editing – Social Media & YouTube', description: 'Short-form and long-form video editing. Color grading, subtitles, graphics.', price: 3000, subcategory: 'Other' },
  { title: 'Heating System Maintenance', description: 'Gas and electric heating servicing. Annual contract available. All makes.', price: 3000, subcategory: 'Repair & Maintenance' },
  { title: 'Driving Lessons – Patient Instructor', description: 'Experienced driving instructor. Code + practical. Automatic and manual.', price: 1500, subcategory: 'Transportation' },
  { title: 'Nanny & Babysitting Services', description: 'Experienced nanny for ages 0–12. Overnight or daytime. References on request.', price: 2500, subcategory: 'Other' },
  { title: 'Accounting Services – Small Business', description: 'Bookkeeping, tax declarations, payroll. Monthly packages available.', price: 8000, subcategory: 'Other' },
  { title: 'Pool Maintenance & Cleaning', description: 'Swimming pool cleaning, pH balancing, equipment check. Weekly or monthly contract.', price: 5000, subcategory: 'Cleaning' },
  { title: 'Carpentry – Custom Furniture', description: 'Custom woodwork for kitchens, wardrobes, and office furniture. On-site measurement.', price: 10000, subcategory: 'Repair & Maintenance' },
];

const SERVICE_FR = [
  { title: 'Nettoyage d\'appartement – Service professionnel', description: 'Nettoyage complet par équipe expérimentée. Produits fournis. Devis gratuit.', price: 3000, subcategory: 'Cleaning' },
  { title: 'Dépannage informatique – PC & Mac', description: 'Réparation, suppression virus, installation logiciels. Déplacement à domicile.', price: 1800, subcategory: 'IT & Tech Support' },
  { title: 'Cours de mathématiques – BEM & Bac', description: 'Soutien scolaire maths et physique. Résultats prouvés. Séances individuelles.', price: 1200, subcategory: 'Tutoring' },
  { title: 'Plombier professionnel – Urgences 24h/24', description: 'Interventions urgentes et programmées. Fuites, canalisations, installation sanitaire.', price: 2500, subcategory: 'Plumbing' },
  { title: 'Électricien agréé – Travaux domestiques', description: 'Tableau électrique, prises, éclairage LED, dépannage. Certifié Sonelgaz.', price: 3000, subcategory: 'Electrical' },
  { title: 'Photographe mariage & événements', description: 'Photographe professionnel 12 ans d\'expérience. Retouches incluses. Photos HD.', price: 18000, subcategory: 'Photography' },
  { title: 'Peinture intérieure – Travail soigné', description: 'Peintre professionnel, préparation des supports, peinture acrylique ou glycéro.', price: 4500, subcategory: 'Painting' },
  { title: 'Entretien de jardin – Contrat mensuel', description: 'Tonte, taille, arrosage, désherbage. Contrats hebdomadaires ou mensuels.', price: 3500, subcategory: 'Gardening' },
  { title: 'Traduction français–arabe – Documents officiels', description: 'Traducteur assermenté. Actes, diplômes, contrats. Délai 48h garanti.', price: 800, subcategory: 'Translation' },
  { title: 'Déménagement avec camion – Région Alger', description: 'Service complet : emballage, chargement, transport, déchargement. Camion 20m³.', price: 9000, subcategory: 'Transportation' },
  { title: 'Climatisation – Installation & entretien', description: 'Pose, nettoyage et recharge de gaz pour tous types de climatiseurs. Garantie 1 an.', price: 2800, subcategory: 'Repair & Maintenance' },
  { title: 'Coiffure à domicile – Femme', description: 'Coupe, couleur, balayage, brushing. Déplacement à domicile sur Alger et banlieue.', price: 2500, subcategory: 'Beauty & Hair' },
  { title: 'Cours de langue française – Tous niveaux', description: 'Enseignante certifiée, enfants et adultes. Planning flexible. FLE et remédiation.', price: 1200, subcategory: 'Tutoring' },
  { title: 'Organisation de mariage clé en main', description: 'Décoration, traiteur, animation, coordination salle. Devis personnalisé gratuit.', price: 45000, subcategory: 'Event Planning' },
  { title: 'Kinésithérapie à domicile', description: 'Kiné diplômée, séances post-opératoires, lumbago, rééducation sportive.', price: 3500, subcategory: 'Physical Therapy' },
  { title: 'Audit sécurité réseau – TPE/PME', description: 'Test de pénétration, rapport de vulnérabilités, mise en conformité RGPD.', price: 30000, subcategory: 'IT & Tech Support' },
  { title: 'Menuiserie sur mesure – Cuisine & Dressing', description: 'Fabrication et pose de meubles de cuisine, dressing, bibliothèque sur mesure.', price: 12000, subcategory: 'Repair & Maintenance' },
  { title: 'Service de traiteur – Événements familiaux', description: 'Buffets, plateaux repas, couscous, pâtisseries orientales. À partir de 20 couverts.', price: 600, subcategory: 'Catering' },
  { title: 'Coach sportif – Domicile & Salle', description: 'Programme personnalisé perte de poids, musculation ou remise en forme.', price: 2000, subcategory: 'Other' },
  { title: 'Aide à domicile – Personne âgée', description: 'Assistance toilette, repas, courses, compagnie. Personnel soignant expérimenté.', price: 4000, subcategory: 'Senior Care' },
  { title: 'Création de site web professionnel', description: 'Sites vitrine, e-commerce et portfolios. WordPress ou React. Livraison 3 semaines.', price: 40000, subcategory: 'IT & Tech Support' },
  { title: 'Désinfection & dératisation', description: 'Traitement anti-nuisibles certifié (cafards, souris, punaises). Produits homologués.', price: 5000, subcategory: 'Cleaning' },
  { title: 'Carrelage & revêtement – Pièce humide', description: 'Pose de carrelage et faïence, joints étanches, nettoyage après chantier.', price: 5500, subcategory: 'Repair & Maintenance' },
  { title: 'Baby-sitting qualifié – À la carte', description: 'Nounou diplômée pour enfants de 0 à 12 ans. Horaires flexibles. Références.', price: 2500, subcategory: 'Other' },
  { title: 'Réparation électroménager – Toutes marques', description: 'Lave-linge, réfrigérateur, four, hotte. Devis gratuit. Déplacement à domicile.', price: 1500, subcategory: 'Repair & Maintenance' },
  { title: 'Montage de meubles IKEA & autres', description: 'Montage rapide et soigné. Disponible 7j/7. Tarif horaire ou à la pièce.', price: 1200, subcategory: 'Repair & Maintenance' },
  { title: 'Cours de comptabilité – TPE & artisans', description: 'Formation pratique: tenue de livre, déclarations TVA, paie. En ligne ou présentiel.', price: 2000, subcategory: 'Tutoring' },
  { title: 'Réparation smartphone – Écran & batterie', description: 'Remplacement d\'écrans iPhone, Samsung, Xiaomi. Garantie 3 mois sur pièces.', price: 1800, subcategory: 'Repair & Maintenance' },
  { title: 'Montage vidéo – Réseaux sociaux & YouTube', description: 'Montage Reels, Shorts, vlogs. Sous-titres, transitions, color grading inclus.', price: 3000, subcategory: 'Other' },
  { title: 'Leçons de conduite – Moniteur patient', description: 'Cours de conduite Manuel & automatique. Code de la route & pratique.', price: 1500, subcategory: 'Transportation' },
  { title: 'Imperméabilisation de terrasse & toiture', description: 'Traitement hydrofuge, membrane bitumineuse, résine époxy. Garantie 5 ans.', price: 9000, subcategory: 'Repair & Maintenance' },
  { title: 'Comptabilité pour petites entreprises', description: 'Tenue de comptabilité mensuelle, déclarations fiscales, bilan annuel.', price: 9000, subcategory: 'Other' },
  { title: 'Serrurerie – Urgence & Installation', description: 'Ouverture de porte bloquée, remplacement serrure, blindage. Intervention rapide.', price: 2500, subcategory: 'Repair & Maintenance' },
];

const SERVICE_AR = [
  { title: 'تنظيف المنازل – فريق متخصص', description: 'تنظيف شامل للمنزل بفريق محترف. المواد مشمولة. مراجع متاحة عند الطلب.', price: 3000, subcategory: 'Cleaning' },
  { title: 'إصلاح الحاسوب والهواتف – نفس اليوم', description: 'إصلاح ويندوز، ماك، أندرويد وiOS. إزالة الفيروسات، استبدال القطع. زيارة منزلية.', price: 1800, subcategory: 'IT & Tech Support' },
  { title: 'دروس خصوصية رياضيات وفيزياء – الثانوي', description: 'أستاذ ذو خبرة لتحضير الباكالوريا والBEM. نتائج مضمونة. حصص فردية وجماعية.', price: 1200, subcategory: 'Tutoring' },
  { title: 'سبّاك محترف – طوارئ 24 ساعة', description: 'تدخل للطوارئ والأعطال المبرمجة. تسريبات، قنوات، تركيب صحي.', price: 2500, subcategory: 'Plumbing' },
  { title: 'كهربائي معتمد – أعمال منزلية', description: 'لوحة كهربائية، مقابس، إضاءة LED، صيانة. شهادة سونلغاز.', price: 3000, subcategory: 'Electrical' },
  { title: 'مصور أعراس ومناسبات', description: 'مصور محترف بخبرة 10 سنوات. تعديل كامل مشمول. صور عالية الجودة.', price: 18000, subcategory: 'Photography' },
  { title: 'دهن وطلاء منازل – عمل دقيق ونظيف', description: 'فريق دهان محترف. تحضير الجدران، طلاء أكريليك أو زيتي. سعر لكل غرفة.', price: 4500, subcategory: 'Painting' },
  { title: 'تنسيق وصيانة الحدائق', description: 'تصميم وزراعة ونظام ري وصيانة أسبوعية للحدائق. عقود شهرية متاحة.', price: 3500, subcategory: 'Gardening' },
  { title: 'ترجمة معتمدة عربي-فرنسي-إنجليزي', description: 'مترجم محلف للوثائق الرسمية والقانونية والتقنية. تسليم 48 ساعة.', price: 800, subcategory: 'Translation' },
  { title: 'نقل الأثاث بشاحنة – منطقة الجزائر', description: 'خدمة نقل كاملة: تغليف، تحميل، نقل، تفريغ. شاحنة 20م³.', price: 8500, subcategory: 'Transportation' },
  { title: 'صيانة وتركيب مكيفات الهواء', description: 'تركيب، تنظيف عميق وشحن غاز لجميع أنواع المكيفات. ضمان سنة.', price: 2800, subcategory: 'Repair & Maintenance' },
  { title: 'كوافيرة تنتقل إلى المنزل', description: 'تصفيف وقص وصباغة وعلاجات. للنساء فقط. تنقل داخل الجزائر العاصمة.', price: 2500, subcategory: 'Beauty & Hair' },
  { title: 'تنظيم حفلات زفاف كاملة', description: 'تنسيق ديكور، ترتيب تسلية، تنسيق قاعة وطعام. عرض سعر مجاني.', price: 45000, subcategory: 'Event Planning' },
  { title: 'كينيزيتيرابي منزلي', description: 'معالج كيني معتمد. جلسات ما بعد العمليات، آلام الظهر، إعادة التأهيل الرياضي.', price: 3500, subcategory: 'Physical Therapy' },
  { title: 'تصميم وتطوير مواقع ويب', description: 'مواقع WordPress و React مخصصة. ملف أعمال متاح. تسليم خلال أسبوعين.', price: 38000, subcategory: 'IT & Tech Support' },
  { title: 'مكافحة الحشرات والقوارض', description: 'علاج احترافي للصراصير والفئران وبق الفراش. مواد مرخصة وآمنة.', price: 4500, subcategory: 'Cleaning' },
  { title: 'مساعدة منزلية لكبار السن', description: 'مرافقة يومية، تذكير بالأدوية، وجبات، تسوق. طاقم تمريض ذو خبرة.', price: 4000, subcategory: 'Senior Care' },
  { title: 'إصلاح شاشات الهواتف الذكية', description: 'استبدال شاشات iPhone وSamsung وXiaomi. ضمان 3 أشهر على القطع.', price: 1800, subcategory: 'Repair & Maintenance' },
  { title: 'دروس في اللغة الفرنسية – كل المستويات', description: 'أستاذة معتمدة للأطفال والكبار. جدول مرن. FLE وتعزيز المكتسبات.', price: 1200, subcategory: 'Tutoring' },
  { title: 'مونتاج فيديو – يوتيوب وتيك توك', description: 'مونتاج ريلز، فيديوهات قصيرة وطويلة. ترجمة، انتقالات، ألوان احترافية.', price: 3000, subcategory: 'Other' },
  { title: 'تركيب الكاروه والرخام', description: 'متخصص في تركيب الكاروه والمرمر في المطابخ والحمامات والتراسات.', price: 5500, subcategory: 'Repair & Maintenance' },
  { title: 'خدمات محاسبة – مؤسسات صغيرة', description: 'مسك الدفاتر، التصريحات الضريبية، الراتب الشهري. عقود شهرية.', price: 9000, subcategory: 'Other' },
  { title: 'تركيب ألواح شمسية – طاقة متجددة', description: 'تركيب وصيانة ألواح شمسية للمنازل والمحلات. ضمان 5 سنوات.', price: 15000, subcategory: 'Electrical' },
  { title: 'تدريس أونلاين عبر زووم', description: 'حصص أونلاين في الرياضيات والعلوم والفرنسية. جميع المستويات.', price: 900, subcategory: 'Tutoring' },
  { title: 'تنظيف المكاتب والشركات', description: 'تنظيف يومي أو أسبوعي للمكاتب والشركات. عقود سنوية بأسعار تفضيلية.', price: 5000, subcategory: 'Cleaning' },
  { title: 'مدرب لياقة بدنية خاص', description: 'برنامج مخصص لإنقاص الوزن أو بناء العضلات. في المنزل أو القاعة.', price: 2000, subcategory: 'Other' },
  { title: 'نجارة على المقاس – مطابخ وخزائن', description: 'تصنيع وتركيب مطابخ وخزائن ومكتبات بالمقاس. قياس ميداني مجاني.', price: 12000, subcategory: 'Repair & Maintenance' },
  { title: 'تصليح الأجهزة الكهرومنزلية', description: 'غسالة، ثلاجة، فرن، شفاط. تشخيص مجاني. زيارة منزلية.', price: 1500, subcategory: 'Repair & Maintenance' },
  { title: 'حراسة وأمن – بناءات وفعاليات', description: 'حراس أمن معتمدون للمناسبات والمباني والشركات. عقود مرنة.', price: 6000, subcategory: 'Other' },
  { title: 'خدمة تقديم الطعام – مناسبات عائلية', description: 'طعام تقليدي وعصري للمناسبات من 20 إلى 500 شخص. عروض أسعار مجانية.', price: 500, subcategory: 'Catering' },
  { title: 'عزل مائي للأسطح والشرفات', description: 'عزل احترافي بالبيتومين أو الراتنج. فحص مجاني للتسربات. ضمان 5 سنوات.', price: 8000, subcategory: 'Repair & Maintenance' },
  { title: 'تصليح ومحاذاة السيارات', description: 'ورشة متنقلة لصيانة السيارات الخفيفة. تغيير زيت، فرامل، إطارات.', price: 2500, subcategory: 'Repair & Maintenance' },
  { title: 'تدريس اللغة الإنجليزية – مبتدئين ومتقدمين', description: 'أستاذة إنجليزية خريجة جامعة. مستويات A1 إلى C1. دروس خاصة وجماعية.', price: 1500, subcategory: 'Tutoring' },
];

// ---------------------------------------------------------------------------
// JOB templates
// ---------------------------------------------------------------------------
const JOB_EN = [
  { title: 'Senior Software Engineer – Full Stack', description: 'We are looking for a Senior Full Stack developer with 5+ years experience in React and Node.js.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'TechDZ Solutions', salary_min: 120000, salary_max: 180000 },
  { title: 'Civil Engineer – Construction Projects', description: 'Civil engineering graduate required for large infrastructure projects. AutoCAD skills essential.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'BatiConstruct SARL', salary_min: 80000, salary_max: 120000 },
  { title: 'General Practitioner – Medical Clinic', description: 'Medical clinic looking for a licensed GP. 3 years minimum experience. Clinic in Algiers suburb.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Polyclinique Moderne', salary_min: 150000, salary_max: 250000 },
  { title: 'English Teacher – Private School', description: 'Native or near-native English speaker required to teach secondary school. Degree in education preferred.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'Académie Excellence', salary_min: 60000, salary_max: 90000 },
  { title: 'Sales Manager – Consumer Electronics', description: 'Drive sales team for electronics retail chain. 5+ years B2C sales management experience needed.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'ElectroDZ Groupe', salary_min: 100000, salary_max: 150000 },
  { title: 'Administrative Secretary – Law Firm', description: 'Bilingual (French/Arabic) secretary needed for law firm. Proficiency in office software required.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Cabinet Maître Benkali', salary_min: 45000, salary_max: 65000 },
  { title: 'Site Foreman – Building Construction', description: 'Experienced site foreman needed for residential building project. Technical diploma required.', price: null, subcategory: 'Construction', job_type: 'full_time', company_name: 'Promobat EURL', salary_min: 70000, salary_max: 100000 },
  { title: 'Truck Driver – Long Distance (CE Licence)', description: 'Long-distance truck driver with CE licence. National routes. Attractive per-diem.', price: null, subcategory: 'Transportation', job_type: 'full_time', company_name: 'TransDZ Freight', salary_min: 55000, salary_max: 80000 },
  { title: 'Chef – 5-Star Hotel Restaurant', description: 'Experienced chef for upscale hotel restaurant. Pastry or Algerian cuisine specialization welcome.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'Hôtel Grand Alger', salary_min: 90000, salary_max: 130000 },
  { title: 'Electrician Apprentice – Workshop', description: 'Training position for recent BTP graduates. On-the-job training in industrial electrical work.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'Elec Industrie DZ', salary_min: 30000, salary_max: 45000 },
  { title: 'Agricultural Engineer – Greenhouse Project', description: 'Agri-food engineer for greenhouse irrigation and crop management project.', price: null, subcategory: 'Agriculture', job_type: 'full_time', company_name: 'AgroTech Algérie', salary_min: 75000, salary_max: 110000 },
  { title: 'Network Administrator – ISP', description: 'Cisco-certified network admin for ISP infrastructure. On-call rotation required.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'ConnectDZ', salary_min: 100000, salary_max: 140000 },
  { title: 'Accountant – Manufacturing Company', description: 'Certified accountant for mid-sized manufacturer. PCG, SYSCOHADA experience required.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'PlastiDZ Industries', salary_min: 65000, salary_max: 95000 },
  { title: 'Store Manager – Supermarket', description: 'Experienced supermarket manager for new hypermarket opening. Leadership skills essential.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'MarketDZ Retail', salary_min: 80000, salary_max: 120000 },
  { title: 'Mechanical Engineer – Automotive', description: 'Automotive mechanic engineer for vehicle diagnostics and workshop management.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'AutoDZ Services', salary_min: 80000, salary_max: 115000 },
  { title: 'Data Analyst – Telecom Company', description: 'SQL and Python data analyst for customer analytics team. Power BI skills preferred.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'TelecomDZ', salary_min: 90000, salary_max: 130000 },
  { title: 'Nurse – Private Clinic', description: 'Registered nurse for private clinic, outpatient care. Day and night shifts available.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Clinique Santé Plus', salary_min: 60000, salary_max: 90000 },
  { title: 'Graphic Designer – Advertising Agency', description: 'Creative graphic designer for print and digital campaigns. Adobe suite expertise required.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'PubDZ Agency', salary_min: 55000, salary_max: 80000 },
  { title: 'HR Manager – Construction Group', description: 'HR manager for construction group of 500 employees. Labor law expertise required.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Groupe BTP Algérie', salary_min: 95000, salary_max: 135000 },
  { title: 'Logistics Coordinator – Import/Export', description: 'Customs and logistics coordinator. Customs code and trade documentation experience required.', price: null, subcategory: 'Transportation', job_type: 'full_time', company_name: 'LogisDZ', salary_min: 65000, salary_max: 95000 },
  { title: 'Pharmacist – Community Pharmacy', description: 'Licensed pharmacist for community pharmacy. Willing to work in any wilaya.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Pharmacie El Afia', salary_min: 100000, salary_max: 140000 },
  { title: 'Python Developer – Fintech Startup', description: 'Python/Django backend developer for fintech product. Remote-friendly, equity option.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'FinDZ Tech', salary_min: 130000, salary_max: 200000 },
  { title: 'Primary School Teacher – Math', description: 'Primary school math teacher for private school, French curriculum.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'École Avenir', salary_min: 50000, salary_max: 75000 },
  { title: 'Plumbing & HVAC Technician', description: 'Qualified plumbing and HVAC technician for hotel maintenance team.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'Hôtel Sheraton Alger', salary_min: 55000, salary_max: 80000 },
  { title: 'Marketing Manager – E-Commerce', description: 'Digital marketing manager for e-commerce platform. SEO, social media, email campaigns.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'ShopDZ Online', salary_min: 90000, salary_max: 130000 },
  { title: 'Dentist – Private Dental Clinic', description: 'Dentist for expanding private dental clinic. Fresh graduates welcome.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Cabinet Dentaire Moderne', salary_min: 120000, salary_max: 200000 },
  { title: 'Welder – Industrial Plant', description: 'Certified welder for industrial manufacturing plant. MIG/TIG/arc welding skills needed.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'MetalDZ Industries', salary_min: 45000, salary_max: 65000 },
  { title: 'Security Guard – Commercial Center', description: 'Uniformed security guard for shopping mall. Night and day shifts. No criminal record required.', price: null, subcategory: 'Other', job_type: 'full_time', company_name: 'SecurDZ Services', salary_min: 30000, salary_max: 45000 },
  { title: 'Supply Chain Specialist – Pharmaceutical', description: 'Pharma supply chain specialist for cold chain logistics. 3 years minimum experience.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'PharmaLog DZ', salary_min: 80000, salary_max: 115000 },
  { title: 'Real Estate Agent – Commission-Based', description: 'Real estate agent for residential and commercial properties. Strong network preferred.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'ImmoExpert DZ', salary_min: 40000, salary_max: 200000 },
  { title: 'Solar Panel Installer – Renewable Energy', description: 'Solar panel installation technician. Training provided. Nationwide projects.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'EnergySol DZ', salary_min: 55000, salary_max: 80000 },
  { title: 'Customer Service Representative – Bank', description: 'Bank customer service rep. Bilingual French/Arabic, professional presentation.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Banque Nationale DZ', salary_min: 50000, salary_max: 70000 },
  { title: 'Cook – Staff Canteen (Large Company)', description: 'Cook for a large company staff canteen. Traditional Algerian and international cuisine.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'GroupeDZ Industries', salary_min: 40000, salary_max: 60000 },
];

const JOB_FR = [
  { title: 'Développeur Full Stack Sénior – React & Node.js', description: 'Nous recherchons un développeur senior 5+ ans React/Node.js pour intégrer notre équipe produit.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'StartupDZ', salary_min: 110000, salary_max: 170000 },
  { title: 'Ingénieur Génie Civil – Projets Infrastructure', description: 'Ingénieur GC pour grands travaux d\'infrastructure. Maîtrise d\'AutoCAD et de la topographie.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'EuroBâtit Algérie', salary_min: 80000, salary_max: 120000 },
  { title: 'Médecin Généraliste – Cabinet Privé', description: 'Cabinet médical cherche médecin généraliste agréé. Minimum 3 ans d\'expérience. Alger.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Clinique Santé Plus', salary_min: 140000, salary_max: 220000 },
  { title: 'Professeur de Français – École Privée', description: 'Enseignant de français langue maternelle ou FLE pour lycée privé. Licence en lettres exigée.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'Lycée Horizons', salary_min: 55000, salary_max: 85000 },
  { title: 'Responsable Commercial – Produits Alimentaires', description: 'Développement réseau de distribution alimentaire. Expérience GMS ou B2B indispensable.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'AlimenTDZ SARL', salary_min: 90000, salary_max: 140000 },
  { title: 'Secrétaire Comptable – Cabinet d\'Expert-Comptable', description: 'Secrétaire comptable bilingue arabe/français. Maîtrise d\'Excel et logiciel de compta.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Cabinet Audit Expertise', salary_min: 40000, salary_max: 60000 },
  { title: 'Chef de Chantier BTP – Résidentiel', description: 'Chef de chantier pour projets résidentiels. DTS ou licence en génie civil requis.', price: null, subcategory: 'Construction', job_type: 'full_time', company_name: 'PromoCité SARL', salary_min: 65000, salary_max: 95000 },
  { title: 'Chauffeur Poids Lourd – Permis CE', description: 'Chauffeur routier permis CE pour tournées nationales. Prime de déplacement attractive.', price: null, subcategory: 'Transportation', job_type: 'full_time', company_name: 'Transauto DZ', salary_min: 50000, salary_max: 75000 },
  { title: 'Cuisinier Chef – Restaurant Gastronomique', description: 'Chef expérimenté pour restaurant gastronomique. Cuisine algérienne et méditerranéenne.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'Restaurant Le Saphir', salary_min: 85000, salary_max: 125000 },
  { title: 'Électricien Industriel – Entreprise de Production', description: 'Électricien qualifié pour maintenance installations industrielles. Habilitations exigées.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'Industrie Nationale DZ', salary_min: 55000, salary_max: 80000 },
  { title: 'Ingénieur Agronome – Projet Serre', description: 'Ingénieur agronome pour conduite de cultures sous serre et gestion irrigation.', price: null, subcategory: 'Agriculture', job_type: 'full_time', company_name: 'SaharAgri DZ', salary_min: 70000, salary_max: 105000 },
  { title: 'Administrateur Réseau – Opérateur Télécom', description: 'Admin réseau certifié Cisco pour infrastructure opérateur. Astreintes week-ends.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'TelecomDZ', salary_min: 95000, salary_max: 135000 },
  { title: 'Comptable Confirmé – Industrie Agroalimentaire', description: 'Comptable PCG expérimenté pour industrie agro. Maîtrise du bilan et liasse fiscale.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'AgroIndustrDZ', salary_min: 60000, salary_max: 90000 },
  { title: 'Responsable de Magasin – Grande Surface', description: 'Manager expérimenté pour ouverture hypermarché. Leadership et gestion d\'équipe requis.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'HyperDZ Market', salary_min: 75000, salary_max: 115000 },
  { title: 'Analyste de Données – Secteur Télécom', description: 'Analyste Python/SQL pour équipe analytics. Power BI apprécié.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'DataDZ Analytics', salary_min: 85000, salary_max: 125000 },
  { title: 'Infirmier Diplômé – Clinique Privée', description: 'Infirmier(ère) diplômé(e) d\'État. Soins ambulatoires, gardes jour et nuit.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Clinique Centrale Alger', salary_min: 55000, salary_max: 85000 },
  { title: 'Designer Graphique – Agence Publicité', description: 'Designer créatif pour supports print et digital. Maîtrise de la suite Adobe.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'CreativeDZ Agency', salary_min: 50000, salary_max: 75000 },
  { title: 'DRH – Groupe BTP (500 salariés)', description: 'DRH pour groupe construction 500 personnes. Droit social et négociation collective.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Groupe BTP Horizons', salary_min: 90000, salary_max: 130000 },
  { title: 'Pharmacien – Officine', description: 'Pharmacien diplômé pour pharmacie en expansion. Toutes wilayas acceptées.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Pharmacie Centrale', salary_min: 95000, salary_max: 140000 },
  { title: 'Soudeur Qualifié – Usine Sidérurgique', description: 'Soudeur MIG/TIG certifié pour unité de production métallique.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'SidéroDZ SARL', salary_min: 40000, salary_max: 60000 },
  { title: 'Agent de Sécurité – Centre Commercial', description: 'Agent sécurité en uniforme pour grand centre commercial. Roulements jour/nuit.', price: null, subcategory: 'Other', job_type: 'full_time', company_name: 'SecuriGuard DZ', salary_min: 28000, salary_max: 42000 },
  { title: 'Développeur Mobile – iOS & Android', description: 'Développeur mobile Flutter/Swift pour application grand public. 3 ans d\'exp.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'AppsDZ Studio', salary_min: 100000, salary_max: 150000 },
  { title: 'Instituteur – École Primaire Privée', description: 'Instituteur cycle primaire pour école privée curriculum français.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'École Les Oliviers', salary_min: 48000, salary_max: 72000 },
  { title: 'Chargé Marketing Digital – E-Commerce', description: 'Manager marketing digital pour plateforme e-commerce. SEO, SEM, email marketing.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'VenteDZ.com', salary_min: 85000, salary_max: 125000 },
  { title: 'Chirurgien Dentiste – Cabinet Moderne', description: 'Chirurgien-dentiste pour cabinet en expansion. Jeunes diplômés bienvenus.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'Cabinet Dent Beauté', salary_min: 110000, salary_max: 190000 },
  { title: 'Technicien Plomberie & CVC – Hôtel', description: 'Technicien multi-technique pour maintenance hôtelière. Plomberie et climatisation.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'Hôtel El Aurassi', salary_min: 50000, salary_max: 75000 },
  { title: 'Responsable Chaîne Logistique – Import', description: 'Supply chain manager import/export. Maîtrise des Incoterms et réglementation douanière.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'LogisDZ Import', salary_min: 80000, salary_max: 115000 },
  { title: 'Cuisinier – Cantine d\'Entreprise', description: 'Cuisinier pour cantine 200 couverts. Cuisine traditionnelle et diététique.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'RestoDZ Corporate', salary_min: 38000, salary_max: 55000 },
  { title: 'Agent Immobilier – Vente & Location', description: 'Agent immobilier commission. Portefeuille clients fourni. Véhicule de service.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'ImmoDZ Expertise', salary_min: 35000, salary_max: 180000 },
  { title: 'Technicien Photovoltaïque – Énergie Solaire', description: 'Installateur panneaux solaires pour projets nationaux. Formation assurée.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'SoleilDZ Énergie', salary_min: 50000, salary_max: 75000 },
  { title: 'Conseiller Clientèle – Banque', description: 'Conseiller clientèle bilingue pour agence bancaire. Sens du service client.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'Banque el Baraka', salary_min: 48000, salary_max: 68000 },
  { title: 'Directeur de Production – Agroalimentaire', description: 'Directeur production usine agroalimentaire. Expérience HACCP, ISO 22000.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'AgroProDZ', salary_min: 150000, salary_max: 220000 },
  { title: 'Technicien de Maintenance Industrielle', description: 'Technicien maintenance préventive et corrective pour unité de production.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'MecaDZ Industries', salary_min: 60000, salary_max: 85000 },
];

const JOB_AR = [
  { title: 'مهندس برمجيات أول – فول ستاك', description: 'نبحث عن مطور فول ستاك بخبرة 5 سنوات في React وNode.js للانضمام لفريق المنتج.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'تك ديزي', salary_min: 110000, salary_max: 170000 },
  { title: 'مهندس مدني – مشاريع البنية التحتية', description: 'مطلوب مهندس مدني لمشاريع بنية تحتية كبرى. إتقان AutoCAD ضروري.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'شركة البناء الجزائري', salary_min: 80000, salary_max: 120000 },
  { title: 'طبيب عام – عيادة خاصة', description: 'مطلوب طبيب عام مرخص لعيادة خاصة. خبرة 3 سنوات على الأقل. الجزائر العاصمة.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'عيادة الصحة الحديثة', salary_min: 140000, salary_max: 220000 },
  { title: 'أستاذ رياضيات – ثانوية خاصة', description: 'مطلوب أستاذ رياضيات لثانوية خاصة. شهادة ليسانس في الرياضيات ضرورية.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'ثانوية المستقبل', salary_min: 55000, salary_max: 85000 },
  { title: 'مسؤول مبيعات – قطاع الغذاء', description: 'تطوير شبكة توزيع للمواد الغذائية. خبرة في B2B أو الجملة ضرورية.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'شركة الأغذية الجزائرية', salary_min: 90000, salary_max: 140000 },
  { title: 'سكرتيرة محاسبة – مكتب محاسبة', description: 'سكرتيرة محاسبة ثنائية اللغة. إتقان Excel وبرامج المحاسبة.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'مكتب التدقيق والخبرة', salary_min: 40000, salary_max: 60000 },
  { title: 'رئيس ورشة بناء – مشاريع سكنية', description: 'رئيس ورشة لمشاريع سكنية. شهادة DTS أو ليسانس في الهندسة المدنية.', price: null, subcategory: 'Construction', job_type: 'full_time', company_name: 'مؤسسة البناء الحديث', salary_min: 65000, salary_max: 95000 },
  { title: 'سائق شاحنة – رحلات طويلة (رخصة CE)', description: 'سائق شاحنة ثقيلة برخصة CE لرحلات وطنية. تعويضات سفر جذابة.', price: null, subcategory: 'Transportation', job_type: 'full_time', company_name: 'شركة النقل الجزائرية', salary_min: 50000, salary_max: 75000 },
  { title: 'طباخ رئيسي – مطعم فندقي', description: 'مطلوب طباخ رئيسي ذو خبرة. المطبخ الجزائري والبحر الأبيض المتوسط.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'فندق الجزائر الكبير', salary_min: 85000, salary_max: 125000 },
  { title: 'كهربائي صناعي – وحدة إنتاج', description: 'كهربائي مؤهل لصيانة منشآت صناعية. شهادات مهنية مطلوبة.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'صناعة الجزائر الوطنية', salary_min: 55000, salary_max: 80000 },
  { title: 'مهندس زراعي – مشروع بيوت محمية', description: 'مهندس زراعي لإدارة زراعة البيوت المحمية وأنظمة الري.', price: null, subcategory: 'Agriculture', job_type: 'full_time', company_name: 'أغروتيك الجزائر', salary_min: 70000, salary_max: 105000 },
  { title: 'مدير شبكة – شركة اتصالات', description: 'مدير شبكة حاصل على شهادة Cisco لبنية تحتية لشركة اتصالات.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'اتصالات الجزائر', salary_min: 95000, salary_max: 135000 },
  { title: 'محاسب معتمد – صناعة الأغذية', description: 'محاسب PCG لشركة أغذية صناعية. إتقان الميزانية والتصريح الضريبي.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'مجمع الأغذية الجزائري', salary_min: 60000, salary_max: 90000 },
  { title: 'مدير متجر – محل كبير', description: 'مدير متجر ذو خبرة لافتتاح هايبرماركت جديد. قيادة وإدارة فريق.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'ماركت الجزائر', salary_min: 75000, salary_max: 115000 },
  { title: 'محلل بيانات – قطاع الاتصالات', description: 'محلل بيانات Python/SQL لفريق analytics. Power BI مرغوب فيه.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'داتا ديزي', salary_min: 85000, salary_max: 125000 },
  { title: 'ممرض/ة دبلوم دولة – عيادة خاصة', description: 'ممرض/ة دبلوم دولة. رعاية خارجية، حراسة نهار وليل.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'عيادة الصحة الجزائرية', salary_min: 55000, salary_max: 85000 },
  { title: 'مصمم جرافيك – وكالة إشهار', description: 'مصمم مبدع لوسائل الطباعة والرقمية. إتقان Adobe Suite.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'وكالة كريتيف', salary_min: 50000, salary_max: 75000 },
  { title: 'مدير موارد بشرية – مجموعة BTP', description: 'مدير HR لمجموعة بناء 500 عامل. خبرة في قانون العمل والتفاوض.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'مجموعة BTP الجزائر', salary_min: 90000, salary_max: 130000 },
  { title: 'صيدلاني – صيدلية جوار', description: 'صيدلاني مرخص لصيدلية في توسع. جميع الولايات مقبولة.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'صيدلية العافية', salary_min: 95000, salary_max: 140000 },
  { title: 'لحام مؤهل – وحدة صناعية', description: 'لحام MIG/TIG معتمد لوحدة إنتاج معادن. خبرة 3 سنوات على الأقل.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'صناعة المعادن الجزائرية', salary_min: 40000, salary_max: 60000 },
  { title: 'عون أمن – مركز تجاري', description: 'عون أمن بزي رسمي لمركز تجاري. دوريات نهارية وليلية.', price: null, subcategory: 'Other', job_type: 'full_time', company_name: 'خدمات الأمن الجزائرية', salary_min: 28000, salary_max: 42000 },
  { title: 'مطور تطبيقات موبايل – iOS وأندرويد', description: 'مطور Flutter/Swift لتطبيق جمهور واسع. خبرة 3 سنوات.', price: null, subcategory: 'Information Technology', job_type: 'full_time', company_name: 'استوديو التطبيقات', salary_min: 100000, salary_max: 150000 },
  { title: 'معلم ابتدائي – مدرسة خاصة', description: 'معلم طور ابتدائي في مدرسة خاصة بالمنهج الفرنسي.', price: null, subcategory: 'Education', job_type: 'full_time', company_name: 'مدرسة المستقبل', salary_min: 48000, salary_max: 72000 },
  { title: 'مسؤول تسويق رقمي – تجارة إلكترونية', description: 'مسؤول تسويق رقمي لمنصة تجارة إلكترونية. SEO، إعلانات، بريد إلكتروني.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'سوق الجزائر أونلاين', salary_min: 85000, salary_max: 125000 },
  { title: 'طبيب أسنان – عيادة حديثة', description: 'جراح أسنان لعيادة في توسع. الخريجون الجدد مرحب بهم.', price: null, subcategory: 'Healthcare', job_type: 'full_time', company_name: 'عيادة الأسنان الحديثة', salary_min: 110000, salary_max: 190000 },
  { title: 'تقني صيانة فندقية – سباكة وتكييف', description: 'تقني سباكة وتكييف لفريق صيانة فندقية. خبرة متعددة التخصصات.', price: null, subcategory: 'Crafts', job_type: 'full_time', company_name: 'فندق الأوراسي', salary_min: 50000, salary_max: 75000 },
  { title: 'مسؤول سلسلة تموين – استيراد', description: 'مسؤول سلسلة التموين استيراد/تصدير. إتقان Incoterms والجمارك.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'لوجيس الجزائر', salary_min: 80000, salary_max: 115000 },
  { title: 'طباخ – مطعم موظفي شركة', description: 'طباخ لمطعم شركة 200 وجبة. مطبخ تقليدي وديتيتيك.', price: null, subcategory: 'Hospitality', job_type: 'full_time', company_name: 'مطاعم المؤسسة', salary_min: 38000, salary_max: 55000 },
  { title: 'وكيل عقاري – بيع وإيجار', description: 'وكيل عقاري بعمولة. ملف عملاء مقدم. سيارة خدمة.', price: null, subcategory: 'Sales & Marketing', job_type: 'full_time', company_name: 'خبرة العقار الجزائري', salary_min: 35000, salary_max: 180000 },
  { title: 'تقني ألواح شمسية – طاقة متجددة', description: 'تقني تركيب ألواح شمسية لمشاريع وطنية. تكوين مضمون.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'الطاقة الشمسية الجزائرية', salary_min: 50000, salary_max: 75000 },
  { title: 'مستشار عملاء – بنك', description: 'مستشار عملاء ثنائي اللغة. خدمة عملاء في وكالة بنكية.', price: null, subcategory: 'Administration', job_type: 'full_time', company_name: 'بنك التنمية الجزائري', salary_min: 48000, salary_max: 68000 },
  { title: 'مدير إنتاج – صناعة غذائية', description: 'مدير إنتاج مصنع أغذية. خبرة HACCP وISO 22000.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'أغرو برو الجزائر', salary_min: 150000, salary_max: 220000 },
  { title: 'تقني صيانة صناعية', description: 'تقني صيانة وقائية وتصحيحية لوحدة إنتاج. خبرة في الميكانيك والكهرباء.', price: null, subcategory: 'Engineering', job_type: 'full_time', company_name: 'مكا الجزائر', salary_min: 60000, salary_max: 85000 },
];

// ---------------------------------------------------------------------------
// Build 100 listings per category by cycling through templates
// ---------------------------------------------------------------------------
function buildListings(userId, userIndex, category, templates, count = 100) {
  const listings = [];
  const wilaya = WILAYAS[userIndex % WILAYAS.length];

  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];

    // Add index suffix to make titles unique
    const suffix = Math.floor(i / templates.length) > 0 ? ` (${Math.floor(i / templates.length) + 1})` : '';

    const base = {
      user_id: userId,
      category,
      status: 'active',
      location_city: wilaya.city,
      location_wilaya: wilaya.name,
      title: tpl.title + suffix,
      description: tpl.description,
      subcategory: tpl.subcategory || null,
      price: tpl.price ?? null,
      views_count: rand(0, 500),
      favorites_count: rand(0, 50),
    };

    if (category === 'for_sale') {
      base.condition = tpl.condition || null;
    }
    if (category === 'for_rent') {
      base.rental_period = tpl.rental_period || 'monthly';
    }
    if (category === 'job') {
      base.job_type = tpl.job_type || 'full_time';
      base.company_name = tpl.company_name || null;
      base.salary_min = tpl.salary_min || null;
      base.salary_max = tpl.salary_max || null;
    }

    listings.push(base);
  }
  return listings;
}

// ---------------------------------------------------------------------------
// Combine templates: 33 EN + 33 FR + 34 AR = 100 per category
// ---------------------------------------------------------------------------
function makeTemplates100(en, fr, ar) {
  // Take first 33 EN, 33 FR, 34 AR
  return [...en.slice(0, 33), ...fr.slice(0, 33), ...ar.slice(0, 34)];
}

const TEMPLATES = {
  for_sale: makeTemplates100(FOR_SALE_EN, FOR_SALE_FR, FOR_SALE_AR),
  for_rent: makeTemplates100(FOR_RENT_EN, FOR_RENT_FR, FOR_RENT_AR),
  service: makeTemplates100(SERVICE_EN, SERVICE_FR, SERVICE_AR),
  job: makeTemplates100(JOB_EN, JOB_FR, JOB_AR),
};

// ---------------------------------------------------------------------------
// Insert listings in batches of 50
// ---------------------------------------------------------------------------
async function insertListings(listings) {
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < listings.length; i += BATCH) {
    const batch = listings.slice(i, i + BATCH);
    const { error } = await supabase.from('listings').insert(batch);
    if (error) {
      console.error(`    ❌ Batch insert error (offset ${i}):`, error.message);
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 MarketDZ Test Data Seeder\n');
  console.log(`   Target: ${SUPABASE_URL}`);
  console.log('   Users: user1@email.com … user10@email.com');
  console.log('   Password: password123');
  console.log('   Listings per user: 400 (100 × for_sale + 100 × for_rent + 100 × service + 100 × job)');
  console.log('   Languages: ~33% English, ~33% French, ~34% Arabic\n');

  const userIds = [];

  // ── Step 1: Create users ─────────────────────────────────────────────────
  console.log('👥 Creating / resolving users...\n');

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@email.com`;
    const firstName = `User${i}`;
    const lastName = 'Test';
    const wilaya = WILAYAS[(i - 1) % WILAYAS.length];

    // Try to create; if already exists, fetch existing
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });

    let uid;
    if (authError) {
      if (authError.message.toLowerCase().includes('already') || authError.status === 422) {
        // User exists — look up by email
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email === email);
        if (existing) {
          uid = existing.id;
          console.log(`   ⏭️  ${email} already exists — using existing user`);
        } else {
          console.error(`   ❌ ${email}: ${authError.message}`);
          continue;
        }
      } else {
        console.error(`   ❌ ${email}: ${authError.message}`);
        continue;
      }
    } else {
      uid = authData.user.id;
      console.log(`   ✅ Created ${email}`);
    }

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: uid,
      email,
      first_name: firstName,
      last_name: lastName,
      wilaya: wilaya.name,
      city: wilaya.city,
    }, { onConflict: 'id' });

    userIds.push({ id: uid, email, index: i - 1 });
  }

  console.log(`\n   ${userIds.length} users ready.\n`);

  if (userIds.length === 0) {
    console.error('❌ No users available. Aborting.');
    process.exit(1);
  }

  // ── Step 2: Create listings ───────────────────────────────────────────────
  console.log('📝 Creating listings...\n');

  let totalInserted = 0;

  for (const { id: userId, email, index } of userIds) {
    console.log(`   ${email}:`);

    for (const [category, templates] of Object.entries(TEMPLATES)) {
      const listings = buildListings(userId, index, category, templates, 100);
      const n = await insertListings(listings);
      totalInserted += n;
      console.log(`      ${category.padEnd(10)} → ${n}/100`);
    }
  }

  // ── Step 3: Summary ───────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Done! Inserted ${totalInserted.toLocaleString()} listings across ${userIds.length} users.`);
  console.log(`\n📊 Expected: ${userIds.length * 400} listings`);

  if (totalInserted < userIds.length * 400) {
    console.log(`⚠️  Some inserts failed — check errors above.`);
  }

  console.log('\n🔗 Local Studio: http://localhost:54323');
  console.log('🔗 App:          http://localhost:3000\n');
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
