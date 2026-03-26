# DlalaDZ — Outstanding Tasks

## Key Reference

| Item | Value |
|------|-------|
| Production URL | `https://dlaladz.com` |
| Supabase cloud project | `vrlzwxoiglzwmhndpolj.supabase.co` |
| Vercel project | `rdjerrouf's projects` on vercel.com |
| Test credentials | user1–10@email.com / password123 |
| Local Supabase | `http://127.0.0.1:54321` (start with `npx supabase start`) |
| Local dev server | `http://localhost:3000` (start with `npm run dev`) |

---

## Priority 1 — Before Any Marketing

### 1. Seed Real Listings
**This is the #1 blocker.** The browse page is empty. Nobody will post on an empty marketplace and nobody will browse one.
- Post 50–100 real listings across Algiers minimum
- Cover multiple categories: electronics, vehicles, real estate, services
- Use real photos, real prices in DA, real wilaya/city data
- Consider reposting items from existing Facebook Marketplace groups (with proper info)

---

## Priority 2 — Pre-Launch Polish

### 2. Verify Listing Creation Flow in Production
Manually verify on `dlaladz.com`:
- [ ] Image upload works (Supabase Storage bucket configured?)
- [ ] Wilaya dropdown populates correctly
- [ ] Listing appears on browse page after submission
- [ ] Seller can edit/delete their listing

---

## Priority 3 — Infrastructure

### 3. Email DNS Setup (5–30 min delays currently)
Email verification works but is slow due to missing DNS authentication records.
1. Create account at Resend (resend.com)
2. Supabase Dashboard → Authentication → SMTP Settings → configure Resend
3. Add SPF, DKIM, DMARC records to `dlaladz.com` (Resend provides exact values)
4. Target: emails arrive in <5 seconds
- Details: `docs/EMAIL_VERIFICATION_SETUP.md`

### 4. Reinstate "Recent Activity" Section with Real Data
The section was removed (hardcoded fake data). Bring it back once real listings exist using live Supabase queries:
- Listings count from today: `count` on `listings` where `created_at > now() - interval '1 day'`
- New members: `count` on `profiles` with same window
- Recent sales: `listings` where `status = 'sold'` ordered by `updated_at`

---

## Priority 4 — Low Priority / Cleanup

### 5. PWA End-to-End Test
- iOS Safari: `https://dlaladz.com` → Share → Add to Home Screen → verify icon + name
- Android Chrome: verify install banner, offline page
- Verify push notification permission prompt (requires VAPID keys set in Vercel env)

### 6. Test File Cleanup
`tests/marketdz.spec.ts` still references the old MarketDZ name. Update to DlalaDZ.

### 7. GitHub Repo Rename (Optional)
- Rename `marketdz` → `dlaladz` on GitHub (Settings → Repository name)
- Update local remote: `git remote set-url origin https://github.com/rdjerrouf/dlaladz.git`
- Vercel auto-follows GitHub repo renames — no Vercel config change needed

---

## ✅ Completed

### Rebrand: MarketDZ → DlalaDZ
- Full rebrand across 54 files (components, pages, configs, docs)
- Domain `dlaladz.com` purchased, connected to Vercel (auto-renews Mar 25, 2027)
- PWA manifest, push service worker, and meta tags updated to DlalaDZ

### Trilingual Support (EN / FR / AR)
- `/privacy` — full Privacy Policy in English, French, Arabic with RTL support
- `/terms` — full Terms of Service in English, French, Arabic with RTL support
- `/help` — full FAQ Help Center in English, French, Arabic with RTL support
- Language switcher on all three pages; Arabic triggers `dir="rtl"` layout

### Help Center FAQ
- Rebuilt `/help` with real FAQs covering: free posting, payments, delivery, reporting scammers, editing listings, personal data safety
- Answers written in French (primary), English, and Arabic

### Category-Specific Placeholder Graphics
- Replaced generic "No Image" grey box with coloured gradient + contextual icon per category:
  - For Sale → blue gradient + 🛒
  - For Rent → green gradient + 🏠
  - Jobs → purple gradient + 💼
  - Services → orange gradient + 🔧
  - Urgent → red gradient + 🚨
- Shared `getCategoryPlaceholder()` utility in `src/lib/utils.ts` used across browse, homepage, favorites, profile listings, MobileListingCard
- `onError` fallback on all `<img>` tags so broken URLs also show category icon

### UI Polish (Web)
- **Help page back button** — matches the back button on `/privacy` and `/terms` (green arrow, trilingual)
- **Mobile sidebar scroll** — fixed `height: 100dvh` + `overflow-y: scroll` so Sign Out is always reachable on web mobile
- **Install App button removed** from `/add-item` — not relevant on web
- **"My Profile" title** — changed from `text-gray-900` (invisible) to `text-white` on dark header background

### Auth & Email
- Email verification sends via Resend on signup
- Favorites 500 error fixed (replaced upsert with plain INSERT)
- Homepage quick-filter buttons wired to browse page

### Admin Panel
- Role-based admin panel with user management (suspend/unsuspend)
- Status indicators and filters working
