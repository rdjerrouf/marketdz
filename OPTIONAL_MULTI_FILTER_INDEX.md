# Optional Index: Multi-Filter Query Optimization

**Date:** 2025-10-21
**Status:** ⚠️ DOCUMENTED - NOT IMPLEMENTED YET
**Decision:** Wait for production usage data before adding

---

## 📊 Current Performance

**Query:** Multi-filter (category + subcategory + wilaya)
```sql
WHERE status='active'
  AND category='for_rent'
  AND subcategory='Apartments'
  AND location_wilaya='Algiers'
ORDER BY created_at DESC, id DESC
LIMIT 50
```

**Current execution time:** 710ms
**Improvement from original:** 7x faster (was 3.9s)

---

## 🔍 EXPLAIN ANALYZE Results

```
Index Scan using idx_listings_active_category_subcat
  - Rows scanned: 2,878
  - Rows filtered by wilaya: 2,827 (removed)
  - Rows returned: 51
  - Execution time: 710ms
  - Bottleneck: Post-index filtering + Incremental Sort
```

**What's happening:**
1. Index efficiently finds all `for_rent + Apartments` (2,878 rows)
2. Filters out non-Algiers rows (2,827 removed)
3. Sorts remaining 51 rows by created_at
4. Returns top 50

---

## 💡 Proposed Optimization

### Option A: Full Coverage Index (Recommended if high-traffic)

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_filter_optimized
  ON public.listings (
    category,
    subcategory,
    location_wilaya,
    created_at DESC,
    id DESC
  )
  WHERE status = 'active';
```

**Expected improvement:**
- Execution time: **710ms → 80-150ms** (5x faster)
- Removes post-filtering
- Removes Incremental Sort
- Direct index scan to results

**Costs:**
- Storage: ~10-15MB
- Write overhead: +10-15% on INSERT/UPDATE
- Memory: Additional cache needed

### Option B: Partial Optimization (If wilaya varies)

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cat_subcat_ordered
  ON public.listings (
    category,
    subcategory,
    created_at DESC,
    id DESC
  )
  WHERE status = 'active';
```

**Expected improvement:**
- Execution time: **710ms → 200-300ms** (2-3x faster)
- Removes Incremental Sort
- Still filters wilaya post-index

**Costs:**
- Storage: ~8-10MB
- Write overhead: +8-12% on INSERT/UPDATE

---

## 🎯 Decision Criteria

### ✅ **ADD the index if:**
- This query pattern is in **top 3** most common searches
- You have >100 requests/minute for this pattern
- Users complain about slowness (>1s is noticeable)
- You have spare write capacity (not write-heavy workload)

### ⚠️ **WAIT if:**
- This query pattern is **rare** (< 1% of searches)
- Current 710ms is acceptable to users
- You're write-heavy (lots of new listings)
- You want to keep database lean and simple

---

## 📈 How to Decide

### Monitor Production Usage (After Launch)

```sql
-- Check how often this query pattern appears
-- (After enabling pg_stat_statements)

SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%for_rent%Apartments%Algiers%'
ORDER BY calls DESC;
```

**If you see:**
- `calls > 1000/day` → Consider adding index
- `calls < 100/day` → Not worth it

---

## 🚀 Implementation Steps (If Decided)

### 1. Test in Production (Off-Peak Hours)
```sql
-- Create index (takes 5-10 minutes on 250k rows)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_multi_filter_optimized
  ON public.listings (
    category,
    subcategory,
    location_wilaya,
    created_at DESC,
    id DESC
  )
  WHERE status = 'active';

-- Update statistics
ANALYZE public.listings;
```

### 2. Verify Performance
```sql
EXPLAIN ANALYZE
SELECT ... FROM public.listings
WHERE status='active'
  AND category='for_rent'
  AND subcategory='Apartments'
  AND location_wilaya='Algiers'
ORDER BY created_at DESC, id DESC
LIMIT 50;

-- Should show:
-- "Index Scan using idx_multi_filter_optimized"
-- Execution Time: < 150ms
```

### 3. Monitor Write Performance
```sql
-- Check write times before/after
SELECT
  NOW() - query_start as duration,
  query
FROM pg_stat_activity
WHERE query LIKE 'INSERT INTO listings%'
ORDER BY duration DESC;
```

### 4. Rollback Plan (If Problems)
```sql
-- Remove index if it causes issues
DROP INDEX CONCURRENTLY IF EXISTS idx_multi_filter_optimized;

-- Revert to previous performance
ANALYZE public.listings;
```

---

## 📊 Production Metrics to Track

After adding index (if you do):

**Before:**
- Multi-filter query: 710ms
- Listing INSERT: ~50-100ms
- Total indexes: 7

**After (Expected):**
- Multi-filter query: 80-150ms (5x faster)
- Listing INSERT: ~60-120ms (10-15% slower)
- Total indexes: 8

**Is it worth it?**
- If multi-filter is <5% of queries: **NO**
- If multi-filter is >20% of queries: **YES**

---

## ✅ Current Recommendation

**Status:** ⚠️ **DO NOT ADD YET**

**Rationale:**
1. ✅ 710ms is acceptable for a complex multi-filter query
2. ✅ Already achieved 7x improvement (3.9s → 710ms)
3. ✅ Following "KEEP IT LEAN" database philosophy
4. ⚠️ Don't know production usage patterns yet
5. ⚠️ More indexes = more write overhead

**Next Steps:**
1. Deploy current optimizations to production
2. Monitor query patterns for 2-4 weeks
3. Check pg_stat_statements for usage frequency
4. Re-evaluate if this becomes a top-3 query
5. Add index only if clearly justified by data

---

## 🎓 Key Lessons

### When to Add Indexes:
- ✅ High-traffic queries (>1000/day)
- ✅ User-facing bottlenecks (>1s is noticeable)
- ✅ Clear ROI (queries/day × time_saved > write_overhead)

### When NOT to Add Indexes:
- ❌ Speculative optimization (no usage data)
- ❌ Low-traffic queries (<100/day)
- ❌ Already acceptable performance (<1s)
- ❌ Write-heavy workload (indexes slow writes)

**Remember:** The fastest query is the one you don't need to optimize! 🎯

---

**Created:** 2025-10-21
**Decision:** Wait for production data
**Review Date:** 2 weeks after launch
**Contact:** Re-evaluate when usage patterns are clear
