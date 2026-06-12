# Budget & Monitoring Watchlist

**Purpose:** the standing list of cost/performance questions Claude and Ryad revisit across sessions. Context: solo developer, hard budget constraint (~Supabase Pro $25/mo target, nothing surprise-shaped), launch marketing push starts ~**2026-07-02** (Algeria trip — ad agencies + TikTok/YouTube influencers).

**How to use this file:** in any future session, say "check the watchlist" — each item has a concrete check (query/command), a trigger date or condition, and a decision to make. Update the Status column as items get resolved; add new worries at the bottom.

---

## 1. Were the 37 listings indexes worth it? — VERDICT PENDING REAL TRAFFIC

The big read-optimization bet: ~37 indexes (131 MB) on a 15 MB table. Justified architecturally, but only real traffic proves which ones earn their keep.

**Check (run ~4–6 weeks after launch, so ≈ mid-August 2026):**
```sql
select indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) as size, idx_scan
from pg_stat_user_indexes where relname = 'listings' order by idx_scan asc;
```
**Decision rule:** indexes with `idx_scan = 0` after a month of real traffic AND > a few MB → drop candidates (the ~25 tiny partial JSONB ones cost ~5 MB total — keep regardless, not worth the churn). Known deferred suspect: `idx_listings_user_id` (CLAUDE.md note). Composite ones to watch: `idx_listings_user_created` (13 MB, 2 scans so far), `idx_listings_active_wilaya` (11 MB, 7 scans).
**Baseline snapshot taken 2026-06-11** — see DAILY_TASK.md amendments section for the full table.

## 2. Index bloat from seed/delete cycles — ACTION AVAILABLE, NOT URGENT

Mass-deleting the ~100k mock seed left B-tree air: `listings_pkey` is 9.5 MB for 10.7k rows (~10× fresh size). Disk is cheap at this scale, so no rush.

**Check:** `pg_relation_size('listings_pkey')` vs row count — fresh UUID pkey ≈ 50 B/row.
**Action when desired (e.g., right before launch, after final test-data cleanup):**
```sql
REINDEX TABLE CONCURRENTLY public.listings;  -- via Management API, off-peak
```

## 3. Photo storage + egress — THE REAL FUTURE BILL ⚠️ watch from launch

A marketplace is an image-serving business. DB egress is engineered down (named columns, JSONB hybrid); photos are where money leaks.

**Checks (monthly after launch):** Supabase dashboard → Usage → Storage egress & size. Pro includes 250 GB egress/mo, 100 GB storage.
**Guardrails already in place:** client-side compression (`src/lib/image-compression.ts`), photos served via Supabase CDN.
**Rules:** keep compression aggressive (WebP, capped dimensions at upload); do NOT enable Supabase image transforms (paid per-transform) — pre-size at upload instead; if egress trends toward the cap, add `cache-control` max-age on the bucket and consider thumbnail variants generated at upload time.

## 4. Compute tier — STAY PUT UNTIL DATA SAYS OTHERWISE

Current tier handles 10.7k rows trivially; the search plan (Phases 0–2) was chosen specifically to not move this needle.
**Check:** dashboard → Reports → CPU/RAM under load after launch spike. **Trigger:** sustained >70% RAM or CPU during normal hours. Don't upgrade for one-off spikes (influencer posts cause bursts — let them pass before deciding).

## 5. pgvector / semantic search — GATED, default NO

**Decision gate (from DAILY_TASK.md plan):** only revisit if, ~1 month post-launch with Phases 0–2 live, zero-result rate stays >~5% AND failing queries are semantic misses the lexicon can't enumerate. Cost if adopted: 375 MB–1.5 GB storage + RAM-resident ANN index → likely compute-tier upgrade + per-query embedding inference. This is the single most expensive idea on the table — that's why it's last.

## 6. Zero-result rate — THE search-quality KPI (live once Phase 0 ships)

```sql
select count(*) filter (where created_at > now() - interval '7 days') as last_7d,
       count(*) as total from public.search_zero_results;
-- top failing queries → lexicon candidates:
select query, count(*) from public.search_zero_results
group by query order by count(*) desc limit 30;
```
**Routine:** weekly after launch; every failing Darija/Arabizi term goes into `search_lexicon` (no redeploy needed). Target: zero-result rate trending toward <5%.

## 7. Realtime (chat) connections — LATER

Pro includes 500 concurrent Realtime connections / 5M messages. Fine for launch. **Trigger to revisit:** DAU in the thousands or dashboard shows connection-limit warnings.

## 8. Vercel — WATCH FUNCTION INVOCATIONS AFTER LAUNCH

API routes proxy search/listings through Vercel functions. Hobby/Pro quotas are generous, but an influencer spike multiplies invocations. **Check:** Vercel dashboard → Usage after each campaign burst. Mitigation if needed: cache headers on browse/search responses for anonymous users.

## 9. Auth MAUs — NON-ISSUE

Pro includes 100k MAU. Revisit never, unless the dream comes true.

---

## Session log

| Date | What changed |
|---|---|
| 2026-06-11 | File created. Baseline: 10,705 listings, DB 146 MB (15 heap / 131 indexes), autovacuum healthy. Launch T-3 weeks. Phases 0+1 implementation started. |
