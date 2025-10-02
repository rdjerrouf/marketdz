# Cloud Migration Plan

Based on Supabase AI analysis of current cloud state vs. local schema.

## Current Situation

**Cloud DB has:**
- All core tables (profiles, listings, favorites, reviews, conversations, messages, notifications)
- Admin system tables (admin_users, admin_invitations, admin_sessions, admin_activity_logs, **admin_mfa**)
- Dual-vector search: `search_vector_ar`, `search_vector_fr`, `normalized_title_ar`, `normalized_description_ar`
- All required extensions (uuid-ossp, pg_trgm, unaccent, pgcrypto, pg_cron)
- RLS enabled on all tables
- **NO Edge Functions deployed**

**Local has:**
- Same core tables
- Admin system (without admin_mfa table)
- Single-vector search: `search_vector` only
- 6 migration files ready to deploy

## Migration Strategy

### Step 1: Pre-Migration Cleanup (NEW)
**File:** `20251002000000_pre_migration_cleanup.sql`

- Verify extensions exist
- Drop conflicting search triggers/functions
- Document decision to keep admin_mfa table
- Prepare for dual-vector search alignment

### Step 2: Align Search with Cloud (NEW)
**File:** `20251002000001_align_search_with_cloud.sql`

- Add dual-vector columns if missing (they should exist)
- Create `normalize_arabic()` function
- Populate search vectors for existing data
- Create triggers to maintain both vectors
- Create GIN indexes for both languages

### Step 3: Apply Remaining Migrations
In order:
1. `20250929000000_initial_lean_schema.sql` - Core schema (mostly exists, will be idempotent)
2. `20250929000001_add_full_text_search.sql` - SKIP (deprecated, kept for local Docker only)
3. `20250929000002_add_listings_security_optimization.sql` - Security updates
4. `20251001000001_add_hot_deals_support.sql` - Hot deals feature
5. `20251001000002_add_admin_system.sql` - Admin tables (mostly exists)
6. `20251001000004_add_role_based_rls.sql` - **CRITICAL** - RLS policies for admin

## Execution Order

```bash
# 1. Link to your Supabase project (if not already done)
npx supabase link --project-ref YOUR_PROJECT_REF

# 2. Backup current cloud database (CRITICAL!)
# Go to Supabase Dashboard → Database → Backups → Create Backup

# 3. Push migrations in order
npx supabase db push --linked

# 4. Verify migration success
# Check Supabase Dashboard → Database → Migrations
```

## Post-Migration Verification

### 1. Check Search Columns
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
AND column_name LIKE '%search%'
ORDER BY column_name;

-- Expected output:
-- normalized_description_ar | text
-- normalized_title_ar | text
-- search_vector_ar | tsvector
-- search_vector_fr | tsvector
```

### 2. Check Indexes
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'listings'
AND indexname LIKE '%search%'
ORDER BY indexname;

-- Expected output:
-- listings_normalized_description_ar_idx
-- listings_normalized_title_ar_idx
-- listings_search_vector_ar_gin
-- listings_search_vector_fr_gin
```

### 3. Verify Admin Functions
```sql
SELECT public.is_admin();  -- Should return boolean
SELECT * FROM public.current_admin();  -- Should return admin record if you're admin
```

### 4. Test RLS Policies
```sql
-- As regular user
SELECT count(*) FROM admin_users;  -- Should fail or return 0

-- As admin user (after setting up admin record)
SELECT count(*) FROM admin_users;  -- Should return admin count
```

### 5. Check admin_mfa Table (Should Exist)
```sql
SELECT count(*) FROM admin_mfa;  -- Should return 0 (empty but exists)
```

## Critical Decisions Made

1. **Keep dual-vector search** (search_vector_ar + search_vector_fr)
   - Reason: Better bilingual support, already in cloud
   - Trade-off: Slightly slower writes (~5ms overhead)

2. **Keep admin_mfa table**
   - Reason: Future MFA implementation for admins
   - Trade-off: Unused table for now, minimal storage cost

3. **Deprecate single search_vector column**
   - Reason: Cloud uses dual-vector, align with production
   - Trade-off: Local Docker still uses simple version for dev speed

## What NOT to Do

❌ **DO NOT** run `DROP SCHEMA public CASCADE` on cloud
❌ **DO NOT** push migrations without backup
❌ **DO NOT** skip the pre-migration cleanup script
❌ **DO NOT** manually delete search columns from cloud
❌ **DO NOT** delete admin_mfa table

## After Migration: Create Super Admin

```sql
-- 1. Sign up via your production app
-- 2. Get your user ID from Supabase Dashboard → Authentication → Users
-- 3. Run this SQL:

INSERT INTO public.admin_users (user_id, role, notes)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'super_admin',
  'Initial super admin - production'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();
```

## Rollback Plan

If migration fails:

1. Restore from backup (Supabase Dashboard → Backups)
2. Review migration errors
3. Fix conflicting migrations
4. Re-attempt with fixed migrations

## Timeline Estimate

- Pre-migration backup: 5 minutes
- Migration execution: 2-3 minutes
- Post-migration verification: 5 minutes
- Admin user setup: 2 minutes
- **Total: ~15 minutes**

## Success Criteria

✅ All migrations applied without errors
✅ Dual-vector search columns exist and are indexed
✅ Admin system functions work (`is_admin()`, `current_admin()`)
✅ RLS policies active and working
✅ admin_mfa table exists
✅ Super admin user created and can access admin panel
✅ Test user can search listings (bilingual)
