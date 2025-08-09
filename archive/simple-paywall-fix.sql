-- SIMPLE PAYWALL FIX 
-- Based on CLAUDE.md: ALL GPTs and Documents should require Pro subscription
-- Free users get preview only, Pro users get full access

-- Set ALL GPTs to require Pro tier (no free GPT access)
UPDATE gpts SET required_tier = 'pro';

-- Set ALL Documents to require Pro tier (no free document access)  
UPDATE documents SET required_tier = 'pro';

-- Verification queries
SELECT 'GPTs Check' as content_type, required_tier, COUNT(*) as count
FROM gpts GROUP BY required_tier
UNION ALL
SELECT 'Documents Check' as content_type, required_tier, COUNT(*) as count  
FROM documents GROUP BY required_tier;

-- Show any potential issues
SELECT 'Potential Issues' as check_type, 
       CASE 
         WHEN required_tier IS NULL THEN 'NULL tier found'
         WHEN required_tier = 'free' THEN 'Free tier found (should be pro)'
         WHEN required_tier NOT IN ('pro', 'ultra') THEN 'Invalid tier: ' || required_tier
         ELSE 'OK'
       END as issue,
       COUNT(*) as count
FROM (
  SELECT required_tier FROM gpts
  UNION ALL 
  SELECT required_tier FROM documents
) all_content
GROUP BY required_tier;