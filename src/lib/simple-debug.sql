-- Simple debug to check current tier assignments

-- Check GPT tier assignments
SELECT title, required_tier, category FROM public.gpts ORDER BY required_tier, title;

-- Check GPT counts by tier
SELECT required_tier, COUNT(*) as count FROM public.gpts GROUP BY required_tier ORDER BY required_tier;

-- Check document tier assignments  
SELECT title, required_tier, category FROM public.documents ORDER BY required_tier, title;

-- Check document counts by tier
SELECT required_tier, COUNT(*) as count FROM public.documents GROUP BY required_tier ORDER BY required_tier;