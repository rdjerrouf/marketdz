-- SIMPLIFIED STORAGE POLICIES - Copy to Supabase SQL Editor
-- Run these one by one if needed

-- Enable uploads for authenticated users
CREATE POLICY "listing_photos_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-photos');

-- Enable public read access  
CREATE POLICY "listing_photos_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'listing-photos');
