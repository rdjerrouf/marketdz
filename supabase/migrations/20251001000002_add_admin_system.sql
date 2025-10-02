-- =============================================================================
-- ADMIN SYSTEM MIGRATION
-- Adds complete admin infrastructure to MarketDZ
-- =============================================================================
-- This migration adds:
-- 1. Admin role types and user status enum
-- 2. Admin users table with role-based access
-- 3. Admin sessions for secure login tracking
-- 4. Admin activity logs for audit trail
-- 5. Admin invitations system
-- 6. User status column for suspension/banning
-- =============================================================================

-- =============================================================================
-- 1. SKIP ENUMS (Using text with CHECK constraints for PostgREST compatibility)
-- =============================================================================

-- NOTE: Originally used enums, but PostgREST has issues with custom enums
-- Using text with CHECK constraints instead for better compatibility

-- =============================================================================
-- 2. UPDATE PROFILES TABLE
-- =============================================================================

-- Add status column to profiles for user moderation (using text instead of enum)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL;

-- Add CHECK constraint for valid statuses
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended', 'banned'));

COMMENT ON COLUMN public.profiles.status IS 'Account status - can be suspended or banned by admins (active, suspended, banned)';

-- Index for filtering users by status
CREATE INDEX IF NOT EXISTS idx_profiles_status
ON public.profiles(status);

-- =============================================================================
-- 3. ADMIN USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'support',
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    last_login_at timestamptz
);

-- Add CHECK constraint for valid roles
ALTER TABLE public.admin_users
    ADD CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'admin', 'moderator', 'support'));

COMMENT ON TABLE public.admin_users IS 'Stores admin user accounts with role-based permissions';
COMMENT ON COLUMN public.admin_users.user_id IS 'Reference to profiles table (one admin per user)';
COMMENT ON COLUMN public.admin_users.role IS 'Admin role determining permission level (super_admin, admin, moderator, support)';
COMMENT ON COLUMN public.admin_users.permissions IS 'Additional granular permissions (JSON)';
COMMENT ON COLUMN public.admin_users.is_active IS 'Whether admin account is currently active';

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_admin_users_user_active
ON public.admin_users(user_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_users_role
ON public.admin_users(role)
WHERE is_active = true;

-- =============================================================================
-- 4. ADMIN SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    session_token text UNIQUE NOT NULL,
    ip_address text,
    user_agent text,
    is_active boolean DEFAULT true NOT NULL,
    logout_reason text,
    created_at timestamptz DEFAULT now() NOT NULL,
    last_activity_at timestamptz DEFAULT now() NOT NULL,
    expires_at timestamptz NOT NULL
);

COMMENT ON TABLE public.admin_sessions IS 'Tracks admin login sessions for security and auditing';
COMMENT ON COLUMN public.admin_sessions.session_token IS 'Unique token for session identification';
COMMENT ON COLUMN public.admin_sessions.logout_reason IS 'Why session ended: manual, timeout, security';

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token
ON public.admin_sessions(session_token)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin
ON public.admin_sessions(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
ON public.admin_sessions(expires_at)
WHERE is_active = true;

-- =============================================================================
-- 5. ADMIN ACTIVITY LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_type text,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.admin_activity_logs IS 'Audit trail of all admin actions';
COMMENT ON COLUMN public.admin_activity_logs.action IS 'Action performed (e.g., user_suspended, listing_deleted)';
COMMENT ON COLUMN public.admin_activity_logs.target_type IS 'Type of target (e.g., user, listing, admin)';
COMMENT ON COLUMN public.admin_activity_logs.target_id IS 'ID of the target entity';
COMMENT ON COLUMN public.admin_activity_logs.details IS 'Additional context about the action (JSON)';

-- Indexes for log queries
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_time
ON public.admin_activity_logs(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_target
ON public.admin_activity_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action_time
ON public.admin_activity_logs(action, created_at DESC);

-- =============================================================================
-- 6. ADMIN INVITATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    invited_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
    role text NOT NULL,
    invitation_token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT admin_invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE public.admin_invitations IS 'Invitations to join admin team';
COMMENT ON COLUMN public.admin_invitations.invitation_token IS 'Unique token for invitation link';
COMMENT ON COLUMN public.admin_invitations.expires_at IS 'When invitation expires (typically 7 days)';
COMMENT ON COLUMN public.admin_invitations.accepted_at IS 'When invitation was accepted (NULL if pending)';

-- Index for active invitations
CREATE INDEX IF NOT EXISTS idx_admin_invites_token
ON public.admin_invitations(invitation_token)
WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_invites_email
ON public.admin_invitations(email)
WHERE accepted_at IS NULL;

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Admin tables should ONLY be accessed via API routes using service role
-- This prevents direct client access and ensures all admin actions are logged

CREATE POLICY "Admin users via API only"
ON public.admin_users
FOR ALL
USING (false);

CREATE POLICY "Admin sessions via API only"
ON public.admin_sessions
FOR ALL
USING (false);

CREATE POLICY "Admin logs via API only"
ON public.admin_activity_logs
FOR ALL
USING (false);

CREATE POLICY "Admin invitations via API only"
ON public.admin_invitations
FOR ALL
USING (false);

-- =============================================================================
-- 8. TRIGGERS & FUNCTIONS
-- =============================================================================

-- Update admin_users updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

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
-- 9. GRANTS (if needed for specific roles)
-- =============================================================================

-- Grant service_role access to admin tables (already has it by default)
-- These tables should ONLY be accessed by service_role via API routes

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Next steps:
-- 1. Run seed script to create first super_admin
-- 2. Test admin login at /admin
-- 3. Remove legacy email-based fallback code
