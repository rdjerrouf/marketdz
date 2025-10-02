I asked Supabase AI: I'm about to migrate the new schema from local DB, and the question is Do I still need what I have already in the cloud from functions and what ever is left from old one: then I've shared /Users/ryad/marketdz/DATABASE_SCHEMA.md
and this is its answer:

I’m going to quickly inspect your project’s current database objects and Edge Functions to compare with your new schema and spot conflicts or leftovers.


Ran list_tables

Ran list_extensions

Ran list_edge_functions

Reasoned
Short answer
Mostly yes: your cloud DB already matches your “Clean Lean Schema” closely. You do not have any deployed Edge Functions. Before migrating, you should keep the existing tables, enums, and extensions that align with your new schema, and remove/replace only what conflicts. I’ve highlighted deltas and an exact pre-migration checklist below.

What you have in the cloud right now
Public tables present with RLS enabled:
profiles, listings, favorites, reviews, conversations, messages, notifications, arabic_stopwords
Admin system tables: admin_users, admin_invitations, admin_sessions, admin_activity_logs, admin_mfa
Key columns, constraints, and checks match your documentation (e.g., ratings 1–5, status enums, foreign keys, timestamps).
Enums present:
listing_category, listing_status (matches doc)
admin_role (enum is present and used by admin tables)
Extensions:
uuid-ossp, pgcrypto, pg_trgm, unaccent, pg_graphql, supabase_vault, pg_cron, etc. present as expected
Edge Functions:
None deployed
Validation: Tables and RLS flags match your described lean schema; no Edge Functions to preserve.

Notable differences vs your spec
listings search fields:
Your spec mentions one search_vector for Arabic, but the cloud has search_vector_ar and search_vector_fr plus normalized_title_ar/normalized_description_ar. If your new migrations still rely on a single search_vector, you’ll need a migration to rename/drop the extra columns and adjust indexes/triggers accordingly.
Triggers and functions:
I don’t see concrete trigger or function definitions surfaced via table introspection. Your plan mentions functions like handle_new_user(), update_updated_at_column(), listings_search_vector_trigger(), is_admin(), current_admin(), etc. If these exist locally only, ensure your migration set includes CREATE FUNCTION and CREATE TRIGGER statements so production matches.
Admin system:
Cloud has admin_mfa table not listed in your doc’s table list, but it is implied by security. Decide if you want to keep admin_mfa; if not included in the lean spec, plan a safe deprecation.
Column checks:
profiles.rating has 0–5 check in cloud (your doc said numeric default 0.0, which is fine). This is compatible but confirm if you want to enforce the 1–5 rule on reviews only (currently reviews.rating is 1–5, which is correct).
Should you keep “what’s already in the cloud”?
Keep:
All core tables and their RLS if your migrations were authored against the same names/structures.
Enums listing_category and listing_status.
Extensions you rely on: uuid-ossp, pg_trgm, unaccent, pgcrypto, pg_cron, pg_graphql. They are harmless to keep if used.
Review/decide:
listings search columns and their associated indexes/triggers. Align to either single-vector or the dual-vector approach you want in production.
admin_mfa table: keep if you plan MFA for admins; otherwise deprecate.
Remove only via migration after backup:
Any columns/tables not in your new spec (e.g., the extra search fields if unused).
Any outdated triggers and functions superseded by your new helpers.
Pre-migration checklist (safe order)
Backup
Take a full database backup (via Supabase dashboard or pg_dump).
Freeze traffic (optional but recommended during structural changes)
Enums and extensions
Verify needed extensions exist (uuid-ossp, pg_trgm, unaccent, pgcrypto, pg_cron). They already exist; your migration can guard with CREATE EXTENSION IF NOT EXISTS.
Functions and triggers
Ensure your migration set contains all CREATE OR REPLACE FUNCTION and CREATE TRIGGER for:
is_admin(), current_admin(), check_admin_status()
update_updated_at_column(), handle_new_user()
listings_search_vector_trigger()
cleanup_expired_admin_sessions(), expire_hot_deals()
RLS policies
Your migration should explicitly CREATE POLICY for all 33 policies and ALTER TABLE ... ENABLE ROW LEVEL SECURITY where needed. If names changed, DROP old ones first to avoid duplicates or unexpected overlaps.
Search schema alignment
If moving to a single search_vector:
DROP dependent GIN indexes on search_vector_ar/search_vector_fr first
DROP columns no longer used
ADD the target search_vector column
CREATE GIN indexes and trigger to maintain it
If staying dual-language, ensure your local migrations reflect existing columns and indexes.
Admin system alignment
Confirm admin_users, admin_sessions, admin_activity_logs, admin_invitations match your definitions. If deprecating admin_mfa, plan a staged removal:
Stop writes
Migrate any data if necessary
DROP dependents (FKs, policies) then DROP TABLE in a later migration
Data-preserving changes
Avoid destructive ops without explicit decisions. For renames, prefer ALTER TABLE ... RENAME COLUMN over drop+add where possible.
Post-deploy tasks
Rebuild search indexes if needed
Schedule pg_cron jobs (cleanup_expired_admin_sessions, expire_hot_deals)
Validate RLS behavior with test users and admin JWT.
What I can do next for you
Generate a migration diff tailored to:
Consolidating listings search fields to your chosen pattern
Recreating all helper functions and triggers
Re-stating all RLS policies cleanly
Optionally deprecating admin_mfa
Run a quick advisors check and recent logs to flag security/perf issues after deploy.
Would you like me to produce the exact migration SQL for:

A) single-vector Arabic search (drop FR/normalized fields), or
B) dual-vector AR/FR including indexes and trigger definitions?
If you prefer, share your local migrations, and I’ll adapt them to your current cloud state to avoid conflicts.