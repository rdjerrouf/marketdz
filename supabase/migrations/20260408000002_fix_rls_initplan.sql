-- Fix RLS auth_rls_initplan Warnings
-- Date: 2026-04-08
--
-- Issue: Supabase advisor flagged multiple tables for auth_rls_initplan.
-- Direct calls to auth.uid() inside RLS policies are re-evaluated PER ROW.
-- Wrapping in (select auth.uid()) makes Postgres evaluate it ONCE per query (initplan),
-- which is significantly faster on large tables.
--
-- Also fixes: multiple permissive SELECT policies on listings (combined into one).
--
-- Affected tables: profiles, admin_users, listings
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

-- =============================================================================
-- 1. is_admin() helper — fix internal auth.uid() call + mark STABLE
-- =============================================================================
-- STABLE tells Postgres the function returns the same value within a transaction,
-- allowing it to be cached rather than re-executed per row.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin IS
  'Returns true if the current authenticated user is an active admin. STABLE + initplan pattern for RLS performance.';

-- =============================================================================
-- 2. profiles — fix UPDATE policy (uses raw auth.uid())
-- =============================================================================
-- 20251028000003 introduced auth.uid() without (select ...) wrapper

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- =============================================================================
-- 3. admin_users — fix SELECT policies (both use raw auth.uid())
-- =============================================================================
-- From 20251027000000_fix_circular_rls_admin_users.sql

DROP POLICY IF EXISTS "Users can check if they are admins" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Users can check if they are admins"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = (SELECT auth.uid())
      AND au.is_active = true
  )
);

-- =============================================================================
-- 4. admin_users — fix INSERT/UPDATE/DELETE policies (raw auth.uid() in subqueries)
-- =============================================================================
-- From 20251001000004_add_role_based_rls.sql

DROP POLICY IF EXISTS "Super admins can create admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;

CREATE POLICY "Super admins can create admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND role = 'super_admin'
      AND is_active = true
  )
);

CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND role = 'super_admin'
      AND is_active = true
  )
);

CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- =============================================================================
-- 5. listings — consolidate multiple permissive SELECT policies into one
-- =============================================================================
-- Previously two SELECT policies existed for the same table:
--   "Active listings are viewable by everyone"     → status = 'active'
--   "Users can view their own non-active listings" → auth.uid() = user_id
-- Multiple permissive policies are OR'd by Postgres and can hurt planner performance.
-- Combining them removes the warning without changing access semantics.

DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Users can view their own non-active listings" ON public.listings;

CREATE POLICY "Listings are viewable"
ON public.listings
FOR SELECT
USING (
  status = 'active'
  OR (select auth.uid()) = user_id
);
