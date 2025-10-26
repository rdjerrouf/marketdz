-- =============================================================================
-- FIX SECURITY DEFINER FUNCTIONS SEARCH_PATH
-- =============================================================================
-- This migration adds SET search_path = public, pg_catalog to SECURITY DEFINER
-- functions to prevent SQL injection via search_path manipulation.
--
-- Security Advisor Issue: Functions using SECURITY DEFINER without explicit
-- search_path are vulnerable to attacks where malicious users can create
-- functions in their own schema that shadow system functions.
--
-- Functions fixed:
-- 1. public.is_admin() - Admin role checker
-- 2. public.current_admin() - Admin details retriever
-- 3. public.handle_new_user() - Auth trigger for profile creation
-- =============================================================================

-- Fix is_admin() function
-- Original: SECURITY DEFINER without search_path
-- Fixed: Add SET search_path = public, pg_catalog
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.is_admin IS 'Returns true if the current authenticated user is an active admin';

-- Fix current_admin() function
-- Original: SECURITY DEFINER without search_path
-- Fixed: Add SET search_path = public, pg_catalog
CREATE OR REPLACE FUNCTION public.current_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  permissions jsonb,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.role,
    a.permissions,
    a.is_active
  FROM public.admin_users a
  WHERE a.user_id = auth.uid()
    AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.current_admin IS 'Returns admin details for the current authenticated user';

-- Fix handle_new_user() function
-- Original: SECURITY DEFINER without search_path
-- Fixed: Add SET search_path = public, pg_catalog
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to create profile on user signup';
