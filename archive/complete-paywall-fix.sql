-- COMPLETE PAYWALL FIX
-- Fix tier assignments + ensure admin has Ultra access

-- STEP 1: Fix admin user tier (ensure Ultra access to everything)
UPDATE users 
SET user_tier = 'ultra', is_pro = true 
WHERE email = 'samcarr1232@gmail.com';

-- STEP 2: Ensure all new signups are 'free' tier by default  
UPDATE users 
SET user_tier = 'free', is_pro = false 
WHERE user_tier IS NULL AND email != 'samcarr1232@gmail.com';

-- STEP 3: Set ALL content to Ultra tier first (so Ultra users get everything)
UPDATE gpts SET required_tier = 'ultra';
UPDATE documents SET required_tier = 'ultra';

-- STEP 4: Set the 3 SPECIFIC GPTs for Pro tier access
UPDATE gpts SET required_tier = 'pro' 
WHERE title IN (
  'The Ultimate Email Enhancer 📧',
  'PromptRefiner', 
  'The Better Ideerer 💡'
);

-- STEP 5: Set the 2 SPECIFIC documents for Pro tier access
-- Use featured documents or most relevant ones for Pro users
UPDATE documents SET required_tier = 'pro'
WHERE id IN (
  SELECT id FROM documents 
  WHERE is_featured = true 
     OR title ILIKE '%Email%' 
     OR title ILIKE '%Prompt%' 
     OR title ILIKE '%Better%'
     OR title ILIKE '%AI%'
  ORDER BY is_featured DESC, added_date DESC
  LIMIT 2
);

-- VERIFICATION: Check user tiers
SELECT 'User Tiers' as check_type, user_tier, is_pro, COUNT(*) as count, 
       STRING_AGG(email, ', ') as emails
FROM users 
GROUP BY user_tier, is_pro;

-- VERIFICATION: Check content distribution
SELECT 'Content Distribution' as check_type, 
       'GPTs: ' || COUNT(CASE WHEN required_tier = 'pro' THEN 1 END) || ' Pro, ' ||
       COUNT(CASE WHEN required_tier = 'ultra' THEN 1 END) || ' Ultra' as distribution
FROM gpts
UNION ALL
SELECT 'Content Distribution' as check_type,
       'Documents: ' || COUNT(CASE WHEN required_tier = 'pro' THEN 1 END) || ' Pro, ' ||
       COUNT(CASE WHEN required_tier = 'ultra' THEN 1 END) || ' Ultra' as distribution
FROM documents;

-- VERIFICATION: Show Pro tier content specifically
SELECT 'Pro Access Content' as type, 'GPT: ' || title as content, required_tier 
FROM gpts WHERE required_tier = 'pro'
UNION ALL
SELECT 'Pro Access Content' as type, 'Document: ' || title as content, required_tier 
FROM documents WHERE required_tier = 'pro';