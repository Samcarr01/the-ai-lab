-- Setup blog images storage bucket and policies
-- Run this in Supabase SQL Editor

-- Create blog-images storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload blog images
CREATE POLICY "Allow authenticated users to upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Storage policy: Allow public read access to blog images
CREATE POLICY "Allow public read access to blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Storage policy: Allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blog-images');

-- Storage policy: Allow authenticated users to delete blog images
CREATE POLICY "Allow authenticated users to delete blog images" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');

-- Check if bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'blog-images';