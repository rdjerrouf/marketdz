-- Migration: optimize_listings_write_path
-- Date: 2026-04-09
-- Purpose: Drop unused indexes and dead columns that add write overhead without benefiting any query.
--
-- Changes:
--   1. Drop legacy compound index (superseded by specialized partial indexes)
--   2. Drop two GIN trigram indexes on normalized Arabic columns (never queried)
--   3. Update trigger to remove dead normalized_* column computation
--   4. Drop the normalized_title_ar and normalized_description_ar columns (never read anywhere)
--
-- Expected gains:
--   - Every INSERT/UPDATE on listings saves 3 index writes + 2 normalize_arabic() calls
--   - Narrower rows = smaller heap pages = better buffer cache utilization
--   - Cleaner query planner (fewer candidate indexes to evaluate)

-- ─── 1. Drop legacy compound index ───────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_listings_search_compound;

-- ─── 2. Drop dead GIN trigram indexes ────────────────────────────────────────
DROP INDEX IF EXISTS public.listings_normalized_title_ar_idx;
DROP INDEX IF EXISTS public.listings_normalized_description_ar_idx;

-- ─── 3. Update trigger — remove dead column writes, keep search vectors ───────
--
-- Before: computed normalized_title_ar + normalized_description_ar (stored) then
--         used them to build search_vector_ar.
-- After:  inline normalize_arabic() calls feed search_vector_ar directly.
--         French vector unchanged.
--
CREATE OR REPLACE FUNCTION public.listings_search_vector_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Arabic search vector: normalize inline (no longer stored in columns)
  NEW.search_vector_ar := to_tsvector('arabic',
    coalesce(normalize_arabic(NEW.title), '')        || ' ' ||
    coalesce(normalize_arabic(NEW.description), '')  || ' ' ||
    coalesce(normalize_arabic(NEW.company_name), '')
  );

  -- French search vector: unchanged
  NEW.search_vector_fr := to_tsvector('french',
    coalesce(NEW.title, '')        || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.company_name, '')
  );

  RETURN NEW;
END;
$$;

-- ─── 4. Drop dead columns ─────────────────────────────────────────────────────
-- Confirmed: zero references in application code or database.ts types.
-- Columns were populated by trigger only; never selected by any query.
ALTER TABLE public.listings DROP COLUMN IF EXISTS normalized_title_ar;
ALTER TABLE public.listings DROP COLUMN IF EXISTS normalized_description_ar;
