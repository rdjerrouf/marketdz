#!/usr/bin/env node
// Upload everything in ./test_photos to the cloud `listing-photos` bucket,
// preserving subfolder structure under `test_photos/`.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_PHOTOS_DIR = path.join(__dirname, '../test_photos')
const BUCKET = 'listing-photos'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const isImage = (f) => /\.(jpg|jpeg|png|webp)$/i.test(f)
const contentType = (f) => {
  const e = path.extname(f).toLowerCase()
  if (e === '.png') return 'image/png'
  if (e === '.webp') return 'image/webp'
  return 'image/jpeg'
}

// Collect every image file with its target key
const files = []
for (const entry of fs.readdirSync(TEST_PHOTOS_DIR, { withFileTypes: true })) {
  if (entry.isFile() && isImage(entry.name)) {
    files.push({
      localPath: path.join(TEST_PHOTOS_DIR, entry.name),
      objectKey: `test_photos/${entry.name}`,
    })
  } else if (entry.isDirectory()) {
    const sub = path.join(TEST_PHOTOS_DIR, entry.name)
    for (const f of fs.readdirSync(sub)) {
      if (!isImage(f)) continue
      files.push({
        localPath: path.join(sub, f),
        objectKey: `test_photos/${entry.name}/${f}`,
      })
    }
  }
}

console.log(`📤 Uploading ${files.length} files to ${BUCKET}/test_photos/...`)
let ok = 0, fail = 0
for (const f of files) {
  const body = fs.readFileSync(f.localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(f.objectKey, body, {
      contentType: contentType(f.localPath),
      upsert: true,
    })
  if (error) {
    console.error(`  ❌ ${f.objectKey}: ${error.message}`)
    fail++
  } else {
    ok++
    if (ok % 25 === 0) console.log(`  ✓ uploaded ${ok}/${files.length}`)
  }
}

console.log(`\n✅ Uploaded ${ok}/${files.length} (${fail} failures)`)
console.log(`Public URL pattern: ${url}/storage/v1/object/public/${BUCKET}/test_photos/...`)
