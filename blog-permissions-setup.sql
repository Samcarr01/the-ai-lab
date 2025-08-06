-- Blog Permissions Setup Script
-- Run this in your Supabase SQL Editor to fix blog post save button

-- Ensure blog_posts table exists with correct structure
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  slug text NOT NULL UNIQUE,
  published_at timestamptz DEFAULT now(),
  meta_description text,
  category text DEFAULT 'AI Tools',
  read_time integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow admin to insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admin to update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admin to delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public to read blog posts" ON blog_posts;

-- Create admin insert policy (allows samcarr1232@gmail.com to create blog posts)
CREATE POLICY "Allow admin to insert blog posts" ON blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.email() = 'samcarr1232@gmail.com'
  );

-- Create admin update policy (allows samcarr1232@gmail.com to edit blog posts)
CREATE POLICY "Allow admin to update blog posts" ON blog_posts
  FOR UPDATE TO authenticated
  USING (
    auth.email() = 'samcarr1232@gmail.com'
  );

-- Create admin delete policy (allows samcarr1232@gmail.com to delete blog posts)
CREATE POLICY "Allow admin to delete blog posts" ON blog_posts
  FOR DELETE TO authenticated
  USING (
    auth.email() = 'samcarr1232@gmail.com'
  );

-- Create public read policy (allows everyone to read blog posts for SEO)
CREATE POLICY "Allow public to read blog posts" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Test the setup with a sample insert (this should work after running the above)
-- You can uncomment and run this to test:
-- INSERT INTO blog_posts (
--   title, 
--   content, 
--   slug, 
--   meta_description, 
--   category, 
--   read_time
-- ) VALUES (
--   'Test Blog Post', 
--   'This is a test blog post to verify permissions are working.',
--   'test-blog-post-' || extract(epoch from now()),
--   'Test blog post for permission verification',
--   'Test',
--   1
-- );

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'blog_posts';