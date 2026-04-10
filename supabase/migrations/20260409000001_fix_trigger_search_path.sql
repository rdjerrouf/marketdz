-- Migration: fix_trigger_search_path
-- Date: 2026-04-09
-- Purpose: Fix function_search_path_mutable security warning on listings_search_vector_trigger.
--
-- Without SET search_path = public, a user with schema-create privileges could
-- shadow normalize_arabic() or to_tsvector() in another schema and have the
-- trigger pick up their version instead. Pinning search_path closes this.
--
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

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
