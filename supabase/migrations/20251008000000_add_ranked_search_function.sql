-- Add ranked search function for better search relevance
-- This function returns listings sorted by how well they match the search query

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

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.search_listings_ranked TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.search_listings_ranked IS
  'Full-text search with relevance ranking using ts_rank. Returns listings sorted by match quality.';
