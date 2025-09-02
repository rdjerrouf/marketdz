// src/lib/constants/categories.ts
// Listing categories specific to MarketDZ

export const LISTING_CATEGORIES = {
  FOR_SALE: {
    value: 'for_sale',
    label: 'À Vendre',
    labelAr: 'للبيع',
    subcategories: [
      'Électronique',
      'Véhicules', 
      'Immobilier',
      'Meubles',
      'Vêtements',
      'Sports & Loisirs',
      'Livres & Médias',
      'Jardin & Bricolage',
      'Enfants & Bébés',
      'Animaux',
      'Autres'
    ]
  },
  JOB: {
    value: 'job',
    label: 'Emplois',
    labelAr: 'وظائف',
    subcategories: [
      'Informatique',
      'Ingénierie',
      'Santé',
      'Éducation',
      'Commerce',
      'Administration',
      'Construction',
      'Transport',
      'Hôtellerie',
      'Artisanat',
      'Agriculture',
      'Autres'
    ]
  },
  SERVICE: {
    value: 'service',
    label: 'Services',
    labelAr: 'خدمات',
    subcategories: [
      'Nettoyage',
      'Réparation',
      'Cours particuliers',
      'Transport',
      'Jardinage',
      'Plomberie',
      'Électricité',
      'Peinture',
      'Coiffure',
      'Traduction',
      'Photographie',
      'Autres'
    ]
  },
  FOR_RENT: {
    value: 'for_rent',
    label: 'À Louer',
    labelAr: 'للإيجار',
    subcategories: [
      'Appartements',
      'Maisons',
      'Bureaux',
      'Magasins',
      'Véhicules',
      'Équipements',
      'Salles',
      'Autres'
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