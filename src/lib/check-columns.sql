-- Check if required_tier columns exist and add them if missing

-- Check what columns exist in gpts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gpts' 
ORDER BY ordinal_position;

-- Check what columns exist in documents table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- Add required_tier columns if they don't exist
DO $$
BEGIN
    -- Add required_tier to gpts table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'gpts' AND column_name = 'required_tier'
    ) THEN
        ALTER TABLE public.gpts 
        ADD COLUMN required_tier TEXT DEFAULT 'free' 
        CHECK (required_tier IN ('free', 'pro', 'ultra'));
    END IF;
    
    -- Add required_tier to documents table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'required_tier'
    ) THEN
        ALTER TABLE public.documents 
        ADD COLUMN required_tier TEXT DEFAULT 'free' 
        CHECK (required_tier IN ('free', 'pro', 'ultra'));
    END IF;
END $$;

-- Now check the columns again to confirm they were added
SELECT 'gpts columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gpts' 
ORDER BY ordinal_position;

SELECT 'documents columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;