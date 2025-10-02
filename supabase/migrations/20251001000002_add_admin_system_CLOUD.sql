-- =============================================================================
-- ADMIN SYSTEM MIGRATION (CLOUD-SAFE VERSION)
-- =============================================================================
-- This is a modified version of 20251001000002_add_admin_system.sql
-- Adapted for Supabase Cloud where admin tables already exist
--
-- SKIPPED (already exists in cloud):
-- - Admin table creation (admin_users, admin_sessions, etc.)
-- - profiles.status column (already exists)
-- - "via API only" deny-all RLS policies (replaced by role-based RLS)
--
-- INCLUDED (safe to run):
-- - Functions and triggers
-- - Indexes (IF NOT EXISTS protects against duplicates)
-- =============================================================================

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Update admin_users updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_admin_users_updated_at'
        AND tgrelid = 'public.admin_users'::regclass
    ) THEN
        CREATE TRIGGER update_admin_users_updated_at
            BEFORE UPDATE ON public.admin_users
            FOR EACH ROW
            EXECUTE FUNCTION update_admin_users_updated_at();
    END IF;
END $$;

-- Cleanup expired sessions function
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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Deactivates expired admin sessions. Call periodically via cron.';

-- =============================================================================
-- INDEXES (IF NOT EXISTS makes all of these safe)
-- =============================================================================

-- Admin Users Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_active
ON public.admin_users(user_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_users_role
ON public.admin_users(role)
WHERE is_active = true;

-- Admin Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token
ON public.admin_sessions(session_token)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin
ON public.admin_sessions(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
ON public.admin_sessions(expires_at)
WHERE is_active = true;

-- Admin Activity Logs Indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_time
ON public.admin_activity_logs(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_target
ON public.admin_activity_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action_time
ON public.admin_activity_logs(action, created_at DESC);

-- Admin Invitations Indexes
CREATE INDEX IF NOT EXISTS idx_admin_invites_token
ON public.admin_invitations(invitation_token)
WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_invites_email
ON public.admin_invitations(email)
WHERE accepted_at IS NULL;

-- Profiles Status Index (might already exist)
CREATE INDEX IF NOT EXISTS idx_profiles_status
ON public.profiles(status);

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify admin tables exist
DO $$
BEGIN
    -- Check admin_users table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
        RAISE EXCEPTION 'admin_users table does not exist. This migration requires existing admin tables.';
    END IF;

    -- Check admin_sessions table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_sessions') THEN
        RAISE EXCEPTION 'admin_sessions table does not exist. This migration requires existing admin tables.';
    END IF;

    -- Check admin_activity_logs table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_activity_logs') THEN
        RAISE EXCEPTION 'admin_activity_logs table does not exist. This migration requires existing admin tables.';
    END IF;

    -- Check admin_invitations table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_invitations') THEN
        RAISE EXCEPTION 'admin_invitations table does not exist. This migration requires existing admin tables.';
    END IF;

    RAISE NOTICE 'All admin tables verified successfully';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE (CLOUD-SAFE VERSION)
-- =============================================================================

-- Next steps:
-- 1. Apply 20251001000004_add_role_based_rls.sql to add RLS policies
-- 2. Create first super_admin user
-- 3. Test admin access
