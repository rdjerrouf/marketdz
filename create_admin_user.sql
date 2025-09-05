-- Create Admin User Script
-- This script will make you an admin user for the MarketDZ admin dashboard

-- First, let's see what users exist
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name
FROM auth.users 
ORDER BY created_at DESC;

-- If you see your user above, copy the ID and run the command below
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from the query above

-- Uncomment and modify the line below with your user ID:
-- INSERT INTO admin_users (user_id, role, permissions) 
-- VALUES ('YOUR_USER_ID_HERE', 'admin', '["users:manage", "listings:manage", "reports:manage", "analytics:view", "notifications:send"]'::jsonb)
-- ON CONFLICT (user_id) DO UPDATE SET 
--   role = EXCLUDED.role,
--   permissions = EXCLUDED.permissions,
--   updated_at = NOW();
