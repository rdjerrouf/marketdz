# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Vercel Best Practices

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons)
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- Add OpenTelemetry via `@vercel/otel` on Node

---

## 🚨 CRITICAL POLICIES

### Cloud Database Rules
**The cloud Supabase database is PRODUCTION-READY. Local and Cloud are synchronized (27 migrations).**

- ✅ **ALLOWED**: Inspect cloud (READ-ONLY), apply tested migrations with user approval
- ❌ **FORBIDDEN**: Ad-hoc "fixes", automatic migrations, experimental queries
- 🔒 **ALWAYS**: Test migrations locally first (`npx supabase db reset`), then apply via MCP with approval

### Environment Switching
When switching between Local and Cloud environments:
1. Clear browser cookies (DevTools → Application → Cookies → Delete all)
2. Restart dev server after changing `.env.local`
3. Sign out before switching

**Why**: JWT tokens from one environment cause "permission denied" errors in another.

---

## 🚀 ESSENTIAL COMMANDS

```bash
# Quick Start
npx supabase start       # Start local Supabase
npm install              # Install dependencies
npm run dev              # Dev server at localhost:3000

# Development
npm run build            # Production build
npm run lint             # ESLint (before committing)
npx supabase db reset    # Reset local database

# Testing
npm run test             # All Playwright tests
npm run test:headed      # Tests with browser UI
npm run test:ui          # Playwright UI mode (interactive)
npx playwright test --grep "auth"  # Run specific tests

# Docker (production-like testing)
npm run docker:build && npm run docker:up  # App at localhost:3001
npm run docker:logs      # View logs
npm run docker:down      # Stop containers

# Mock Data (LOCAL ONLY)
node scripts/create-10-test-users.js   # user1-10@email.com / password123
node scripts/generate-10k-listings.js  # 10k test listings
npm run mock:test                      # Quick mock data (small)
npm run mock:medium                    # Medium dataset
npm run mock:full                      # Full dataset
npm run admin:seed                     # Seed admin user
npm run listings:create                # Create listings with photos

# MCP Tools
npm run chrome:debug     # Start Chrome with debugging (port 9222)
```

**Test Credentials**: user1@email.com through user10@email.com / password123

---

## 🏗️ ARCHITECTURE

### Project Overview
DlalaDZ is a Next.js 15 marketplace for Algeria with:
- **Trilingual**: Arabic RTL + French + English (EN/FR/AR switcher on Help, Privacy, Terms pages)
- **Auth**: Supabase PKCE with email verification + TOTP MFA (`otplib`)
- **Search**: Arabic full-text search with geographic filtering
- **Admin**: Role-based panel (`super_admin`, `admin`, `moderator`)
- **Messaging**: Real-time chat between buyers/sellers
- **PWA**: Installable with offline support
- **Rate Limiting**: Upstash Redis (`src/lib/rate-limit/`)
- **Scale**: Optimized for 250k+ listings

**Tech**: Next.js 15 + Turbopack, Supabase (PostgreSQL + PostGIS), Tailwind CSS 4, Radix UI, TypeScript 5, Playwright

### Key Directories
```
src/app/api/          # API routes (auth, listings, search, admin, favorites, messages, reviews, upload)
src/app/admin/        # Admin panel pages
src/app/chat/         # Real-time messaging UI
src/app/favorites/    # Saved listings
src/app/my-listings/  # User's own listings
src/app/edit-listing/ # Edit existing listing
src/app/search-advanced/ # Advanced search filters
src/components/       # React components (common/, listings/, chat/, search/, navigation/)
src/lib/supabase/     # Supabase clients (client.ts, server.ts, serverPool.ts)
src/lib/rate-limit/   # Upstash Redis rate limiting
src/lib/validations/  # Input validation schemas
src/lib/notifications/ # Notification helpers
src/contexts/         # AuthContext (single source of truth)
src/types/            # TypeScript types (database.ts)
supabase/migrations/  # Database migrations (27 total)
supabase/functions/   # Edge Functions
tests/                # Playwright E2E tests
scripts/              # Utility scripts
```

### Authentication System
- `src/lib/supabase/client.ts` - Browser singleton client
- `src/lib/supabase/server.ts` - SSR client + admin client
- `src/lib/supabase/serverPool.ts` - Pooled service-role client for API routes (reused across invocations, optimized for Supabase Nano tier)
- `src/contexts/AuthContext.tsx` - Single auth listener (prevents "Multiple GoTrueClient" warning)
- `middleware.ts` - Session validation

### Development Environments
| Mode | URL | Supabase | Use For |
|------|-----|----------|---------|
| Local Dev | localhost:3000 | localhost:54321 | Day-to-day development |
| Docker | localhost:3001 | localhost:54321 | Production-like testing |
| Cloud | - | vrlzwxoiglzwmhndpolj.supabase.co | READ-ONLY inspection |

---

## 💡 CRITICAL PATTERNS

### TypeScript Database Nullables
Database columns return `null`, not `undefined`:
```typescript
// ❌ Wrong
interface Listing { avatar_url?: string }

// ✅ Correct
interface Listing { avatar_url: string | null }
```

### Supabase Client Singleton
Only ONE auth listener exists (in AuthContext) to prevent warnings:
```typescript
// src/lib/supabase/client.ts
let supabaseInstance: SupabaseClient<Database> | null = null
export const supabase = supabaseInstance ?? createBrowserClient<Database>(...)
```

