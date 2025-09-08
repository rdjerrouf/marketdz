-- Materialized view for listing aggregates (favorites count, ratings)
-- This dramatically improves performance for listing feeds

-- Create private schema for internal views
CREATE SCHEMA IF NOT EXISTS private;

-- Create materialized view for listing statistics
CREATE MATERIALIZED VIEW private.listing_stats AS
SELECT 
  l.id as listing_id,
  l.title,
  l.user_id,
  l.status,
  l.created_at,
  COALESCE(f.favorite_count, 0) as favorite_count,
  COALESCE(r.avg_rating, 0) as seller_avg_rating,
  COALESCE(r.review_count, 0) as seller_review_count
FROM listings l
LEFT JOIN (
  -- Favorites count per listing
  SELECT 
    listing_id,
    COUNT(*) as favorite_count
  FROM favorites
  GROUP BY listing_id
) f ON l.id = f.listing_id
LEFT JOIN (
  -- Seller ratings aggregated
  SELECT 
    l2.user_id,
    AVG(rev.rating::numeric) as avg_rating,
    COUNT(rev.id) as review_count
  FROM listings l2
  LEFT JOIN reviews rev ON rev.reviewed_id = l2.user_id
  GROUP BY l2.user_id
) r ON l.user_id = r.user_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_listing_stats_id ON private.listing_stats (listing_id);

-- Function to refresh stats for specific listing
CREATE OR REPLACE FUNCTION refresh_listing_stats(listing_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- For now, refresh the entire view concurrently
  -- In high-traffic scenarios, you'd implement partial refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh stats for specific user (when they get new review)
CREATE OR REPLACE FUNCTION refresh_user_stats(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Refresh the entire view for now
  -- In production, you'd update only rows for this user
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to refresh stats on favorite changes
CREATE OR REPLACE FUNCTION refresh_stats_on_favorite()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule async refresh (in production, use pg_cron or background job)
  PERFORM refresh_listing_stats(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.listing_id
      ELSE NEW.listing_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to refresh stats on review changes
CREATE OR REPLACE FUNCTION refresh_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh stats for the reviewed user
  PERFORM refresh_user_stats(NEW.reviewed_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain the materialized view
DROP TRIGGER IF EXISTS refresh_stats_on_favorite_change ON favorites;
CREATE TRIGGER refresh_stats_on_favorite_change
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION refresh_stats_on_favorite();

DROP TRIGGER IF EXISTS refresh_stats_on_review_change ON reviews;
CREATE TRIGGER refresh_stats_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION refresh_stats_on_review();

-- Create view for efficient listing queries with stats
CREATE OR REPLACE VIEW public.listings_with_stats AS
SELECT 
  l.*,
  ls.favorite_count,
  ls.seller_avg_rating,
  ls.seller_review_count,
  p.first_name,
  p.last_name,
  p.avatar_url
FROM listings l
JOIN private.listing_stats ls ON l.id = ls.listing_id
JOIN profiles p ON l.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.listings_with_stats TO authenticated;
GRANT SELECT ON public.listings_with_stats TO anon;

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW private.listing_stats;
