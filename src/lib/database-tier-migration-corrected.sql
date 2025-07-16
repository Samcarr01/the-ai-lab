-- CORRECTED Database Migration: Fix 3-Tier System Content Assignment
-- Run this in Supabase SQL Editor to fix the tier assignments

-- 1. Reset all content to free tier first
UPDATE public.gpts SET required_tier = 'free';
UPDATE public.documents SET required_tier = 'free';

-- 2. Pro tier GPTs (3 essential GPTs) - CORRECTED TITLES
UPDATE public.gpts 
SET required_tier = 'pro' 
WHERE title IN (
    'The Ultimate Email Enhancer 📧',
    'PromptRefiner', 
    'The Better Ideerer 💡'
);

-- 3. Ultra tier GPTs (remaining 4 GPTs) - CORRECTED TITLES
UPDATE public.gpts 
SET required_tier = 'ultra' 
WHERE title IN (
    'SaaS Project Planner Pro 🚀',
    'The Executor 🪓',
    'n8n System Prompt',
    'n8n Planner'
);

-- 4. For documents: Set all to Ultra initially, then manually adjust in admin panel
-- (This ensures Free users can't access any documents)
UPDATE public.documents SET required_tier = 'ultra' WHERE title IS NOT NULL;

-- 5. Verification query to check results
SELECT 'GPTS' as type, required_tier, COUNT(*) as count, 
       STRING_AGG(title, ', ') as titles
FROM public.gpts 
GROUP BY required_tier
UNION ALL
SELECT 'DOCUMENTS' as type, required_tier, COUNT(*) as count,
       STRING_AGG(title, ', ') as titles
FROM public.documents 
GROUP BY required_tier
ORDER BY type, required_tier;

-- Expected results after this migration:
-- GPTs: 3 Pro, 4 Ultra, 0 Free
-- Documents: 0 Pro, All Ultra, 0 Free

-- Next steps:
-- 1. Run this migration
-- 2. Check admin panel to see document titles
-- 3. Manually set 2 specific documents to 'pro' tier via admin panel or additional SQL