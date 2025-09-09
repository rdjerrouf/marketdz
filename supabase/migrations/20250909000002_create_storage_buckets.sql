-- Create storage buckets for file uploads

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create listing-photos bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos', 
  'listing-photos', 
  true, 
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create user-photos bucket for general user photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-photos', 
  'user-photos', 
  true, 
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up RLS policies for listing-photos bucket
CREATE POLICY "Listing photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'listing-photos');

CREATE POLICY "Users can upload listing photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own listing photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = (storage.foldername(name))[2]::uuid 
    AND listings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own listing photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'listing-photos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = (storage.foldername(name))[2]::uuid 
    AND listings.user_id = auth.uid()
  )
);

-- Set up RLS policies for user-photos bucket
CREATE POLICY "User photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'user-photos');

CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);