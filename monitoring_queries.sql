-- Connection Pool Monitoring Queries for MarketDZ
-- Run these in Supabase SQL Editor to monitor connection pool performance

-- 1. Current Connection Status
SELECT 
  'Total Active Connections' as metric,
  COUNT(*) as value
FROM pg_stat_activity 
WHERE datname = current_database()
  AND state = 'active'

UNION ALL

SELECT 
  'Idle Connections',
  COUNT(*)
FROM pg_stat_activity 
WHERE datname = current_database()
  AND state = 'idle'

UNION ALL

SELECT 
  'Waiting Connections',
  COUNT(*)
FROM pg_stat_activity 
WHERE datname = current_database()
  AND state = 'waiting';

-- 2. Connection Pool Efficiency (if pgBouncer is enabled)
SELECT 
  pool,
  cl_active as client_active,
  cl_waiting as client_waiting,
  sv_active as server_active,
  sv_idle as server_idle,
  sv_used as server_used,
  maxwait as max_wait_seconds
FROM pgbouncer.pools
WHERE name = current_database();

-- 3. Query Performance by API Endpoint
SELECT 
  query,
  calls,
  mean_exec_time as avg_ms,
  max_exec_time as max_ms,
  total_exec_time as total_ms
FROM pg_stat_statements 
WHERE query LIKE '%listings%'
  AND calls > 10
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 4. Index Usage for Search Queries
SELECT 
  indexrelname as index_name,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  ROUND(idx_tup_fetch::numeric / GREATEST(idx_scan, 1), 2) as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE relname = 'listings'
  AND idx_scan > 0
ORDER BY idx_scan DESC;

-- 5. Connection Duration Analysis
SELECT 
  state,
  COUNT(*) as connection_count,
  AVG(extract(epoch from now() - state_change))::int as avg_duration_seconds,
  MAX(extract(epoch from now() - state_change))::int as max_duration_seconds
FROM pg_stat_activity 
WHERE datname = current_database()
  AND backend_type = 'client backend'
GROUP BY state
ORDER BY connection_count DESC;

-- 6. Database Size and Growth
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value

UNION ALL

SELECT 
  'Listings Table Size',
  pg_size_pretty(pg_total_relation_size('listings'))

UNION ALL

SELECT 
  'Total Listings Count',
  COUNT(*)::text
FROM listings

UNION ALL

SELECT 
  'Active Listings Count',
  COUNT(*)::text
FROM listings 
WHERE status = 'active';

-- 7. Recent Query Performance (last hour)
SELECT 
  NOW() - interval '1 hour' as time_window_start,
  COUNT(*) as total_queries,
  AVG(mean_exec_time)::numeric(6,2) as avg_execution_time_ms,
  MAX(max_exec_time)::numeric(6,2) as worst_query_ms
FROM pg_stat_statements 
WHERE last_call > NOW() - interval '1 hour';

-- 8. Connection Pool Health Check
DO $$
DECLARE
  active_conn integer;
  max_conn integer;
  pool_usage numeric;
BEGIN
  SELECT COUNT(*) INTO active_conn 
  FROM pg_stat_activity 
  WHERE datname = current_database();
  
  SELECT setting::integer INTO max_conn 
  FROM pg_settings 
  WHERE name = 'max_connections';
  
  pool_usage := (active_conn::numeric / max_conn::numeric) * 100;
  
  RAISE NOTICE 'Pool Usage: %% (% / %)', 
    ROUND(pool_usage, 1), active_conn, max_conn;
  
  IF pool_usage > 80 THEN
    RAISE WARNING 'Connection pool usage above 80%! Consider scaling.';
  ELSIF pool_usage > 60 THEN
    RAISE NOTICE 'Connection pool usage above 60%. Monitor closely.';
  ELSE
    RAISE NOTICE 'Connection pool usage healthy.';
  END IF;
END $$;
