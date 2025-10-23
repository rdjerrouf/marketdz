# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL ISSUES

### ❌ Reviews & Favorites Timeout (2025-10-22)

**Status**: 🔴 **BLOCKING** - Database timeout at 250k scale

**Problem**: Both reviews and favorites fail with 500 errors due to expensive triggers that refresh entire materialized views on every insert.

**Root Cause**:
- Trigger `refresh_stats_on_review_change` refreshes `private.listing_stats` materialized view
- Trigger `refresh_stats_on_favorite_change` does the same
- At 250k listings, this takes 30+ seconds and times out
- These were manually added to cloud DB (not in migrations)

**Solution**: Migration `supabase/migrations/20251022000001_fix_review_timeout.sql`
- Drops expensive materialized view refresh triggers
- Keeps efficient row-level triggers (`update_user_rating`, `update_favorites_count`)
- Adds `idx_reviews_reviewed_rating` index for fast aggregation

**⚠️ BEFORE APPLYING**: Inspect cloud database state first using Supabase MCP (see "MCP Servers" section) or manual SQL at https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj/sql/new

**Verification After Fix**:
1. Test reviews at http://localhost:3001/profile/12aecaf5-7547-4ec2-8de2-96817695c2ef
2. Test favorites by clicking heart icon on any listing
3. Both should complete instantly (<100ms)

**Test Credentials**: user1@email.com / password123

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
npm run build            # Build with turbopack
npm run start            # Start production build
npm run lint             # ESLint (use before committing)
npm run health           # Check health endpoint
```

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

### Testing
```bash
npm run test             # Run all Playwright tests
npm run test:headed      # Tests with browser UI
npm run test:ui          # Playwright UI mode
npm run test:report      # Show test report
npm run test:pool        # Test DB connection pool
```

### Mock Data
```bash
npm run mock:test        # Minimal test data
npm run mock:medium      # Medium dataset
npm run mock:full        # Full dataset
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
**Purpose**: Direct cloud database inspection
**Access Token**: Configured in `.mcp.json` (not committed to git)

**⚠️ IMPORTANT**: Always ask user before running queries that modify cloud database!

**Usage Examples**:
- "Inspect triggers on the reviews table using Supabase MCP"
- "List all functions that reference listing_stats"
- "Check if private.listing_stats materialized view exists"

**Available Tools**: `query`, `listTables`, `listFunctions`

**Note**: Both MCPs require Claude Code restart to activate after installation.

---

## 🏗️ ARCHITECTURE

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
- `src/components/FileUpload.tsx` - Drag/drop component
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
- Caching: NetworkFirst (API), CacheFirst (static), NetworkOnly (admin/auth)

### Mobile UI
- `src/components/common/MobileListingCard.tsx` - 2-column grid layout
- Mobile: `grid-cols-2` via `md:hidden`
- Desktop: `lg:grid-cols-3` via `hidden md:grid`

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

---

## ⚙️ ENVIRONMENT & CONFIGURATION

### Environment Files
```
.env.docker.example     # Template (commit)
.env.docker            # Your keys (NEVER commit)
.env.local             # Local development keys
```

### Required Variables
Get from: `npx supabase status`
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Key URLs
- **Local Dev**: http://localhost:3000 (auto-opens)
- **Production**: http://localhost:3002 (cloud backend)
- **Docker App**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **Cloud Supabase**: https://vrlzwxoiglzwmhndpolj.supabase.co

---

## 🛠️ UTILITY SCRIPTS

Located in `scripts/` directory:

**Data Management**:
- `setup-complete-test-data.js` - Complete test data
- `create-test-listings-with-photos.js` - Listings with photos
- `generate-cloud-test-data.js` - Generate cloud test data

**Admin**:
- `create-admin-user.js` - Create admin
- `create-super-admin.js` - Create super admin
- `test-admin-api.js` - Test admin endpoints

**Verification**:
- `verify-listings.js` - Verify listing integrity
- `check-search-vector.js` - Verify search index
- `test-rpc-function.js` - Test DB functions

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Authentication fails**:
- Check middleware cookie handling
- Verify session flow
- Use `src/lib/auth-error-handler.ts`

