-- FIX PRO TIER DOCUMENTS
-- Set the correct 2 specific documents for Pro users

-- STEP 1: Reset all documents to Ultra tier first
UPDATE documents SET required_tier = 'ultra';

-- STEP 2: Set the 2 CORRECT documents for Pro tier
UPDATE documents SET required_tier = 'pro' 
WHERE title IN (
  'The ChatGPT Mastery Playbook: Enhancing Productivity and Workflow Efficiency',
  'Social Media Authority Playbook: Strategies for Building Influence and Engagement'
);

-- Alternative approach if exact title matching doesn't work
UPDATE documents SET required_tier = 'pro' 
WHERE title ILIKE '%ChatGPT Mastery%' 
   OR title ILIKE '%Social Media Authority%';

-- VERIFICATION: Show Pro tier content after fix
SELECT 'Fixed Pro Content' as type, 'GPT: ' || title as content, required_tier 
FROM gpts WHERE required_tier = 'pro'
UNION ALL
SELECT 'Fixed Pro Content' as type, 'Document: ' || title as content, required_tier 
FROM documents WHERE required_tier = 'pro'
ORDER BY type, content;