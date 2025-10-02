-- =============================================================================
-- ROLE-BASED RLS FOR ADMIN SYSTEM
-- Implements the "Gold Standard" Supabase admin pattern
-- =============================================================================
-- This migration adds:
-- 1. is_admin() helper function for RLS policies
-- 2. Role-based RLS policies for admin access
-- 3. Safe, idiomatic Supabase security model
-- =============================================================================

-- =============================================================================
-- 1. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Check if current user is an admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin IS 'Returns true if the current authenticated user is an active admin';

-- Get current admin user details
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.current_admin IS 'Returns admin details for the current authenticated user';

-- =============================================================================
-- 2. UPDATE RLS POLICIES - ADMIN USERS TABLE
-- =============================================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Admin users via API only" ON public.admin_users;
DROP POLICY IF EXISTS "Service role full access" ON public.admin_users;

-- Admins can view all admin users
CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
USING (is_admin());

-- Only super_admins can insert new admin users
CREATE POLICY "Super admins can create admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- Only super_admins can update admin users
CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- Only super_admins can delete admin users
CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- =============================================================================
-- 3. UPDATE RLS POLICIES - ADMIN SESSIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Admin sessions via API only" ON public.admin_sessions;

-- Admins can view their own sessions
CREATE POLICY "Admins can view own sessions"
ON public.admin_sessions
FOR SELECT
USING (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Admins can create their own sessions
CREATE POLICY "Admins can create own sessions"
ON public.admin_sessions
FOR INSERT
WITH CHECK (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Admins can update their own sessions
CREATE POLICY "Admins can update own sessions"
ON public.admin_sessions
FOR UPDATE
USING (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- 4. UPDATE RLS POLICIES - ADMIN ACTIVITY LOGS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Admin logs via API only" ON public.admin_activity_logs;

-- Admins can view all activity logs
CREATE POLICY "Admins can view all logs"
ON public.admin_activity_logs
FOR SELECT
USING (is_admin());

-- Admins can insert their own logs
CREATE POLICY "Admins can create logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (
  admin_user_id IN (
    SELECT id FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- 5. UPDATE RLS POLICIES - ADMIN INVITATIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Admin invitations via API only" ON public.admin_invitations;

-- Admins can view all invitations
CREATE POLICY "Admins can view invitations"
ON public.admin_invitations
FOR SELECT
USING (is_admin());

-- Only super_admins can create invitations
CREATE POLICY "Super admins can create invitations"
ON public.admin_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  )
);

-- =============================================================================
-- 6. UPDATE RLS POLICIES - PROFILES TABLE (for admin user management)
-- =============================================================================

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (id = auth.uid() OR is_admin());

-- Admins can update user status (for banning/suspending)
CREATE POLICY "Admins can update user status"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid() OR
  (is_admin() AND auth.uid() != id) -- Admins can't modify their own profile
)
WITH CHECK (
  id = auth.uid() OR
  (is_admin() AND auth.uid() != id)
);

-- =============================================================================
-- 7. GRANT EXECUTE PERMISSIONS
-- =============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin() TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Next steps:
-- 1. Update API routes to use standard authenticated client
-- 2. Remove service_role bypass patterns
-- 3. Test admin functionality with new RLS
