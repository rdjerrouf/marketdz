-- Performance optimization indexes for MarketDZ marketplace
-- Based on Supabase AI recommendations for common query patterns

-- 1. Listings – multi-column filter for search pages (HIGHEST IMPACT)
-- Supports: category + wilaya + city + status + price filtering
CREATE INDEX IF NOT EXISTS idx_listings_search 
ON public.listings (category, location_wilaya, location_city, status, price);

-- 2. Listings – full-text search on title & description (HIGH IMPACT)
-- Supports: keyword search across title and description
CREATE INDEX IF NOT EXISTS idx_listings_fulltext 
ON public.listings USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 3. Listings – status-only index for active listings (HIGH IMPACT)
-- Supports: filtering active listings in joins (favorites, search)
CREATE INDEX IF NOT EXISTS idx_listings_status 
ON public.listings (status);

-- 4. Favorites – user to listing lookup (HIGH IMPACT)
-- Supports: "Get user's favorites" queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_listing 
ON public.favorites (user_id, listing_id);

-- 5. Listings – covering index for ID + status (MEDIUM IMPACT)
-- Supports: fast joins after favorites with status check
CREATE INDEX IF NOT EXISTS idx_listings_id_status 
ON public.listings (id, status);

-- 6. Reviews – pagination by creation time (MEDIUM IMPACT)
-- Supports: paginated review fetches with ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_reviews_user_created 
ON public.reviews (reviewed_id, created_at DESC);

-- 7. Reviews – rating aggregation per user (MEDIUM IMPACT)
-- Supports: AVG(rating) and COUNT(*) calculations
CREATE INDEX IF NOT EXISTS idx_reviews_user_rating 
ON public.reviews (reviewed_id, rating);

-- 8. Additional foreign key indexes (LOW IMPACT but good practice)

-- Listings user relationship
CREATE INDEX IF NOT EXISTS idx_listings_user_id 
ON public.listings (user_id);

-- Reviews reviewer relationship
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id 
ON public.reviews (reviewer_id);

-- Reviews listing relationship (for listing-specific reviews)
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id 
ON public.reviews (listing_id) WHERE listing_id IS NOT NULL;

-- Favorites listing relationship (for listing favorite counts)
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id 
ON public.favorites (listing_id);

-- Additional specialized indexes for common patterns

-- 9. Listings by user with status (for "My Listings" page)
CREATE INDEX IF NOT EXISTS idx_listings_user_status 
ON public.listings (user_id, status, created_at DESC);

-- 10. Listings by creation date for newest listings
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
ON public.listings (created_at DESC) WHERE status = 'active';

-- 11. Listings by price for price-based sorting
CREATE INDEX IF NOT EXISTS idx_listings_price 
ON public.listings (price) WHERE status = 'active' AND price IS NOT NULL;

-- 12. Composite index for location-based searches
CREATE INDEX IF NOT EXISTS idx_listings_location 
ON public.listings (location_wilaya, location_city, status);

-- Comments explaining the impact and usage of each index:

COMMENT ON INDEX idx_listings_search IS 'Primary search index: category + location + status + price - covers 80% of search queries';
COMMENT ON INDEX idx_listings_fulltext IS 'Full-text search index: enables fast keyword search on title and description';
COMMENT ON INDEX idx_listings_status IS 'Status filter index: critical for showing only active listings';
COMMENT ON INDEX idx_favorites_user_listing IS 'User favorites lookup: enables fast favorites page loading';
COMMENT ON INDEX idx_reviews_user_created IS 'Review pagination: enables fast paginated review loading';
COMMENT ON INDEX idx_reviews_user_rating IS 'Rating calculation: speeds up average rating and count queries';

-- Performance monitoring queries to validate index usage:

-- To check if indexes are being used, run these queries:
-- EXPLAIN ANALYZE SELECT * FROM listings WHERE category = 'for_sale' AND location_wilaya = 'Alger' AND status = 'active';
-- EXPLAIN ANALYZE SELECT * FROM favorites WHERE user_id = 'user-uuid';
-- EXPLAIN ANALYZE SELECT AVG(rating) FROM reviews WHERE reviewed_id = 'user-uuid';
