-- Drop Duplicate Indexes on listings
-- Date: 2026-04-08
--
-- Issue: Supabase advisor detected two pairs of duplicate GIN indexes on listings:
--   idx_listings_fts_ar  ≡  listings_search_vector_ar_gin  (both on search_vector_ar)
--   idx_listings_fts_fr  ≡  listings_search_vector_fr_gin  (both on search_vector_fr)
--
-- Root cause: 20251020000000_performance_optimization_250k.sql created idx_listings_fts_*
-- indexes that were already created by 20251002000001_align_search_with_cloud.sql
-- as listings_search_vector_*_gin.
--
-- Fix: Drop the later duplicates (idx_listings_fts_*). Keep listings_search_vector_*_gin
-- as they were created first and are more descriptively named.
--
-- Impact: ~reclaim storage, faster INSERT/UPDATE on listings (fewer indexes to maintain)

DROP INDEX IF EXISTS public.idx_listings_fts_ar;
DROP INDEX IF EXISTS public.idx_listings_fts_fr;
