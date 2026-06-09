-- category_field_definitions: metadata table that drives which fields appear per subcategory.
-- Mirrors src/lib/constants/subcategory-fields.ts (the TypeScript registry is the runtime source of truth;
-- this table enables future admin-UI management of fields without code deploys).

CREATE TABLE IF NOT EXISTS public.category_field_definitions (
  id              SERIAL PRIMARY KEY,
  category        TEXT NOT NULL,              -- 'for_sale' | 'for_rent'
  subcategory     TEXT NOT NULL,
  field_key       TEXT NOT NULL,
  label_en        TEXT NOT NULL,
  label_fr        TEXT,
  label_ar        TEXT,
  field_type      TEXT NOT NULL,              -- 'text' | 'integer' | 'select' | 'boolean_select'
  storage         TEXT NOT NULL DEFAULT 'jsonb', -- 'jsonb' | vehicle_make | vehicle_model | …
  options         JSONB,                      -- [{value, label_en, label_fr, label_ar}]
  is_required     BOOLEAN NOT NULL DEFAULT false,
  is_searchable   BOOLEAN NOT NULL DEFAULT false,
  is_range_filter BOOLEAN NOT NULL DEFAULT false,
  display_order   SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, subcategory, field_key)
);

COMMENT ON TABLE public.category_field_definitions IS
  'Admin-editable metadata for subcategory-specific listing fields. Runtime source of truth is src/lib/constants/subcategory-fields.ts.';

-- RLS: read-only for all authenticated users; write restricted to admins via service role
ALTER TABLE public.category_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category_field_definitions_select"
  ON public.category_field_definitions FOR SELECT
  USING (true);

-- Data API grants (required for Supabase PostgREST after Oct 2026)
GRANT SELECT ON public.category_field_definitions TO anon, authenticated;
