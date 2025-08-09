-- Fix Paywall: Update all documents and GPTs with null or 'free' required_tier to 'pro'
-- This prevents free users from accessing premium content

-- Update documents table
UPDATE documents 
SET required_tier = 'pro' 
WHERE required_tier IS NULL OR required_tier = 'free';

-- Update GPTs table  
UPDATE gpts 
SET required_tier = 'pro' 
WHERE required_tier IS NULL OR required_tier = 'free';

-- Verify changes
SELECT 'Documents' as table_name, required_tier, count(*) as count 
FROM documents 
GROUP BY required_tier
UNION ALL
SELECT 'GPTs' as table_name, required_tier, count(*) as count 
FROM gpts 
GROUP BY required_tier
ORDER BY table_name, required_tier;