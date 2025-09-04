-- Favorites Performance Indexes
-- Add these to your existing database optimization scripts

-- =============================================================================
-- FAVORITES TABLE INDEXES - Optimize favorites queries
-- =============================================================================

-- Primary index for user favorites lookup (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_id_created 
ON favorites(user_id, created_at DESC);

-- Index for listing popularity (count favorites per listing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_listing_id 
ON favorites(listing_id);

-- Composite index for checking if user favorited specific listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_listing 
ON favorites(user_id, listing_id);

-- Support for cleanup operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_created_at 
ON favorites(created_at);

-- Update table statistics
ANALYZE favorites;

-- =============================================================================
-- FAVORITES CONSTRAINTS (if not already present)
-- =============================================================================

-- Ensure unique user-listing combinations (prevent duplicate favorites)
-- This constraint should already exist, but adding for completeness
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'favorites_user_id_listing_id_unique'
    ) THEN
        ALTER TABLE favorites 
        ADD CONSTRAINT favorites_user_id_listing_id_unique 
        UNIQUE (user_id, listing_id);
    END IF;
END $$;

-- =============================================================================
-- OPTIONAL: MATERIALIZED VIEW for favorite counts per listing
-- =============================================================================

-- Create materialized view for listing favorite counts (for popularity features)
CREATE MATERIALIZED VIEW IF NOT EXISTS listing_favorite_counts AS
SELECT 
    listing_id,
    COUNT(*) as favorite_count,
    MAX(created_at) as last_favorited_at
FROM favorites
GROUP BY listing_id;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_favorite_counts_listing_id 
ON listing_favorite_counts(listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_favorite_counts_count 
ON listing_favorite_counts(favorite_count DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_listing_favorite_counts()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY listing_favorite_counts;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DEPLOYMENT NOTES:
-- 
-- 1. Run these during low-traffic periods
-- 2. The materialized view is optional - use only if you need favorite counts
-- 3. Refresh the materialized view periodically (hourly/daily depending on needs)
-- 4. Monitor index usage with pg_stat_user_indexes
-- =============================================================================
