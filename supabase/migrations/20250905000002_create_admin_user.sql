-- Create Admin User Migration
-- This migration will help you become an admin user

-- Step 1: Check existing users and create a function to make admin
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- If there are users, let's show them for reference
    IF user_count > 0 THEN
        RAISE NOTICE 'Found % users in the system:', user_count;
        
        -- Show recent users (for reference in logs)
        FOR user_record IN 
            SELECT id, email, created_at 
            FROM auth.users 
            ORDER BY created_at DESC 
            LIMIT 5
        LOOP
            RAISE NOTICE 'User: % (ID: %)', user_record.email, user_record.id;
        END LOOP;
        
        -- Auto-make the first/most recent user an admin if no admins exist
        IF NOT EXISTS (SELECT 1 FROM admin_users) THEN
            INSERT INTO admin_users (user_id, role, permissions)
            SELECT 
                id, 
                'admin', 
                '["users:manage", "listings:manage", "reports:manage", "analytics:view", "notifications:send"]'::jsonb
            FROM auth.users 
            ORDER BY created_at ASC 
            LIMIT 1;
            
            RAISE NOTICE 'Created admin user for the first registered user';
        END IF;
    ELSE
        RAISE NOTICE 'No users found in the system yet';
    END IF;
END $$;

-- Create a helper function to make any user an admin (for future use)
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    result_text TEXT;
BEGIN
    -- Find user by email
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'User not found with email: ' || user_email;
    END IF;
    
    -- Insert or update admin record
    INSERT INTO admin_users (user_id, role, permissions) 
    VALUES (
        user_id, 
        'admin', 
        '["users:manage", "listings:manage", "reports:manage", "analytics:view", "notifications:send"]'::jsonb
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = NOW();
    
    RETURN 'Successfully made ' || user_email || ' an admin user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage (uncomment and modify with your email):
-- SELECT make_user_admin('your-email@example.com');
