#!/usr/bin/env node

// Reset password for admin account
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function resetAdminPassword() {
  if (!SERVICE_ROLE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Update password for rdjerrouf@gmail.com
    const { data, error } = await supabase.auth.admin.updateUserById(
      '407b4e2f-2c18-4e45-b0b0-9d183b2893be', // Your user ID
      {
        password: 'newpassword123'
      }
    );

    if (error) {
      console.log('❌ Password reset failed:', error.message);
    } else {
      console.log('✅ Password updated successfully!');
      console.log('📧 Email: rdjerrouf@gmail.com');
      console.log('🔑 New Password: newpassword123');
      console.log('');
      console.log('Now try signing in at: http://localhost:3003/signin');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

resetAdminPassword();