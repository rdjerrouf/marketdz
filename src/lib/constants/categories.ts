// src/lib/constants/categories.ts
// Listing categories specific to DlalaDZ

// RULE: name = English key stored in DB. nameAr / nameFr = display only, never stored.
export interface Subcategory {
  name: string    // stored in DB
  nameAr: string  // display only
  nameFr: string  // display only
}

export const LISTING_CATEGORIES = {
  FOR_SALE: {
    value: 'for_sale',
    label: 'For Sale',
    labelAr: 'للبيع',
    subcategories: [
      // Electronics & Tech
      { name: 'Electronics',               nameAr: 'إلكترونيات',              nameFr: 'Électronique' },
      { name: 'Phones & Accessories',      nameAr: 'هواتف وملحقات',           nameFr: 'Téléphones et Accessoires' },
      { name: 'Computers & Tablets',       nameAr: 'أجهزة كمبيوتر وأقراص',   nameFr: 'Ordinateurs et Tablettes' },
      { name: 'Cameras & Photography',     nameAr: 'كاميرات وتصوير',          nameFr: 'Appareils Photo et Photographie' },
      { name: 'Video Games & Consoles',    nameAr: 'ألعاب فيديو وأجهزة',     nameFr: 'Jeux Vidéo et Consoles' },

      // Home & Living
      { name: 'Home Appliances',           nameAr: 'أجهزة منزلية',            nameFr: 'Électroménager' },
      { name: 'Furniture & Decor',         nameAr: 'أثاث وديكور',             nameFr: 'Meubles et Décoration' },
      { name: 'Home & Garden',             nameAr: 'منزل وحديقة',             nameFr: 'Maison et Jardin' },
      { name: 'Garden & DIY',              nameAr: 'حديقة وأعمال يدوية',      nameFr: 'Jardin et Bricolage' },

      // Fashion & Personal
      { name: 'Fashion & Accessories',     nameAr: 'موضة وإكسسوارات',         nameFr: 'Mode et Accessoires' },
      { name: 'Watches & Jewelry',         nameAr: 'ساعات ومجوهرات',          nameFr: 'Montres et Bijoux' },
      { name: 'Health & Beauty',           nameAr: 'صحة وجمال',               nameFr: 'Santé et Beauté' },

      // Entertainment & Hobbies
      { name: 'Sports & Outdoors',         nameAr: 'رياضة وأنشطة خارجية',    nameFr: 'Sports et Loisirs' },
      { name: 'Musical Instruments',       nameAr: 'آلات موسيقية',            nameFr: 'Instruments de Musique' },
      { name: 'Books & Media',             nameAr: 'كتب ووسائل إعلام',        nameFr: 'Livres et Médias' },
      { name: 'Toys & Games',              nameAr: 'ألعاب وترفيه',            nameFr: 'Jouets et Jeux' },
      { name: 'Art & Collectibles',        nameAr: 'فن وتحف',                 nameFr: 'Art et Collections' },

      // Family & Kids
      { name: 'Baby & Kids',              nameAr: 'أطفال ورضع',              nameFr: 'Bébé et Enfants' },

      // Tools & Professional
      { name: 'Tools & Equipment',         nameAr: 'أدوات ومعدات',            nameFr: 'Outils et Équipements' },
      { name: 'Industrial Supplies & Equipment', nameAr: 'مستلزمات صناعية',  nameFr: 'Fournitures Industrielles' },

      // Big Ticket Items
      { name: 'Vehicles',                  nameAr: 'مركبات',                  nameFr: 'Véhicules' },
      { name: 'Motorcycles',               nameAr: 'دراجات نارية',            nameFr: 'Motos' },
      { name: 'Boats & Watercraft',        nameAr: 'قوارب وسفن',              nameFr: 'Bateaux' },
      { name: 'Trailers & Towing',         nameAr: 'مقطورات',                 nameFr: 'Remorques' },
      { name: 'RV & Campers',              nameAr: 'عربات تخييم',             nameFr: 'Camping-cars' },
      { name: 'Heavy Equipment',           nameAr: 'معدات ثقيلة',             nameFr: 'Engins Lourds' },
      { name: 'Construction Vehiclest',    nameAr: 'مركبات بناء',             nameFr: 'Engins de Chantier' },
      { name: 'Real Estate',               nameAr: 'عقارات',                  nameFr: 'Immobilier' },

      // Business & Industry
      { name: 'Construction Materials',    nameAr: 'مواد بناء',               nameFr: 'Matériaux de Construction' },
      { name: 'Agriculture',               nameAr: 'زراعة',                   nameFr: 'Agriculture' },
      { name: 'Mining',                    nameAr: 'تعدين',                   nameFr: 'Exploitation Minière' },
      { name: 'Construction',              nameAr: 'بناء',                    nameFr: 'Construction' },
      { name: 'Manufacturing',             nameAr: 'تصنيع',                   nameFr: 'Industrie' },

      // Miscellaneous
      { name: 'Other',                     nameAr: 'أخرى',                    nameFr: 'Autre' },
    ] as Subcategory[]
  },
  JOB: {
    value: 'job',
    label: 'Jobs',
    labelAr: 'وظائف',
    subcategories: [
      { name: 'Information Technology', nameAr: 'تكنولوجيا المعلومات', nameFr: 'Informatique' },
      { name: 'Engineering',            nameAr: 'هندسة',               nameFr: 'Ingénierie' },
      { name: 'Healthcare',             nameAr: 'رعاية صحية',          nameFr: 'Santé' },
      { name: 'Education',              nameAr: 'تعليم',               nameFr: 'Éducation' },
      { name: 'Sales & Marketing',      nameAr: 'مبيعات وتسويق',       nameFr: 'Ventes et Marketing' },
      { name: 'Administration',         nameAr: 'إدارة',               nameFr: 'Administration' },
      { name: 'Construction',           nameAr: 'بناء',                nameFr: 'Construction' },
      { name: 'Transportation',         nameAr: 'نقل',                 nameFr: 'Transport' },
      { name: 'Hospitality',            nameAr: 'ضيافة',               nameFr: 'Hôtellerie' },
      { name: 'Crafts',                 nameAr: 'حرف يدوية',           nameFr: 'Artisanat' },
      { name: 'Agriculture',            nameAr: 'زراعة',               nameFr: 'Agriculture' },
      { name: 'Other',                  nameAr: 'أخرى',                nameFr: 'Autre' },
    ] as Subcategory[]
  },
  SERVICE: {
    value: 'service',
    label: 'Services',
    labelAr: 'خدمات',
    subcategories: [
      { name: 'Cleaning',            nameAr: 'تنظيف',              nameFr: 'Nettoyage' },
      { name: 'Repair & Maintenance',nameAr: 'إصلاح وصيانة',       nameFr: 'Réparation et Entretien' },
      { name: 'Tutoring',            nameAr: 'تدريس خصوصي',        nameFr: 'Cours Particuliers' },
      { name: 'Transportation',      nameAr: 'نقل',                nameFr: 'Transport' },
      { name: 'Gardening',           nameAr: 'بستنة',              nameFr: 'Jardinage' },
      { name: 'Plumbing',            nameAr: 'سباكة',              nameFr: 'Plomberie' },
      { name: 'Electrical',          nameAr: 'كهرباء',             nameFr: 'Électricité' },
      { name: 'Painting',            nameAr: 'دهان',               nameFr: 'Peinture' },
      { name: 'Beauty & Hair',       nameAr: 'تجميل وشعر',         nameFr: 'Beauté et Coiffure' },
      { name: 'Physical Therapy',    nameAr: 'علاج طبيعي',         nameFr: 'Kinésithérapie' },
      { name: 'Senior Care',         nameAr: 'رعاية المسنين',      nameFr: 'Aide aux Personnes Âgées' },
      { name: 'Translation',         nameAr: 'ترجمة',              nameFr: 'Traduction' },
      { name: 'Photography',         nameAr: 'تصوير',              nameFr: 'Photographie' },
      { name: 'Event Planning',      nameAr: 'تنظيم فعاليات',      nameFr: "Organisation d'Événements" },
      { name: 'Catering',            nameAr: 'تقديم طعام',         nameFr: 'Traiteur' },
      { name: 'IT & Tech Support',   nameAr: 'دعم تقني',           nameFr: 'Support Informatique' },
      { name: 'Other',               nameAr: 'أخرى',               nameFr: 'Autre' },
    ] as Subcategory[]
  },
  FOR_RENT: {
    value: 'for_rent',
    label: 'For Rent',
    labelAr: 'للإيجار',
    subcategories: [
      { name: 'Apartments',                  nameAr: 'شقق',             nameFr: 'Appartements' },
      { name: 'Houses',                      nameAr: 'منازل',           nameFr: 'Maisons' },
      { name: 'Offices',                     nameAr: 'مكاتب',           nameFr: 'Bureaux' },
      { name: 'Commercial Space',            nameAr: 'مساحات تجارية',   nameFr: 'Espaces Commerciaux' },
      { name: 'Vehicles',                    nameAr: 'مركبات',          nameFr: 'Véhicules' },
      { name: 'Equipment',                   nameAr: 'معدات',           nameFr: 'Équipements' },
      { name: 'Event Halls (Salle des Fêtes)', nameAr: 'قاعات مناسبات', nameFr: 'Salles des Fêtes' },
      { name: 'Other',                       nameAr: 'أخرى',            nameFr: 'Autre' },
    ] as Subcategory[]
  },
  URGENT: {
    value: 'urgent',
    label: 'Urgent Help',
    labelAr: 'مساعدة عاجلة',
    subcategories: [
      { name: 'Blood Donation',    nameAr: 'تبرع بالدم',       nameFr: 'Don de Sang' },
      { name: 'Medicine Needed',   nameAr: 'دواء مطلوب',       nameFr: 'Médicament Nécessaire' },
      { name: 'Food Assistance',   nameAr: 'مساعدة غذائية',    nameFr: 'Aide Alimentaire' },
      { name: 'Medical Equipment', nameAr: 'معدات طبية',       nameFr: 'Équipement Médical' },
      { name: 'Emergency Housing', nameAr: 'إيواء طارئ',       nameFr: "Hébergement d'Urgence" },
    ] as Subcategory[]
  }
} as const

export type ListingCategory = keyof typeof LISTING_CATEGORIES
export type ListingCategoryValue = typeof LISTING_CATEGORIES[ListingCategory]['value']

export function getCategoryByValue(value: string): typeof LISTING_CATEGORIES[ListingCategory] | undefined {
  return Object.values(LISTING_CATEGORIES).find(category => category.value === value)
}

export function getAllCategories() {
  return Object.values(LISTING_CATEGORIES)
}

export function getSubcategories(categoryValue: ListingCategoryValue): readonly Subcategory[] {
  const category = getCategoryByValue(categoryValue)
  return category ? category.subcategories : []
}
