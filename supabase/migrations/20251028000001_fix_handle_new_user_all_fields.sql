-- Fix handle_new_user to copy ALL user metadata fields to profile
-- Issue: phone, city, and wilaya were not being copied from user_metadata
-- This meant new users would have NULL location even if they provided it during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    phone,
    city,
    wilaya
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'wilaya'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

COMMENT ON FUNCTION public.handle_new_user IS
'Trigger function to create profile when auth user is created. Copies all metadata fields including phone, city, and wilaya.';
