-- Hybrid schema for subcategory-specific listing details
--
-- Strategy:
--   vehicle_* columns  → dedicated, indexed — cars/motos are filtered heavily (year, mileage ranges)
--   listing_details    → JSONB for everything else (real estate, electronics, fashion, books, …)
--                        zero-cost to add new subcategory fields without future migrations
--
-- Cost note: listing_details returns null for non-matching rows (~20 bytes vs ~750 bytes for
-- 50 dedicated NULL columns), making it 37x cheaper on Supabase egress for browsing pages.

ALTER TABLE listings
  -- Vehicle-specific dedicated columns (filterable ranges)
  ADD COLUMN IF NOT EXISTS vehicle_make         TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model        TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_year         SMALLINT CHECK (vehicle_year IS NULL OR (vehicle_year >= 1900 AND vehicle_year <= 2030)),
  ADD COLUMN IF NOT EXISTS vehicle_mileage      INTEGER  CHECK (vehicle_mileage IS NULL OR vehicle_mileage >= 0),
  ADD COLUMN IF NOT EXISTS vehicle_transmission TEXT     CHECK (vehicle_transmission IS NULL OR vehicle_transmission IN ('manual', 'automatic', 'semi-automatic')),
  ADD COLUMN IF NOT EXISTS vehicle_fuel_type    TEXT     CHECK (vehicle_fuel_type IS NULL OR vehicle_fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'lpg')),
  ADD COLUMN IF NOT EXISTS vehicle_body_type    TEXT     CHECK (vehicle_body_type IS NULL OR vehicle_body_type IN ('sedan', 'suv', 'hatchback', 'pickup', 'van', 'coupe', 'wagon', 'convertible', 'minivan', 'scooter', 'sport', 'cruiser', 'other')),

  -- Generic subcategory details (real estate, electronics, fashion, books, …)
  ADD COLUMN IF NOT EXISTS listing_details      JSONB;

-- GIN index on listing_details for equality lookups (brand, property_type, etc.)
-- Only create if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'listings' AND indexname = 'idx_listings_details_gin'
  ) THEN
    CREATE INDEX idx_listings_details_gin ON listings USING gin (listing_details jsonb_path_ops);
  END IF;
END $$;
