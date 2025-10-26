#!/usr/bin/env node
/**
 * Clean Storage Bucket - Delete all files from listing-photos bucket
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vrlzwxoiglzwmhndpolj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanStorageBucket() {
  console.log('🧹 Cleaning listing-photos storage bucket...\n');

  const BUCKET_NAME = 'listing-photos';

  try {
    // List all files in the bucket
    console.log('1️⃣  Listing all files in bucket...');
    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 10000,
        offset: 0
      });

    if (listError) {
      console.error('❌ Error listing files:', listError);
      process.exit(1);
    }

    if (!files || files.length === 0) {
      console.log('✅ Bucket is already empty!\n');
      return;
    }

    console.log(`   Found ${files.length} files/folders\n`);

    // Get all file paths recursively
    const allPaths = [];

    async function getAllFiles(prefix = '') {
      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .list(prefix, {
          limit: 1000
        });

      if (error) {
        console.error(`❌ Error listing ${prefix}:`, error);
        return;
      }

      for (const item of data) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

        if (item.id) {
          // It's a file
          allPaths.push(fullPath);
        } else {
          // It's a folder, recurse
          await getAllFiles(fullPath);
        }
      }
    }

    console.log('2️⃣  Scanning all files recursively...');
    await getAllFiles();
    console.log(`   Found ${allPaths.length} files total\n`);

    if (allPaths.length === 0) {
      console.log('✅ No files to delete!\n');
      return;
    }

    // Delete files in batches
    console.log('3️⃣  Deleting files...');
    const BATCH_SIZE = 100;
    let deleted = 0;

    for (let i = 0; i < allPaths.length; i += BATCH_SIZE) {
      const batch = allPaths.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove(batch);

      if (error) {
        console.error(`❌ Error deleting batch ${i / BATCH_SIZE + 1}:`, error);
      } else {
        deleted += batch.length;
        console.log(`   Deleted ${deleted}/${allPaths.length} files...`);
      }
    }

    console.log(`\n✅ Storage cleanup complete!`);
    console.log(`   Deleted ${deleted} files from ${BUCKET_NAME} bucket\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

cleanStorageBucket().catch(console.error);
