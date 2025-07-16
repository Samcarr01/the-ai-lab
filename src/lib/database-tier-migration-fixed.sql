-- Fixed Database Migration: Correct 3-Tier System Content Assignment
-- This script fixes the tier assignments with correct GPT titles and specific content mapping

-- First, reset all content to free tier to start fresh
UPDATE public.gpts SET required_tier = 'free';
UPDATE public.documents SET required_tier = 'free';

-- Pro tier content (3 essential GPTs + 2 core playbooks)
-- These are the most essential tools for daily AI use

-- Pro GPTs: 3 essential GPTs for daily productivity
UPDATE public.gpts 
SET required_tier = 'pro' 
WHERE title IN (
    'The Ultimate Email Enhancer 📧',
    'PromptRefiner', 
    'The Better Ideerer 💡'
);

-- Pro Documents: 2 core playbooks for getting started
-- Update these with actual document titles after checking admin panel
UPDATE public.documents 
SET required_tier = 'pro' 
WHERE title LIKE '%Email%' OR title LIKE '%Prompt%' OR title LIKE '%Better%';

-- Ultra tier content (remaining 4 GPTs + remaining playbooks)
-- These are advanced tools for comprehensive AI workflows

-- Ultra GPTs: Advanced and specialized GPTs
UPDATE public.gpts 
SET required_tier = 'ultra' 
WHERE title IN (
    'SaaS Project Planner Pro 🚀',
    'The Executor 🪓',
    'n8n System Prompt',
    'n8n Planner'
);

-- Ultra Documents: All remaining playbooks
UPDATE public.documents 
SET required_tier = 'ultra' 
WHERE title NOT LIKE '%Email%' AND title NOT LIKE '%Prompt%' AND title NOT LIKE '%Better%';

-- Verification queries to check tier distribution
SELECT 'GPT Tier Distribution' as table_name, required_tier, COUNT(*) as count 
FROM public.gpts 
GROUP BY required_tier
UNION ALL
SELECT 'Document Tier Distribution' as table_name, required_tier, COUNT(*) as count 
FROM public.documents 
GROUP BY required_tier;

-- Expected results:
-- Pro: 3 GPTs + 2 Documents
-- Ultra: 4 GPTs + remaining Documents  
-- Free: 0 GPTs + 0 Documents (everything should be gated)