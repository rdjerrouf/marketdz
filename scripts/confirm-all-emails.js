#!/usr/bin/env node
/**
 * Confirm all user emails in local Supabase
 * This allows users to sign in without email verification
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllEmails() {
  console.log('📧 Confirming all user emails...\n');

  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  console.log(`Found ${users.length} users\n`);

  // Confirm each user
  for (const user of users) {
    if (!user.email_confirmed_at) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error(`❌ Error confirming ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ Confirmed: ${user.email}`);
      }
    } else {
      console.log(`✓ Already confirmed: ${user.email}`);
    }
  }

  console.log('\n✅ All emails confirmed!');
}

confirmAllEmails().catch(console.error);
