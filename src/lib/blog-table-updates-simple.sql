-- Add missing columns to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 5;

-- Add admin policies for blog posts (so admin can create/update/delete)
CREATE POLICY "Admin can manage all blog posts" ON public.blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- Allow service role to manage blog posts (for API operations)  
CREATE POLICY "Service role can manage blog posts" ON public.blog_posts
  FOR ALL USING (auth.role() = 'service_role');