-- Fix "permission denied for schema private" errors on favorites and reviews tables
-- Issue: Manually added triggers/functions in cloud database reference private.listing_stats
-- Solution: Convert functions to SECURITY DEFINER with restricted search_path
-- Date: 2025-10-05

-- =============================================================================
-- FIX 1: Reviews table - refresh_user_stats function
-- =============================================================================
-- Trigger: refresh_stats_on_review_change calls refresh_stats_on_review()
-- which calls refresh_user_stats() which refreshes private.listing_stats

-- Recreate the function with SECURITY DEFINER and restricted search_path
CREATE OR REPLACE FUNCTION public.refresh_user_stats(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  -- Keep existing logic; runs with definer privileges and proper search_path
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$;

-- Ensure ownership is postgres (privileged role)
ALTER FUNCTION public.refresh_user_stats(uuid) OWNER TO postgres;

-- Lock down EXECUTE permissions so clients cannot call it directly
REVOKE ALL ON FUNCTION public.refresh_user_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_user_stats(uuid) FROM anon, authenticated;

-- Triggers run under table owner privileges and don't need EXECUTE grants

-- =============================================================================
-- FIX 2: Favorites table - refresh_listing_stats function
-- =============================================================================
-- Trigger: refresh_stats_on_favorite_change calls refresh_stats_on_favorite()
-- which calls refresh_listing_stats() which refreshes private.listing_stats

-- Recreate the function with SECURITY DEFINER and restricted search_path
CREATE OR REPLACE FUNCTION public.refresh_listing_stats(listing_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.listing_stats;
END;
$$;

-- Ensure ownership is postgres (privileged role)
ALTER FUNCTION public.refresh_listing_stats(uuid) OWNER TO postgres;

-- Lock down EXECUTE permissions so clients cannot call it directly
REVOKE ALL ON FUNCTION public.refresh_listing_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_listing_stats(uuid) FROM anon, authenticated;

-- Triggers run under table owner privileges and don't need EXECUTE grants

-- =============================================================================
-- FIX 3: Convert all 4 trigger functions to SECURITY DEFINER
-- =============================================================================
-- The trigger functions themselves also need SECURITY DEFINER to avoid
-- "permission denied for function" errors when they call helper functions

-- 3.1) Favorites trigger function: refresh_stats_on_favorite()
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

-- 3.2) Favorites trigger function: update_favorites_count()
CREATE OR REPLACE FUNCTION public.update_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
AS $$
BEGIN
    UPDATE public.listings
    SET favorites_count = (
        SELECT COUNT(*)
        FROM public.favorites
        WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)
    )
    WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.update_favorites_count() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_favorites_count() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_favorites_count() FROM anon, authenticated;

-- 3.3) Reviews trigger function: refresh_stats_on_review()
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

-- 3.4) Reviews trigger function: update_user_rating()
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, private
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
        )
    WHERE id = COALESCE(NEW.reviewed_id, OLD.reviewed_id);

    RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.update_user_rating() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_user_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_rating() FROM anon, authenticated;

-- =============================================================================
-- NOTES
-- =============================================================================
-- These triggers and functions were manually added to the cloud database and
-- are NOT part of our lean schema philosophy. They reference a private schema
-- with materialized views that we don't manage in migrations.
--
-- Complete fix required:
-- 1. Helper functions (refresh_user_stats, refresh_listing_stats) → SECURITY DEFINER
-- 2. All 4 trigger functions → SECURITY DEFINER
-- 3. Revoke EXECUTE from anon/authenticated on all functions
-- 4. Set owner to postgres and restrict search_path to public,private
--
-- This migration documents the fix for the permission errors, but ideally:
-- 1. The private.listing_stats matview should be documented in migrations
-- 2. The refresh triggers should be moved off the write path (use pg_cron)
-- 3. Consider maintaining stats incrementally instead of full REFRESH
--
-- For now, this SECURITY DEFINER approach allows the existing functionality
-- to work without granting broad privileges to anon/authenticated roles.
-- =============================================================================
