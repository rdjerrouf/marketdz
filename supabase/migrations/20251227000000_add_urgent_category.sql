-- Migration: Add Urgent/Emergency Humanitarian Category
-- Description: Adds 'urgent' category for time-sensitive humanitarian assistance
-- Date: 2025-12-27
-- Status: LOCAL DEVELOPMENT ONLY

-- ============================================================================
-- STEP 1: Extend listing_category enum to include 'urgent'
-- ============================================================================

-- Add 'urgent' to the existing listing_category enum
ALTER TYPE listing_category ADD VALUE IF NOT EXISTS 'urgent';

-- ============================================================================
-- STEP 2: Add urgent-specific columns to listings table
-- ============================================================================

-- Add columns for urgent listings (following hot deals pattern)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS urgent_type TEXT
    CHECK (urgent_type IN (
      'blood_donation',
      'medicine_needed',
      'food_assistance',
      'medical_equipment',
      'emergency_housing'
    )),
  ADD COLUMN IF NOT EXISTS urgent_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS urgent_contact_preference TEXT
    CHECK (urgent_contact_preference IN ('phone', 'whatsapp', 'both'));

-- Add comments for documentation
COMMENT ON COLUMN listings.urgent_type IS 'Type of urgent humanitarian need (only for category=urgent)';
COMMENT ON COLUMN listings.urgent_expires_at IS 'Auto-expiration timestamp for urgent listings (default: 48 hours from creation)';
COMMENT ON COLUMN listings.urgent_contact_preference IS 'Preferred contact method for urgent requests';

-- ============================================================================
-- STEP 3: Create performance indexes for urgent category
-- ============================================================================

-- Note: Partial indexes with new enum values will be created in next migration
-- to avoid "unsafe use of new value" error in same transaction

-- Simple index on urgent_expires_at (used by all urgent queries)
CREATE INDEX IF NOT EXISTS idx_listings_urgent_expires
  ON listings(urgent_expires_at DESC NULLS LAST);

-- Simple index on urgent_type (used for filtering)
CREATE INDEX IF NOT EXISTS idx_listings_urgent_type_simple
  ON listings(urgent_type);

-- Note: More specific partial indexes will be added in migration 20251227000001

-- ============================================================================
-- STEP 4: Auto-expiration function for urgent listings
-- ============================================================================

-- Function to automatically expire urgent listings
CREATE OR REPLACE FUNCTION expire_urgent_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update expired urgent listings to 'expired' status
  UPDATE listings
  SET status = 'expired',
      updated_at = NOW()
  WHERE category = 'urgent'
    AND urgent_expires_at < NOW()
    AND status = 'active';

  -- Get the number of rows affected
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Log the number of expired listings
  RAISE NOTICE 'Expired % urgent listings', expired_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION expire_urgent_listings() IS 'Automatically expires urgent listings past their expiration time';

-- ============================================================================
-- STEP 5: Trigger to set default expiration on insert
-- ============================================================================

-- Function to set default expiration time (48 hours)
CREATE OR REPLACE FUNCTION set_urgent_default_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only apply to urgent category
  IF NEW.category = 'urgent' THEN
    -- Set default expiration to 48 hours if not provided
    IF NEW.urgent_expires_at IS NULL THEN
      NEW.urgent_expires_at := NOW() + INTERVAL '48 hours';
    END IF;

    -- Ensure urgent_type is set
    IF NEW.urgent_type IS NULL THEN
      RAISE EXCEPTION 'urgent_type is required for urgent category';
    END IF;

    -- Ensure contact preference is set
    IF NEW.urgent_contact_preference IS NULL THEN
      RAISE EXCEPTION 'urgent_contact_preference is required for urgent category';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_set_urgent_defaults ON listings;
CREATE TRIGGER trg_set_urgent_defaults
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_urgent_default_expiration();

-- ============================================================================
-- STEP 6: Update RLS policies to include urgent category
-- ============================================================================

-- Note: Existing RLS policies should automatically cover urgent category
-- since they filter by status='active' and user_id checks.
-- No new policies needed unless urgent category requires special permissions.

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

-- Ensure authenticated users can access expire function (if called manually)
GRANT EXECUTE ON FUNCTION expire_urgent_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION set_urgent_default_expiration() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- ============================================================================

-- Test that urgent enum value exists:
-- SELECT unnest(enum_range(NULL::listing_category));

-- Test urgent columns exist:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'listings'
-- AND column_name LIKE 'urgent%';

-- Test indexes exist:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'listings'
-- AND indexname LIKE '%urgent%';

-- Test functions exist:
-- SELECT proname FROM pg_proc
-- WHERE proname LIKE '%urgent%';
