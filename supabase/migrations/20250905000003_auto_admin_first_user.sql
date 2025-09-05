-- Auto-Admin First User Migration
-- This will automatically make the first user who signs up an admin

-- Create function to auto-make first user admin
CREATE OR REPLACE FUNCTION auto_admin_first_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user and no admins exist
  IF (SELECT COUNT(*) FROM auth.users) = 1 AND NOT EXISTS (SELECT 1 FROM admin_users) THEN
    -- Make this user an admin
    INSERT INTO admin_users (user_id, role, permissions) 
    VALUES (
      NEW.id, 
      'admin', 
      '["users:manage", "listings:manage", "reports:manage", "analytics:view", "notifications:send"]'::jsonb
    );
    
    -- Log this action
    RAISE NOTICE 'Auto-created admin user for first signup: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run this function after user creation
DROP TRIGGER IF EXISTS auto_admin_first_user_trigger ON auth.users;
CREATE TRIGGER auto_admin_first_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_admin_first_user();
