// src/lib/constants/categories.ts
// Listing categories specific to MarketDZ

export const LISTING_CATEGORIES = {
  FOR_SALE: {
    value: 'for_sale',
    label: 'For Sale',
    labelAr: 'للبيع',
    subcategories: [
      // Electronics & Tech
      'Electronics',
      'Phones & Accessories',
      'Computers & Tablets',
      'Cameras & Photography',
      'Video Games & Consoles',

      // Home & Living
      'Home Appliances',
      'Furniture & Decor',
      'Home & Garden',
      'Garden & DIY',

      // Fashion & Personal
      'Fashion & Accessories',
      'Watches & Jewelry',
      'Health & Beauty',

      // Entertainment & Hobbies
      'Sports & Outdoors',
      'Musical Instruments',
      'Books & Media',
      'Toys & Games',
      'Art & Collectibles',

      // Family & Kids
      'Baby & Kids',

      // Tools & Professional
      'Tools & Equipment',
      'Industrial Supplies & Equipment',

      // Big Ticket Items
      'Vehicles',
      'Motorcycles',
      'Boats & Watercraft',
      'Trailers & Towing',
      'RV & Campers',
      'Heavy Equipment',
      'Construction Vehiclest',
      'Real Estate',

      // Business & Industry
      'Construction Materials',
      'Agriculture',
      'Mining',
      'Construction',
      'Manufacturing',

      // Miscellaneous
      'Other'
    ]
  },
  JOB: {
    value: 'job',
    label: 'Jobs',
    labelAr: 'وظائف',
    subcategories: [
      'Information Technology',
      'Engineering',
      'Healthcare',
      'Education',
      'Sales & Marketing',
      'Administration',
      'Construction',
      'Transportation',
      'Hospitality',
      'Crafts',
      'Agriculture',
      'Other'
    ]
  },
  SERVICE: {
    value: 'service',
    label: 'Services',
    labelAr: 'خدمات',
    subcategories: [
      'Cleaning',
      'Repair & Maintenance',
      'Tutoring',
      'Transportation',
      'Gardening',
      'Plumbing',
      'Electrical',
      'Painting',
      'Beauty & Hair',
      'Physical Therapy',
      'Senior Care',
      'Translation',
      'Photography',
      'Event Planning',
      'Catering',
      'IT & Tech Support',
      'Other'
    ]
  },
  FOR_RENT: {
    value: 'for_rent',
    label: 'For Rent',
    labelAr: 'للإيجار',
    subcategories: [
      'Apartments',
      'Houses',
      'Offices',
      'Commercial Space',
      'Vehicles',
      'Equipment',
      'Event Halls (Salle des Fêtes)',
      'Other'
    ]
  },
  URGENT: {
    value: 'urgent',
    label: 'Urgent Help',
    labelAr: 'مساعدة عاجلة',
    subcategories: [
      'Blood Donation',
      'Medicine Needed',
      'Food Assistance',
      'Medical Equipment',
      'Emergency Housing'
    ]
  }
} as const

export type ListingCategory = keyof typeof LISTING_CATEGORIES
export type ListingCategoryValue = typeof LISTING_CATEGORIES[ListingCategory]['value']

// Helper functions for categories
export function getCategoryByValue(value: string): typeof LISTING_CATEGORIES[ListingCategory] | undefined {
  return Object.values(LISTING_CATEGORIES).find(category => category.value === value)
}

export function getAllCategories() {
  return Object.values(LISTING_CATEGORIES)
}

export function getSubcategories(categoryValue: ListingCategoryValue): readonly string[] {
  const category = getCategoryByValue(categoryValue)
  return category ? category.subcategories : []
}