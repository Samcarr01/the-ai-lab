-- Fix GPTs table to ensure required columns exist
-- This fixes the "column gpts.tier does not exist" error

-- Add tier column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gpts' AND column_name='tier') THEN
        ALTER TABLE gpts ADD COLUMN tier text;
    END IF;
END $$;

-- Ensure required_tier column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gpts' AND column_name='required_tier') THEN
        ALTER TABLE gpts ADD COLUMN required_tier text DEFAULT 'pro';
    END IF;
END $$;

-- Update any NULL required_tier values to 'pro' 
UPDATE gpts SET required_tier = 'pro' WHERE required_tier IS NULL;

-- If tier column exists but required_tier is empty, copy values
UPDATE gpts SET required_tier = tier WHERE tier IS NOT NULL AND required_tier IS NULL;