-- Migration: security_advisor_lockdown
-- Date: 2026-05-03
-- Purpose: Address the high-impact findings from the Supabase security advisor:
--   1. SECURITY DEFINER functions exposed to anon (and in some cases authenticated)
--   2. Public storage buckets that allow anyone to enumerate every file via SELECT on storage.objects
--
-- Background:
--   Supabase grants EXECUTE on new functions to public/anon/authenticated by default.
--   For SECURITY DEFINER functions this means any HTTP caller can invoke them via PostgREST.
--   We tighten the surface to only the roles that actually need each function.
--
--   For storage: the affected buckets (avatars, listing-photos, user-photos) are public,
--   meaning the public CDN serves files at /storage/v1/object/public/<bucket>/<path>
--   without consulting RLS. The broad SELECT policies on storage.objects only matter
--   for storage.list() / storage.download() via the SDK. The app does not call
--   storage.list() from the client (verified in src/components/listings/ImageUpload.tsx),
--   so removing the SELECT policies blocks bucket enumeration without breaking image display.

-- =============================================================================
-- 1. SECURITY DEFINER function grants
-- =============================================================================

-- is_admin() — used by RLS policies on profiles and admin_users.
-- authenticated MUST keep EXECUTE (RLS is evaluated as the calling role).
-- anon never legitimately needs this.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;

-- current_admin() — same reasoning as is_admin().
REVOKE EXECUTE ON FUNCTION public.current_admin() FROM anon, public;

-- handle_new_user() — fires as a trigger on auth.users INSERT.
-- Triggers run as the table owner, so the calling role does not need EXECUTE.
-- No legitimate caller should invoke this directly.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- expire_urgent_listings() — invoked exclusively by pg_cron, which runs as postgres.
-- No HTTP client should ever call this.
REVOKE EXECUTE ON FUNCTION public.expire_urgent_listings() FROM anon, authenticated, public;

-- search_listings_ranked(...) — intentional public search RPC, left as-is.

-- =============================================================================
-- 2. Storage bucket SELECT policies
-- =============================================================================
-- Drop the broad "anyone can SELECT objects in this bucket" policies.
-- Public bucket URLs continue to serve files; only programmatic listing is blocked.

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Listing photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "listing_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "User photos are publicly accessible" ON storage.objects;

-- The original local migration (20250929000000_initial_lean_schema.sql) created
-- "Anyone can view listing photos" / "Anyone can view profile photos" with the
-- same intent. Drop those too if they exist in cloud (idempotent).
DROP POLICY IF EXISTS "Anyone can view listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
