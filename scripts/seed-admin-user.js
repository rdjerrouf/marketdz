#!/usr/bin/env node

/**
 * Seed Admin User Script
 *
 * This script adds the initial admin users to the admin_users table.
 * It can be run locally or in production to bootstrap admin access.
 *
 * Usage:
 *   node scripts/seed-admin-user.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
  console.log('✓ Loaded environment from .env.local')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedAdminUsers() {
  console.log('🌱 Seeding admin users...\n')

  const adminUsers = [
    { email: 'rdjerrouf@gmail.com', role: 'super_admin' },
    { email: 'anyadjerrouf@gmail.com', role: 'admin' }
  ]

  for (const admin of adminUsers) {
    try {
      console.log(`📧 Processing ${admin.email}...`)

      // Find user by email
      const { data: authUsers, error: findError } = await supabase.auth.admin.listUsers()

      if (findError) {
        console.error(`❌ Error listing users: ${findError.message}`)
        continue
      }

      const authUser = authUsers.users.find(u => u.email === admin.email)

      if (!authUser) {
        console.log(`⚠️  User ${admin.email} not found in auth.users - skipping`)
        continue
      }

      console.log(`✓ Found user: ${authUser.id}`)

      // Check if admin record already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (checkError) {
        console.error(`❌ Error checking admin_users: ${checkError.message}`)
        continue
      }

      if (existingAdmin) {
        // Update existing admin
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            role: admin.role,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', authUser.id)

        if (updateError) {
          console.error(`❌ Error updating admin: ${updateError.message}`)
          continue
        }

        console.log(`✅ Updated existing admin: ${admin.email} → ${admin.role}`)
      } else {
        // Insert new admin
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert({
            user_id: authUser.id,
            role: admin.role,
            is_active: true,
            permissions: {},
            notes: 'Seeded via seed-admin-user.js script'
          })

        if (insertError) {
          console.error(`❌ Error inserting admin: ${insertError.message}`)
          continue
        }

        console.log(`✅ Created new admin: ${admin.email} → ${admin.role}`)
      }

    } catch (error) {
      console.error(`❌ Unexpected error for ${admin.email}:`, error.message)
    }
  }

  // Verify seeded admins
  console.log('\n📊 Verifying admin_users table...')
  const { data: allAdmins, error: verifyError } = await supabase
    .from('admin_users')
    .select('id, user_id, role, is_active')

  if (verifyError) {
    console.error('❌ Error verifying admins:', verifyError.message)
  } else {
    console.log(`✓ Total admins in table: ${allAdmins?.length || 0}`)
    if (allAdmins && allAdmins.length > 0) {
      console.log('\nAdmin users:')
      for (const admin of allAdmins) {
        // Fetch email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id)
        console.log(`  - ${authUser?.user?.email || 'unknown'} (${admin.role})`)
      }
    }
  }

  console.log('\n✅ Admin seeding complete!')
  console.log('⚠️  Remember to remove the bootstrap fallback from middleware.ts after confirming access')
}

seedAdminUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
