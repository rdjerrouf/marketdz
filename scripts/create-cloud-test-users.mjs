#!/usr/bin/env node
// Creates user1..user20@email.com in cloud Supabase auth with confirmed emails,
// and ensures matching rows exist in public.profiles.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required (source .env.cloud)')
  process.exit(1)
}

const PASSWORD = 'TestPass123!'
const EMAILS = Array.from({ length: 20 }, (_, i) => `user${i + 1}@email.com`)
const WILAYAS = ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Setif', 'Blida', 'Batna', 'Bejaia']

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

// Index existing users so we don't try to re-create
const existing = new Map()
let page = 1
while (page <= 20) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
  if (error) { console.error('listUsers:', error.message); process.exit(1) }
  for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id)
  if (data.users.length < 200) break
  page++
}

const results = []
for (let i = 0; i < EMAILS.length; i++) {
  const email = EMAILS[i]
  let userId = existing.get(email.toLowerCase())

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: `User`, last_name: `${i + 1}` },
    })
    if (error) {
      console.error(`  ❌ create ${email}:`, error.message)
      continue
    }
    userId = data.user.id
    console.log(`  ✓ created ${email}`)
  } else {
    console.log(`  • already exists: ${email}`)
  }

  // Upsert a profile row so listings.user_id FK is satisfied and queries work
  const wilaya = WILAYAS[i % WILAYAS.length]
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      first_name: 'User',
      last_name: String(i + 1),
      city: `${wilaya} Center`,
      wilaya,
    }, { onConflict: 'id' })

  if (profileErr) console.error(`  ⚠️  profile upsert ${email}:`, profileErr.message)
  results.push({ email, userId })
}

console.log(`\n✅ Done. ${results.length}/${EMAILS.length} test users ready.`)
console.log(`Password for all: ${PASSWORD}`)
