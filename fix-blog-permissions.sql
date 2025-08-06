-- Fix blog_posts table permissions
-- Enable RLS but allow admin user to insert/update blog posts

-- First, ensure RLS is enabled
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admin to insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admin to update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow admin to delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public to read published blog posts" ON blog_posts;

-- Allow admin user (samcarr1232@gmail.com) to insert blog posts
CREATE POLICY "Allow admin to insert blog posts" ON blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- Allow admin user to update blog posts
CREATE POLICY "Allow admin to update blog posts" ON blog_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- Allow admin user to delete blog posts
CREATE POLICY "Allow admin to delete blog posts" ON blog_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- Allow everyone to read published blog posts (for public blog access)
CREATE POLICY "Allow public to read published blog posts" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON blog_posts TO authenticated;
GRANT USAGE ON SEQUENCE blog_posts_id_seq TO authenticated;