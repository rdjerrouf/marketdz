// src/lib/constants/categories.ts
// Listing categories specific to MarketDZ

export const LISTING_CATEGORIES = {
  FOR_SALE: {
    value: 'for_sale',
    label: 'For Sale',
    labelAr: 'للبيع',
    subcategories: [
      'Electronics',
      'Vehicles', 
      'Real Estate',
      'Furniture',
      'Clothing',
      'Sports & Leisure',
      'Books & Media',
      'Garden & DIY',
      'Baby & Kids',
      'Animals',
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
      'Translation',
      'Photography',
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
      'Event Halls',
      'Other'
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