# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 PURPOSE OF THIS WORKSPACE

**This is a Docker-only testing sandbox.** It is NOT the production repo and should NEVER be pushed to GitHub.

- **Goal**: Build, test, and experiment with MarketDZ inside Docker containers
- **Workflow**: Make changes here → test in Docker → if it works, manually carry improvements to the production repo
- **No git pushes**: Do not `git push`, create PRs, or sync with GitHub from here
- **Safe to break**: Feel free to experiment — this is disposable

---

## 🚀 DOCKER COMMANDS (the only way to run this project)

```bash
# Prerequisites: Docker Desktop running + local Supabase
npx supabase start

# === Production-like build (tests how the real deploy works) ===
npm run docker:build       # Build production image
npm run docker:up          # Start container → http://localhost:3000
npm run docker:logs        # Tail logs
npm run docker:down        # Stop
npm run docker:reset       # Full rebuild + restart
npm run docker:shell       # Shell into running container
npm run docker:status      # See containers + networks

# === Dev mode (hot-reload, edit src/ and see changes live) ===
npm run docker:dev         # Start dev container → http://localhost:3000
npm run docker:dev:down    # Stop dev container
```

### When to use which mode
| Mode | Command | Use For |
|------|---------|---------|
| **Dev** | `npm run docker:dev` | Editing code, seeing changes instantly |
| **Production** | `npm run docker:build && npm run docker:up` | Testing the real build pipeline, performance, final QA |

---

## 🔧 ENVIRONMENT

- **`.env.docker`** — environment variables (local Supabase keys, pre-filled)
- **`docker-compose.yml`** — production-like container
- **`docker-compose.dev.yml`** — dev container with volume mounts + hot-reload
- **`Dockerfile`** — multi-stage production build
- **`Dockerfile.dev`** — lightweight dev image (`next dev --turbopack`)

Container reaches host Supabase via `host.docker.internal:54321`.
Browser reaches Supabase via `localhost:54321`.

---

## 🏗️ ARCHITECTURE

### Project Overview
DlalaDZ is a Next.js 15 marketplace for Algeria with:
- **Trilingual**: Arabic RTL + French + English
- **Auth**: Supabase PKCE with email verification + TOTP MFA
- **Search**: Arabic full-text search with geographic filtering
- **Admin**: Role-based panel (`super_admin`, `admin`, `moderator`)
- **Messaging**: Real-time chat between buyers/sellers
- **PWA**: Installable with offline support

**Tech**: Next.js 15 + Turbopack, Supabase (PostgreSQL + PostGIS), Tailwind CSS 4, Radix UI, TypeScript 5

### Key Directories
```
src/app/api/          # API routes
src/app/admin/        # Admin panel pages
src/components/       # React components
src/lib/supabase/     # Supabase clients (client.ts, server.ts, serverPool.ts)
src/contexts/         # AuthContext (single source of truth)
src/types/            # TypeScript types (database.ts)
supabase/migrations/  # Database migrations
tests/                # Playwright E2E tests
```

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

## 🐛 DOCKER TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Container can't reach Supabase | Ensure `npx supabase start` is running on host; container uses `host.docker.internal:54321` |
| Port 3000 already in use | Stop other dev servers or change port in `docker-compose.yml` |
| Build fails on TypeScript | Run `npm run docker:logs` to see build errors; fix in `src/` |
| Hot-reload not working (dev mode) | `WATCHPACK_POLLING=true` is set; if still broken, restart with `npm run docker:dev:down && npm run docker:dev` |
| Photos not loading | Use `fixPhotoUrl()` to translate Docker internal URLs |
| "Permission Denied" (42501) | Clear browser cookies; ensure you're hitting local Supabase, not cloud |
| Need a clean slate | `npx supabase db reset` to reset DB; `npm run docker:reset` to rebuild container |

### Useful Debug Commands
```bash
npm run docker:logs          # Tail app logs
npm run docker:shell         # Shell into container
npm run docker:status        # Container + network overview
docker compose exec app sh -c "curl http://localhost:3000/api/health"  # Health check from inside
```

---

## 🗄️ DATABASE (local only)

```bash
npx supabase start           # Start local Supabase
npx supabase db reset        # Reset + re-run all migrations
npx supabase status          # Show URLs and keys
```

All database work happens locally. No cloud database access from this workspace.

---

## ⚠️ RULES FOR THIS WORKSPACE

1. **Docker only** — never run `npm run dev` directly; always use Docker
2. **No git push** — this is a sandbox, not the production repo
3. **Local Supabase only** — no cloud keys, no production database
4. **Experiment freely** — break things, try ideas, iterate fast
5. **Carry wins manually** — when something works, take the diff to your production repo
6. **Document every change** — after every modification to the project (code, config, DB schema, scripts, etc.), log it in `docs/DAILY_TASK.md` with the date, what changed, and why

---

## 🔌 MCP TOOLS

### Chrome DevTools MCP
```bash
npm run chrome:debug     # Start Chrome with debugging on port 9222
```
Use for: screenshots, clicking elements, filling forms, inspecting console/network errors in the Dockerized app.

### Docker MCP (via VS Code Container Tools)
Docker container management is available through VS Code's built-in container tools. Use it to:
- Inspect running containers, images, and networks
- View container logs and stats
- Manage container lifecycle (start/stop/restart/remove)

Both are configured in `.mcp.json` and available to Claude Code / Copilot in this workspace.
