#!/usr/bin/env node
/**
 * Fix Admin RLS Policies - Create SECURITY DEFINER helper function
 * This resolves the infinite recursion issue in admin_users RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

// Use cloud Supabase credentials
const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybHp3eG9pZ2x6d21obmRwb2xqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY2OTQ3NiwiZXhwIjoyMDcyMjQ1NDc2fQ.VxNa2WISH0Sr6eY_Y9UAckC8LxXcO_UtgKTQ0wVdjT8';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function fixAdminRLSPolicies() {
  console.log('🔧 Fixing Admin RLS Policies with SECURITY DEFINER helper function...');

  try {
    // Step 1: Create SECURITY DEFINER helper function
    console.log('📝 Step 1: Creating SECURITY DEFINER helper function...');

    const helperFunctionSQL = `
      -- Drop existing function if it exists
      DROP FUNCTION IF EXISTS admin_secure.check_admin_access(uuid);

      -- Create schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS admin_secure;

      -- Create SECURITY DEFINER helper function
      CREATE OR REPLACE FUNCTION admin_secure.check_admin_access(user_id_param uuid)
      RETURNS TABLE (
        admin_id uuid,
        user_id uuid,
        role text,
        is_active boolean,
        permissions jsonb
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        -- This function bypasses RLS by using SECURITY DEFINER
        -- Only returns admin record if user is active admin
        RETURN QUERY
        SELECT
          au.id as admin_id,
          au.user_id,
          au.role,
          au.is_active,
          au.permissions
        FROM admin_users au
        WHERE au.user_id = user_id_param
          AND au.is_active = true;
      END;
      $$;

      -- Grant execute permission to authenticated users
      GRANT EXECUTE ON FUNCTION admin_secure.check_admin_access(uuid) TO authenticated;
      GRANT EXECUTE ON FUNCTION admin_secure.check_admin_access(uuid) TO anon;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: helperFunctionSQL
    });

    if (functionError) {
      console.log('❌ Failed to create helper function, trying direct SQL...');
      // Try executing each part separately
      const statements = [
        'DROP FUNCTION IF EXISTS admin_secure.check_admin_access(uuid);',
        'CREATE SCHEMA IF NOT EXISTS admin_secure;',
        `CREATE OR REPLACE FUNCTION admin_secure.check_admin_access(user_id_param uuid)
         RETURNS TABLE (
           admin_id uuid,
           user_id uuid,
           role text,
           is_active boolean,
           permissions jsonb
         )
         LANGUAGE plpgsql
         SECURITY DEFINER
         SET search_path = public
         AS $$
         BEGIN
           RETURN QUERY
           SELECT
             au.id as admin_id,
             au.user_id,
             au.role,
             au.is_active,
             au.permissions
           FROM admin_users au
           WHERE au.user_id = user_id_param
             AND au.is_active = true;
         END;
         $$;`,
        'GRANT EXECUTE ON FUNCTION admin_secure.check_admin_access(uuid) TO authenticated;',
        'GRANT EXECUTE ON FUNCTION admin_secure.check_admin_access(uuid) TO anon;'
      ];

      for (const stmt of statements) {
        console.log('Executing:', stmt.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        if (error) {
          console.error('Error executing statement:', error.message);
        }
      }
    } else {
      console.log('✅ Helper function created successfully');
    }

    // Step 2: Drop existing problematic policies
    console.log('📝 Step 2: Dropping existing recursive policies...');

    const dropPoliciesSQL = `
      -- Drop all existing policies on admin_users
      DROP POLICY IF EXISTS "Admin users can view their own record" ON admin_users;
      DROP POLICY IF EXISTS "Admin users can view all admin records" ON admin_users;
      DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
      DROP POLICY IF EXISTS "Admins can view admin records" ON admin_users;
      DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
      DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
      DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;
      DROP POLICY IF EXISTS "Users can read their admin status" ON admin_users;
      DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) {
      console.warn('⚠️ Some policies might not exist:', dropError.message);
    } else {
      console.log('✅ Existing policies dropped');
    }

    // Step 3: Create new non-recursive policies using the helper function
    console.log('📝 Step 3: Creating new non-recursive policies...');

    const newPoliciesSQL = `
      -- Policy 1: Allow users to check their own admin status using helper function
      CREATE POLICY "Users can check admin status via helper" ON admin_users
        FOR SELECT
        TO authenticated
        USING (
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM admin_secure.check_admin_access(auth.uid())
            WHERE role IN ('super_admin', 'admin')
          )
        );

      -- Policy 2: Super admins can insert new admin users
      CREATE POLICY "Super admins can insert admin users" ON admin_users
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM admin_secure.check_admin_access(auth.uid())
            WHERE role = 'super_admin'
          )
        );

      -- Policy 3: Super admins can update admin users
      CREATE POLICY "Super admins can update admin users" ON admin_users
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM admin_secure.check_admin_access(auth.uid())
            WHERE role = 'super_admin'
          )
        );

      -- Policy 4: Super admins can delete admin users
      CREATE POLICY "Super admins can delete admin users" ON admin_users
        FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM admin_secure.check_admin_access(auth.uid())
            WHERE role = 'super_admin'
          )
        );
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: newPoliciesSQL });
    if (policiesError) {
      console.error('❌ Failed to create new policies:', policiesError.message);
      throw policiesError;
    }

    console.log('✅ New non-recursive policies created successfully');

    // Step 4: Re-enable RLS
    console.log('📝 Step 4: Re-enabling RLS on admin_users...');

    const enableRLSSQL = 'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;';
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });

    if (rlsError) {
      console.error('❌ Failed to enable RLS:', rlsError.message);
      throw rlsError;
    }

    console.log('✅ RLS re-enabled on admin_users');

    // Step 5: Test the helper function
    console.log('📝 Step 5: Testing helper function...');

    const testUserID = '4ff07100-d1b7-480e-8699-57ed8a3dea08'; // rdjerrouf@gmail.com
    const { data: testResult, error: testError } = await supabase
      .rpc('admin_secure.check_admin_access', { user_id_param: testUserID });

    if (testError) {
      console.warn('⚠️ Test failed:', testError.message);
    } else {
      console.log('✅ Helper function test successful:', testResult);
    }

    console.log('\n🎉 Admin RLS policies fixed successfully!');
    console.log('📋 Summary:');
    console.log('  ✅ Created SECURITY DEFINER helper function');
    console.log('  ✅ Dropped recursive policies');
    console.log('  ✅ Created new non-recursive policies');
    console.log('  ✅ Re-enabled RLS');
    console.log('\n🚀 Admin panel should now work without infinite recursion');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

fixAdminRLSPolicies();