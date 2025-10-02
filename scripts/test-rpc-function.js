#!/usr/bin/env node
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

const supabaseUrl = envVars.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing RPC function with admin client...\n');

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testRPC() {
  const userId = '85f21d73-4983-42ed-8681-60b4f54b2b79';

  console.log('Calling check_admin_status RPC for user:', userId);

  const { data, error } = await adminClient
    .rpc('check_admin_status', { check_user_id: userId });

  if (error) {
    console.error('❌ RPC Error:', error);
    process.exit(1);
  }

  console.log('✅ RPC Success!');
  console.log('Result:', JSON.stringify(data, null, 2));
}

testRPC().catch(console.error);
