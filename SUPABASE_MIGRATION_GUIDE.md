# Supabase Database Migration Guide - 3-Tier System

## 🚀 **Required Actions in Supabase Dashboard**

### **Step 1: Run Database Migration**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the entire contents of `src/lib/database-tier-migration.sql`
4. Click **Run** to execute the migration

### **Step 2: Verify Migration Success**
After running the migration, verify these changes:

**Check Users Table:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
```

**Check GPTs Table:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'gpts' AND table_schema = 'public';
```

**Check Documents Table:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'documents' AND table_schema = 'public';
```

### **Step 3: Set Content Tier Requirements**
The migration automatically sets up tier requirements, but you may want to customize them:

**Update GPT Tier Requirements:**
```sql
-- Set Pro tier GPTs (3 essential GPTs)
UPDATE public.gpts 
SET required_tier = 'pro' 
WHERE title IN ('Email Enhancer', 'PromptRefiner', 'The Better Ideerer');

-- Set Ultra tier GPTs (remaining 4 GPTs)
UPDATE public.gpts 
SET required_tier = 'ultra' 
WHERE title NOT IN ('Email Enhancer', 'PromptRefiner', 'The Better Ideerer');
```

**Update Document Tier Requirements:**
```sql
-- Set Pro tier documents (2 core playbooks)
UPDATE public.documents 
SET required_tier = 'pro' 
WHERE title LIKE '%Email%' OR title LIKE '%Prompt%';

-- Set Ultra tier documents (remaining playbooks)
UPDATE public.documents 
SET required_tier = 'ultra' 
WHERE title NOT LIKE '%Email%' AND title NOT LIKE '%Prompt%';
```

### **Step 4: Test Access Control**
Run these queries to verify the access control is working:

```sql
-- Check tier distribution
SELECT required_tier, COUNT(*) as count 
FROM public.gpts 
GROUP BY required_tier;

SELECT required_tier, COUNT(*) as count 
FROM public.documents 
GROUP BY required_tier;

-- Test user tier access
SELECT email, user_tier, is_pro 
FROM public.users 
LIMIT 10;
```

### **Step 5: Update Existing Users (Optional)**
If you have existing users you want to set to specific tiers:

```sql
-- Set specific users to Pro tier
UPDATE public.users 
SET user_tier = 'pro', is_pro = true 
WHERE email IN ('user1@example.com', 'user2@example.com');

-- Set admin to Ultra tier (automatic in code, but can be explicit)
UPDATE public.users 
SET user_tier = 'ultra', is_pro = true 
WHERE email = 'samcarr1232@gmail.com';
```

## 🔧 **Optional: Custom Tier Assignments**

If you want to customize which content belongs to which tier:

### **GPT Tier Assignment Strategy:**
- **Pro Tier (£7/month)**: 3 most essential GPTs for daily use
- **Ultra Tier (£19/month)**: All 7 GPTs for comprehensive AI toolkit

### **Document Tier Assignment Strategy:**
- **Pro Tier (£7/month)**: 2 core playbooks for getting started
- **Ultra Tier (£19/month)**: All playbooks for complete library

## ✅ **Migration Verification Checklist**

- [ ] Database migration executed successfully
- [ ] New columns added to users, gpts, and documents tables
- [ ] RLS policies updated for tier-based access
- [ ] Content assigned to appropriate tiers
- [ ] Admin user has Ultra access
- [ ] Test user accounts have correct tier assignments
- [ ] Indexes created for performance optimization

## 🚨 **Important Notes**

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Consider running this in a staging environment first
3. **RLS Policies**: The migration updates Row Level Security policies - ensure they work as expected
4. **Admin Access**: Admin email (samcarr1232@gmail.com) automatically gets Ultra tier access
5. **Backward Compatibility**: The `is_pro` field is maintained for backward compatibility

## 📊 **Expected Results After Migration**

- **Users Table**: New tier tracking columns added
- **Content Tables**: Tier requirements set on all GPTs and documents
- **Access Control**: Proper gating based on user subscription tier
- **Performance**: Indexes added for faster tier-based queries
- **Security**: RLS policies enforce tier-based access at database level

## 🔄 **If Migration Fails**

If you encounter issues:

1. Check the Supabase logs for specific error messages
2. Ensure all referenced tables exist
3. Verify you have sufficient permissions
4. Run sections of the migration individually if needed
5. Contact if you need help debugging specific errors

The migration is designed to be safe and maintain existing data while adding new tier functionality.