### API Route Authentication
API routes MUST use the request parameter to read middleware-processed cookies:
```typescript
// ✅ Correct - reads cookies from middleware
export async function PUT(request: Request) {
  const supabase = createApiSupabaseClient(request)
  const { data: { user } } = await supabase.auth.getUser()
}

// ❌ Wrong - no auth context
const supabase = createServerSupabaseClient()  // Missing request!
```

### Service Role Pattern (for API routes with RLS issues)
When RLS causes issues in API routes, authenticate first then use admin client:
```typescript
// 1. Authenticate with regular client
const supabase = await createServerSupabaseClient(request)
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Use admin client with explicit security check
const adminClient = createSupabaseAdminClient()
await adminClient.from('profiles').update({...}).eq('id', user.id)  // Security: own profile only
```

### Search Queries
```typescript
// ✅ Use precomputed search vectors
.textSearch('search_vector', query, { type: 'websearch', config: 'simple' })

// ✅ Always include status filter (hits partial indexes)
.eq('status', 'active')

// ✅ Keyset pagination for large datasets
WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 50
```

---

## 🐛 TROUBLESHOOTING

### "Permission Denied" (42501) Errors
```
Step 1: Check environment (Network tab → Supabase URL)
        Should be: localhost:54321 for local, NOT cloud URL

Step 2: Clear browser cookies + restart dev server + sign in again

Step 3: For API routes, verify using createApiSupabaseClient(request)

Step 4: Check RLS policies allow the operation for auth.uid()
```

### Common Issues
| Issue | Solution |
|-------|----------|
| Auth fails after env switch | Clear cookies, restart server |
| Photos not loading | Use `fixPhotoUrl()` for Docker URLs |
| Container won't start | Run `npx supabase status`, check `.env.docker` exists |
| Build failures | Ensure `.env.local` has all vars, clear `.next` cache |

### Debugging
```bash
docker logs dlaladz-app-1 --follow | grep "Middleware"  # Auth issues
npm run docker:status                                     # Container/network status
```

---

## 🗄️ DATABASE PHILOSOPHY

### Keep It Lean
Previous issues were caused by excessive indexes, triggers, and materialized views.

**Golden Rules**:
1. NEVER manually add indexes without performance testing proof
2. ALWAYS use migrations - never manual SQL
3. TEST first with `scripts/performance-test-suite.js`
4. AVOID materialized views on write path (use scheduled jobs)
5. LOCAL TESTING ONLY - never experiment on cloud

### Preferred Patterns
```sql
-- ✅ Partial indexes for common queries
CREATE INDEX idx_listings_active ON listings(category, created_at DESC) WHERE status = 'active';

-- ✅ Use CONCURRENTLY for production
CREATE INDEX CONCURRENTLY idx_name ON table(column);

-- ❌ Avoid: refreshing materialized views on every write
-- ❌ Avoid: overly broad compound indexes
```

---

## ⚙️ ENVIRONMENT VARIABLES

**Local Development** (`.env.local`) - get from `npx supabase status`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

**Docker** (`.env.docker`) - copy from `.env.docker.example`:
- Uses dual URL setup: `NEXT_PUBLIC_SUPABASE_URL` for browser, `SUPABASE_URL` for container networking

---

## 🔌 MCP SERVERS

### Chrome DevTools MCP
```bash
npm run chrome:debug     # Start Chrome with debugging
```
Use for: screenshots, clicking elements, filling forms, viewing console/network

### Supabase MCP
Configured in `.mcp.json` for cloud database inspection (READ-ONLY).

**Token Refresh**: If auth fails, regenerate at supabase.com/dashboard/account/tokens and update `.mcp.json`.

---

## 📧 EMAIL SETUP (partially done)

Email verification sends via Resend on signup. Still has 5–30 min delays due to missing DNS auth records.

**Remaining**:
1. Add SPF/DKIM/DMARC records to `dlaladz.com` (Resend provides exact values)
2. Target: emails arrive in <5 seconds

See `docs/EMAIL_VERIFICATION_SETUP.md` for details.

---

## 📚 REFERENCE

### Key Files
- **Database types**: `src/types/database.ts`
- **Auth context**: `src/contexts/AuthContext.tsx`
- **Supabase clients**: `src/lib/supabase/*.ts`
- **Middleware**: `middleware.ts`
- **Admin secure functions**: Database `admin_secure` schema

### Image Placeholders
When a listing has no photos, use `getCategoryPlaceholder(category)` from `src/lib/utils.ts` — never the old "No Image" grey SVG. The function returns a coloured gradient + emoji per category (for_sale=🛒 blue, for_rent=🏠 green, job=💼 purple, service=🔧 orange, urgent=🚨 red). It is re-exported from `src/lib/storage.ts` for components that import from there. Always pass `listing.category` to `fixPhotoUrl(url, category)` when displaying listing images so the fallback is category-aware.

---

### Resolved Issues
Historical context on solved problems:
- **Profile Update 42501 error** (2025-10-29): Fixed with service role pattern in `src/app/api/profile/route.ts`
- **Favorites 500 error**: Replaced upsert with plain INSERT in favorites API route
- **"My Profile" invisible title**: Header has dark background — title must be `text-white` not `text-gray-900`
- **Mobile sidebar Sign Out hidden**: Fixed with `height: 100dvh` + `overflow-y: scroll` on the nav element in `MobileSidebar.tsx`
