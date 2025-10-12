// src/lib/search/enhanced-utils.ts - Production-grade search enhancements
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface SearchAnalytics {
  query: string;
  category?: string;
  resultsCount: number;
  timestamp: Date;
  ip: string;
  responseTime?: number;
  strategy?: string;
  userAgent?: string;
}

export interface SearchParams {
  query?: string;
  category?: string;
  wilaya?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  includeCount?: boolean;
  strategy?: 'ilike' | 'trigram' | 'fulltext';
}

interface SearchListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  wilaya: string;
  city: string;
  photos: string[];
  created_at: string;
  user_id: string;
  status: string;
  view_count: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    city: string | null;
    wilaya: string | null;
    rating: number | null;
    review_count: number | null;
  } | null;
}

export interface SearchResult {
  listings: SearchListing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    hasCount: boolean;
  };
  filters: Record<string, unknown>;
  metadata?: {
    strategy: string;
    executionTime: number;
    cacheHit?: boolean;
  };
}

// Enhanced search with multiple strategies
export class AdvancedSearchEngine {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // Auto-select best search strategy based on query characteristics
  public selectOptimalStrategy(query: string): 'ilike' | 'trigram' | 'fulltext' {
    if (!query || query.length < 3) return 'ilike';
    
    // Complex queries benefit from full-text search
    if (query.includes(' ') && query.split(' ').length > 2) {
      return 'fulltext';
    }
    
    // Single words or simple phrases use trigram
    return 'trigram';
  }

  // Enhanced search with automatic strategy selection
  async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();
    const strategy = params.strategy || this.selectOptimalStrategy(params.query || '');
    
