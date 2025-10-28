-- Migration: Fix circular RLS dependency in admin_users table
-- Date: 2025-10-27
-- Issue: is_admin() function creates circular dependency when checking admin_users table
--
-- Problem:
--   1. Profile UPDATE policy calls is_admin()
--   2. is_admin() needs to SELECT from admin_users
--   3. admin_users SELECT policy requires is_admin() = true
--   4. Circular dependency blocks all profile updates
--
-- Solution:
--   Allow users to check if THEY are admins (their own user_id) without requiring is_admin()

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

-- Create new policies that allow:
-- 1. Users can check if THEY are admins (needed for is_admin() function)
-- 2. Admins can view ALL admin users (for admin management)

CREATE POLICY "Users can check if they are admins"
ON public.admin_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  -- Allow if user is checking themselves (covered by above policy)
  -- OR if the user is an admin (can view all)
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = true
  )
);

COMMENT ON POLICY "Users can check if they are admins" ON public.admin_users IS
  'Allows users to check if THEY are admins. This breaks the circular dependency with is_admin() function.';

COMMENT ON POLICY "Admins can view all admin users" ON public.admin_users IS
  'Allows admins to view all admin users for management purposes.';
