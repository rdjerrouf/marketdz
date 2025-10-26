-- =============================================================================
-- FIX REMAINING FUNCTIONS SEARCH_PATH
-- =============================================================================
-- This migration adds SET search_path = public, pg_catalog to remaining
-- functions that don't have it set. While these are not SECURITY DEFINER,
-- setting search_path is still good security practice to prevent unexpected
-- behavior from search_path manipulation.
--
-- Functions fixed:
-- 1. public.update_updated_at_column() - Generic timestamp trigger
-- 2. public.listings_search_vector_trigger() - Search vector maintenance
-- 3. public.expire_hot_deals() - Hot deals expiration
-- 4. public.update_admin_users_updated_at() - Admin timestamp trigger
-- 5. public.cleanup_expired_admin_sessions() - Session cleanup
-- 6. public.normalize_arabic() - Arabic text normalization
-- =============================================================================

-- 1. Fix update_updated_at_column()
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.update_updated_at_column IS 'Generic trigger to update updated_at timestamp';

-- 2. Fix listings_search_vector_trigger()
-- This is the current version from align_search_with_cloud migration
CREATE OR REPLACE FUNCTION public.listings_search_vector_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Normalize Arabic text
  NEW.normalized_title_ar := normalize_arabic(NEW.title);
  NEW.normalized_description_ar := normalize_arabic(NEW.description);

  -- Update Arabic search vector
  NEW.search_vector_ar := to_tsvector('arabic',
    coalesce(NEW.normalized_title_ar, '') || ' ' ||
    coalesce(NEW.normalized_description_ar, '') || ' ' ||
    coalesce(normalize_arabic(NEW.company_name), '')
  );

  -- Update French search vector
  NEW.search_vector_fr := to_tsvector('french',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.company_name, '')
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.listings_search_vector_trigger IS 'Maintains search vectors for Arabic and French full-text search';

-- 3. Fix expire_hot_deals()
CREATE OR REPLACE FUNCTION expire_hot_deals()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET is_hot_deal = FALSE,
      hot_deal_badge_type = NULL
  WHERE is_hot_deal = TRUE
    AND hot_deal_expires_at IS NOT NULL
    AND hot_deal_expires_at < NOW();
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION expire_hot_deals IS 'Automatically expires hot deals that have passed their expiration time';

-- 4. Fix update_admin_users_updated_at()
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION update_admin_users_updated_at IS 'Updates admin_users timestamp on row update';

-- 5. Fix cleanup_expired_admin_sessions()
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS integer AS $$
DECLARE
    affected_count integer;
BEGIN
    UPDATE public.admin_sessions
    SET is_active = false,
        logout_reason = 'timeout'
    WHERE is_active = true
      AND expires_at < now();

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Marks expired admin sessions as inactive';

-- 6. Fix normalize_arabic()
CREATE OR REPLACE FUNCTION public.normalize_arabic(text_input text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF text_input IS NULL THEN
    RETURN '';
  END IF;

  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(text_input, '[أإآ]', 'ا', 'g'),
        '[ىي]', 'ي', 'g'),
      'ة', 'ه', 'g'),
    '[^\w\s]', ' ', 'g'
  );
END;
$$;

COMMENT ON FUNCTION public.normalize_arabic IS 'Normalizes Arabic text for better search matching';
