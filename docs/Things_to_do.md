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
**This is the #1 blocker.** Production currently has 0 listings (`/api/search/count` returns 0).
- Post 50–100 real listings across Algiers minimum
- Cover multiple categories: electronics, vehicles, real estate, services
- Use real photos, real prices in DA, real wilaya/city data
- Consider reposting items from existing Facebook Marketplace groups (with proper info)

---

## Priority 2 — Pre-Launch Polish

### 2. Verify Listing Creation Flow in Production
Manually verify on `dlaladz.com` (blocked by #1 — do this while seeding real listings):
- [ ] Image upload works (Supabase Storage bucket configured?)
- [ ] Wilaya dropdown populates correctly
- [ ] Listing appears on browse page after submission
- [ ] Seller can edit/delete their listing

---

## Priority 2b — Subcategory Search Filters (Phase 4)

### Subcategory-Specific Browse Filters
The form now captures structured subcategory fields (property_type, bedrooms, moto_type, truck_type, etc.) but the browse/search UI does not yet expose them as filters. When a buyer selects "Real Estate" they should see Bedrooms, Surface Area, Furnished filters — not just the generic price/wilaya panel.

**What's done:**
- `src/lib/constants/subcategory-fields.ts` — field registry with `is_searchable` and `is_range_filter` flags on every field
- 22 expression indexes on `listing_details` JSONB fields (migration `20260608000002`)
- Vehicle filters (make, year, transmission, fuel) already wired in `browse/page.tsx` + `src/app/api/search/route.ts`

**What's needed:**
- Read `getSubcategoryConfig(category, subcategory)` in `browse/page.tsx` to know which JSONB filters to show
- Add JSONB filter params to the search API (`src/app/api/search/route.ts`) using `@>` containment for equality and `::integer` cast for range filters
- Translations for filter labels already exist in en/fr/ar (same keys as form fields)

**Files to touch:** `src/app/[locale]/browse/page.tsx`, `src/app/api/search/route.ts`

---

## Priority 2c — Apply Pending Migrations

Two migration files written but not yet applied:
```bash
# Local
npx supabase db reset

# Cloud
SUPABASE_ACCESS_TOKEN=... SUPABASE_DB_PASSWORD=... npx supabase db push
```
- `20260608000001_add_category_field_definitions.sql` — `category_field_definitions` table
- `20260608000002_add_listing_details_jsonb_indexes.sql` — 22 JSONB expression indexes

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
Section exists on homepage but `newToday` is hardcoded to `0` (disabled) and `hotDeals` is `0`.
Unblock once real listings exist — implement with live Supabase queries:
- `newToday`: `count` on `listings` where `created_at > now() - interval '1 day'`
- `hotDeals`: define criteria (e.g. price drop, high views) and query accordingly
- Recent sales: `listings` where `status = 'sold'` ordered by `updated_at`
File: `src/app/[locale]/page.tsx` — search for `newToday: 0 // Disabled`

---

## Priority 4 — Low Priority / Cleanup

### 5. PWA End-to-End Test
VAPID keys are set in env. Still needs manual device testing:
- iOS Safari: `https://dlaladz.com` → Share → Add to Home Screen → verify icon + name
- Android Chrome: verify install banner, offline page
- Verify push notification permission prompt appears

### 7. GitHub Repo Rename (Optional)
- Rename `marketdz` → `dlaladz` on GitHub (Settings → Repository name)
- Update local remote: `git remote set-url origin https://github.com/rdjerrouf/dlaladz.git`
- Vercel auto-follows GitHub repo renames — no Vercel config change needed

---

## ✅ Completed

### Subcategory Architecture — Phases 1–3
**Research:** Full competitor analysis of Ouedkniss.com — documented in `docs/subcategory-research.md`.

**Phase 1 — Correct field separation:**
- Split `VEHICLE_SUBCATS` into 5 separate detection sets (Cars, Motorcycles, Auto Parts, Construction Trucks, Heavy Equipment)
- Each subcategory now shows only the fields that apply to it (e.g. Auto Parts shows part_category only — no mileage/transmission; Heavy Equipment shows hours_used — no mileage)
- Vehicle search filters in `browse/page.tsx` restricted to subcategories that actually use vehicle columns

**Phase 2 — For-rent subcategory fields:**
- Apartments & Houses: property type, furnished, bedrooms, bathrooms, surface area, floor, parking
- Offices & Commercial Space: usage type, surface area, floor, parking
- Event Halls: capacity, catering included, parking
- Vehicles for Rent: vehicle columns + rate_unit, deposit_required, driver_included, mileage_limit_km
- Equipment for Rent: equipment_type, brand, rate_unit, deposit_required

**Phase 3 — Metadata-driven architecture:**
- `src/lib/constants/subcategory-fields.ts` — 24 subcategory configs (17 for_sale + 7 for_rent), each with `FieldDef[]` describing type, storage, searchability, and trilingual translation keys
- `src/components/listings/SubcategoryFields.tsx` — generic renderer; zero hardcoded subcategory logic
- `ListingForm.tsx` reduced from 1,747 → 829 lines; all explicit `if (isCar)` / `if (isMoto)` JSX blocks removed
- `supabase/migrations/20260608000001` — `category_field_definitions` table for future admin management
- `supabase/migrations/20260608000002` — 22 JSONB expression indexes covering all `is_searchable = true` fields
- ~85 new translation keys added across en/fr/ar

**Pending:** Phase 4 (browse filter alignment) and migration apply — see Priority 2b/2c above.

---

### Test File Cleanup
`tests/marketdz.spec.ts` updated — all references now use DlalaDZ.

---

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
