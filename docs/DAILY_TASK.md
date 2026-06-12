# Daily Task Log

All changes to the MarketDZ project must be logged here with the date, what changed, the exact code/SQL applied, and why.
(Entries before 2026-06-11 were completed and archived out — see git history of this file.)

---

## 2026-06-11 — French default locale + locale-preserving navigation

**Commit:** `b2a9db9` (pushed to `main` → Vercel deploy)

**Problem 1:** Home-page search navigated with `window.location.href = '/browse?search=...'` — a hard URL with no locale prefix, so every search dumped the user back to the default language regardless of what they had selected.
**Fix:** use `useRouter()` from `@/i18n/navigation` (`router.push(...)` keeps the current prefix). Same bug class fixed in the session-expiry redirect in `src/lib/supabase/client.ts` (now preserves the `/ar` / `/en` prefix from the current path).

**Problem 2:** Default language was Arabic; product decision to make it French.
**Fix:** `defaultLocale: 'fr'` in `src/i18n/routing.ts` + `src/i18n/config.ts`. URL scheme is now `/` = French, `/ar/` = Arabic (RTL), `/en/` = English. Old `/fr/...` links 307-redirect to unprefixed. Updated: canonical/hreflang + metadata fallbacks in `src/app/[locale]/layout.tsx`, PWA `start_url` in all three manifests (`manifest-fr.json` → `/`, `manifest-ar.json` → `/ar`, `manifest.json` → `/en` — the English one was wrongly `/` even before), and `.claude/CLAUDE.md`.

**Verified:** `tsc --noEmit` clean; live dev server: `/` → `lang="fr"`, `/ar` → `lang="ar" dir="rtl"` + Cairo font, `/en` → English; Playwright check: searching "tires" from `/en` lands on `/en/browse?search=tires`.

**SEO note:** unprefixed production URLs that used to render Arabic now render French; hreflang/canonical updated so crawlers re-index accordingly.

---

## 2026-06-11 — PLAN (proposed, NOT yet implemented): Cross-language search

> **Status: awaiting decision.** Nothing below has been built. This section is the implementation plan for making a French/English query (e.g. "brakes", "freins") find listings written in Arabic (فرامل) and vice-versa.

### The problem

A listing's two search vectors are two **stemmings of the same text**, not two languages. The trigger (`supabase/migrations/20260409000000_optimize_listings_write_path.sql:37-48`) builds `search_vector_ar` (arabic config + `normalize_arabic()`) and `search_vector_fr` (french config) from whatever the seller typed. The search API (`src/app/api/search/route.ts:225-227`) ORs both vectors:

```
search_vector_ar.wfts.<query>,search_vector_fr.wfts.<query>
```

So a query in French can never match a listing written only in Arabic — they share no tokens. In a market where buyers and sellers routinely code-switch (FR/MSA/Darija/Arabizi), this silently partitions the catalog by language: a French-typing buyer only ever sees the French-written half of inventory. Secondary gap: no typo tolerance ("breakes" ≠ "brakes" — FTS is exact-lexeme).

**Why it matters:** search users convert at ~3× browse users industry-wide; ~80% abandon after a failed search; and for an early marketplace, a zero-result page on inventory that *exists* teaches the user the site is empty. Liquidity perception is the whole game at launch.

### What we are deliberately NOT doing

- **No content translation.** Algerian users read both languages; we only need *matching*, not translated display. Title/description render as the seller wrote them.
- **No per-listing reprocessing.** All phases are query-time or index-only — no backfill of 100k+ rows, no new columns, no egress cost.
- **No semantic/embedding search up front** (Phase 3 is gated on data, see below).
- Category/subcategory **filters need nothing** — they already work cross-language because they're stored as language-neutral keys and localized at render.

---

### Phase 0 — Zero-result query logging (measure first) — ~½ day

Before changing matching, capture what users actually fail to find. This both justifies the work and feeds the Phase-1 dictionary forever.

