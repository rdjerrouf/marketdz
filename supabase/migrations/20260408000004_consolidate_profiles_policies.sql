-- Consolidate profiles RLS policies
-- Date: 2026-04-08
--
-- Issue: Supabase advisor flagged multiple permissive policies on public.profiles:
--   SELECT: "Public profiles are viewable" + "Admins can view all profiles"
--   UPDATE: "Users can update their own profile" + "Admins can update user status"
--
-- Fix:
--   SELECT: Drop "Admins can view all profiles" — it is fully redundant because
--           "Public profiles are viewable" uses USING (true) which already allows
--           everyone (including admins) to see all rows.
--
--   UPDATE: Merge both UPDATE policies into one that covers users updating
--           their own profile AND admins updating other users' profiles.

-- =============================================================================
-- SELECT — drop the redundant admin policy
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- =============================================================================
-- UPDATE — merge into one policy
-- =============================================================================

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;

CREATE POLICY "Users and admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = id
  OR ((SELECT is_admin()) AND (SELECT auth.uid()) != id)
)
WITH CHECK (
  (SELECT auth.uid()) = id
  OR ((SELECT is_admin()) AND (SELECT auth.uid()) != id)
);
