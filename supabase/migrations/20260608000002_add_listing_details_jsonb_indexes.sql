-- Expression indexes on listing_details JSONB for searchable subcategory fields.
-- Each index covers only active listings (partial index) to keep them small.
-- Equality filters use jsonb_path_ops containment (@>); range filters use cast expressions.

-- Vehicles / Motos
CREATE INDEX IF NOT EXISTS idx_listings_details_moto_type
  ON public.listings ((listing_details->>'moto_type'))
  WHERE status = 'active' AND listing_details ? 'moto_type';

CREATE INDEX IF NOT EXISTS idx_listings_details_engine_cc
  ON public.listings (((listing_details->>'engine_cc')::integer))
  WHERE status = 'active' AND listing_details ? 'engine_cc';

-- Auto Parts
CREATE INDEX IF NOT EXISTS idx_listings_details_part_category
  ON public.listings ((listing_details->>'part_category'))
  WHERE status = 'active' AND listing_details ? 'part_category';

-- Construction Trucks
CREATE INDEX IF NOT EXISTS idx_listings_details_truck_type
  ON public.listings ((listing_details->>'truck_type'))
  WHERE status = 'active' AND listing_details ? 'truck_type';

CREATE INDEX IF NOT EXISTS idx_listings_details_payload_capacity
  ON public.listings (((listing_details->>'payload_capacity_kg')::integer))
  WHERE status = 'active' AND listing_details ? 'payload_capacity_kg';

-- Heavy Equipment
CREATE INDEX IF NOT EXISTS idx_listings_details_equipment_type
  ON public.listings ((listing_details->>'equipment_type'))
  WHERE status = 'active' AND listing_details ? 'equipment_type';

CREATE INDEX IF NOT EXISTS idx_listings_details_hours_used
  ON public.listings (((listing_details->>'hours_used')::integer))
  WHERE status = 'active' AND listing_details ? 'hours_used';

-- Construction Materials
CREATE INDEX IF NOT EXISTS idx_listings_details_material_type
  ON public.listings ((listing_details->>'material_type'))
  WHERE status = 'active' AND listing_details ? 'material_type';

-- Real Estate (sale + rent)
CREATE INDEX IF NOT EXISTS idx_listings_details_property_type
  ON public.listings ((listing_details->>'property_type'))
  WHERE status = 'active' AND listing_details ? 'property_type';

CREATE INDEX IF NOT EXISTS idx_listings_details_bedrooms
  ON public.listings (((listing_details->>'bedrooms')::integer))
  WHERE status = 'active' AND listing_details ? 'bedrooms';

CREATE INDEX IF NOT EXISTS idx_listings_details_size_sqm
  ON public.listings (((listing_details->>'size_sqm')::integer))
  WHERE status = 'active' AND listing_details ? 'size_sqm';

CREATE INDEX IF NOT EXISTS idx_listings_details_furnished
  ON public.listings ((listing_details->>'furnished'))
  WHERE status = 'active' AND listing_details ? 'furnished';

CREATE INDEX IF NOT EXISTS idx_listings_details_parking
  ON public.listings ((listing_details->>'parking'))
  WHERE status = 'active' AND listing_details ? 'parking';

CREATE INDEX IF NOT EXISTS idx_listings_details_finishing
  ON public.listings ((listing_details->>'finishing'))
  WHERE status = 'active' AND listing_details ? 'finishing';

-- Electronics
CREATE INDEX IF NOT EXISTS idx_listings_details_brand
  ON public.listings ((listing_details->>'brand'))
  WHERE status = 'active' AND listing_details ? 'brand';

-- Fashion
CREATE INDEX IF NOT EXISTS idx_listings_details_gender
  ON public.listings ((listing_details->>'gender'))
  WHERE status = 'active' AND listing_details ? 'gender';

-- Baby & Kids
CREATE INDEX IF NOT EXISTS idx_listings_details_age_range
  ON public.listings ((listing_details->>'age_range'))
  WHERE status = 'active' AND listing_details ? 'age_range';

-- Sports
CREATE INDEX IF NOT EXISTS idx_listings_details_sport_type
  ON public.listings ((listing_details->>'sport_type'))
  WHERE status = 'active' AND listing_details ? 'sport_type';

-- Tools
CREATE INDEX IF NOT EXISTS idx_listings_details_tool_type
  ON public.listings ((listing_details->>'tool_type'))
  WHERE status = 'active' AND listing_details ? 'tool_type';

CREATE INDEX IF NOT EXISTS idx_listings_details_power_source
  ON public.listings ((listing_details->>'power_source'))
  WHERE status = 'active' AND listing_details ? 'power_source';

-- Event Halls (rent)
CREATE INDEX IF NOT EXISTS idx_listings_details_capacity_persons
  ON public.listings (((listing_details->>'capacity_persons')::integer))
  WHERE status = 'active' AND listing_details ? 'capacity_persons';

-- Commercial (rent)
CREATE INDEX IF NOT EXISTS idx_listings_details_usage_type
  ON public.listings ((listing_details->>'usage_type'))
  WHERE status = 'active' AND listing_details ? 'usage_type';
