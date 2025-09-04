-- Database migration for rate limiting table
-- Run this in your Supabase SQL editor for production rate limiting

-- Create rate_limits table for production rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  identifier TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

-- Create indexes for search performance on listings table
-- These are CRITICAL for search performance at scale

-- 1. Trigram indexes for fuzzy text search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for title and description
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING GIN (description gin_trgm_ops);

-- 2. Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_listings_active_category ON listings(status, category) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_active_location ON listings(status, location_wilaya, location_city) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_active_price ON listings(status, price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_active_created ON listings(status, created_at DESC) WHERE status = 'active';

-- 3. Composite index for category + location + price filters
CREATE INDEX IF NOT EXISTS idx_listings_category_location_price ON listings(status, category, location_wilaya, location_city, price) WHERE status = 'active';

-- 4. Full-text search index (for future upgrade to FTS)
-- Uncomment when ready to implement full-text search
-- CREATE INDEX IF NOT EXISTS idx_listings_fts ON listings USING GIN (to_tsvector('english', title || ' ' || description));

-- Auto-cleanup function for rate_limits table
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run manually or set up as cron job)
-- SELECT cleanup_rate_limits();

-- Row Level Security for rate_limits (optional)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow API to manage rate limits
CREATE POLICY "API can manage rate limits" ON rate_limits
  FOR ALL USING (true);

-- Grant permissions to your service role
-- GRANT ALL ON rate_limits TO service_role;
