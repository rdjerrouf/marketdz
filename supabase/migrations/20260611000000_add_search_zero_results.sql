-- Phase 0 of cross-language search plan (docs/DAILY_TASK.md, 2026-06-11):
-- log every search that returned zero rows. Feeds the search_lexicon with
-- real failing queries and gives the zero-result-rate KPI (docs/BUDGET_WATCHLIST.md #6).

CREATE TABLE IF NOT EXISTS public.search_zero_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  query text NOT NULL,
  locale text,
  filters jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_zero_results ENABLE ROW LEVEL SECURITY;

-- Internal telemetry: NO policies and NO anon/authenticated grants on purpose.
-- Only the service-role search API writes; reads happen via SQL editor/admin tooling.
-- (Data API deny-by-default keeps this invisible to clients.)
GRANT SELECT, INSERT ON public.search_zero_results TO service_role;
