-- Add Full-Text Search optimization for listings
-- This replaces inefficient ilike OR queries with proper PostgreSQL FTS

-- 1. Add materialized tsvector column for search
ALTER TABLE public.listings ADD COLUMN search_vector tsvector;

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

-- 6. Add strategic composite indexes for common filter combinations
-- Index for status + category + location (most common filters)
CREATE INDEX listings_status_category_location_created ON public.listings
  (status, category, location_wilaya, location_city, created_at DESC);

-- Index for status + category + price filtering
CREATE INDEX listings_status_category_price ON public.listings
  (status, category, price);

-- Index for job-specific searches (status + category + salary range)
CREATE INDEX listings_job_salary_range ON public.listings
  (status, category, salary_min, salary_max)
  WHERE category = 'job';

-- Add comment explaining the optimization
COMMENT ON COLUMN public.listings.search_vector IS 'Full-text search vector for title, description, and company_name. Automatically updated via trigger.';
COMMENT ON INDEX listings_search_vector_gin IS 'GIN index for fast full-text search queries using search_vector';
COMMENT ON INDEX listings_status_category_location_created IS 'Composite index for common filter combinations with created_at sort';
COMMENT ON INDEX listings_status_category_price IS 'Composite index for category + price filtering';
COMMENT ON INDEX listings_job_salary_range IS 'Specialized index for job listings with salary range filtering';