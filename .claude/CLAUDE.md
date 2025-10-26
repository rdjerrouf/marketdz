# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL POLICIES

### ❌ CLOUD DATABASE - ABSOLUTELY UNTOUCHABLE

**The cloud Supabase database is PRODUCTION-READY and PERFECTLY STRUCTURED for launch.**

**NEVER:**
- Touch, modify, or "fix" the cloud database
- Apply migrations to cloud automatically
- Suggest optimizations for cloud
- Run queries against cloud without explicit approval
- Assume cloud needs any changes

**The cloud database is ready for launch. Period.**

**ALL development and testing MUST be done in LOCAL Supabase ONLY.**

---

### ⚠️ Environment Switching Protocol

When switching between Local and Cloud environments (for inspection only):

1. **ALWAYS clear browser cookies** (DevTools → Application → Cookies → Delete all)
2. **ALWAYS restart dev server** after changing .env.local
3. **ALWAYS sign out** before switching environments
4. **VERIFY network requests** go to correct Supabase URL

**Why**: JWT tokens from one environment won't work in another → Permission denied errors

**Best Practice**: Use separate browser profiles for local vs cloud.

---

## 📋 PROJECT OVERVIEW

MarketDZ is a Next.js 15 marketplace application optimized for Algeria with:
- **PWA Support**: Installable app with offline functionality
- **Bilingual**: Arabic RTL + French localization
- **Authentication**: Supabase PKCE flow with Docker networking
- **File Uploads**: Secure storage with content moderation via Edge Functions
- **Real-time**: Messaging and notifications
- **Search**: Advanced Arabic full-text search with geographic filtering
- **Admin System**: Role-based admin panel with SECURITY DEFINER functions
- **Performance**: Optimized for 250k+ listings scale

**Tech Stack**:
- Next.js 15.5.2 with App Router & Turbopack
- Supabase (PostgreSQL + PostGIS)
- Tailwind CSS 4 + Radix UI
- TypeScript 5
- Playwright for E2E testing
- PWA via next-pwa

