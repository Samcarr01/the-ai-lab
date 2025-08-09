-- EMERGENCY PAYWALL FIX
-- This script fixes the critical paywall bypass issue where content was created with 'free' tier

-- Fix GPTs table - set all content to 'pro' tier unless explicitly set to something else
UPDATE gpts 
SET required_tier = 'pro' 
WHERE required_tier IS NULL OR required_tier = 'free';

-- Fix Documents table - set all content to 'pro' tier unless explicitly set to something else  
UPDATE documents 
SET required_tier = 'pro' 
WHERE required_tier IS NULL OR required_tier = 'free';

-- Check results
SELECT 
  'gpts' as table_name,
  required_tier,
  COUNT(*) as count
FROM gpts 
GROUP BY required_tier
UNION ALL
SELECT 
  'documents' as table_name,
  required_tier,
  COUNT(*) as count
FROM documents 
GROUP BY required_tier
ORDER BY table_name, required_tier;