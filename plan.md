# DlalaDZ Rebrand Plan

**Strategy**: Keep the existing project and rebrand in-place. Do NOT create a new project.

## Why NOT to create a new project

- Supabase cloud is already configured with 25 migrations, RLS policies, storage buckets, auth settings. A new project means re-doing all of that.
- Vercel deployment has environment variables, domain config, and build settings. Easier to add `dlaladz.com` as a custom domain on the existing Vercel project.
- Git history, CI/CD, and all tooling stays intact.
- A new project buys nothing — you'd be cloning the same code anyway.

---

## Tier 1 — Critical (user-facing brand)

These are what users see:

| Where | File(s) | Change |
|---|---|---|
| App name in UI | `src/config/app.ts` — `name`, `seo`, `contact`, `social` | `MarketDZ` → `DlalaDZ` |
| PWA manifest | `public/manifest.json` — `name`, `short_name` | `MarketDZ` → `DlalaDZ` |
| SEO metadata | `src/app/layout.tsx` — `title`, `openGraph`, `appleWebApp`, `twitter` | Update all |
| Homepage | `src/app/page.tsx` — ~6 occurrences | Brand text |
| Navigation | `src/components/common/Navigation.tsx` | Logo text |
| Mobile sidebar | `src/components/MobileSidebar.tsx` | Logo text |
| Browse page | `src/app/browse/page.tsx` | Header + search text |
| Auth pages | signin, signup, forgot-password, reset-password, confirm | Brand text |
| Add item page | `src/app/add-item/page.tsx` | Header |
| Legal pages | `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` | All "MarketDZ" refs + email addresses |
| Help page | `src/app/help/page.tsx` | `support@marketdz.com` → `support@dlaladz.com` |
| Push notifications | `public/push-sw.js` | Default title |
| PWA install prompts | `src/lib/browser-detection.ts`, `src/components/PWAInstallButton.tsx` | Install text |
| Admin emails | `src/lib/admin/invitations.ts` | Invitation text |
| Admin MFA | `src/lib/admin/mfa.ts` | App name |
| Admin settings | `src/app/admin/settings/page.tsx`, `src/app/admin/layout.tsx` | Default site name + admin emails |
| Notifications | `src/app/notifications/page.tsx` | Welcome message |
| Profile WhatsApp | `src/app/profile/page.tsx` | Share text |

## Tier 2 — Infrastructure (not user-facing but should update)

| Where | File(s) | Change |
|---|---|---|
| package.json | `package.json` | `"name": "dlaladz"`, docker script names |
| Env example | `.env.example` | `NEXT_PUBLIC_APP_NAME=DlalaDZ` |
| Docker compose | `docker-compose.yml` | Container/network names |
| Middleware header | `middleware.ts` | `X-MarketDZ-Version` → `X-DlalaDZ-Version` |
| Supabase client info | `src/lib/supabase/serverPool.ts` | `X-Client-Info` header |
| Auth error handler | `src/lib/auth-error-handler.ts` | localStorage key |
| README | `README.md` | Full rebrand |

## Tier 3 — Docs & tests (low priority, update at leisure)

- `.claude/CLAUDE.md`, deployment docs, `future_arabic_version.md`, test files
- Playwright reports are auto-generated — ignore

## Tier 4 — External services

- **Vercel**: Add `dlaladz.com` as custom domain in project settings (no new project needed)
- **Supabase**: Update Site URL and Redirect URLs in Auth settings to `https://dlaladz.com`
- **DNS**: Point `dlaladz.com` to Vercel (CNAME or A records per Vercel docs)
- **Git remote**: Optionally rename the GitHub repo from `marketdz` to `dlaladz`

---

## Execution Order

1. **Find-and-replace pass** across Tier 1 + 2 files (case-sensitive: `MarketDZ` → `DlalaDZ`, `marketdz` → `dlaladz`)
2. **Update email addresses**: `*@marketdz.com` → `*@dlaladz.com`
3. **Update social URLs** in `src/config/app.ts`
4. **Run `npm run build`** to catch any breakage
5. **Run tests** (`npm run test`)
6. **Deploy to Vercel**, add `dlaladz.com` as custom domain
7. **Update Supabase Auth** redirect URLs to use `dlaladz.com`
8. **Rename local folder** if desired (`mv ~/marketdz ~/dlaladz`)

## Notes

- The `localStorage` key change in `src/lib/auth-error-handler.ts` (`marketdz-auth`) will log out existing users on the old key — this is fine for launch since you're moving to a new domain anyway.
- Copyright year should be updated from 2025 to 2026 while rebranding.
