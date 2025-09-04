-- Advanced Database Optimizations for MarketDZ Search
-- Run these in Supabase SQL Editor for maximum performance

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS btree_gin; -- For composite GIN indexes

-- 2. Composite B-tree index for common filter patterns
-- This covers: status + category + location + price + ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_composite_search 
ON listings(status, category, location_wilaya, location_city, price, created_at DESC) 
WHERE status = 'active';

-- 3. Trigram indexes for fast fuzzy text search (replaces expensive ILIKE scans)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_title_trgm 
ON listings USING GIN (title gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_description_trgm 
ON listings USING GIN (description gin_trgm_ops);

-- 4. Combined text search index for title + description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_text_search 
ON listings USING GIN ((title || ' ' || description) gin_trgm_ops) 
WHERE status = 'active';

-- 5. Specialized indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_category_location 
ON listings(status, category, location_wilaya) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_price_range 
ON listings(status, price, created_at DESC) 
WHERE status = 'active' AND price IS NOT NULL;

-- 6. Full-text search preparation (optional upgrade path)
-- Uncomment when ready to upgrade to PostgreSQL full-text search
/*
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_fulltext 
ON listings USING GIN (to_tsvector('english', title || ' ' || description)) 
WHERE status = 'active';
*/

-- 7. Analyze tables to update statistics after index creation
ANALYZE listings;
ANALYZE profiles;

-- 8. Verify index usage (run after deployment)
/*
-- Check if indexes are being used:
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND tablename = 'listings'
ORDER BY idx_tup_read DESC;

-- Check query performance:
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%listings%' 
ORDER BY mean_exec_time DESC 
LIMIT 10;
*/
