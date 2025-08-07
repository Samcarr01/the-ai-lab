-- Setup affiliate tools table for "Our Toolkit" page
-- Run this in Supabase SQL Editor

-- Create affiliate_tools table
CREATE TABLE affiliate_tools (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affiliate_url VARCHAR(500) NOT NULL,
  original_url VARCHAR(500), -- Original tool website for research
  image_url VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  research_data JSONB, -- Store Perplexity research for reference
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_affiliate_tools_category ON affiliate_tools(category);
CREATE INDEX idx_affiliate_tools_featured ON affiliate_tools(is_featured);
CREATE INDEX idx_affiliate_tools_created ON affiliate_tools(created_at);

-- Enable Row Level Security
ALTER TABLE affiliate_tools ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for the public toolkit page)
CREATE POLICY "Allow public read access to affiliate tools"
ON affiliate_tools FOR SELECT
TO public
USING (true);

-- Policy: Allow authenticated users to insert affiliate tools (admin only in practice)
CREATE POLICY "Allow authenticated users to insert affiliate tools"
ON affiliate_tools FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to update affiliate tools
CREATE POLICY "Allow authenticated users to update affiliate tools"
ON affiliate_tools FOR UPDATE
TO authenticated
USING (true);

-- Policy: Allow authenticated users to delete affiliate tools
CREATE POLICY "Allow authenticated users to delete affiliate tools"
ON affiliate_tools FOR DELETE
TO authenticated
USING (true);

-- Insert sample data for testing (optional)
INSERT INTO affiliate_tools (
  title, 
  description, 
  affiliate_url,
  original_url,
  category,
  is_featured
) VALUES (
  'N8N Automation Platform',
  'The workflow automation tool that transformed how we handle repetitive tasks. N8N''s visual interface lets you connect 300+ services without writing code. We''ve automated everything from lead processing to content distribution, saving 15+ hours per week. The self-hosted option gives you complete control over your data and workflows. Essential for any serious automation strategy.',
  'https://n8n.io?ref=affiliate', -- Replace with actual affiliate link
  'https://n8n.io',
  'Automation',
  true
);

-- Check if table was created successfully
SELECT * FROM affiliate_tools;