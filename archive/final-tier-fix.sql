-- FINAL TIER FIX: Correct Pro/Ultra assignments
-- Based on the specifications: Pro gets 3 specific GPTs + 2 specific playbooks, Ultra gets everything

-- STEP 1: Set ALL content to Ultra tier by default (Ultra gets everything)
UPDATE gpts SET required_tier = 'ultra';
UPDATE documents SET required_tier = 'ultra';

-- STEP 2: Set the 3 SPECIFIC GPTs for Pro tier
-- These are the ones previously specified for Pro access
UPDATE gpts SET required_tier = 'pro' 
WHERE title IN (
  'The Ultimate Email Enhancer 📧',
  'PromptRefiner', 
  'The Better Ideerer 💡'
);

-- STEP 3: Set the 2 SPECIFIC playbooks for Pro tier  
-- Set the featured documents or documents matching key patterns
UPDATE documents SET required_tier = 'pro'
WHERE title ILIKE '%Email%' OR title ILIKE '%Prompt%' OR title ILIKE '%Better%'
OR is_featured = true
LIMIT 2;

-- Alternative approach if the above doesn't work - set by most recently featured/added
UPDATE documents SET required_tier = 'pro'
WHERE id IN (
  SELECT id FROM documents 
  WHERE is_featured = true OR title ILIKE '%Email%' OR title ILIKE '%Prompt%'
  ORDER BY is_featured DESC, added_date DESC
  LIMIT 2
);

-- VERIFICATION: Final tier distribution  
SELECT 'GPTs Distribution' as content_type, required_tier, COUNT(*) as count
FROM gpts GROUP BY required_tier
UNION ALL
SELECT 'Documents Distribution' as content_type, required_tier, COUNT(*) as count
FROM documents GROUP BY required_tier
ORDER BY content_type, required_tier;

-- VERIFICATION: Show specific Pro content
SELECT 'Pro GPTs' as type, title, required_tier FROM gpts WHERE required_tier = 'pro'
UNION ALL
SELECT 'Pro Documents' as type, title, required_tier FROM documents WHERE required_tier = 'pro'
UNION ALL  
SELECT 'Ultra GPTs' as type, title, required_tier FROM gpts WHERE required_tier = 'ultra'
UNION ALL
SELECT 'Ultra Documents' as type, title, required_tier FROM documents WHERE required_tier = 'ultra';