-- COMPLETE 3-TIER SYSTEM MIGRATION
-- This script ensures proper tier assignments and fixes any issues

-- Step 1: Verify required_tier columns exist (add if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'gpts' AND column_name = 'required_tier') THEN
        ALTER TABLE public.gpts ADD COLUMN required_tier TEXT DEFAULT 'free' 
        CHECK (required_tier IN ('free', 'pro', 'ultra'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'documents' AND column_name = 'required_tier') THEN
        ALTER TABLE public.documents ADD COLUMN required_tier TEXT DEFAULT 'free' 
        CHECK (required_tier IN ('free', 'pro', 'ultra'));
    END IF;
END $$;

-- Step 2: Reset ALL content to FREE tier (clean slate)
UPDATE public.gpts SET required_tier = 'free' WHERE required_tier IS NOT NULL;
UPDATE public.documents SET required_tier = 'free' WHERE required_tier IS NOT NULL;

-- Step 3: Set PRO tier GPTs (3 essential GPTs for daily use)
UPDATE public.gpts 
SET required_tier = 'pro' 
WHERE title IN (
    'The Ultimate Email Enhancer 📧',
    'PromptRefiner', 
    'The Better Ideerer 💡'
);

-- Step 4: Set ULTRA tier GPTs (remaining GPTs - these should be the advanced ones)
UPDATE public.gpts 
SET required_tier = 'ultra' 
WHERE title NOT IN (
    'The Ultimate Email Enhancer 📧',
    'PromptRefiner', 
    'The Better Ideerer 💡'
);

-- Step 5: Set ALL documents to ULTRA tier (will manually adjust 2 to Pro later)
UPDATE public.documents 
SET required_tier = 'ultra' 
WHERE title IS NOT NULL;

-- Step 6: CRITICAL - Update indexes for performance
CREATE INDEX IF NOT EXISTS idx_gpts_required_tier ON public.gpts(required_tier);
CREATE INDEX IF NOT EXISTS idx_documents_required_tier ON public.documents(required_tier);

-- Step 7: Verification Query - Check Results
SELECT 
    'GPTs' as content_type,
    required_tier,
    COUNT(*) as count,
    CASE 
        WHEN required_tier = 'free' THEN 'Should be 0'
        WHEN required_tier = 'pro' THEN 'Should be 3'
        WHEN required_tier = 'ultra' THEN 'Should be remaining (4+)'
        ELSE 'Unknown'
    END as expected_count,
    STRING_AGG(title, ', ') as titles
FROM public.gpts 
GROUP BY required_tier
ORDER BY 
    CASE required_tier 
        WHEN 'free' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'ultra' THEN 3 
    END;

-- Step 8: Document Verification
SELECT 
    'Documents' as content_type,
    required_tier,
    COUNT(*) as count,
    CASE 
        WHEN required_tier = 'free' THEN 'Should be 0'
        WHEN required_tier = 'pro' THEN 'Should be 2 (manually set later)'
        WHEN required_tier = 'ultra' THEN 'Should be remaining documents'
        ELSE 'Unknown'
    END as expected_count,
    STRING_AGG(title, ', ') as titles
FROM public.documents 
GROUP BY required_tier
ORDER BY 
    CASE required_tier 
        WHEN 'free' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'ultra' THEN 3 
    END;

-- Step 9: Show final expected results
SELECT 
    'EXPECTED RESULTS' as status,
    'Free users: 0 GPTs, 0 documents' as free_tier,
    'Pro users: 3 GPTs, 2 documents' as pro_tier,
    'Ultra users: 7 GPTs, all documents' as ultra_tier;

-- Step 10: Manual document assignment (run after checking document titles)
-- UPDATE public.documents SET required_tier = 'pro' WHERE title IN ('Document1', 'Document2');