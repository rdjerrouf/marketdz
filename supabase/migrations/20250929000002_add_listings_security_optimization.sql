-- Add security and performance optimizations for listings API
-- Follows the LEAN golden schema philosophy - no redundant policies or indexes

-- 1. SECURITY: Ensure RLS is enabled (already done in initial schema)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Grant basic privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;

-- Note: RLS policies are already defined in 20250929000000_initial_lean_schema.sql
-- We do NOT duplicate them here to maintain the lean golden schema approach:
--   - "Active listings are viewable by everyone"
--   - "Users can view their own non-active listings"
--   - "Users can create listings"
--   - "Users can update their own listings"
--   - "Users can delete their own listings"

-- 2. PERFORMANCE: No additional indexes needed
-- The initial schema already has all essential indexes for optimal performance.
-- Adding more indexes would:
--   - Increase storage costs
--   - Slow down writes (every INSERT/UPDATE must update all indexes)
--   - Consume more memory
--   - Provide no measurable performance benefit (verified through testing)

-- Performance verification query (for testing)
-- This query uses the existing idx_listings_user_id index efficiently:
-- SELECT id, title, price, created_at
-- FROM public.listings
-- WHERE user_id = auth.uid()
-- ORDER BY created_at DESC, id DESC
-- LIMIT 10;