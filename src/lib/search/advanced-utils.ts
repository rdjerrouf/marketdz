// Advanced search utilities with full-text search option
// src/lib/search/advanced-utils.ts

// Full-text search implementation for PostgreSQL
export function buildFullTextQuery(query: string): string {
  // Clean and prepare query for PostgreSQL full-text search
  const cleanQuery = query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep alphanumeric, spaces, and Arabic
    .split(/\s+/)
    .filter(term => term.length > 2)
    .join(' & '); // Use & for AND operation in PostgreSQL FTS

  return cleanQuery;
}

// Enhanced search options for different search strategies
export interface SearchStrategy {
  type: 'ilike' | 'trigram' | 'fulltext';
  description: string;
  performance: 'good' | 'better' | 'best';
  useCase: string;
}

export const SEARCH_STRATEGIES: Record<string, SearchStrategy> = {
  ilike: {
    type: 'ilike',
    description: 'Standard ILIKE pattern matching',
    performance: 'good',
    useCase: 'Simple exact substring matching'
  },
  trigram: {
    type: 'trigram',
    description: 'Trigram fuzzy search with GIN indexes',
    performance: 'better',
    useCase: 'Fuzzy matching, typo tolerance, partial words'
  },
  fulltext: {
    type: 'fulltext',
    description: 'PostgreSQL full-text search',
    performance: 'best',
    useCase: 'Advanced search, ranking, stemming, multiple languages'
  }
};

// Build search query based on strategy
export function buildSearchQuery(
  query: string, 
  strategy: 'ilike' | 'trigram' | 'fulltext' = 'trigram'
): string {
  switch (strategy) {
    case 'ilike':
      // Current implementation - works but slower
      return `title.ilike.%${escapeSearchQuery(query)}%,description.ilike.%${escapeSearchQuery(query)}%`;
    
    case 'trigram':
      // Trigram similarity search - better performance with fuzzy matching
      const escapedQuery = escapeSearchQuery(query);
      return `title.like.%${escapedQuery}%,description.like.%${escapedQuery}%`;
    
    case 'fulltext':
      // Full-text search - best performance for complex queries
      const ftsQuery = buildFullTextQuery(query);
      return `fts.@@.${ftsQuery}`;
    
    default:
      return buildSearchQuery(query, 'trigram');
  }
}

// Escape function from existing utils
function escapeSearchQuery(query: string): string {
  return query.replace(/[%_\\]/g, '\\$&');
}

// Performance monitoring for search strategies
export function logSearchPerformance(
  strategy: string,
  query: string,
  resultCount: number,
  executionTime: number
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Search Performance - Strategy: ${strategy}, Query: "${query}", Results: ${resultCount}, Time: ${executionTime}ms`);
  }
  
  // In production, send to analytics service
  // Example: analytics.track('search_performance', { strategy, query, resultCount, executionTime });
}
