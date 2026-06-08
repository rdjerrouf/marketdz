# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## PROJECT

**DlalaDZ** is a Next.js 15 marketplace for Algeria, deployed on Vercel, with a cloud Supabase backend (`vrlzwxoiglzwmhndpolj.supabase.co`).

- **GitHub**: `rdjerrouf/marketdz` — pushing to `main` triggers a Vercel deploy
- **Local dev**: `npm run dev` + local Supabase (`npx supabase start`)
- **Sandbox**: `~/Marketdz-backup` is a separate Docker-based sandbox used to prototype and test; working changes are manually brought here

---

## COMMANDS

```bash
# Development
npm run dev              # Start dev server → http://localhost:3000 (Turbopack)
npx supabase start       # Start local Supabase (required for local dev)
npx supabase status      # Show local URLs and keys

# Type checking & lint
npx tsc --noEmit
npm run lint

# Database
npx supabase db reset    # Reset + re-run all migrations locally
npx supabase migration new <name>   # Create a new migration file

# Push local migrations to cloud (requires SUPABASE_DB_PASSWORD from .env.local)
SUPABASE_ACCESS_TOKEN=<token> SUPABASE_DB_PASSWORD=<pass> npx supabase db push

# E2E tests (requires dev server running on localhost:3000)
npm test                                              # All tests
npx playwright test tests/search.spec.ts             # Single file
npx playwright test --grep "pattern"                 # By name
npm run test:headed                                   # Visible browser
npm run test:ui                                       # Interactive Playwright UI
npm run test:report                                   # Open last HTML report

# Mock data (local only)
npm run mock:test        # Small dataset
npm run mock:medium      # Medium dataset
npm run mock:full        # Full dataset (~4000 listings, 10 users)
```

---

## ARCHITECTURE

### Overview
- **Trilingual**: Arabic (default, RTL, no URL prefix) + French (`/fr/`) + English (`/en/`) via `next-intl`
- **Auth**: Supabase PKCE with email verification + TOTP MFA (`otplib`)
- **Search**: Full-text search across Arabic/French/English with geographic filtering; service-role client bypasses RLS for performance at scale
- **Admin**: Role-based panel (`super_admin`, `admin`, `moderator`)
- **Messaging**: Real-time chat via Supabase Realtime
- **PWA**: Installable, per-locale manifests (`manifest-ar.json`, `manifest-fr.json`, `manifest.json`)
- **Rate limiting**: `src/lib/rate-limit/` — memory-based in dev, ready for Upstash Redis

**Tech**: Next.js 15 + Turbopack, Supabase (PostgreSQL + PostGIS), Tailwind CSS 4, Radix UI, TypeScript 5

### Key Directories
```
src/app/[locale]/          # All locale-aware pages — must live here for next-intl routing
src/app/[locale]/layout.tsx  # Per-locale fonts, RTL direction, PWA manifest, GlobalMobileNav
src/app/api/               # API routes (auth, listings, search, admin, favorites, messages, upload)
src/app/admin/             # Admin panel (role-gated by middleware)
src/i18n/                  # next-intl config (config.ts, routing.ts, request.ts, navigation.ts)
src/components/            # React components (common/, listings/, chat/, search/, navigation/)
src/lib/supabase/          # Supabase clients (client.ts, server.ts, serverPool.ts, server-fetch.ts)
src/lib/search-security.ts # Manual RLS enforcement for service-role search queries
src/lib/constants/algeria.ts  # 58 wilayas × ~10 cities with trilingual names
src/config/app.ts          # Feature flags, pagination, search params, storage limits
src/contexts/              # AuthContext + NotificationsContext (real-time)
src/hooks/                 # useRealtime* hooks (messages, conversations, notifications)
src/types/                 # TypeScript types (database.ts — update manually when adding DB columns)
supabase/migrations/       # All DB migrations (apply with `npx supabase db reset`)
src/i18n/locales/          # next-intl translation files (en.json, fr.json, ar.json)
tests/                     # Playwright E2E tests
```

### Authentication Flow
- `src/lib/supabase/client.ts` — browser singleton (one instance, prevents "Multiple GoTrueClient" warning)
- `src/lib/supabase/server.ts` — SSR + API route client factories
- `src/lib/supabase/serverPool.ts` — pooled service-role singleton (`getServerSupabase()`) for search
- `src/lib/supabase/server-fetch.ts` — URL-rewriting fetch adapter (see Docker/Vercel note below)
- `src/contexts/AuthContext.tsx` — single `onAuthStateChange` listener
- `middleware.ts` — three-stage pipeline: **next-intl locale routing → Supabase session refresh → admin route protection**

**Admin access checks in order:** `admin_users` table → user metadata → bootstrap allowlist (`rdjerrouf@gmail.com`, `anyadjerrouf@gmail.com`)

### Supabase Client Selection

