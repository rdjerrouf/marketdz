-- Migration: Add Hot Deals support to listings
-- This adds the infrastructure for premium "Hot Deals" feature
-- Feature is currently disabled in UI (coming soon)

-- Add hot deal columns to listings table
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_hot_deal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hot_deal_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS hot_deal_badge_type TEXT CHECK (hot_deal_badge_type IN ('limited_time', 'flash_sale', 'deal_of_day', 'clearance', 'special_offer')),
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);

-- Add comment to explain columns
COMMENT ON COLUMN listings.is_hot_deal IS 'Marks listing as a hot deal (premium feature)';
COMMENT ON COLUMN listings.hot_deal_expires_at IS 'When the hot deal expires';
COMMENT ON COLUMN listings.hot_deal_badge_type IS 'Type of hot deal badge to display';
COMMENT ON COLUMN listings.original_price IS 'Original price before discount (for showing % off)';

-- Index for fast hot deals queries (ready for when feature launches)
CREATE INDEX IF NOT EXISTS idx_listings_hot_deals
ON listings(is_hot_deal, hot_deal_expires_at DESC, created_at DESC)
WHERE is_hot_deal = TRUE AND status = 'active';

-- Function to automatically expire hot deals
CREATE OR REPLACE FUNCTION expire_hot_deals()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET is_hot_deal = FALSE,
      hot_deal_badge_type = NULL
  WHERE is_hot_deal = TRUE
    AND hot_deal_expires_at IS NOT NULL
    AND hot_deal_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: We'll set up a cron job later to call expire_hot_deals() periodically
COMMENT ON FUNCTION expire_hot_deals IS 'Automatically expires hot deals that have passed their expiration time';
