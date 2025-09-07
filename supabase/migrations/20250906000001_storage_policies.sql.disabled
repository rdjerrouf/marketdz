-- Storage policies for listing photos
-- This migration adds RLS policies to allow authenticated users to upload images
-- and everyone to view them

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to INSERT (upload) images to listing-photos bucket
CREATE POLICY "Allow authenticated users to upload listing photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-photos');

-- Policy: Allow everyone to SELECT (view) images from listing-photos bucket
CREATE POLICY "Allow public read access to listing photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-photos');

-- Policy: Allow users to UPDATE their own uploaded images
CREATE POLICY "Allow users to update their own listing photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'listing-photos');

-- Policy: Allow users to DELETE their own uploaded images
CREATE POLICY "Allow users to delete their own listing photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid()::text = owner::text);
