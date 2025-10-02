-- DEPRECATED: This migration is superseded by 20251002000001_align_search_with_cloud.sql
-- Cloud already has dual-vector search (search_vector_ar + search_vector_fr)
-- This migration is kept for local Docker compatibility but will be skipped in cloud

-- Add Full-Text Search optimization for listings (DOCKER ONLY)
-- This replaces inefficient ilike OR queries with proper PostgreSQL FTS

-- 1. Add materialized tsvector column for search (single vector - simpler for local dev)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.listings ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- 2. Populate existing listings with search vectors
UPDATE public.listings
SET search_vector = to_tsvector('simple',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(company_name, '')
);

-- 3. Create trigger function to keep search_vector updated
CREATE OR REPLACE FUNCTION public.listings_search_vector_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.company_name, '')
  );
  RETURN NEW;
END;
$$;

-- 4. Create trigger to automatically update search_vector
CREATE TRIGGER listings_search_vector_update
  BEFORE INSERT OR UPDATE OF title, description, company_name ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_search_vector_trigger();

-- 5. Create GIN index for fast full-text search
CREATE INDEX listings_search_vector_gin ON public.listings USING GIN(search_vector);

-- Note: Following the LEAN golden schema philosophy
-- We do NOT add composite indexes like:
--   - listings_status_category_location_created
--   - listings_status_category_price
--   - listings_job_salary_range
--
-- Why? Testing showed that the existing indexes (idx_listings_search_compound,
-- idx_listings_fulltext, idx_listings_user_id) combined with the search_vector GIN
-- index handle all query patterns efficiently. Adding more composite indexes would:
--   - Increase storage costs on Supabase
--   - Slow down INSERT/UPDATE operations
--   - Consume more memory
--   - Provide negligible performance benefit

-- Add comment explaining the optimization
COMMENT ON COLUMN public.listings.search_vector IS 'Full-text search vector for title, description, and company_name. Automatically updated via trigger.';
COMMENT ON INDEX listings_search_vector_gin IS 'GIN index for fast full-text search queries using search_vector';