- New table `search_zero_results` (`query text`, `locale text`, `filters jsonb`, `created_at`); insert fire-and-forget from `/api/search/route.ts` when FTS returns 0 rows (service-role client already in hand via `serverPool`).
- **Must include the new-table grants** per the Data API deny-by-default rule (see CLAUDE.md): `GRANT INSERT` to the service role path only — this table should NOT be readable by `anon`/`authenticated` at all (it's internal telemetry). RLS enabled, no public policies.
- Migration applied to cloud via Management REST API (NOT `db push` — see CLAUDE.md).
- Optional later: tiny admin page reading top zero-result queries.

**Acceptance:** failed searches appear in the table with locale + query; no latency impact on the search hot path (insert is not awaited).

---

### Phase 1 — Trilingual synonym expansion at query time — ~1–1.5 days ⭐ the core fix

**Idea:** a curated dictionary of concept groups, each listing equivalent terms across FR / EN / MSA / Darija / common Arabizi spellings. At query time each user token is expanded to its group, and the FTS condition becomes "(any variant) AND (any variant of next token)".

**New file `src/lib/search/synonyms.ts`:**

```ts
// Each group = one concept, all spellings that should match each other.
// Arabic entries stored PRE-NORMALIZED (same rules as normalize_arabic()).
const GROUPS: string[][] = [
  ['frein', 'freins', 'brake', 'brakes', 'فرامل', 'فرينة', 'frinat', 'frina'],
  ['pneu', 'pneus', 'tire', 'tires', 'tyre', 'إطارات', 'عجلات', '3ajlat'],
  ['climatiseur', 'clim', 'air conditioner', 'ac', 'مكيف', 'كليماتيزور'],
  // ... seeded from i18n label files + curated per category (see below)
]
// Reverse index built once at module load: token → its group
export function expandToken(token: string): string[]  // group or [token]
export function tokenize(q: string): string[]         // split + strip PostgREST-breaking chars , ( ) | & : .
```

**Hook — shared helper used by all three search routes** (`/api/search/route.ts`, `/api/search/lean/route.ts`, `/api/search/count/route.ts`), e.g. `buildFtsFilters(query)` in `src/lib/search/`:

```ts
// One .or() PER TOKEN (chained .or()s are ANDed by PostgREST) —
// preserves "token1 AND token2" semantics while ORing variants within a token:
for (const token of tokenize(query)) {
  const variants = expandToken(token).join(' OR ')   // websearch syntax: OR only, no parens
  q = q.or(`search_vector_ar.wfts.${variants},search_vector_fr.wfts.${variants}`)
}
```

Notes that make this correct:
- `websearch_to_tsquery` supports bare `OR` between single terms; we never emit parentheses or `AND` (websearch has no grouping), which is why expansion must stay **one token-group per `.or()` call**. Mixing groups in one string would change precedence (`a OR b c` parses as `a | (b & c)`).
- **Sanitization is load-bearing:** commas/parens in a `.or()` value break PostgREST filter parsing (today's code passes the raw query — pre-existing weakness this fixes for free). `tokenize()` strips `, ( ) | & : "` before anything is interpolated.
- **Arabic query normalization:** the `ar` vector is built from `normalize_arabic()` text, but the API currently sends the raw query against it. Port the normalization rules (alef/yaa/taa-marbuta variants, diacritics strip — see `20251002000001_align_search_with_cloud.sql:47`) into `tokenize()` for Arabic-script tokens, and store dictionary Arabic pre-normalized. This fixes a *second* latent recall bug (Arabic queries with ى/ي or أ/ا variants missing today).
- Performance: per-token OR-lists hit the same two GIN indexes; k-way `|` inside one tsquery is cheap. Verify with `EXPLAIN ANALYZE` against the ~100k-row cloud seed / `mock:full` local set.

**Dictionary seeding strategy (the real work is curation, not code):**
1. Auto-extract baseline groups from the three i18n files (`src/i18n/locales/{fr,en,ar}.json`) — category/subcategory labels are already professionally translated triples.
2. Hand-curate per category, starting where listings are densest: **vehicles + auto parts** (makes, parts vocabulary), then construction (major market — never cut), appliances, real estate. Target ~200–400 groups initially.
3. Darija/Arabizi variants added opportunistically from Phase-0 zero-result logs — this is the feedback loop that grows recall where users actually fail.

**Safety/rollout:**
- Feature flag in `src/config/app.ts` (`searchSynonymExpansion: boolean`) — instant kill-switch, no deploy needed beyond toggling + redeploy.
- Pure TS module: no migration, no DB state, trivially revertable.

**Tests:**
- Unit: `expandToken`/`tokenize` (sanitization, Arabic normalization, unknown tokens pass through).
- E2E in `tests/search.spec.ts` style: seed an Arabic-titled listing locally, assert a French query finds it via `/api/search`, and that multi-token queries still AND.

**Acceptance:** "freins", "brakes" and "فرامل" all return the same parts listings; multi-word queries unchanged in semantics; p95 search latency within noise of baseline.

---

### Phase 2 — Typo tolerance (pg_trgm fallback) — ~1 day

Fixes "breakes" → "brakes". Orthogonal to Phase 1; do second because it only helps misspellings, not the language wall.

- `pg_trgm` is already installed (in `extensions` schema since `20251230000000`).
- **Migration:** partial trigram index, applied to cloud via Management REST API:
  ```sql
  CREATE INDEX CONCURRENTLY idx_listings_title_trgm
    ON public.listings USING GIN (title extensions.gin_trgm_ops)
    WHERE status = 'active';
  ```
- **Fallback-only, never the hot path:** in `/api/search/route.ts`, if the FTS query (post-Phase-1 expansion) returns **0 rows**, re-query with `word_similarity` on `title`, ordered by similarity, capped (e.g. 20 rows). Service-role path must keep `applySearchSecurityConstraints()` + `status='active'`.
- UI nicety (optional): label fallback results "Did you mean…?" — needs a `match: 'fuzzy'` flag in the API response.

**Acceptance:** "breakes" returns brake listings ranked by similarity; normal queries never pay the trigram cost; index write overhead acceptable (one more GIN on a column that changes rarely).

---

### Phase 3 — DEFERRED: semantic search (pgvector) — not now

Embeddings would handle both languages and typos in one mechanism, but cost: embedding generation for every listing + every query (external API or edge model), pgvector index memory, ongoing $/latency. **Decision gate, revisit only if:** after Phases 0–2 have run against real traffic for ~a month, zero-result rate is still >~5% AND the failing queries in the log are semantic misses (synonyms can't enumerate them). Otherwise skip permanently.

---

### Decisions needed before starting

1. **Scope of Phase-1 dictionary v1** — vehicles + parts + construction first (recommended), or attempt all 20+ subcategories at once?
2. **Phase 0 worth it?** Strongly recommended (it's half a day and feeds everything), but it does add one table + one migration.
3. **Who curates Darija/Arabizi terms?** Code can ship with FR/EN/MSA from i18n files; dialect terms benefit from a native speaker pass (Ryad).
4. Sequencing proposal: **Phase 0 → Phase 1 → ship → watch logs 1–2 weeks → Phase 2** (rather than all at once), so each change's effect on zero-result rate is measurable.

**Total estimate (Phases 0+1+2): ~3 dev-days** + ongoing dictionary curation. No new infrastructure, no schema changes to `listings`, fully reversible at each step.

---

### Amendments after external review (2026-06-11, second opinions: Codex, Gemini Pro, Supabase AI Assistant — see `docs/Findings.txt`)

**Unanimous consensus — plan core stands unchanged:**
- Staged approach (logging → synonym expansion → trgm fallback → pgvector only if data demands) confirmed by all three.
- File-based Postgres synonym/thesaurus dictionaries **confirmed impossible on hosted Supabase** (no filesystem access) — closes that question; query-time expansion is the only real option.
- Trigram **fallback-only** pattern confirmed correct (precedent already in repo: `20260503000000_add_company_name_trigram_index.sql`).
- Arabic query-side normalization confirmed as a critical fix (Gemini called it the top quick win).
- pgvector deferral confirmed; if ever needed: start with 384-dim multilingual embeddings (~375–750 MB payload at 250k–500k rows + ANN index on top).

**AMENDMENT 1 — Phase 1 becomes a single SQL RPC, not PostgREST `.or()` chains** (Codex + Supabase AI, 2 of 3; adopted)
- One `search_listings_v2(...)` function: normalize → expand tokens (AND-of-OR tsquery via `|`/`&`) → match both vectors → rank → trgm fallback branch when FTS yields 0 — all in **one round trip**, parameterized (injection-safe by construction), `EXPLAIN`-able.
- This also fixes two pre-existing defects Codex flagged: **no relevance ranking** (routes sort by `created_at`/`price` only, never `ts_rank` — there's even an unused ranked function from `20251008000000_add_ranked_search_function.sql` to use as reference) and the **count-vs-results mismatch** (`/api/search/count` uses `.fts` + different normalization than main/lean's `.wfts` — counts can disagree with pages today).
- **Real cost accepted:** the RPC must take the existing filter params (category, subcategory, price min/max, wilaya, city, paging, sort) plus the `d_*` JSONB detail filters as one `jsonb` arg — filtering on top of the RPC result would break pagination. This is the bulk of the added effort.
- When `sortBy` ≠ relevance, order by the requested column instead of rank (keep current UX contract).
- Guardrails from reviewers, adopted: max ~6 tokens/query, max ~6–8 expansions/token, drop tokens < 2 chars, dedupe variants, log latency percentiles.

**AMENDMENT 2 — synonym dictionary lives in a DB table (`search_lexicon`), not a TS module** (adopted)
- Why: curate/grow it (from zero-result logs) without redeploying the app; admin UI possible later.
- Versioning preserved: seed contents live in a checked-in migration/seed file; table is the runtime source of truth.
- **Grants/RLS:** RLS enabled, NO grants to `anon`/`authenticated` (deny-by-default covers new tables) — read path is the RPC executed via the service-role client only.

**AMENDMENT 3 — trgm operator details** (consensus: `word_similarity`)
- Match with the word-similarity operator family (`<%` / `%>`, governed by `pg_trgm.word_similarity_threshold`) so the **operator and the ranking function agree**; rank by `word_similarity`, threshold ~0.35, tune from logs. `strict_word_similarity` judged too strict for noisy marketplace text (Supabase AI), `similarity` over-matches short strings (Codex).
- Expression index must match the query expression exactly (e.g. both `lower(title)`).

**Phase 1.5 (new, optional, cheap):** A/B `arabic` config vs `simple`-over-normalized-text for the AR vector on a labeled Darija/Arabizi query set (all three flagged MSA stemming as possibly harmful for dialect). Don't switch globally without measurement — switching requires a vector rebuild. Synonyms reduce the stakes either way.

**⚠️ The Supabase assistant's drafted SQL (bottom of Findings.txt) must NOT be run as-is** (correctly left unexecuted). Defects to fix when writing the real migration:
1. Builds the Arabic tsquery from raw lowercased tokens — **never applies `normalize_arabic()`**, so Arabic queries would still miss the normalized vector: it re-introduces the exact latent bug this project is fixing.
2. `search_lexicon` created with **no RLS and no grant strategy** → either invisible to the Data API or wide open, depending on path.
3. **Ignores every existing filter** (category, price, wilaya, JSONB details) and paginates inside the function — composing filters afterward would silently return wrong pages.
4. `to_tsquery(cfg, quote_literal(term))` turns multi-word equivalents into phrase queries as a side effect, and throws on tsquery-special characters — sanitize tokens before, not via `quote_literal`.
5. Fallback filters with `%` (plain-similarity operator/threshold) but **ranks** with `word_similarity` — mismatched semantics (see Amendment 3).
6. It was about to apply DDL straight to prod — everything goes through a checked-in migration applied via the Management REST API, like all other schema changes.

**New facts from live cloud stats (via the assistant):** `listings` currently holds **~10.7k rows** (not the assumed ~100k — earlier bulk seed isn't there anymore), 146 MB total of which **131 MB is indexes**; dead tuples negligible, autovacuum healthy. Implications: plenty of headroom for one more partial GIN index; index-to-heap ratio already high, so capture a `pg_stat_user_indexes` snapshot before/after Phase 2 and prune dead indexes if any show 0 scans after real traffic.

**Revised estimate:** Phase 1 grows to ~2–2.5 days (RPC + filter integration + route rewiring + count parity + tests). **Total Phases 0+1+2: ~4 dev-days.**

**Cost & performance impact (asked 2026-06-11):**

| Phase | DB cost | Hot-path performance |
|---|---|---|
| 0 — zero-result log | Negligible: tiny append-only table, only failed searches; KBs–MBs of disk | None — insert is fire-and-forget, not awaited |
| 1 — RPC + lexicon | Negligible: lexicon is a few hundred rows (KBs); **no new indexes on `listings`, no backfill, no egress change** (RPC keeps returning named columns only) | Neutral-to-better: one round trip instead of PostgREST filter assembly; expanded tsquery is more `OR` branches against the same GIN indexes (milliseconds at this scale, bounded by the 6-token/8-variant caps) |
| 2 — trgm index | One partial GIN on `title` (active rows): a few MB at 10.7k rows, ~tens of MB at 250k — irrelevant vs plan disk quota. Small extra write cost per insert/update (titles rarely change) | Zero on the hot path — fallback runs **only** when FTS returns nothing (queries that today return an empty page instantly instead pay one extra indexed query) |
| 3 — pgvector (deferred) | **The only real cost**: 375 MB–1.5 GB+ storage, ANN index must live in RAM → likely forces a bigger compute tier ($) + per-query embedding inference | Adds embedding-API latency to every search |

Two things to actually watch, both measurable not speculative:
1. **`ts_rank_cd` CPU on very broad queries** — ranking is computed per matching row before LIMIT; a one-token query matching thousands of rows pays for all of them. Mitigation: filters shrink candidates, and `EXPLAIN ANALYZE` during Phase 1 against the seeded dataset will show if a rank cap is needed.
2. Supabase billing is compute-tier + disk + egress — Phases 0–2 move none of those meaningfully at current scale (146 MB total today). Egress stays flat because the RPC returns the same named-column payload the routes select now.

**Updated decisions needed:**
1. Approve the RPC-based implementation (Amendment 1) — supersedes the `.or()`-chain design above.
2. Approve DB-table lexicon vs original TS-module dictionary (Amendment 2).
3. Dictionary v1 scope — still recommend vehicles + parts + construction first.
4. Sequencing unchanged: Phase 0 → Phase 1 → ship → watch logs 1–2 weeks → Phase 2.

---

## 2026-06-11 (session 2) — Phases 0 + 1 IMPLEMENTED ✅ (cross-language search live)

Ryad approved the amended plan; Phases 0 and 1 are built, tested, and applied to cloud.

### Repo hygiene (same session)
`cookies.txt` removed from git tracking and deleted (`git rm --cached` + `.gitignore` entry) — it was one careless curl away from committing session cookies.

### New docs
- `docs/BUDGET_WATCHLIST.md` — standing cost/monitoring checklist (index ROI verdict, bloat reindex, photo egress, compute tier, pgvector gate, zero-result KPI). Launch context: marketing push from ~2026-07-02.

### Phase 0 — `supabase/migrations/20260611000000_add_search_zero_results.sql`
`search_zero_results` table (RLS on, **no** anon/authenticated grants — service-role only). The search route logs `{query, locale, filters}` whenever a text query returns 0 rows on page 1. Browse page now sends `locale` for this. Applied to cloud via Management API (`[]`).

### Phase 1 — `supabase/migrations/20260611000001_add_search_lexicon_and_rpc.sql`
- **`search_lexicon`**: one row per concept, `terms text[]` stored lowercase + `normalize_arabic()`-normalized AT INSERT (cannot drift from the vector pipeline). GIN on terms. Seeded with **101 groups**: vehicles, auto parts, construction, generics (FR/EN/MSA/Darija/Arabizi) **+ ~55 car makes/models in both scripts** (clio↔كليو, renault↔رينو…) — added after testing showed Latin "clio" couldn't match Arabic "كليو" (cross-script brand names are lexicon work, not stemmer work).
- **`build_search_tsqueries(p_search)`**: tokenize (cap 6) → expand via lexicon (cap 8, original token always survives) → `plainto_tsquery` per variant (injection-proof) → OR within token-group, AND across groups; AR side normalized with `normalize_arabic()` (fixes the latent أ/ا ى/ي query bug).
- **`search_listings_v2(...)`**: single RPC mirroring every `/api/search` filter (category/subcategory/wilaya/city/price/rent/job/vehicle/JSONB details) + `ts_rank_cd` relevance ranking computed **only when `p_sort='relevance'`**. EXECUTE revoked from anon/authenticated, granted to service_role.

### App changes
- `src/config/app.ts`: `features.searchSynonymExpansion: true` — kill switch back to legacy path.
- `src/app/api/search/route.ts`: rewritten — flag-gated RPC path (default) vs legacy PostgREST path; shared `d_*` allowlist parsing; zero-result logging; `metadata.strategy: 'rpc_v2'`. Default sort becomes **relevance** when a text query is present; explicit price/date sorts honored.
- `src/types/database.ts`: added `search_zero_results`, `search_lexicon` tables + `search_listings_v2` function types.
- `src/app/[locale]/browse/page.tsx`: sends `locale` param.

### Verification
- Local SQL: FR "freins clio" → finds Arabic 'فرامل رينو كليو 4 أصلية' ✅; EN "brakes" ✅; alef-variant Arabic query ✅; multi-token AND constrains ✅; filters compose ✅.
- Local API (port 3001): strategy `rpc_v2`, same results; zero-result query logged with locale ✅; plain browse unaffected ✅.
- **Cloud**: migrations applied; Arabic query `فرامل` returns the English "Brake Discs/Pads/Caliper…" seed listings ✅; `EXPLAIN ANALYZE` ≈ **30 ms** at 10.7k rows.
- `tsc --noEmit` clean; semgrep clean.

### Still open
- Phase 2 (trgm typo fallback) — deliberately deferred: ship, watch `search_zero_results` 1–2 weeks first.
- `/api/search/lean` + `/api/search/count` have **no app callers** — candidates for deletion in a cleanup pass.
- Lexicon growth routine: weekly `select query, count(*) from search_zero_results group by 1 order by 2 desc` → add rows to `search_lexicon` (no redeploy needed).

### Test-suite repair (same session)
The search E2E suite had been silently broken since May's cold-load optimization (`2310a91` removed auto-search on bare `/browse`; the suite predates it, `a0eea2f`), and today's French-default change invalidated its English text selectors. Also `npm run mock:*` is broken — `scripts/quick-mock-data.js` no longer exists (package.json is stale; follow-up: rebuild local seeding, e.g. adapt `generate-mock-listings.mjs`).

Fixes in `tests/search.spec.ts`:
- `gotoAndWait` waits on `button[type="submit"]` (locale-agnostic) instead of `has-text("Search")`.
- New `gotoBare()` helper for filterless `/browse` (no response to await).
- "loads with default listing cards" → split into "bare /browse does NOT auto-search" (asserts the optimization) + "loads listing cards when a filter is present".
- Card-dependent tests navigate with `?category=for_sale`.
- Inserted 5 local test listings (FR + AR, Computers & Tablets, Béjaïa) covering the data-dependent tests; bonus assertion observed: FR query "voiture logan" finds Arabic 'سيارة داسيا لوقان للبيع' via the cross-script lexicon.

**Result: 22 passed, 1 skipped (legit), 0 failed.**

---

## 2026-06-11 (session 3) — Cross-language test matrix on cloud + lexicon tuning

Seeded 6 cloud test listings (tires + brake pads × FR/AR/EN, owned by user1@email.com) and ran the full language matrix through `search_listings_v2`. Two findings, one real bug fixed:

1. **Expansion-cap bug (fixed, `20260611000002_raise_expansion_cap.sql`):** groups with ~10 terms were trimmed to 8 variants *alphabetically* — Latin sorts before Arabic, so the Arabic spellings (the entire point) were dropped. FR "pneus" couldn't reach إطارات. Cap raised to 12. **Curation rule: keep lexicon groups ≤ 12 terms.**
2. **Multi-word lexicon terms are emit-only:** lookup is per-token, so "brake pads" in a group matches nothing unless `pad`/`pads`/`تيل` exist as single-word terms too. Plaquettes group updated accordingly (cloud + local). **Curation rule: every multi-word term needs its distinctive single words in the group.**

Final matrix: **all 9 language combinations match** (pneus/tires/إطارات and plaquettes/brake pads/تيل فرامل each find the FR, AR, and EN listings). Apparent "misses" in earlier runs were ranking artifacts: the English-heavy 1000-listing parts seed pushes single-mention listings past the 50-row page — verified via uncapped queries (85 and 64 total matches, both including the cross-language listing). Resolves itself as real mixed-language inventory replaces the seed.

The 6 test listings remain on cloud for browser testing (delete via `user1@email.com`'s listings when no longer needed).
