#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkSchema() {
  console.log('🔍 Checking Arabic search schema...\n');

  // Check if Arabic functions exist
  console.log('📊 Available functions:');
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .ilike('proname', '%arabic%');

  if (funcError) {
    console.error('❌ Error checking functions:', funcError);
  } else {
    console.log('Arabic functions found:', functions?.map(f => f.proname) || 'None');
  }

  // Check listings table structure
  console.log('\n📋 Listings table columns:');
  const { data: columns, error: colError } = await supabase.rpc('exec', {
    sql: `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'listings' 
      ORDER BY ordinal_position;
    `
  });

  if (colError) {
    console.error('❌ Error checking columns:', colError);
  } else {
    columns?.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  }

  // Check if Arabic search tables exist
  console.log('\n📚 Arabic search tables:');
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .ilike('table_name', '%arabic%');

  if (tableError) {
    console.error('❌ Error checking tables:', tableError);
  } else {
    console.log('Arabic tables found:', tables?.map(t => t.table_name) || 'None');
  }

  // Check text search configurations
  console.log('\n🔤 Text search configurations:');
  const { data: configs, error: configError } = await supabase.rpc('exec', {
    sql: 'SELECT cfgname FROM pg_ts_config WHERE cfgname LIKE \'%arabic%\' OR cfgname LIKE \'%ar_%\';'
  });

  if (configError) {
    console.error('❌ Error checking configs:', configError);
  } else {
    console.log('Text search configs found:', configs?.map(c => c.cfgname) || 'None');
  }

  // Try basic listing query
  console.log('\n📃 Testing basic listings query:');
  const { data: listings, error: listError } = await supabase
    .from('listings')
    .select('*')
    .limit(3);

  if (listError) {
    console.error('❌ Error querying listings:', listError);
  } else {
    console.log(`✅ Found ${listings?.length || 0} listings`);
    if (listings && listings.length > 0) {
      console.log('Sample listing columns:', Object.keys(listings[0]).join(', '));
    }
  }

  console.log('\n🏁 Schema check completed');
}

if (require.main === module) {
  checkSchema();
}

module.exports = { checkSchema };