-- Migration: Move pg_trgm extension to extensions schema
-- Date: 2025-12-30
-- Purpose: Follow PostgreSQL best practice by keeping extensions in dedicated schema
-- Resolves: Supabase advisor warning "extension_in_public"

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension from public to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Verify the move
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_trgm'
    AND n.nspname = 'extensions'
  ) THEN
    RAISE EXCEPTION 'Failed to move pg_trgm extension to extensions schema';
  END IF;

  RAISE NOTICE 'Successfully moved pg_trgm extension to extensions schema';
END $$;
