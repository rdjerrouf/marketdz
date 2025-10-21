/**
 * Security safeguards for search API using service role
 *
 * When using service role (which bypasses RLS), we must enforce
 * all security constraints server-side to prevent data leaks.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Allowed columns for public listing search
 * This allowlist prevents accidental exposure of sensitive data
 */
const ALLOWED_LISTING_COLUMNS = [
  'id',
  'title',
  'description',
  'price',
  'category',
  'subcategory',
  'created_at',
  'status',
  'user_id',
  'location_wilaya',
  'location_city',
  'photos',
  'condition',
  'available_from',
  'available_to',
  'rental_period',
  'salary_min',
  'salary_max',
  'job_type',
  'company_name',
  'favorites_count',
  'views_count'
] as const;

/**
 * Get select string for listings with only allowed columns
 */
export function getListingSelectColumns(): string {
  return ALLOWED_LISTING_COLUMNS.join(', ');
}

/**
 * Allowed columns for profile information in search results
 */
const ALLOWED_PROFILE_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'avatar_url',
  'rating'
] as const;

/**
 * Get select string for profiles with only allowed columns
 */
export function getProfileSelectColumns(): string {
  return ALLOWED_PROFILE_COLUMNS.join(', ');
}

/**
 * Apply security constraints to a search query
 *
 * CRITICAL: This function MUST be called on all queries using service role
 * to ensure we only return public data.
 *
 * @param query - Supabase query builder
 * @returns Query with security constraints applied
 */
export function applySearchSecurityConstraints<T>(
  query: any
): any {
  // CRITICAL: Always filter to active listings only
  // Service role bypasses RLS, so we must enforce this server-side
  return query.eq('status', 'active');
}

/**
 * Validate search parameters to prevent injection or abuse
 */
export function validateSearchParams(params: {
  category?: string;
  subcategory?: string;
  wilaya?: string;
  city?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}) {
  const errors: string[] = [];

  // Validate category
  const validCategories = ['for_sale', 'job', 'service', 'for_rent'];
  if (params.category && !validCategories.includes(params.category)) {
    errors.push(`Invalid category: ${params.category}`);
  }

  // Validate sortBy
  const validSorts = ['created_at', 'newest', 'oldest', 'price_low', 'price_high', 'popular'];
  if (params.sortBy && !validSorts.includes(params.sortBy)) {
    errors.push(`Invalid sortBy: ${params.sortBy}`);
  }

  // Validate limit
  if (params.limit !== undefined) {
    if (params.limit < 1 || params.limit > 100) {
      errors.push(`Invalid limit: must be between 1 and 100`);
    }
  }

  // Validate page
  if (params.page !== undefined) {
    if (params.page < 1 || params.page > 1000) {
      errors.push(`Invalid page: must be between 1 and 1000`);
    }
  }

  // Validate string lengths to prevent DoS
  if (params.subcategory && params.subcategory.length > 100) {
    errors.push(`Subcategory too long`);
  }

  if (params.wilaya && params.wilaya.length > 100) {
    errors.push(`Wilaya too long`);
  }

  if (params.city && params.city.length > 100) {
    errors.push(`City too long`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Security audit log for service role queries
 * Log all searches using service role for monitoring
 */
export function logServiceRoleQuery(params: {
  endpoint: string;
  filters: Record<string, any>;
  resultCount: number;
  executionTime: number;
}) {
  // In production, send to monitoring service
  console.log('🔐 Service role query:', {
    timestamp: new Date().toISOString(),
    ...params
  });
}
