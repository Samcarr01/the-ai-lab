-- Add required_tier columns to GPTs and Documents tables
-- These columns are missing from the original schema

-- Add required_tier column to GPTs table
ALTER TABLE public.gpts 
ADD COLUMN IF NOT EXISTS required_tier TEXT DEFAULT 'free';

-- Add required_tier column to Documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS required_tier TEXT DEFAULT 'free';

-- Add user_tier column to Users table for 3-tier system
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free';

-- Add subscription fields to Users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- Add tier column to documents and gpts for backward compatibility
ALTER TABLE public.gpts 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gpts_required_tier ON public.gpts(required_tier);
CREATE INDEX IF NOT EXISTS idx_documents_required_tier ON public.documents(required_tier);
CREATE INDEX IF NOT EXISTS idx_users_user_tier ON public.users(user_tier);

-- Verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'gpts' AND column_name IN ('required_tier', 'tier');

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name IN ('required_tier', 'tier');

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('user_tier', 'stripe_subscription_id');