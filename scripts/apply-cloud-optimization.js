#!/usr/bin/env node

/**
 * Apply Lean Launch Optimization to Cloud Supabase
 * Executes the critical optimization migration manually
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vrlzwxoiglzwmhndpolj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Lean optimization SQL commands (from migration 20250910000001)
const optimizationCommands = [
  // Drop unnecessary category-specific indexes
  "DROP INDEX IF EXISTS idx_listings_available_from;",
  "DROP INDEX IF EXISTS idx_listings_available_to;",
  "DROP INDEX IF EXISTS idx_listings_salary_min;",
  "DROP INDEX IF EXISTS idx_listings_salary_max;",
  "DROP INDEX IF EXISTS idx_listings_job_type;",
  "DROP INDEX IF EXISTS idx_listings_company_name;",
  "DROP INDEX IF EXISTS idx_listings_condition;",
  "DROP INDEX IF EXISTS idx_listings_rental_period;",
  
  // Drop redundant composite indexes
  "DROP INDEX IF EXISTS idx_listings_job_filters;",
  "DROP INDEX IF EXISTS idx_listings_rent_filters;",
  "DROP INDEX IF EXISTS idx_listings_sale_filters;",
  
  // Drop redundant indexes
  "DROP INDEX IF EXISTS idx_listings_created_at;",
  "DROP INDEX IF EXISTS idx_listings_wilaya_status_active;",
  "DROP INDEX IF EXISTS idx_listings_category_status_active;",
  "DROP INDEX IF EXISTS idx_listings_price;",
  "DROP INDEX IF EXISTS idx_listings_price_active;",
  "DROP INDEX IF EXISTS idx_listings_location;",
  
  // Create essential optimized indexes
  `CREATE INDEX IF NOT EXISTS idx_listings_search_compound 
   ON public.listings (status, category, location_wilaya, price, created_at DESC)
   WHERE status = 'active';`,
  
  `CREATE INDEX IF NOT EXISTS idx_listings_fulltext 
   ON public.listings USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));`,
   
  "CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings (user_id);",
  "CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles (id);"
];

async function applyOptimization() {
  console.log('🚀 Applying Lean Launch Optimization to Cloud Supabase...');
  
  let successCount = 0;
  let skipCount = 0;
  
  for (const [index, sql] of optimizationCommands.entries()) {
    try {
      console.log(`📋 [${index + 1}/${optimizationCommands.length}] ${sql.slice(0, 60)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log(`⚠️  Skipped (already optimized): ${error.message}`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      } else {
        console.log('✅ Success');
        successCount++;
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
    }
  }
  
  console.log(`\n🎉 Lean Optimization Results:`);
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`⚠️  Skipped operations: ${skipCount}`);
  console.log(`📊 Total operations: ${optimizationCommands.length}`);
  
  // Test performance after optimization
  console.log('\n⚡ Testing search performance after optimization...');
  const start = Date.now();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .limit(20);
    
  const searchTime = Date.now() - start;
  
  if (error) {
    console.error(`❌ Search test failed: ${error.message}`);
  } else {
    console.log(`🔍 Search performance: ${searchTime}ms for ${data.length} results`);
    console.log(`💡 Expected improvement: Should be faster than 1500ms`);
  }
}

// Check if we have the exec_sql function
async function checkExecFunction() {
  console.log('🔍 Checking if exec_sql function exists...');
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: 'SELECT 1 as test;' 
  });
  
  if (error) {
    console.log('❌ exec_sql function not available');
    console.log('💡 Try running optimization manually via Supabase dashboard SQL editor');
    return false;
  } else {
    console.log('✅ exec_sql function is available');
    return true;
  }
}

async function main() {
  try {
    const hasExecFunction = await checkExecFunction();
    
    if (hasExecFunction) {
      await applyOptimization();
    } else {
      console.log('\n📋 Manual optimization required:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Run the lean optimization commands manually');
      console.log('3. This will drop 30+ indexes and keep only ~15 essential ones');
    }
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
  }
}

if (require.main === module) {
  main();
}