-- Fix Cloud Drift: Restore missing functions, triggers, and indexes
-- Date: 2026-04-03
-- Context: Cloud DB was missing 7 functions, 2 triggers, and 4 indexes that exist
--          in local. Tables/columns/data are intact. This migration is idempotent.
--
-- Priority order:
--   1. HIGH: update_favorites_count + trigger (favorites_count never updated in prod)
--   2. HIGH: update_user_rating + trigger (seller ratings never updated in prod)
--   3. MEDIUM: search_listings_ranked (ranked search endpoint)
--   4. MEDIUM: GIN indexes for Arabic/French full-text search
--   5. LOW: refresh_listing_stats / refresh_user_stats / refresh_stats_on_* (manual helpers)
--   6. LOW: remaining indexes

-- =============================================================================
-- 1. update_favorites_count() + trigger
-- =============================================================================
-- Canonical version from 20251022000001_fix_review_timeout.sql

CREATE OR REPLACE FUNCTION public.update_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    UPDATE public.listings
    SET
        favorites_count = (
            SELECT COUNT(*)
            FROM public.favorites
            WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
        ),
        updated_at = now()
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.update_favorites_count() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_favorites_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_favorites_count() FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_favorites_count_trigger ON public.favorites;
CREATE TRIGGER update_favorites_count_trigger
    AFTER INSERT OR DELETE ON public.favorites
    FOR EACH ROW
    EXECUTE FUNCTION public.update_favorites_count();

-- =============================================================================
-- 2. update_user_rating() + trigger
-- =============================================================================
-- Canonical version from 20251022000001_fix_review_timeout.sql

CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    UPDATE public.profiles
    SET
        rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM public.reviews
            WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id)
        ), 0),
        review_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id)
        ),
        updated_at = now()
    WHERE id = COALESCE(NEW.reviewed_id, OLD.reviewed_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.update_user_rating() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_user_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_rating() FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_user_rating_trigger ON public.reviews;
CREATE TRIGGER update_user_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_rating();

-- =============================================================================
-- 3. search_listings_ranked()
-- =============================================================================
-- From 20251008000000_add_ranked_search_function.sql

CREATE OR REPLACE FUNCTION public.search_listings_ranked(
  search_query text,
  filter_category text DEFAULT NULL,
  filter_wilaya text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  filter_min_price numeric DEFAULT NULL,
  filter_max_price numeric DEFAULT NULL,
  result_limit int DEFAULT 20,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  category listing_category,
  created_at timestamptz,
  status listing_status,
  user_id uuid,
  location_wilaya text,
  location_city text,
  photos text[],
  condition text,
  available_from date,
  available_to date,
  rental_period text,
  salary_min numeric,
  salary_max numeric,
  job_type text,
  company_name text,
  search_rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.description,
    l.price,
    l.category,
    l.created_at,
    l.status,
    l.user_id,
    l.location_wilaya,
    l.location_city,
    l.photos,
    l.condition,
    l.available_from,
    l.available_to,
    l.rental_period,
    l.salary_min,
    l.salary_max,
    l.job_type,
    l.company_name,
    GREATEST(
      ts_rank(l.search_vector_fr, to_tsquery('french', search_query)),
      ts_rank(l.search_vector_ar, to_tsquery('arabic', search_query))
    )::real as search_rank
  FROM
    public.listings l
  WHERE
    l.status = 'active'
    AND (
      l.search_vector_fr @@ to_tsquery('french', search_query)
      OR l.search_vector_ar @@ to_tsquery('arabic', search_query)
    )
    AND (filter_category IS NULL OR l.category::text = filter_category)
    AND (filter_wilaya IS NULL OR l.location_wilaya = filter_wilaya)
    AND (filter_city IS NULL OR l.location_city = filter_city)
    AND (filter_min_price IS NULL OR l.price >= filter_min_price)
    AND (filter_max_price IS NULL OR l.price <= filter_max_price)
  ORDER BY
    search_rank DESC,
    l.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_listings_ranked TO authenticated, anon;

-- =============================================================================
-- 4. GIN indexes for Arabic and French full-text search
-- =============================================================================

CREATE INDEX IF NOT EXISTS listings_search_vector_ar_gin
    ON public.listings USING GIN (search_vector_ar);

CREATE INDEX IF NOT EXISTS listings_search_vector_fr_gin
    ON public.listings USING GIN (search_vector_fr);

-- =============================================================================
-- 5. Supporting indexes (missed by cloud)
-- =============================================================================

-- Speeds up the aggregation in update_user_rating trigger
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_rating
    ON public.reviews (reviewed_id, rating);

-- Composite index on admin_users (replaces single-column cloud-only index)
CREATE INDEX IF NOT EXISTS idx_admin_users_user_active
    ON public.admin_users (user_id, is_active);

-- =============================================================================
-- 6. Legacy helper functions (low priority, kept for parity with local)
-- =============================================================================
-- Note: These call REFRESH MATERIALIZED VIEW on private.listing_stats.
-- Their triggers (refresh_stats_on_review_change, refresh_stats_on_favorite_change)
-- were intentionally DROPPED in migration 20251022000001 because they caused
-- 30+ second timeouts at 250k scale. These functions exist for manual use only.

CREATE OR REPLACE FUNCTION public.refresh_listing_stats(listing_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  -- Manual helper — not called by any trigger
  -- Kept for parity with local schema
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$;

ALTER FUNCTION public.refresh_listing_stats(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.refresh_listing_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_listing_stats(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_user_stats(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  -- Manual helper — not called by any trigger
  -- Kept for parity with local schema
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$;

ALTER FUNCTION public.refresh_user_stats(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.refresh_user_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_user_stats(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_stats_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  PERFORM public.refresh_listing_stats(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.listing_id
      ELSE NEW.listing_id
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.refresh_stats_on_favorite() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.refresh_stats_on_favorite() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_stats_on_favorite() FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_stats_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  PERFORM public.refresh_user_stats(NEW.reviewed_id);
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.refresh_stats_on_review() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.refresh_stats_on_review() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_stats_on_review() FROM anon, authenticated;

-- =============================================================================
-- 7. One-time backfill: fix stale favorites_count and ratings on cloud
-- =============================================================================
-- Rows created before triggers existed will have stale counts (0 or wrong).
-- This recomputes all of them once; triggers will keep them correct going forward.

-- Backfill favorites_count for all listings
UPDATE public.listings l
SET favorites_count = (
    SELECT COUNT(*)
    FROM public.favorites f
    WHERE f.listing_id = l.id
);

-- Backfill rating + review_count for all profiles
UPDATE public.profiles p
SET
    rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2)
        FROM public.reviews r
        WHERE r.reviewed_id = p.id
    ), 0),
    review_count = (
        SELECT COUNT(*)
        FROM public.reviews r
        WHERE r.reviewed_id = p.id
    );

-- Update query planner stats after backfill
ANALYZE public.listings;
ANALYZE public.profiles;
ANALYZE public.reviews;
ANALYZE public.favorites;
