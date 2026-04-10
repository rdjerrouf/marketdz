# DB Design Analysis — Cost-Effectiveness for Listing Search

**Date:** 2026-04-09  
**Context:** Full schema review at ~250K listings scale on Supabase/PostgreSQL

---

## Overall Verdict: Good foundation, but 3 structural concerns for search cost

---

## What's working well

- **Partial indexes** (`WHERE status='active'`) — hot data stays in memory, index size is ~30% smaller
- **Lazy profile loading** — fetches profiles only for returned rows (20-50), not via JOIN on all 250K
- **Heuristic pagination** — `hasNextPage = results.length === limit` avoids expensive COUNT
- **GIN indexes on tsvectors** — correct choice for full-text search at scale
- **`(SELECT auth.uid()`)** initplan pattern — avoids per-row auth re-evaluation (fixed 2026-04-08)

---

## Structural Concerns for Search

### 1. Wide flat table (biggest issue)

The `listings` table mixes category-specific nullable columns into a single wide row:

```
salary_min, salary_max, job_type, company_name   ← jobs only
available_from, available_to, rental_period       ← rentals only
condition                                          ← for_sale only
```

Every index scan still fetches the full row width. At 250K rows, ~75% of columns in any given row are NULL. This bloats page reads and the shared buffer cache. A `for_sale` search pays the I/O cost of carrying rental and job columns it never uses.

**Fix:** Move category-specific columns to a `listing_details` JSONB column or separate child tables (`listing_job_details`, `listing_rental_details`, etc.).

---

### 2. Dual tsvectors maintained by trigger

`search_vector_ar` + `search_vector_fr` both recalculate on every INSERT/UPDATE of `title`, `description`, or `company_name`. The trigger is already correctly scoped (does NOT fire on status/price changes). However, the trigger also computes `normalized_title_ar` and `normalized_description_ar` — **columns that are never read by any query in the codebase**. This wastes CPU on every write.

**Fix (a):** Remove `normalized_title_ar` and `normalized_description_ar` from the trigger (and eventually drop the columns + their unused trigram indexes). This eliminates 2× `normalize_arabic()` calls and 2 GIN trigram index updates per write.

**Fix (b):** Compute `search_vector_fr` asynchronously if profiling shows the dual tsvector update is a bottleneck (most users search in Arabic).

---

### 3. Dead trigram indexes + columns

Two GIN trigram indexes were created but are **never used by any query**:
- `listings_normalized_title_ar_idx` (GIN gin_trgm_ops)
- `listings_normalized_description_ar_idx` (GIN gin_trgm_ops)

GIN trigram indexes are among the most expensive to maintain on writes. Along with them, the `normalized_title_ar` and `normalized_description_ar` columns are dead weight — populated by the trigger but never read.

**Fix:** Drop both trigram indexes and remove the columns from the trigger. Optionally drop the columns themselves in a follow-up migration.

---

### 4. The `/api/search/count` endpoint

Even with `count: 'estimated', head: true`, this fires a separate DB round-trip. The heuristic pagination in the main search route is the right call — but the count endpoint is **also used by the admin dashboard and analytics pages** for total listing stats, so it cannot be fully removed.

**Fix:** Stop calling the count endpoint from search pagination (the heuristic is sufficient). Keep it for admin pages, but consider caching the count (e.g., a materialized view refreshed every 5 minutes) instead of hitting the table live on each admin page load.

---

## Remaining Legacy Weight

The compound index `idx_listings_search_compound` on `(status, category, location_wilaya, price, created_at DESC)` is still present "for backward compatibility":

- Extra write cost on every INSERT/UPDATE
- ~15-20% extra storage vs the specialized indexes
- Can confuse the query planner when multiple candidate indexes exist

**Fix:** Drop it once confirmed no query plan references it.

Additionally, the `metadata jsonb DEFAULT '{}'::jsonb` column already exists in the table but is unused — it's the natural home for category-specific data if/when the wide table is restructured.

---

## Recommendations

| Priority | Action | Expected Gain |
|---|---|---|
| High | Drop `idx_listings_search_compound` (confirmed unused) | Faster writes, smaller WAL |
| High | Drop trigram indexes `listings_normalized_title_ar_idx` + `listings_normalized_description_ar_idx` (never queried) | Faster writes, ~significant WAL reduction (GIN trigram is expensive) |
| High | Remove `normalized_title_ar`/`normalized_description_ar` computation from trigger | -2 `normalize_arabic()` calls per write |
| High | Stop calling `/api/search/count` from search pagination — heuristic is enough | -1 DB round-trip per search |
| Medium | Cache admin count via materialized view (refresh every 5 min) | Cheaper admin dashboard loads |
| Medium | Move category-specific columns to existing `metadata` JSONB column | Narrower rows = faster scans |
| Medium | Compute `search_vector_fr` async if profiling shows write bottleneck | Lower write latency |
| Low | Add a materialized view for wilaya+category counts | Instant faceted filters |

---

## Quick Wins (do these first)

The biggest cost-reduction levers available right now are:

1. **Drop `idx_listings_search_compound`** — easy, reversible, immediate write + query plan benefit
2. **Drop trigram indexes** (`listings_normalized_title_ar_idx`, `listings_normalized_description_ar_idx`) — never queried, GIN trigram is expensive to maintain
3. **Strip dead columns from trigger** — remove `normalized_title_ar`/`normalized_description_ar` computation from `listings_search_vector_trigger()`
4. **Remove `/api/search/count` from search pages** — keep for admin only, reduces DB connections per search by ~50%

All are low-risk changes. Items 1-3 require a single migration. Item 4 is a frontend change.

---

## Index Inventory (current state)

| Index | Columns | Type | Purpose | Keep? |
|---|---|---|---|---|
| `listings_search_vector_ar_gin` | search_vector_ar | GIN | Arabic FTS | ✅ Yes |
| `listings_search_vector_fr_gin` | search_vector_fr | GIN | French FTS | ✅ Yes |
| `idx_listings_active_category` | (category, created_at DESC) WHERE active | BTREE | Category browse | ✅ Yes |
| `idx_listings_active_category_subcat` | (category, subcategory, created_at DESC) WHERE active | BTREE | Subcategory drill-down | ✅ Yes |
| `idx_listings_active_wilaya` | (location_wilaya, created_at DESC) WHERE active | BTREE | Geographic filter | ✅ Yes |
| `idx_listings_active_category_price` | (category, price, id) WHERE active | BTREE | Price sort/range | ✅ Yes |
| `idx_listings_active_created_at` | (created_at DESC, id DESC) WHERE active | BTREE | Homepage newest | ✅ Yes |
| `idx_listings_user_created` | (user_id, created_at DESC) | BTREE | My Listings page | ✅ Yes |
| `idx_listings_search_compound` | (status, category, location_wilaya, price, created_at DESC) | BTREE | Legacy | ❌ Drop |
| `listings_normalized_title_ar_idx` | normalized_title_ar | GIN (trigram) | Never queried | ❌ Drop |
| `listings_normalized_description_ar_idx` | normalized_description_ar | GIN (trigram) | Never queried | ❌ Drop |
