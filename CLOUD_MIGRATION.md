# Cloud Migration Guide

## Database Migration Status (2025-10-01)

### ✅ Current State: Clean, Lean Database Ready for Cloud

The database has been reset with a minimal, production-ready schema. All legacy migrations and bloat have been removed.

---

## Migration Files (In Order)

These are the ONLY migrations that should be deployed to production:

1. **`20250929000000_initial_lean_schema.sql`** - Core marketplace schema
2. **`20250929000001_add_full_text_search.sql`** - Arabic full-text search
3. **`20250929000002_add_listings_security_optimization.sql`** - Security & performance
4. **`20251001000001_add_hot_deals_support.sql`** - Hot deals feature
5. **`20251001000002_add_admin_system.sql`** - Admin infrastructure (tables, RLS)
6. **`20251001000004_add_role_based_rls.sql`** - Role-based RLS policies (Gold Standard)

---

## Deploying to Supabase Cloud

### Step 1: Link Your Project
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Push Migrations
```bash
npx supabase db push --linked
```

This will apply all migrations in order.

### Step 3: Create First Admin User

After migrations are deployed, create the first admin user via SQL:

```sql
-- Insert auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  reauthentication_token,
  phone_change,
  phone_change_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'YOUR_EMAIL@example.com',
  crypt('YOUR_SECURE_PASSWORD', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Admin","last_name":"User"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '', '', '', '', '', '', ''
)
RETURNING id;

-- Use the returned ID to create admin entry
INSERT INTO public.admin_users (
  user_id,
  role,
  permissions,
  is_active,
  notes
) VALUES (
  'PASTE_USER_ID_HERE',
  'super_admin',
  '{}'::jsonb,
  true,
  'Initial super admin'
);
```

### Step 4: Verify Admin Access

Test the admin login:
```bash
node scripts/test-admin-users-page.js
```

### Step 5: Update Environment Variables

In your production environment (Vercel/etc), set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ⚠️ CRITICAL: Database Philosophy

### **DO NOT** Add Unnecessary Database Objects

The previous version of this system broke because of manual additions of excessive indexes, triggers, and other objects in the cloud environment.

### Golden Rules:

1. **NEVER manually add indexes** unless proven necessary through performance testing
2. **NEVER add triggers** without thorough testing and documentation
3. **ALWAYS use migrations** for schema changes - never manual SQL in cloud
4. **STICK to the lean schema** - it contains exactly what we need
5. **TEST performance first** - don't assume you need more indexes

### Current Index Count: 11 Essential Indexes

Our lean schema contains exactly **11 essential indexes** - this is intentional:
- `idx_profiles_wilaya` - Geographic filtering
- `idx_listings_user_id` - User's listings
- `idx_listings_fulltext` - Search functionality
- `idx_listings_search_compound` - Complex filtering
- `idx_favorites_listing_id` - Favorite lookups
- `idx_reviews_reviewed_id` - User reviews
- `idx_conversations_users` - User conversations
- `idx_messages_conversation_time` - Message ordering
- `idx_messages_unread` - Unread counts
- `idx_notifications_user_unread` - Unread notifications
- `idx_notifications_user_all` - Notification history

### Before Adding ANY Database Object:

1. **Prove it's needed** with actual performance testing
2. **Document the reason** in a migration file with comments
3. **Test thoroughly** in local environment first
4. **Get approval** before deploying to cloud
5. **Monitor impact** after deployment

---

## Admin System Architecture

### Security Model: Role-Based RLS (Gold Standard)

The admin system uses **role-based RLS** - the recommended Supabase pattern:

- ✅ All admin operations use standard authenticated client
- ✅ No service_role bypass in API routes
- ✅ Database-level security via RLS policies
- ✅ `is_admin()` helper function for policy checks
- ✅ Proper audit trail via admin_activity_logs

### Admin Tables:

1. **admin_users** - Admin user accounts with roles
2. **admin_sessions** - Admin login session tracking
3. **admin_activity_logs** - Audit trail of admin actions
4. **admin_invitations** - Admin invitation system

### Admin Roles (Hierarchical):

- **super_admin** - Full system access, can manage other admins
- **admin** - Can manage users and content
- **moderator** - Can moderate content
- **support** - Read-only access for support staff

---

## Post-Migration Verification

Run these SQL queries after migration to verify:

```sql
-- Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check full-text search is configured
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE '%fulltext%';

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename;

-- Confirm migration count (should be 6)
SELECT COUNT(*) as total_migrations FROM supabase_migrations.schema_migrations;

-- Test is_admin() function
SELECT is_admin();

-- Check admin users table
SELECT * FROM admin_users;
```

---

## Rollback Plan

If something goes wrong during migration:

1. **DO NOT** manually fix in production
2. Create a new migration file to fix the issue
3. Test locally first: `npx supabase db reset`
4. Then push to production: `npx supabase db push --linked`

---

## Support

If you encounter issues:
- Check Supabase logs in the dashboard
- Review RLS policies: Settings → Database → Policies
- Test locally first with `npx supabase start`
- Never bypass RLS with service_role in production

---

**Last Updated**: 2025-10-01
**Database Version**: Clean lean schema with role-based admin RLS
