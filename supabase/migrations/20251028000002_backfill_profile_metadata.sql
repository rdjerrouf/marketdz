-- Backfill existing user profiles with data from auth.users metadata
-- This fixes users created before the trigger was updated

UPDATE public.profiles
SET 
  phone = COALESCE(
    (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = profiles.id),
    phone
  ),
  city = COALESCE(
    (SELECT raw_user_meta_data->>'city' FROM auth.users WHERE id = profiles.id),
    city
  ),
  wilaya = COALESCE(
    (SELECT raw_user_meta_data->>'wilaya' FROM auth.users WHERE id = profiles.id),
    wilaya
  )
WHERE 
  (phone IS NULL OR city IS NULL OR wilaya IS NULL)
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = profiles.id 
    AND (
      raw_user_meta_data->>'phone' IS NOT NULL 
      OR raw_user_meta_data->>'city' IS NOT NULL 
      OR raw_user_meta_data->>'wilaya' IS NOT NULL
    )
  );
