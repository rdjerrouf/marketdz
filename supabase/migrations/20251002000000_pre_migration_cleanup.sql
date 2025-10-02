-- Pre-Migration Cleanup for Cloud
-- Run this FIRST before applying new migrations to align cloud DB with local schema

-- ============================================================================
-- SEARCH VECTOR ALIGNMENT
-- ============================================================================
-- Cloud has: search_vector_ar, search_vector_fr, normalized_title_ar, normalized_description_ar
-- Local has: search_vector (single column)
-- Decision: Keep cloud's dual-vector approach (better for bilingual support)

-- Drop existing search-related triggers/functions if they exist
DROP TRIGGER IF EXISTS listings_search_vector_update ON public.listings;
DROP FUNCTION IF EXISTS public.listings_search_vector_trigger();

-- Drop old indexes if they exist (will be recreated with correct names)
DROP INDEX IF EXISTS public.listings_search_vector_gin;

-- ============================================================================
-- KEEP ADMIN_MFA TABLE
-- ============================================================================
-- Cloud has admin_mfa table - keep it for future MFA implementation
-- No action needed here, just documenting the decision

-- ============================================================================
-- VERIFY EXTENSIONS
-- ============================================================================
-- Ensure all required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================================
-- CLEAN UP OLD RLS POLICIES (if any naming conflicts)
-- ============================================================================
-- This ensures we start fresh with the new RLS policies from migrations

-- Note: Only run this if you encounter policy conflicts
-- Uncomment if needed:
-- DO $$
-- DECLARE
--   pol RECORD;
-- BEGIN
--   FOR pol IN
--     SELECT schemaname, tablename, policyname
--     FROM pg_policies
--     WHERE schemaname = 'public'
--   LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
--       pol.policyname, pol.schemaname, pol.tablename);
--   END LOOP;
-- END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify alignment:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'listings' AND column_name LIKE '%search%';
-- SELECT tablename, indexname FROM pg_indexes WHERE tablename = 'listings';
-- SELECT count(*) FROM admin_mfa;  -- Should exist but be empty