| Client | When to use |
|--------|-------------|
| `createApiSupabaseClient(request)` | API routes that need the authenticated user (reads middleware cookies) |
| `createServerSupabaseClient()` | Server Components / SSR pages |
| `createSupabaseAdminClient()` | After verifying auth, need RLS bypass for own-data mutations |
| `getServerSupabase()` from `serverPool.ts` | Service-role pooled client for search/internal ops — always follow with `applySearchSecurityConstraints()` |

### server-fetch.ts — URL Rewriting
`NEXT_PUBLIC_SUPABASE_URL` (the public URL) is always passed to `createServerClient()` so auth cookie names stay consistent. `getDockerAwareFetch()` intercepts the actual network calls and rewrites the URL to `SUPABASE_URL` if the two differ (Docker: `host.docker.internal`; Vercel: same URL → no-op).

---

## I18N ARCHITECTURE

Uses `next-intl` with `localePrefix: 'as-needed'`:
- Arabic (`ar`) is the default — no URL prefix, RTL, Cairo font
- French/English use `/fr/` and `/en/` prefixes
- **Every page must live under `src/app/[locale]/`** — pages outside this directory are intercepted by next-intl middleware and return 404
- Navigation helpers come from `src/i18n/navigation.ts` — **never import from `next/navigation`** directly in locale-aware pages
- `next.config.ts` plugin order matters: `withNextIntl(withPWAConfig(nextConfig))`
- Translation files: `src/i18n/locales/ar.json`, `src/i18n/locales/fr.json`, `src/i18n/locales/en.json`

### Trilingual City/Wilaya Names
**File:** `src/lib/constants/algeria.ts`

Latin city names are the stored DB value — never change them without a DB migration. Arabic/French names are display-only, resolved at render time.

```typescript
// RULE: name = Latin key stored in DB. nameAr / nameFr = display only, never stored.
export interface City { name: string; nameAr: string; nameFr: string }

// Single helper — use everywhere instead of inline ternaries
export function getLocalizedName(
  item: { name: string; nameAr: string; nameFr: string },
  locale: string
): string {
  if (locale === 'ar') return item.nameAr
  if (locale === 'fr') return item.nameFr
  return item.name
}
```

City dropdowns: `value={city.name}` (DB key), `label={getLocalizedName(city, locale)}` (display).  
City validation: use `.some(c => c.name === selectedCity)` not `.includes(selectedCity)` (cities is `City[]` not `string[]`).

---

## CRITICAL PATTERNS

### TypeScript Database Nullables
Database columns return `null`, not `undefined`:
```typescript
// Wrong
interface Listing { avatar_url?: string }
// Correct
interface Listing { avatar_url: string | null }
```

### API Route Authentication
```typescript
// Correct — reads cookies from middleware-processed request
export async function PUT(request: NextRequest) {
  const supabase = createApiSupabaseClient(request)
  const { data: { user } } = await supabase.auth.getUser()
}

// Wrong — no auth context
const supabase = createServerSupabaseClient()  // missing request!
```

### Service Role Pattern (when RLS blocks API routes)
```typescript
// 1. Authenticate first
const supabase = createApiSupabaseClient(request)
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Then use admin client, scoped to the authenticated user
const adminClient = createSupabaseAdminClient()
await adminClient.from('profiles').update({...}).eq('id', user.id)
```

### Search with Service Role
```typescript
const supabase = getServerSupabase()
let query = supabase.from('listings').select(getListingSelectColumns())
query = applySearchSecurityConstraints(query)  // CRITICAL: enforces status='active', excludes sensitive columns
```

### RLS Policy Rules
- Always use `(select auth.uid())` (initplan — evaluated once per query), never bare `auth.uid()` (evaluated per row)
- Never split `admin_users` SELECT into two permissive policies — it creates a circular RLS problem. The single policy `"Admin users are viewable"` allows each user to see their own row OR any active admin to see all rows
- Merge permissive policies on the same table/operation where possible — multiple permissive policies are OR'd by the planner and add overhead

### Search Queries
```typescript
.textSearch('search_vector', query, { type: 'websearch', config: 'simple' })
.eq('status', 'active')      // always include — hits partial indexes
```

---

## TESTING

Playwright tests hit `http://localhost:3000`. The config auto-starts `npm run dev` if no server is detected.

**Admin tests** use global auth setup (`tests/admin.setup.ts`) which signs in once and saves cookies to `.playwright/admin-auth.json`. Admin test files do not sign in themselves — they depend on the setup project in `playwright.config.ts`.

**Browse page tests** use `test.describe.configure({ mode: 'serial' })` to avoid response-listener races under parallel workers.

```bash
# Run a subset
npx playwright test --project=chromium          # Chromium only
npx playwright test --project=chromium-admin    # Admin tests only
```

---

## DATABASE

All migrations live in `supabase/migrations/`. Apply locally with `npx supabase db reset` (full reset) or `npx supabase migration up` (incremental).

