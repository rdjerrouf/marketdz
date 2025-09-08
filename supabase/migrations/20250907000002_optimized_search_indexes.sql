-- Optimized Search Indexes for MarketDZ
-- These indexes are specifically designed for the most common search patterns

-- Drop the previous composite search index if it exists
DROP INDEX IF EXISTS idx_listings_search;

-- Create a highly optimized composite index for the exact search pattern
-- This covers: category + location_wilaya + status + price range queries
CREATE INDEX idx_listings_category_wilaya_status_price 
ON public.listings (category, location_wilaya, status, price)
WHERE status = 'active';

-- Create additional partial indexes for common search patterns
CREATE INDEX idx_listings_category_status_active 
ON public.listings (category, status, created_at DESC)
WHERE status = 'active';

CREATE INDEX idx_listings_wilaya_status_active 
ON public.listings (location_wilaya, status, created_at DESC)
WHERE status = 'active';

-- Price range index for active listings
CREATE INDEX idx_listings_price_active 
ON public.listings (price)
WHERE status = 'active' AND price IS NOT NULL;

-- Full compound index for complex searches (most specific first)
CREATE INDEX idx_listings_search_compound 
ON public.listings (status, category, location_wilaya, price, created_at DESC)
WHERE status = 'active';

-- Update table statistics to help query planner
ANALYZE public.listings;

-- Force PostgreSQL to consider using indexes even for small tables
-- (This is mainly for testing - remove in production if you have large datasets)
SET enable_seqscan = OFF;
