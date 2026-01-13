-- Fix search_path security warning for set_urgent_default_expiration function
-- This prevents malicious schema injection attacks by locking down the search_path

CREATE OR REPLACE FUNCTION public.set_urgent_default_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only apply to urgent category (humanitarian assistance)
  IF NEW.category = 'urgent' THEN
    -- Set default expiration to 48 hours if not provided
    IF NEW.urgent_expires_at IS NULL THEN
      NEW.urgent_expires_at := NOW() + INTERVAL '48 hours';
    END IF;

    -- Ensure urgent_type is set (blood_donation, food_assistance, medicine_needed, etc.)
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

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.set_urgent_default_expiration() IS
'Trigger function for urgent humanitarian assistance listings. Sets 48-hour default expiration and validates required fields (urgent_type, urgent_contact_preference).';