**Indexes on `listings` (14 total):**

| Index | Purpose |
|-------|---------|
| `listings_search_vector_ar_gin` | FTS Arabic (GIN) |
| `listings_search_vector_fr_gin` | FTS French (GIN) |
| `idx_listings_active_category` | Category browse |
| `idx_listings_active_category_subcat` | Category + subcategory |
| `idx_listings_active_category_price` | Price range + sort |
| `idx_listings_active_wilaya` | Geographic filter |
| `idx_listings_active_created_at` | Default newest-first sort |
| `idx_listings_user_created` | User's own listings |
| `idx_listings_hot_deals` | Hot deals widget |
| `idx_listings_details_gin` | JSONB GIN on `listing_details` (subcategory filter equality) |
| Others | FK lookups, urgent expiry |

**Deferred — do NOT drop without checking `pg_stat_user_indexes.idx_scan` on cloud after real traffic:**  
`idx_listings_user_id` (0 scans locally, may be used in production)

### Subcategory-Specific Listing Details — Hybrid Schema

**Strategy:** vehicles use dedicated columns (range-queryable); all other subcategories use a single `listing_details JSONB` column. This is ~37× cheaper on Supabase egress than adding 50+ dedicated NULL columns.

**Vehicle columns** (dedicated, filterable by range):
`vehicle_make`, `vehicle_model`, `vehicle_year` (SMALLINT), `vehicle_mileage` (INTEGER), `vehicle_transmission`, `vehicle_fuel_type`, `vehicle_body_type`

**Subcategory → `listing_details` JSONB key mapping:**

| Subcategory group | Keys stored |
|---|---|
| Real Estate | `property_type`, `bedrooms`, `bathrooms`, `size_sqm`, `floor`, `furnished` |
| Electronics / Phones | `brand`, `model_name`, `storage`, `color` |
| Computers & Tablets | `brand`, `model_name`, `ram_gb`, `storage_gb`, `processor` |
| Fashion / Watches | `brand`, `size`, `color`, `material` |
| Home / Furniture | `brand`, `color`, `material`, `dimensions` |
| Books & Media | `author`, `book_language`, `genre` |
| Musical Instruments | `brand`, `instrument_type` |
| Sports / Tools / Other | `brand`, `model_name` |

**Subcategory detection sets** (defined at top of `ListingForm.tsx`):
```typescript
VEHICLE_SUBCATS, REAL_ESTATE_SUBCATS, ELECTRONICS_SUBCATS,
FASHION_SUBCATS, HOME_SUBCATS, BOOKS_SUBCATS, MUSIC_SUBCATS, SPORTS_TOOLS_SUBCATS
```

**RULE — never use `SELECT *` in listing hot paths.** The browse detail page and listing API routes select named columns explicitly to avoid pulling NULL vehicle/detail columns on every non-vehicle listing. See `src/app/[locale]/browse/[id]/page.tsx`.

### `database.ts` Must Be Updated Manually

`src/types/database.ts` is **not auto-generated** — it was last regenerated early in the project and has drifted far behind. When you add columns via migration, also update the `Row`, `Insert`, and `Update` blocks in `database.ts`. Failing to do so causes `SelectQueryError` from the Supabase TypeScript client when those columns appear in a `.select()` call.

### New tables need an explicit GRANT (Supabase Data API change)

**Effective Oct 30, 2026** for this (existing) project: any **new** table created in the `public` schema is NOT exposed to the Data API (PostgREST / GraphQL / `supabase-js`) until explicitly granted. Existing tables are unaffected — this is not retroactive.

**RULE:** when a migration creates a new `public` table, add grants alongside the RLS policies, or the client will get empty results / permission errors:

```sql
-- After CREATE TABLE + ENABLE ROW LEVEL SECURITY + policies:
GRANT SELECT ON public.<new_table> TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.<new_table> TO authenticated;  -- as needed; RLS still gates rows
```

Symptom if forgotten: a brand-new table returns empty/permission errors from the client despite correct RLS. Fix = the grants above. (This is deny-by-default — a security improvement, same philosophy as `20260503000001_security_advisor_lockdown.sql`.)

### Supabase MCP Token

The Supabase MCP server token is stored in `.mcp.json` (project root). When it expires the MCP tools return `Unauthorized`. The current token and DB password live in `.env.local`:

```
SUPABASE_ACCESS_TOKEN=...   ← update .mcp.json args when this changes
SUPABASE_DB_PASSWORD=...    ← needed for npx supabase db push
```

When the MCP token is expired and cannot be refreshed mid-session, apply migrations via the Management REST API:
```bash
curl -X POST "https://api.supabase.com/v1/projects/vrlzwxoiglzwmhndpolj/database/query" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "<SQL here>"}'
# [] = success, error object = failure
# Avoid single-quoted CHECK constraints in JSON — use app-layer validation instead
```
