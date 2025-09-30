-- Add security and performance optimizations for listings API
-- Implements Supabase AI recommendations while keeping database lean

-- 1. SECURITY: Add proper RLS policies for listings table
-- Enable RLS (already enabled, but ensure it's explicitly set)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Grant basic privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;

-- SECURITY POLICIES for authenticated users (owners only)
CREATE POLICY "listings_owner_insert" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "listings_owner_update" ON public.listings
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "listings_owner_delete" ON public.listings
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- SECURITY POLICIES for public browsing (anon users can see active listings)
CREATE POLICY "listings_public_select" ON public.listings
  FOR SELECT TO anon
  USING (status = 'active');

-- SECURITY POLICIES for authenticated users (can see all active listings + own listings)
CREATE POLICY "listings_authenticated_select" ON public.listings
  FOR SELECT TO authenticated
  USING (
    status = 'active' OR
    (SELECT auth.uid()) = user_id
  );

-- 2. PERFORMANCE: Add strategic indexes for common query patterns
-- Index for user-specific queries (my listings page)
CREATE INDEX IF NOT EXISTS listings_user_status_created_idx
  ON public.listings (user_id, status, created_at DESC);

-- Index for public browsing by category + status
CREATE INDEX IF NOT EXISTS listings_public_category_created_idx
  ON public.listings (status, category, created_at DESC)
  WHERE status = 'active';

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS listings_location_status_created_idx
  ON public.listings (location_wilaya, status, created_at DESC)
  WHERE status = 'active';

-- 3. Add comments explaining the lean approach
COMMENT ON POLICY listings_owner_insert ON public.listings IS
  'Users can only create listings for themselves';
COMMENT ON POLICY listings_owner_update ON public.listings IS
  'Users can only update their own listings';
COMMENT ON POLICY listings_owner_delete ON public.listings IS
  'Users can only delete their own listings';
COMMENT ON POLICY listings_public_select ON public.listings IS
  'Anonymous users can browse active listings only';
COMMENT ON POLICY listings_authenticated_select ON public.listings IS
  'Authenticated users can see active listings + their own listings';

COMMENT ON INDEX listings_user_status_created_idx IS
  'Optimizes user-specific queries (my listings page)';
COMMENT ON INDEX listings_public_category_created_idx IS
  'Optimizes public browsing by category with active status filter';
COMMENT ON INDEX listings_location_status_created_idx IS
  'Optimizes location-based searches for active listings';

-- 4. Performance verification query (for testing)
-- This query should use the new indexes efficiently
-- SELECT id, title, price, created_at
-- FROM public.listings
-- WHERE user_id = auth.uid()
-- ORDER BY created_at DESC, id DESC
-- LIMIT 10;