**Production Status**: Running on Supabase cloud (https://vrlzwxoiglzwmhndpolj.supabase.co)

**Recent Optimizations** (2025-10-21):
- Homepage: 20s → 164-403ms (87x faster)
- Admin routes: All optimized for 250k scale
- Query deduplication: 6x profile queries → 1x (80% reduction)
- Placeholder image 404s fixed with inline SVG

---

## 🚀 ESSENTIAL COMMANDS

### Quick Start
```bash
npx supabase start       # Start local Supabase
npm install              # Install dependencies
npm run dev              # Start dev server (opens browser at localhost:3000)
```

### Development
```bash
npm run dev              # Local dev with turbopack (opens browser)
npm run build            # Production build with turbopack
npm run start            # Start production build
npm run lint             # ESLint (use before committing)
npm run health           # Check health endpoint
```

### Testing
```bash
npm run test             # Run all Playwright tests
npm run test:headed      # Tests with browser UI
npm run test:ui          # Playwright UI mode (interactive)
npm run test:report      # Show test report
npm run test:pool        # Test DB connection pool

# Run specific tests
npx playwright test --grep "auth"     # Run tests matching pattern
npx playwright test --debug           # Debug mode
```

**Test Files Location**: `tests/` directory

### Docker
```bash
npm run docker:up        # Start container
npm run docker:down      # Stop container
npm run docker:logs      # View logs (follow mode)
npm run docker:restart   # Restart
npm run docker:reset     # Full reset (down + up)
npm run docker:shell     # Access shell
npm run docker:status    # Check status
```

### Mock Data (LOCAL ONLY)
```bash
npm run mock:test        # Minimal test data
npm run mock:medium      # Medium dataset
npm run mock:full        # Full dataset

# Create users and listings
node scripts/create-10-test-users.js      # user1@email.com - user10@email.com
node scripts/generate-10k-listings.js     # 10k listings across users
```

**Test Credentials**: user1@email.com through user10@email.com / password123

### PWA Testing
```bash
npm run build && npm run start  # Test PWA in production mode
# Then test in Chrome DevTools > Application > Service Workers
```

---

## 🔌 MCP SERVERS

### Chrome DevTools MCP
**Status**: ✅ Configured
**Purpose**: Browser automation and debugging

```bash
npm run chrome:debug     # Start Chrome with debugging (port 9222)
npm run chrome:verify    # Verify connection
```

**Usage Examples**:
- "Take a screenshot of localhost:3001"
- "Show console errors"
- "Click the Submit button"
- "Fill out the review form with 5 stars"

**Available Tools**: `take_snapshot`, `click`, `fill`, `list_network_requests`, `list_console_messages`, `navigate_page`, and 20+ more

**Docs**: See `docs/CHROME_MCP_QUICK_START.md`

### Supabase Database MCP
**Status**: ✅ Configured (2025-10-22)
**Purpose**: **INSPECTION ONLY** - View cloud database state
**Access Token**: Configured in `.mcp.json` (not committed to git)

**⚠️ CRITICAL**: This tool is for READ-ONLY inspection of cloud database. NEVER run modification queries!

**When to Use**:
- Inspecting cloud database schema (READ-ONLY)
- Checking for manually added triggers/indexes (READ-ONLY)
- Verifying production state (READ-ONLY)

**When NOT to Use**:
- Any modification queries (INSERT, UPDATE, DELETE, ALTER, DROP, CREATE)
- Routine local development queries (use local Supabase instead)
- "Fixing" or "optimizing" cloud database

**Usage Examples**:
- "Show me the schema of the reviews table in cloud" (READ-ONLY)
- "List all indexes on listings table in cloud" (READ-ONLY)

**Note**: Both MCPs require Claude Code restart to activate after installation.

---

## 🏗️ ARCHITECTURE

### Development Modes

**Local Development (Default - USE THIS)**:
- URL: http://localhost:3000
- Supabase: Local instance via `npx supabase start` (http://127.0.0.1:54321)
- Studio: http://127.0.0.1:54323
- Hot reload with Turbopack
- Use for ALL day-to-day development and testing

**Docker Mode** (for production-like testing):
- URL: http://localhost:3001
- Requires `.env.docker` configuration
- Use for testing Docker networking, PWA, or deployment issues

**Cloud Production** (UNTOUCHABLE):
- URL: https://vrlzwxoiglzwmhndpolj.supabase.co
- **DO NOT TOUCH** - Production ready for launch
- Inspection only via Supabase MCP (READ-ONLY)

**Current Local Setup**:
- `project_id = "vrlzwxoiglzwmhndpolj"` in config.toml
- This is a LOCAL instance (completely separate from cloud)
- Contains 10k test listings for development

### Authentication System
Supabase PKCE authentication with singleton pattern:

**Key Files**:
- `src/lib/supabase/client.ts` - Browser-side auth with singleton pattern
- `src/lib/supabase/server.ts` - SSR auth with cookie handling
- `src/lib/supabase/serverPool.ts` - Connection pooling for API routes
- `middleware.ts` - Request interception and session validation
- `src/contexts/AuthContext.tsx` - Global auth state (single source of truth)

**Critical Pattern**: Only ONE auth listener exists (in AuthContext) to prevent "Multiple GoTrueClient instances" warning

**Docker Cookie Config**:
- Cookie attributes: `httpOnly: false`, `secure: false`, `sameSite: 'lax'`
- Dual URLs: `SUPABASE_URL` (container) vs `NEXT_PUBLIC_SUPABASE_URL` (browser)

### Admin System
Role-based admin panel with SECURITY DEFINER functions:

**Structure**:
- Frontend: `src/app/admin/*` - User management, analytics, logs, settings
- Backend: `admin_secure` schema with secure functions
- Auth: `src/lib/admin/*` - Invitations, MFA, session management
- Roles: `super_admin`, `admin`, `moderator`

**Pages**: users, admins, analytics, logs, notifications, listings, settings

### File Upload Flow
Client validation → Content moderation → Secure upload → Metadata storage

**Key Files**:
- `src/components/listings/ImageUpload.tsx` - Drag/drop component
- `src/lib/storage.ts` - Upload management via Edge Functions
- `src/lib/image-compression.ts` - Client-side compression
- Allowed: JPEG, PNG, WebP only

### API Routes (`src/app/api/`)
- `auth/*` - signin, signup, signout, session, reset-password
- `listings/*` - CRUD + search
- `search/*` - Advanced search with Arabic support (analytics, suggestions, count)
- `messages/*` - Real-time messaging
- `admin/*` - Admin functions (users, stats, user-management)
- `favorites/*`, `reviews/*` - User interactions
- `upload/*` - File uploads
- `health/*`, `monitoring/*` - System health

### PWA Configuration
- Manifest: `public/manifest.json`
- Service Worker: Auto-caching via next-pwa
- Config: `next.config.ts`
- Caching Strategies:
  - `NetworkFirst`: Supabase API, general API routes
  - `CacheFirst`: Static assets (images)
  - `NetworkOnly`: Admin/auth routes (never cached)

### Mobile UI
- `src/components/common/MobileListingCard.tsx` - 2-column grid layout
- Mobile: `grid-cols-2` via `md:hidden`
- Desktop: `lg:grid-cols-3` via `hidden md:grid`

---

## 💡 CRITICAL PATTERNS & FIXES

### TypeScript Database Nullables
**IMPORTANT**: Database columns return `null`, not `undefined`

```typescript
// ❌ Wrong - uses optional (undefined)
interface Listing {
  listing_id?: string
  avatar_url?: string
}

// ✅ Correct - uses null union
interface Listing {
  listing_id: string | null
  avatar_url: string | null
}
```

**Pattern**: Database nullables use `T | null`, not `T?` which means `T | undefined`

### Supabase Client Singleton Pattern
**CRITICAL**: Only ONE auth listener to prevent "Multiple GoTrueClient instances" warning

**Implementation**:
- `AuthContext.tsx` - Single source of truth for auth state
- `useAuth.ts` - Re-exports from AuthContext (no listener)
- `useUser.ts` - Consumes from AuthContext (no listener)
- `src/lib/supabase/client.ts` - Singleton pattern

```typescript
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseKey)
  }
  return supabaseInstance
}

export const supabase = getSupabaseClient()
```

**Important**: Import `SupabaseClient` from `@supabase/supabase-js`, NOT from `@supabase/ssr`

### Database Query Best Practices

**Search API Pattern**:
```typescript
// ✅ Correct - use precomputed search vectors
.textSearch('search_vector', query, { type: 'websearch', config: 'simple' })

// ❌ Wrong - forces expensive to_tsvector() on every query
.textSearch('title', query)
```

**Pagination**:
```typescript
// ✅ Prefer keyset pagination for large datasets
WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 50

// ❌ Avoid OFFSET for large result sets (slow at scale)
OFFSET 10000 LIMIT 50
```

**Always Include Status Filter**:
```typescript
// ✅ Hits partial indexes efficiently
.eq('status', 'active')

// ❌ Requires full table scan
// Missing status filter
```

---

## 📁 QUICK FILE REFERENCE

**Database**:
- Type definitions: `src/types/database.ts`
- Migrations: `supabase/migrations/`
- Edge Functions: `supabase/functions/`
- Config: `supabase/config.toml`

**Authentication**:
- Client singleton: `src/lib/supabase/client.ts`
- Server auth: `src/lib/supabase/server.ts`
- API route pool: `src/lib/supabase/serverPool.ts`
- Auth context: `src/contexts/AuthContext.tsx`
- Middleware: `middleware.ts`

**Key Utilities**:
- Storage: `src/lib/storage.ts`
- Image compression: `src/lib/image-compression.ts`
- Auth errors: `src/lib/auth-error-handler.ts`

**Admin**:
- Pages: `src/app/admin/*/page.tsx`
- Auth: `src/lib/admin/*`
- Secure schema: Database `admin_secure` schema

---

## ⚙️ ENVIRONMENT & CONFIGURATION

### Environment Files
```
.env.docker.example     # Template (commit)
.env.docker            # Your keys (NEVER commit)
.env.local             # Local development keys (NEVER commit)
```

### Required Variables
Get from: `npx supabase status` (for local development)
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

### Key URLs
- **Local Dev**: http://localhost:3000 (auto-opens)
- **Local Supabase API**: http://127.0.0.1:54321
- **Local Supabase Studio**: http://127.0.0.1:54323
- **Docker App**: http://localhost:3001
- **Cloud Supabase (READ-ONLY)**: https://vrlzwxoiglzwmhndpolj.supabase.co

---

## 🛠️ UTILITY SCRIPTS

Located in `scripts/` directory:

**Data Management (LOCAL ONLY)**:
- `create-10-test-users.js` - Creates user1@email.com through user10@email.com
- `generate-10k-listings.js` - 10k listings across users
- `create-test-listings-with-photos.js` - Listings with photos
- `generate-to-250k-multilingual.js` - 250k listings for scale testing

**Admin**:
- `create-admin-user.js` - Create admin
- `create-super-admin.js` - Create super admin
- `test-admin-api.js` - Test admin endpoints

**Verification**:
- `verify-listings.js` - Verify listing integrity
- `check-search-vector.js` - Verify search index
- `performance-test-suite.js` - Test queries at scale

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Authentication fails**:
- Check middleware cookie handling
- Verify session flow
- Use `src/lib/auth-error-handler.ts`
- **If switching environments**: Clear browser cookies!

**Favorites/Reviews "permission denied"**:
- Check which environment you're in (network tab)
- Clear browser cookies when switching between local/cloud
- Verify `.env.local` has correct Supabase URL
- Restart dev server after changing env vars
- **Root cause**: JWT token mismatch between environments

**Photos not loading**:
- Use `fixPhotoUrl()` utility for Docker URLs
- Check storage bucket permissions

**Container won't start**:
- Verify Supabase running: `npx supabase status`
- Check Docker network: `npm run docker:status`

**Build failures**:
- Ensure env variables in `.env.local`
- Clear `.next` cache: `rm -rf .next`

**Supabase Studio shows loading forever**:
- Normal for large datasets (10k+ rows)
- Use API calls to verify data instead
- Use SQL Editor for direct queries

### Debugging Commands
```bash
# Auth debugging
docker logs marketdz-app-1 --follow | grep "Middleware"

# Upload debugging
docker logs marketdz-app-1 --follow | grep "Upload"

# Network status
npm run docker:status
docker network ls | grep supabase

# Check which environment browser is using
# In browser DevTools > Network tab, look for Supabase requests
# Should be: http://127.0.0.1:54321 for local
# NOT: https://vrlzwxoiglzwmhndpolj.supabase.co

# Verify data in local database
curl -s "http://127.0.0.1:54321/rest/v1/listings?select=count" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Prefer: count=exact"
```

---

## 🔒 SECURITY NOTES

- **Never commit**: API keys, `.env.docker`, `.env.local`
- **File uploads**: Always go through Edge Functions with content moderation
- **Admin operations**: Use SECURITY DEFINER with `SET search_path TO public` (or specific schemas)
- **Auth errors**: Use `src/lib/auth-error-handler.ts` for safe handling
- **RLS Policies**: All tables have Row Level Security enabled
- **Cloud Database**: READ-ONLY access only, never modify

---

## ⚡ PERFORMANCE NOTES

- **Turbopack**: Enabled for fast dev/build
- **Connection Pooling**: Singleton clients minimize connections
- **Source Maps**: Disabled in production
- **Docker**: Standalone output for minimal image size
- **Current Scale**: Optimized for 250k+ listings
- **Query Performance**: 150-300ms typical for complex queries

### Performance Testing Learnings (250k Scale)

**Key Insights from 250k listings test**:
1. **Test indexes before applying** - don't assume you need them
2. **Use precomputed columns** - query `search_vector`, never `to_tsvector()` on every request
3. **Simple beats complex** - standalone category/subcategory indexes often outperform compound indexes for broad queries
4. **Statement timeouts are symptoms** - fix queries, don't raise timeouts
5. **Use CONCURRENTLY for production** - create indexes without locking tables
6. **Avoid materialized views on write path** - use scheduled jobs instead

**Performance Targets**:
- Category pages: <600ms
- Full-text search: <800ms
- Geographic filter: <700ms
- Multi-filter combo: <750ms
- Homepage: <500ms

---

## 🗄️ DATABASE MANAGEMENT

### Local Database Setup

**Current Status**:
- Project ID: `vrlzwxoiglzwmhndpolj` (matches cloud name for clarity, but completely separate)
- Users: 10 test users (user1@email.com - user10@email.com, password: password123)
- Listings: 10,000 multilingual test listings
- Ready for: Development and testing

**To reset local database**:
```bash
npx supabase db reset  # Resets and re-runs all migrations
```

### Migration Philosophy

**Local Development**:
- Run migrations freely in local environment
- Test thoroughly with 10k+ rows
- Document all changes in migration files

**Cloud Production** (UNTOUCHABLE):
- **NEVER apply migrations without explicit user approval**
- **NEVER suggest "fixing" cloud database**
- Cloud is production-ready and perfectly structured
- All testing MUST be done locally first

### Migration Files (for local development)

Clean, lean schema approach with essential migrations:

1. `20250929000000_initial_lean_schema.sql` - Core marketplace schema
2. `20250929000001_add_full_text_search.sql` - Arabic full-text search
3. `20250929000002_add_listings_security_optimization.sql` - Security + performance
4. `20251001000001_add_hot_deals_support.sql` - Hot deals
5. `20251001000002_add_admin_system.sql` - Admin with role-based access
6. `20251001000004_add_role_based_rls.sql` - Enhanced RLS
7. `20251002000001_align_search_with_cloud.sql` - Search optimization
8. `20251008000000_add_ranked_search_function.sql` - Ranked search
9. `20251020000000_performance_optimization_250k.sql` - 250k scale optimization
10. `20251021000000_add_homepage_index.sql` - Homepage performance
11. `20251024000000_fix_security_definer_search_path.sql` - Fix SECURITY DEFINER functions
12. `20251024000001_fix_remaining_functions_search_path.sql` - Fix remaining functions
13. `20251024000002_fix_handle_new_user_null_names.sql` - Fix null name handling

### Verification Queries (Local only)
```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;

-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verify RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Count records
SELECT
  (SELECT COUNT(*) FROM listings) as listings,
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM auth.users) as users;
```

---

## 🎯 DATABASE PHILOSOPHY: KEEP IT LEAN

### ⚠️ CRITICAL WARNING
**Previous issues were caused by manually adding excessive indexes, triggers, and materialized views.** Do NOT repeat this mistake!

### Golden Rules
1. **NEVER manually add indexes** without performance testing proof
2. **NEVER add triggers** without thorough testing + documentation IN MIGRATIONS
3. **ALWAYS use migrations** - never manual SQL
4. **STICK to lean schema** - contains exactly what's needed
5. **TEST first** - don't assume you need more indexes
6. **AVOID materialized views on write path** - use scheduled jobs instead
7. **LOCAL TESTING ONLY** - never experiment on cloud

### Before Adding ANY Database Object (in LOCAL)
1. Prove it's needed with actual performance tests (run `scripts/performance-test-suite.js`)
2. Document reason in migration with comments
3. Test thoroughly in local environment with 10k+ rows
4. Add to migrations - NEVER apply manually
5. Monitor impact after deployment

**Remember**: More database objects ≠ better performance. Often the opposite is true.

### Preferred Patterns (for local development)
```sql
-- ✅ Good: Partial indexes for common queries
CREATE INDEX idx_listings_active_category
ON listings(category, created_at DESC)
WHERE status = 'active';

-- ✅ Good: Use CONCURRENTLY when needed
CREATE INDEX CONCURRENTLY idx_name ON table(column);

-- ✅ Good: Scheduled materialized view refresh (not on write path)
SELECT cron.schedule('job', '0 */6 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY view_name$$);

-- ❌ Bad: Refreshing materialized views on every write
CREATE TRIGGER refresh_on_insert ...
  EXECUTE FUNCTION refresh_materialized_view();

-- ❌ Bad: Overly broad indexes
CREATE INDEX idx_everything ON table(col1, col2, col3, col4);
```

---

## 📝 NOTES FOR FUTURE CLAUDE INSTANCES

### Environment Setup Summary
- **Local Supabase**: project_id = "vrlzwxoiglzwmhndpolj" (separate from cloud)
- **Test Users**: user1@email.com through user10@email.com, password: password123
- **Test Data**: 10k multilingual listings ready for development
- **Cloud Database**: UNTOUCHABLE - production ready

### Common Tasks
```bash
# Start fresh development session
npx supabase start
npm run dev

# Reset local database if needed
npx supabase db reset

# Create fresh test data
node scripts/create-10-test-users.js
node scripts/generate-10k-listings.js

# Test performance
node scripts/performance-test-suite.js
```

### Remember
- ALL development happens locally
- Cloud database is READ-ONLY for inspection
- Clear browser cookies when switching environments
- Use Chrome DevTools MCP for debugging
- Follow the lean database philosophy
