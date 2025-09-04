// src/lib/search/utils.ts - Search utility functions
export interface SearchAnalytics {
  query: string;
  category?: string;
  resultsCount: number;
  timestamp: Date;
  ip: string;
  responseTime?: number;
}

// Escape special characters for PostgreSQL ILIKE queries
// Handles %, _, and \ characters that could cause security issues or unintended matches
export function escapeSearchQuery(query: string): string {
  // Escape backslashes first, then % and _ wildcards
  return query.replace(/[%_\\]/g, '\\$&');
}

// Enhanced escape function with validation
export function escapeSearchQuerySecure(query: string): string {
  if (typeof query !== 'string') {
    throw new Error('Search query must be a string');
  }
  
  // Limit query length for DoS protection
  if (query.length > 500) {
    throw new Error('Search query too long (max 500 characters)');
  }
  
  // Escape PostgreSQL special characters
  return query
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape % wildcards
    .replace(/_/g, '\\_');   // Escape _ wildcards
}

// Normalize search query for better matching
export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep alphanumeric, spaces, and Arabic characters
    .substring(0, 500); // Limit length
}

// Extract search terms for potential highlighting
export function extractSearchTerms(query: string): string[] {
  return normalizeSearchQuery(query)
    .split(' ')
    .filter(term => term.length > 2); // Only terms longer than 2 characters
}

// Calculate search relevance score based on title vs description matches
export function calculateRelevanceScore(listing: any, searchTerms: string[]): number {
  if (!searchTerms.length) return 0;

  const title = listing.title?.toLowerCase() || '';
  const description = listing.description?.toLowerCase() || '';
  
  let score = 0;
  
  searchTerms.forEach(term => {
    // Title matches are worth more
    if (title.includes(term)) {
      score += title.startsWith(term) ? 10 : 5; // Prefix matches worth more
    }
    
    // Description matches
    if (description.includes(term)) {
      score += 1;
    }
  });
  
  return score;
}

// Generate cache key for search results
export function generateCacheKey(params: {
  query?: string;
  category?: string;
  wilaya?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}): string {
  const keyParts = [
    'search',
    params.query || '',
    params.category || '',
    params.wilaya || '',
    params.city || '',
    params.minPrice?.toString() || '',
    params.maxPrice?.toString() || '',
    params.sortBy || '',
    params.page?.toString() || '1',
    params.limit?.toString() || '20'
  ];
  
  return keyParts.join(':');
}

// Simple search analytics (in production, use proper analytics service)
export function logSearchAnalytics(analytics: SearchAnalytics): void {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('Search Analytics:', analytics);
  }
  
  // In production, send to analytics service
  // Example: send to your analytics endpoint
}

// Suggest related searches based on categories
export function getRelatedSearchSuggestions(category?: string): string[] {
  const suggestions: Record<string, string[]> = {
    'for_sale': ['laptop', 'smartphone', 'car', 'apartment', 'furniture'],
    'job': ['developer', 'manager', 'teacher', 'driver', 'engineer'],
    'service': ['cleaning', 'repair', 'tutoring', 'design', 'photography'],
    'for_rent': ['apartment', 'house', 'car', 'office', 'equipment']
  };
  
  return category ? suggestions[category] || [] : [];
}

// Validate search parameters
export function validateSearchParams(params: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (params.query && typeof params.query !== 'string') {
    errors.push('Query must be a string');
  }
  
  if (params.query && params.query.length > 500) {
    errors.push('Query too long (max 500 characters)');
  }
  
  if (params.category && !['for_sale', 'job', 'service', 'for_rent'].includes(params.category)) {
    errors.push('Invalid category');
  }
  
  if (params.minPrice && (isNaN(params.minPrice) || params.minPrice < 0)) {
    errors.push('Invalid minPrice');
  }
  
  if (params.maxPrice && (isNaN(params.maxPrice) || params.maxPrice < 0)) {
    errors.push('Invalid maxPrice');
  }
  
  if (params.minPrice && params.maxPrice && params.minPrice > params.maxPrice) {
    errors.push('minPrice cannot be greater than maxPrice');
  }
  
  if (params.page && (isNaN(params.page) || params.page < 1)) {
    errors.push('Invalid page number');
  }
  
  if (params.limit && (isNaN(params.limit) || params.limit < 1 || params.limit > 100)) {
    errors.push('Invalid limit (must be between 1 and 100)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
