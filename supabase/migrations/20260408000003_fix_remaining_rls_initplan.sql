-- Fix Remaining RLS auth_rls_initplan Warnings
-- Date: 2026-04-08
--
-- Previous migration (20260408000002) missed three tables:
--   - admin_sessions    (3 policies with raw auth.uid() in subqueries)
--   - admin_activity_logs (INSERT policy with raw auth.uid())
--   - admin_invitations (INSERT policy with raw auth.uid())
--   - profiles          (SELECT + UPDATE admin policies with raw auth.uid())
--
-- Also fixes: admin_users now has 3 overlapping SELECT policies (multiple permissive
-- policies warning). Consolidates them into one, removing the stale
-- "Users can check own admin status" policy that existed only in cloud.

-- =============================================================================
-- 1. admin_sessions — fix all 3 policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can create own sessions" ON public.admin_sessions;
DROP POLICY IF EXISTS "Admins can update own sessions" ON public.admin_sessions;

CREATE POLICY "Admins can view own sessions"
ON public.admin_sessions
FOR SELECT
USING (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admins can create own sessions"
ON public.admin_sessions
FOR INSERT
WITH CHECK (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admins can update own sessions"
ON public.admin_sessions
FOR UPDATE
USING (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = (SELECT auth.uid())
  )
);

-- =============================================================================
-- 2. admin_activity_logs — fix INSERT policy
-- =============================================================================

DROP POLICY IF EXISTS "Admins can create logs" ON public.admin_activity_logs;

CREATE POLICY "Admins can create logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = (SELECT auth.uid())
  )
);

-- =============================================================================
-- 3. admin_invitations — fix INSERT policy
-- =============================================================================

DROP POLICY IF EXISTS "Super admins can create invitations" ON public.admin_invitations;

CREATE POLICY "Super admins can create invitations"
ON public.admin_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = (SELECT auth.uid())
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- =============================================================================
-- 4. profiles — fix admin SELECT + UPDATE policies
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (id = (SELECT auth.uid()) OR (SELECT is_admin()));

CREATE POLICY "Admins can update user status"
ON public.profiles
FOR UPDATE
USING (
  id = (SELECT auth.uid()) OR
  ((SELECT is_admin()) AND (SELECT auth.uid()) != id)
)
WITH CHECK (
  id = (SELECT auth.uid()) OR
  ((SELECT is_admin()) AND (SELECT auth.uid()) != id)
);

-- =============================================================================
-- 5. admin_users — consolidate 3 SELECT policies into 1
-- =============================================================================
-- The cloud had a stale "Users can check own admin status" policy not present in
-- any migration file. Combined with the two policies from 20260408000002, this
-- caused a "multiple permissive policies" warning.
-- All three are dropped and replaced with a single policy that:
--   a) lets any user see their own row (breaks the circular RLS dependency)
--   b) lets active admins see all rows

DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check if they are admins" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Admin users are viewable"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = (SELECT auth.uid())
      AND au.is_active = true
  )
);
