-- Database Migration: Add 3-Tier System Support
-- Execute this migration to update from single Pro tier to Free/Pro/Ultra system

-- 1. Add user_tier column to users table
ALTER TABLE public.users 
ADD COLUMN user_tier TEXT DEFAULT 'free' 
CHECK (user_tier IN ('free', 'pro', 'ultra'));

-- 2. Add tier-specific tracking columns
ALTER TABLE public.users 
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN subscription_current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_cancel_at_period_end BOOLEAN DEFAULT false;

-- 3. Add tier restrictions to content tables
ALTER TABLE public.gpts 
ADD COLUMN required_tier TEXT DEFAULT 'free' 
CHECK (required_tier IN ('free', 'pro', 'ultra'));

ALTER TABLE public.documents 
ADD COLUMN required_tier TEXT DEFAULT 'free' 
CHECK (required_tier IN ('free', 'pro', 'ultra'));

-- 4. Migrate existing data: Convert is_pro to tier system
UPDATE public.users 
SET user_tier = CASE 
    WHEN is_pro = true THEN 'pro'
    ELSE 'free'
END;

-- 5. Set up content tier requirements based on new structure
-- Pro tier content (3 GPTs + 2 guides)
UPDATE public.gpts 
SET required_tier = 'pro' 
WHERE title IN ('Email Enhancer', 'PromptRefiner', 'The Better Ideerer');

UPDATE public.documents 
SET required_tier = 'pro' 
WHERE title LIKE '%Email%' OR title LIKE '%Prompt%';

-- Ultra tier content (remaining 4 GPTs + 2 guides)
UPDATE public.gpts 
SET required_tier = 'ultra' 
WHERE title NOT IN ('Email Enhancer', 'PromptRefiner', 'The Better Ideerer');

UPDATE public.documents 
SET required_tier = 'ultra' 
WHERE title NOT LIKE '%Email%' AND title NOT LIKE '%Prompt%';

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(user_tier);
CREATE INDEX IF NOT EXISTS idx_gpts_tier ON public.gpts(required_tier);
CREATE INDEX IF NOT EXISTS idx_documents_tier ON public.documents(required_tier);

-- 7. Update RLS policies to include tier checking
DROP POLICY IF EXISTS "Pro users can download documents" ON public.documents;
CREATE POLICY "Tier-based document access" ON public.documents
  FOR SELECT USING (
    required_tier = 'free' OR 
    (required_tier = 'pro' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.user_tier IN ('pro', 'ultra')
    )) OR
    (required_tier = 'ultra' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.user_tier = 'ultra'
    ))
  );

DROP POLICY IF EXISTS "Pro users can access GPTs" ON public.gpts;
CREATE POLICY "Tier-based GPT access" ON public.gpts
  FOR SELECT USING (
    required_tier = 'free' OR 
    (required_tier = 'pro' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.user_tier IN ('pro', 'ultra')
    )) OR
    (required_tier = 'ultra' AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.user_tier = 'ultra'
    ))
  );

-- 8. Add admin override for content management
CREATE POLICY "Admin can manage GPT tiers" ON public.gpts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

CREATE POLICY "Admin can manage document tiers" ON public.documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.email = 'samcarr1232@gmail.com'
    )
  );

-- 9. Create helper function for tier checking
CREATE OR REPLACE FUNCTION user_has_tier_access(required_tier TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Free tier has access to free content
  IF required_tier = 'free' THEN
    RETURN true;
  END IF;
  
  -- Check user's tier
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = user_id 
    AND (
      (required_tier = 'pro' AND users.user_tier IN ('pro', 'ultra')) OR
      (required_tier = 'ultra' AND users.user_tier = 'ultra')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add trigger to update updated_at on tier changes
CREATE TRIGGER set_timestamp_users_tier
  BEFORE UPDATE OF user_tier ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 11. Add comment documentation
COMMENT ON COLUMN public.users.user_tier IS 'User subscription tier: free, pro, or ultra';
COMMENT ON COLUMN public.users.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';
COMMENT ON COLUMN public.users.subscription_status IS 'Current subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN public.gpts.required_tier IS 'Minimum tier required to access this GPT';
COMMENT ON COLUMN public.documents.required_tier IS 'Minimum tier required to download this document';

-- Migration complete - Ready for 3-tier system!