-- Fix handle_new_user to handle missing first_name/last_name in user metadata
-- Issue: When creating users via admin API without metadata, the function tries to insert NULL
-- which violates NOT NULL constraints on first_name and last_name columns

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.handle_new_user IS
'Trigger function to create profile when auth user is created. Uses COALESCE to default to empty string when metadata is missing.';
