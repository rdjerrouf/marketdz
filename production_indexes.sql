-- PRODUCTION-GRADE DATABASE INDEXES - MarketDZ Search
-- Deploy these indexes for maximum search performance at scale
-- Run in Supabase SQL Editor with CONCURRENTLY for zero-downtime deployment

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- =============================================================================
-- 1. CRITICAL INDEXES - Every WHERE/ORDER BY/JOIN column covered
-- =============================================================================

-- Core status filtering (most important - status = 'active' is in every query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_status 
ON listings(status) 
WHERE status = 'active';

-- Category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_active 
ON listings(category, status) 
WHERE status = 'active';

-- Location filtering (wilaya is province level, city is more specific)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_location_active 
ON listings(location_wilaya, location_city, status) 
WHERE status = 'active';

-- Price range filtering with ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price_active 
ON listings(price, status) 
WHERE status = 'active' AND price IS NOT NULL;

-- Created date ordering (most common sort)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_created_active 
ON listings(created_at DESC, status) 
WHERE status = 'active';

-- =============================================================================
-- 2. COMPOSITE INDEXES - Cover multiple filter combinations
-- =============================================================================

-- The "golden index" - covers most common query pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_search_composite 
ON listings(status, category, location_wilaya, location_city, price, created_at DESC) 
WHERE status = 'active';

-- Category + location (very common filter combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_location 
ON listings(status, category, location_wilaya, created_at DESC) 
WHERE status = 'active';

-- Price range queries with location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price_location 
ON listings(status, location_wilaya, price, created_at DESC) 
WHERE status = 'active' AND price IS NOT NULL;

-- =============================================================================
-- 3. TEXT SEARCH INDEXES - Replace expensive ILIKE scans
-- =============================================================================

-- Trigram indexes for fuzzy text search (handles typos, partial matches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_title_trgm 
ON listings USING GIN (title gin_trgm_ops) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_description_trgm 
ON listings USING GIN (description gin_trgm_ops) 
WHERE status = 'active';

-- Combined title + description for multi-field search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_text_combined_trgm 
ON listings USING GIN ((title || ' ' || description) gin_trgm_ops) 
WHERE status = 'active';

-- =============================================================================
-- 4. FULL-TEXT SEARCH UPGRADE (Optional - for future performance boost)
-- =============================================================================

-- Uncomment these when ready to upgrade to PostgreSQL FTS
-- This is 2-5x faster than ILIKE for complex searches

/*
-- Full-text search index (English + Arabic support)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_fts_english 
ON listings USING GIN (to_tsvector('english', title || ' ' || description)) 
WHERE status = 'active';

-- For Arabic content (if you have Arabic listings)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_fts_arabic 
ON listings USING GIN (to_tsvector('arabic', title || ' ' || description)) 
WHERE status = 'active';
*/

-- =============================================================================
-- 5. JOIN OPTIMIZATION - Profile data joins
-- =============================================================================

-- Optimize the profiles!inner join
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_id_active 
ON profiles(id) 
WHERE id IS NOT NULL;

-- =============================================================================
-- 6. MAINTENANCE INDEXES - Support data operations
-- =============================================================================

-- Support bulk updates and maintenance operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_user_status 
ON listings(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_updated_at 
ON listings(updated_at DESC);

-- =============================================================================
-- 7. ANALYZE TABLES - Update statistics after index creation
-- =============================================================================

ANALYZE listings;
ANALYZE profiles;

-- =============================================================================
-- 8. INDEX USAGE VERIFICATION (Run after deployment)
-- =============================================================================

/*
-- Check if your new indexes are being used:
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    idx_tup_read, 
    idx_tup_fetch,
    idx_tup_read::float / NULLIF(idx_tup_fetch, 0) as selectivity
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('listings', 'profiles')
ORDER BY idx_tup_read DESC;

-- Check query performance:
SELECT 
    query, 
    mean_exec_time, 
    calls, 
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query ILIKE '%listings%' 
ORDER BY mean_exec_time DESC 
LIMIT 10;
*/

-- =============================================================================
-- DEPLOYMENT NOTES:
-- 
-- 1. Deploy indexes during low-traffic periods
-- 2. Use CONCURRENTLY to avoid blocking operations
-- 3. Monitor index usage after deployment
-- 4. Drop unused indexes to save storage costs
-- 5. Re-run ANALYZE after significant data changes
-- =============================================================================
