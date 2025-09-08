-- Supabase Production Database Verification Script
-- Run these queries in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications') 
    THEN '✅ Core Table' 
    ELSE '📋 Other Table' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
  CASE WHEN table_name IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications') THEN 1 ELSE 2 END,
  table_name;

-- 2. Check performance indexes
SELECT 
  i.indexname,
  i.tablename,
  CASE 
    WHEN i.indexname LIKE 'idx_%' THEN '🚀 Performance Index'
    WHEN i.indexname LIKE '%_pkey' THEN '🔑 Primary Key'
    WHEN i.indexname LIKE '%_fkey' THEN '🔗 Foreign Key'
    ELSE '📋 Other Index'
  END as index_type
FROM pg_indexes i
WHERE i.schemaname = 'public'
AND i.tablename IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications')
ORDER BY i.tablename, i.indexname;

-- 3. Check RLS is enabled
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Enabled' 
    ELSE '⚠️ RLS Disabled' 
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications')
ORDER BY tablename;

-- 4. Check RLS policies exist
SELECT 
  p.tablename,
  p.policyname,
  p.cmd as operation,
  CASE 
    WHEN p.qual IS NOT NULL THEN '✅ Has Conditions'
    ELSE '⚠️ No Conditions'
  END as policy_status
FROM pg_policies p
WHERE p.schemaname = 'public'
AND p.tablename IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications')
ORDER BY p.tablename, p.policyname;

-- 5. Check real-time publications
SELECT 
  pt.pubname,
  pt.tablename,
  '🔴 Real-time Enabled' as realtime_status
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime'
AND pt.tablename IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications')
UNION ALL
SELECT 
  'supabase_realtime' as pubname,
  t.table_name as tablename,
  '⚠️ Real-time Missing' as realtime_status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name IN ('profiles', 'listings', 'favorites', 'reviews', 'messages', 'conversations', 'notifications')
AND t.table_name NOT IN (
  SELECT pt.tablename 
  FROM pg_publication_tables pt 
  WHERE pt.pubname = 'supabase_realtime'
)
ORDER BY tablename;

-- 6. Check storage buckets
SELECT 
  name as bucket_name,
  public,
  CASE 
    WHEN public THEN '🌐 Public Access'
    ELSE '🔒 Private Access'
  END as access_status,
  created_at
FROM storage.buckets
ORDER BY name;

-- 7. Test sample data counts
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM profiles
UNION ALL
SELECT 
  'listings' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM listings
UNION ALL
SELECT 
  'favorites' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM favorites
UNION ALL
SELECT 
  'reviews' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM reviews
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM messages
UNION ALL
SELECT 
  'conversations' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM conversations
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Has Data'
    ELSE '⚠️ No Data'
  END as data_status
FROM notifications
ORDER BY table_name;

-- 8. Performance test query
EXPLAIN ANALYZE 
SELECT l.*, p.first_name, p.last_name, p.rating
FROM listings l
JOIN profiles p ON l.user_id = p.id
WHERE l.status = 'active'
AND l.category = 'for_sale'
AND l.location_wilaya = 'Alger'
ORDER BY l.created_at DESC
LIMIT 10;
