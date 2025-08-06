import { NextResponse } from 'next/server'

export async function GET() {
  // Return the SQL script that needs to be run in Supabase
  const sqlScript = `-- Blog Permissions Setup Script
-- Copy and paste this into your Supabase SQL Editor and run it

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

-- Check that policies were created successfully
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'blog_posts';`

  return new Response(sqlScript, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'To fix blog permissions, you need to run SQL commands in your Supabase dashboard',
    instructions: [
      '1. Go to your Supabase project dashboard',
      '2. Navigate to SQL Editor',
      '3. Create a new query',
      '4. Copy the SQL from GET /api/admin/setup-blog-permissions',
      '5. Paste and run the SQL script',
      '6. This will create the proper RLS policies for blog_posts table'
    ],
    sqlUrl: '/api/admin/setup-blog-permissions',
    quickFix: 'Visit the URL above to get the complete SQL script to run'
  })
}