**Photos not loading**:
- Use `fixPhotoUrl()` utility for Docker URLs
- Check storage bucket permissions

**Container won't start**:
- Verify Supabase running: `npx supabase status`
- Check Docker network: `npm run docker:status`

**Build failures**:
- Ensure env variables in `.env.local`
- Clear `.next` cache: `rm -rf .next`

**Admin access denied**:
- Check admin session via `src/lib/admin/` utilities
- Verify admin_users table entry

**Image upload failures**:
- Check Edge Function logs
- Verify content moderation status

### Debugging Commands
```bash
# Auth debugging
docker logs marketdz-app-1 --follow | grep "Middleware"

# Upload debugging
docker logs marketdz-app-1 --follow | grep "Upload"

# Network status
npm run docker:status
docker network ls | grep supabase
```

---

## 🔒 SECURITY NOTES

- **Never commit**: API keys, `.env.docker`, `.env.local`
- **File uploads**: Always go through Edge Functions with content moderation
- **Admin operations**: Use SECURITY DEFINER with secure search_path
- **Auth errors**: Use `src/lib/auth-error-handler.ts` for safe handling

---

## ⚡ PERFORMANCE NOTES

- **Turbopack**: Enabled for fast dev/build
- **Connection Pooling**: Singleton clients minimize connections
- **Source Maps**: Disabled in production
- **Docker**: Standalone output for minimal image size
- **Current Scale**: Optimized for 250k+ listings
- **Query Performance**: 150-300ms typical

---

## 🗄️ DATABASE MANAGEMENT

### Migration Status
Clean, lean schema approach with essential migrations:

1. `initial_lean_schema.sql` - Core marketplace schema
2. `add_full_text_search.sql` - Arabic full-text search
3. `add_listings_security_optimization.sql` - Security + performance
4. `add_hot_deals_support.sql` - Hot deals
5. `add_admin_system.sql` - Admin with role-based access
6. `add_role_based_rls.sql` - Enhanced RLS
7. `align_search_with_cloud.sql` - Search optimization
8. `add_homepage_index.sql` - Homepage performance
9. `fix_review_timeout.sql` - Review/favorites timeout fix

### Deploying Migrations

⚠️ **ALWAYS get user approval before applying migrations to cloud!**

```bash
# Link project (first time only)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx supabase db push --linked

# Push single migration
npx supabase db push --linked --include-all=false --file supabase/migrations/FILE_NAME.sql
```

### Verification Queries
```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;

-- Verify tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verify RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## 🎯 DATABASE PHILOSOPHY: KEEP IT LEAN

### ⚠️ CRITICAL WARNING
**The previous version broke by manually adding excessive indexes, triggers, and materialized views in cloud.** Do NOT repeat this mistake!

### Golden Rules
1. **NEVER manually add indexes** without performance testing proof
2. **NEVER add triggers** without thorough testing + documentation
3. **ALWAYS use migrations** - never manual SQL in cloud
4. **STICK to golden schema** - contains exactly what's needed
5. **TEST first** - don't assume you need more indexes
6. **GET APPROVAL** before any cloud database changes

### Current Lean State ✅
Exactly **11 essential indexes**:
- `idx_profiles_wilaya` - Geographic filtering
- `idx_listings_user_id` - User's listings
- `idx_listings_fulltext` - Search
- `idx_listings_search_compound` - Complex filtering
- `idx_favorites_listing_id` - Favorites
- `idx_reviews_reviewed_id` - Reviews
- `idx_conversations_users` - Conversations
- `idx_messages_conversation_time` - Message ordering
- `idx_messages_unread` - Unread counts
- `idx_notifications_user_unread` - Unread notifications
- `idx_notifications_user_all` - Notification history

### Before Adding ANY Database Object
1. Prove it's needed with actual performance tests
2. Document reason in migration with comments
3. Test thoroughly in local environment
4. **Get user approval** before deploying to cloud
5. Monitor impact after deployment

**Remember**: More database objects ≠ better performance. Often the opposite is true.