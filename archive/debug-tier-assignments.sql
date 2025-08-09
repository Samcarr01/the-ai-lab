-- DEBUG TIER ASSIGNMENTS
-- Run this to see exactly what's in your database

-- Check all GPTs and their current tier assignments
SELECT 
    'CURRENT GPT ASSIGNMENTS' as section,
    title,
    required_tier,
    category,
    is_featured
FROM public.gpts 
ORDER BY required_tier, title;

-- Check all documents and their current tier assignments  
SELECT 
    'CURRENT DOCUMENT ASSIGNMENTS' as section,
    title,
    required_tier,
    category,
    is_featured
FROM public.documents 
ORDER BY required_tier, title;

-- Count by tier
SELECT 
    'GPT COUNTS' as section,
    required_tier,
    COUNT(*) as count
FROM public.gpts 
GROUP BY required_tier
ORDER BY required_tier;

SELECT 
    'DOCUMENT COUNTS' as section,
    required_tier,
    COUNT(*) as count
FROM public.documents 
GROUP BY required_tier
ORDER BY required_tier;

-- Show what the tier access should be
SELECT 
    'EXPECTED ACCESS' as section,
    'Free users should access: 0 GPTs, 0 documents' as free_access,
    'Pro users should access: 3 GPTs, 2 documents' as pro_access,
    'Ultra users should access: ALL GPTs, ALL documents' as ultra_access;