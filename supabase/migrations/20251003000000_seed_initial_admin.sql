-- =============================================================================
-- SEED INITIAL ADMIN USER
-- Created: 2025-10-03
-- Purpose: Add rdjerrouf@gmail.com as initial super_admin
-- =============================================================================

-- Insert admin user record
-- This uses the auth.users email to find the user_id
INSERT INTO public.admin_users (user_id, role, is_active, permissions, notes)
SELECT
  id,
  'super_admin'::text,
  true,
  '{}'::jsonb,
  'Initial super admin - seeded via migration'
FROM auth.users
WHERE email = 'rdjerrouf@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = now(),
  notes = COALESCE(admin_users.notes, '') || ' | Updated via migration ' || now()::date;

-- Also add anyadjerrouf@gmail.com as admin if exists
INSERT INTO public.admin_users (user_id, role, is_active, permissions, notes)
SELECT
  id,
  'admin'::text,
  true,
  '{}'::jsonb,
  'Admin user - seeded via migration'
FROM auth.users
WHERE email = 'anyadjerrouf@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  is_active = true,
  updated_at = now(),
  notes = COALESCE(admin_users.notes, '') || ' | Updated via migration ' || now()::date;

-- Log the seeding action
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  RAISE NOTICE 'Admin users table now has % records', admin_count;
END $$;

-- Verify the seeded admins
SELECT
  au.id,
  au.user_id,
  u.email,
  au.role,
  au.is_active,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email IN ('rdjerrouf@gmail.com', 'anyadjerrouf@gmail.com');
