# Supabase AI Migration Plan
## Based on AI Analysis of Cloud vs Local

### Executive Summary
Cloud already has most of the schema. We only need to apply **5 migrations** (3 full + 2 modified).

---

## Migration Execution Order

### ✅ Step 1: Backup (CRITICAL!)
Go to Supabase Dashboard → Database → Backups → Create Backup

### ✅ Step 2: Run Pre-Migration Cleanup
**File:** `20251002000000_pre_migration_cleanup.sql`
**Status:** Run as-is ✅
**Purpose:** Removes single-vector artifacts, validates extensions

### ✅ Step 3: Align Search with Cloud
**File:** `20251002000001_align_search_with_cloud.sql`
**Status:** Run as-is ✅
**Purpose:** Ensures dual-vector trigger, functions, indexes

### ✅ Step 4: Add Hot Deals Support
**File:** `20251001000001_add_hot_deals_support.sql`
**Status:** Run as-is ✅
**Purpose:** Adds hot deals columns, index, function

### ⚠️ Step 5: Add Admin System (MODIFIED)
**File:** `20251001000002_add_admin_system.sql`
**Status:** Needs modification ⚠️

**What to SKIP in cloud:**
- ❌ CREATE TABLE statements (tables already exist)
- ❌ "via API only" deny-all policies (will be replaced in next step)
- ❌ profiles.status addition (already exists in cloud)

**What to KEEP:**
- ✅ `update_admin_users_updated_at()` function + trigger
- ✅ `cleanup_expired_admin_sessions()` function
- ✅ Admin table indexes (IF NOT EXISTS protects us)

### ✅ Step 6: Add Role-Based RLS
**File:** `20251001000004_add_role_based_rls.sql`
**Status:** Run as-is ✅
**Purpose:** Creates `is_admin()`, `current_admin()`, replaces policies

---

## Migrations to SKIP Entirely

| Migration | Reason to Skip |
|-----------|---------------|
| `20250929000000_initial_lean_schema.sql` | Core tables already exist in cloud |
| `20250929000001_add_full_text_search.sql` | Deprecated - cloud uses dual-vector |
| `20250929000002_add_listings_security_optimization.sql` | RLS already enabled in cloud |

---

## Modified Migration File Needed

### Create Cloud-Safe Version of Admin System Migration

**Original:** `20251001000002_add_admin_system.sql`
**New:** `20251001000002_add_admin_system_CLOUD.sql`

Extract only:
```sql
-- Update admin_users updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS integer AS $$
DECLARE
    affected_count integer;
BEGIN
    UPDATE public.admin_sessions
    SET is_active = false,
        logout_reason = 'timeout'
    WHERE is_active = true
      AND expires_at < now();

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_admin_sessions IS 'Deactivates expired admin sessions. Call periodically via cron.';

-- Indexes (IF NOT EXISTS makes this safe)
CREATE INDEX IF NOT EXISTS idx_admin_users_user_active
ON public.admin_users(user_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_users_role
ON public.admin_users(role)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token
ON public.admin_sessions(session_token)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin
ON public.admin_sessions(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry
ON public.admin_sessions(expires_at)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_time
ON public.admin_activity_logs(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_target
ON public.admin_activity_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action_time
ON public.admin_activity_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token
ON public.admin_invitations(invitation_token)
WHERE accepted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_invites_email
ON public.admin_invitations(email)
WHERE accepted_at IS NULL;
```

---

## Post-Migration Validation

Run these SQL queries in Supabase Dashboard → SQL Editor:

### 1. Verify Search Columns
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
AND column_name LIKE '%search%'
ORDER BY column_name;
```
**Expected:** 4 columns (normalized_description_ar, normalized_title_ar, search_vector_ar, search_vector_fr)

### 2. Verify Admin Functions
```sql
SELECT public.is_admin();
-- Should return: false (or true if you're already admin)

SELECT * FROM public.current_admin();
-- Should return: empty or your admin record
```

### 3. Verify Hot Deals Structure
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
AND column_name LIKE '%hot%'
ORDER BY column_name;
```
**Expected:** is_hot_deal, hot_deal_badge_type, hot_deal_expires_at

### 4. Verify admin_mfa Exists
```sql
SELECT count(*) FROM admin_mfa;
```
**Expected:** 0 (empty table)

### 5. Check All Applied Migrations
```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

---

## Execution Commands

```bash
# Step 1: Link to cloud (if not already done)
npx supabase link --project-ref YOUR_PROJECT_REF

# Step 2: Apply migrations using Supabase Dashboard SQL Editor
# Copy and paste each migration file content in order:
# 1. 20251002000000_pre_migration_cleanup.sql
# 2. 20251002000001_align_search_with_cloud.sql
# 3. 20251001000001_add_hot_deals_support.sql
# 4. 20251001000002_add_admin_system_CLOUD.sql (modified version)
# 5. 20251001000004_add_role_based_rls.sql

# Alternative: Use CLI (but manual is safer for first time)
# npx supabase db push --linked
```

---

## Post-Migration Tasks

### 1. Create Super Admin
```sql
INSERT INTO public.admin_users (user_id, role, notes)
VALUES (
  'YOUR_USER_ID_HERE',  -- Get from auth.users after signup
  'super_admin',
  'Initial super admin - production'
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();
```

### 2. Setup Cron Jobs (Optional)
```sql
-- Expire hot deals every hour
SELECT cron.schedule(
  'expire-hot-deals',
  '0 * * * *',  -- Every hour
  $$ SELECT expire_hot_deals(); $$
);

-- Cleanup expired admin sessions daily
SELECT cron.schedule(
  'cleanup-admin-sessions',
  '0 2 * * *',  -- 2 AM daily
  $$ SELECT cleanup_expired_admin_sessions(); $$
);
```

### 3. Update Search API Code
File: `src/app/api/search/route.ts`

Change from:
```typescript
.textSearch('search_vector', searchQuery)
```

To:
```typescript
// Search both Arabic and French vectors
.or(`search_vector_ar.fts.${searchQuery},search_vector_fr.fts.${searchQuery}`)
```

---

## Rollback Plan

If migration fails:
1. Go to Supabase Dashboard → Database → Backups
2. Select the backup created in Step 1
3. Click "Restore"
4. Review errors and fix
5. Re-attempt

---

## Timeline

- Backup: 5 minutes
- Migration execution: 10 minutes (manual SQL editor)
- Validation: 5 minutes
- Admin user creation: 2 minutes
- **Total: ~22 minutes**

---

## Key Differences from Original Plan

| Original Plan | AI Recommendation | Reason |
|--------------|-------------------|---------|
| Run all 8 migrations | Run only 5 (3 full + 2 modified) | Cloud already has core schema |
| Use `npx supabase db push` | Use SQL Editor (safer) | Better control, see errors immediately |
| Apply admin system as-is | Modify to skip table creation | Tables already exist with different structure |
| Keep single-vector migration | Skip entirely | Cloud uses dual-vector |

---

## Success Criteria

✅ All 5 migrations applied without errors
✅ Dual-vector search columns and indexes exist
✅ `is_admin()` and `current_admin()` functions work
✅ Hot deals columns added
✅ RLS policies active and role-based
✅ Super admin user created
✅ Search API updated for dual-vector
