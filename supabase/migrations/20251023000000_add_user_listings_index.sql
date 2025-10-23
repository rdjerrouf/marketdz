-- Add index for user's listings queries (my-listings page)
-- This enables fast queries filtering by user_id and ordering by created_at
-- Without this index, queries timeout at 250K scale (8+ seconds)

-- Drop if exists (for idempotency)
DROP INDEX IF EXISTS idx_listings_user_created;

-- Create composite index on user_id and created_at
-- This supports queries like: WHERE user_id = X ORDER BY created_at DESC LIMIT 100
CREATE INDEX idx_listings_user_created
ON public.listings (user_id, created_at DESC);

-- Performance impact:
-- Before: 8.4s timeout (full table scan)
-- After: <50ms (index scan)
