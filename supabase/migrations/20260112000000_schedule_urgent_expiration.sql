-- Migration: Schedule Automatic Expiration for Urgent Listings
-- Description: Sets up pg_cron job to automatically expire urgent listings every 5 minutes
-- Date: 2026-01-12
-- Status: LOCAL DEVELOPMENT ONLY (test first, then apply to cloud with approval)

-- ============================================================================
-- STEP 1: Enable pg_cron extension
-- ============================================================================

-- Enable pg_cron extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Add comment
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for urgent listing expiration';

-- ============================================================================
-- STEP 2: Schedule the expiration job
-- ============================================================================

-- Clear any existing urgent expiration jobs (in case of re-running migration)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'expire_urgent_listings_job';

-- Schedule the job to run every 5 minutes
-- This will check for expired urgent listings and update their status
SELECT cron.schedule(
  'expire_urgent_listings_job',           -- Job name
  '*/5 * * * *',                          -- Cron schedule: every 5 minutes
  $$SELECT expire_urgent_listings();$$    -- SQL command to execute
);

-- Add comment explaining the job
COMMENT ON EXTENSION pg_cron IS 'Schedules expire_urgent_listings() to run every 5 minutes';

-- ============================================================================
-- STEP 3: Grant necessary permissions
-- ============================================================================

-- Ensure the cron extension can execute the function
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT EXECUTE ON FUNCTION expire_urgent_listings() TO postgres;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Check that pg_cron extension is enabled:
-- SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- View scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname = 'expire_urgent_listings_job';

-- View job run history (last 10 runs):
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire_urgent_listings_job')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- Manually run the expiration function to test:
-- SELECT expire_urgent_listings();

-- Check for active urgent listings that should expire:
-- SELECT id, title, category, status, urgent_expires_at,
--        (urgent_expires_at < NOW()) AS is_expired,
--        NOW() - urgent_expires_at AS time_past_expiration
-- FROM listings
-- WHERE category = 'urgent'
--   AND status = 'active'
-- ORDER BY urgent_expires_at DESC;
