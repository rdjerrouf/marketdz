-- Migration: add_company_name_trigram_index
-- Date: 2026-05-03
-- Purpose: Make `company_name ILIKE '%term%'` substring search index-eligible.
--
-- Background:
--   The /api/search endpoint filters job listings with
--     supabaseQuery.ilike('company_name', `%${companyName}%`)
--   A leading wildcard cannot use a B-tree index, so this falls back to a
--   sequential scan over the active-listings subset. At ~250k rows that path
--   becomes the dominant cost of any company-name search.
--
-- Fix:
--   Create a partial GIN trigram index scoped to the same predicate already
--   enforced by applySearchSecurityConstraints() (status='active'), so the
--   planner can satisfy the search with the partial index alone.
--
-- Notes:
--   - pg_trgm is already installed (used by previous migrations).
--   - CONCURRENTLY avoids locking writes during creation on large tables.
--   - Partial predicate matches the API's hot path; full-table scope is wasted
--     write overhead because inactive rows are never searched.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_company_name_trgm
  ON public.listings
  USING gin (company_name gin_trgm_ops)
  WHERE status = 'active' AND company_name IS NOT NULL;