    try {
      let queryBuilder = this.supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          category,
          location_wilaya,
          location_city,
          photos,
          created_at,
          user_id,
          status,
          profiles!inner (
            id,
            first_name,
            last_name,
            avatar_url,
            city,
            wilaya,
            rating,
            review_count
          )
        `, { count: params.includeCount ? 'estimated' : undefined })
        .eq('status', 'active');

      // Apply filters
      queryBuilder = this.applyFilters(queryBuilder, params) as typeof queryBuilder;

      // Apply search strategy
      if (params.query) {
        queryBuilder = this.applySearchStrategy(queryBuilder, params.query, strategy) as typeof queryBuilder;
      }

      // Apply sorting with enhanced options
      queryBuilder = this.applySorting(queryBuilder, params) as typeof queryBuilder;
      
      // Apply pagination
      const offset = ((params.page || 1) - 1) * (params.limit || 20);
      queryBuilder = queryBuilder.range(offset, offset + (params.limit || 20) - 1);

      const { data: listings, error, count } = await queryBuilder;
      
      if (error) throw error;

      const executionTime = Date.now() - startTime;
      
      return this.formatSearchResult(listings || [], count, params, {
        strategy,
        executionTime
      });

    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  }

  private applyFilters(queryBuilder: unknown, params: SearchParams): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builder = queryBuilder as any;

    if (params.category) {
      builder = builder.eq('category', params.category);
    }
    if (params.wilaya) {
      builder = builder.eq('location_wilaya', params.wilaya);
    }
    if (params.city) {
      builder = builder.eq('location_city', params.city);
    }
    if (params.minPrice !== undefined) {
      builder = builder.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      builder = builder.lte('price', params.maxPrice);
    }

    return builder;
  }

  private applySearchStrategy(queryBuilder: unknown, query: string, strategy: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder = queryBuilder as any;
    const escapedQuery = this.escapeSearchQuery(query);

    switch (strategy) {
      case 'ilike':
        return builder.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);

      case 'trigram':
        // Use trigram similarity with threshold
        return builder.or(`title % ${escapedQuery}, description % ${escapedQuery}`);

      case 'fulltext':
        const ftsQuery = this.buildFullTextQuery(query);
        return builder.textSearch('search_vector', ftsQuery);

      default:
        return builder.or(`title.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`);
    }
  }

  private applySorting(queryBuilder: unknown, params: SearchParams): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder = queryBuilder as any;
    const sortBy = params.sortBy || 'created_at';

    switch (sortBy) {
      case 'price_asc':
        return builder.order('price', { ascending: true });
      case 'price_desc':
        return builder.order('price', { ascending: false });
      case 'popularity':
        // Fall back to created_at since views_count doesn't exist yet
        return builder.order('created_at', { ascending: false });
      case 'rating':
        return builder.order('profiles.rating', { ascending: false });
      case 'relevance':
        // For full-text search, order by rank
        if (params.query) {
          return builder.order('ts_rank(search_vector, plainto_tsquery($1))', { ascending: false });
        }
        return builder.order('created_at', { ascending: false });
      default:
        return builder.order('created_at', { ascending: false });
    }
  }

  private formatSearchResult(listings: unknown[], count: number | null, params: SearchParams, metadata: { strategy: string; executionTime: number }): SearchResult {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalItems = count || 0;
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      listings: this.transformListings(listings),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: totalPages ? page < totalPages : listings.length === limit,
        hasPreviousPage: page > 1,
        hasCount: params.includeCount || false
      },
      filters: {
        query: params.query,
        category: params.category,
        wilaya: params.wilaya,
        city: params.city,
        minPrice: params.minPrice?.toString(),
        maxPrice: params.maxPrice?.toString(),
        sortBy: params.sortBy
      },
      metadata
    };
  }

  private transformListings(listings: unknown[]): SearchListing[] {
    return listings.map((listing: unknown) => {
      const l = listing as Record<string, unknown>;
      const profiles = l.profiles as Record<string, unknown> | undefined;

      return {
        id: l.id as string,
        title: l.title as string,
        description: l.description as string | null,
        price: l.price as number | null,
        category: l.category as string,
        wilaya: l.location_wilaya as string,
        city: l.location_city as string,
        photos: Array.isArray(l.photos) ?
          (l.photos as string[]).slice(0, l.category === 'for_rent' ? 5 : 3) : [],
        created_at: l.created_at as string,
        user_id: l.user_id as string,
        status: l.status as string,
        view_count: 0, // Placeholder until views_count column is added
        user: profiles ? {
          id: profiles.id as string,
          first_name: profiles.first_name as string,
          last_name: profiles.last_name as string,
          avatar_url: profiles.avatar_url as string | null,
          city: profiles.city as string | null,
          wilaya: profiles.wilaya as string | null,
          rating: profiles.rating as number | null,
          review_count: profiles.review_count as number | null
        } : null
      };
    });
  }

  private escapeSearchQuery(query: string): string {
    return query.replace(/[%_\\]/g, '\\$&');
  }

  private buildFullTextQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .join(' & ');
  }
}

// Enhanced search suggestions with machine learning potential
export class SearchSuggestionEngine {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // Get autocomplete suggestions based on existing listings
  async getAutocompleteSuggestions(query: string, limit = 10): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select('title')
        .ilike('title', `%${query}%`)
        .eq('status', 'active')
        .limit(limit);

      if (error) throw error;

      // Extract unique words from titles
      const suggestions = new Set<string>();
      data?.forEach((listing: unknown) => {
        const l = listing as { title: string };
        const words = l.title.toLowerCase().split(/\s+/);
        words.forEach((word: string) => {
          if (word.includes(query.toLowerCase()) && word.length > 2) {
            suggestions.add(word);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  // Get trending searches (placeholder for analytics integration)
  getTrendingSearches(category?: string): string[] {
    const trending: Record<string, string[]> = {
      'for_sale': ['iPhone', 'laptop', 'voiture', 'appartement', 'meuble'],
      'job': ['développeur', 'manager', 'professeur', 'chauffeur', 'ingénieur'],
      'service': ['nettoyage', 'réparation', 'cours', 'design', 'photographie'],
      'for_rent': ['appartement', 'maison', 'voiture', 'bureau', 'équipement']
    };

    return category ? trending[category] || [] : [];
  }

  // Search history and personalization (placeholder)
  async getPersonalizedSuggestions(userId: string): Promise<string[]> {
    // In production, analyze user's search history and favorites
    // Return personalized suggestions based on behavior
    return [];
  }
}

// Search performance monitoring
export class SearchAnalyticsClass {
  static log(analytics: SearchAnalytics): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Search Analytics:', analytics);
    }
    
    // In production, send to analytics service
    // Example: segment.track('search_performed', analytics);
  }

  static logPerformance(
    strategy: string,
    query: string,
    resultCount: number,
    executionTime: number
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Search Performance - Strategy: ${strategy}, Query: "${query}", Results: ${resultCount}, Time: ${executionTime}ms`);
    }
  }
}

// Cache management for search results
export class SearchCache {
  private static TTL = {
    SEARCH_RESULTS: 300, // 5 minutes
    SUGGESTIONS: 1800,   // 30 minutes
    TRENDING: 3600       // 1 hour
  };

  static generateKey(params: SearchParams): string {
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

  static shouldCache(params: SearchParams): boolean {
    // Cache non-personalized searches
    return !params.query || params.query.length > 2;
  }

  static getCacheHeaders(params: SearchParams): Record<string, string> {
    if (this.shouldCache(params)) {
      return {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Vary': 'Accept-Encoding'
      };
    }
    
    return {
      'Cache-Control': 'private, no-cache'
    };
  }
}
