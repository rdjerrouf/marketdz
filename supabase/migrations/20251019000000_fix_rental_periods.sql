-- Fix rental listings that are missing rental_period
-- Set default rental_period to 'monthly' for all for_rent listings that don't have it

UPDATE listings
SET rental_period = 'monthly'
WHERE category = 'for_rent'
  AND (rental_period IS NULL OR btrim(rental_period) = '');

-- Optional: Add constraint to prevent invalid values in future (this IS a schema change)
-- Uncomment if you want to enforce data integrity at the database level
-- ALTER TABLE listings
--   ADD CONSTRAINT rental_period_check
--   CHECK (rental_period IS NULL OR rental_period IN ('hourly','daily','weekly','monthly','yearly'));

-- Verify the update
SELECT
  COUNT(*) as total_rentals,
  COUNT(rental_period) as rentals_with_period,
  COUNT(*) - COUNT(rental_period) as rentals_without_period
FROM listings
WHERE category = 'for_rent';
