-- Add admin user
-- Replace 'your-email@example.com' with your actual email

-- First, find your user ID (replace with your actual email)
-- You can find this in your Supabase Auth dashboard

-- Example admin user insertion (you'll need to replace the user_id with your actual UUID)
-- INSERT INTO admin_users (user_id, role, permissions) 
-- SELECT id, 'admin', '["users:manage", "listings:manage", "reports:manage", "analytics:view"]'::jsonb
-- FROM auth.users 
-- WHERE email = 'your-email@example.com';

-- For now, let's just show existing users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
