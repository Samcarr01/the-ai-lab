-- Add status field to blog_posts table for draft/published workflow
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Update existing posts to be published (they were already visible)
UPDATE public.blog_posts 
SET status = 'published' 
WHERE status IS NULL;

-- Create an index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);

-- Update the RLS policy to only show published posts to public
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (
    status = 'published' AND published_at IS NOT NULL
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- Admin can always see all posts (draft and published)
-- This policy already exists from the blog-table-updates.sql