# Deployment Trigger

This file is used to trigger Vercel redeployments when environment variables are updated.

Last updated: 2025-10-02 (Updated Supabase API keys to new format)

## Environment Variables Updated:
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Updated to sb_publishable_ format
- SUPABASE_SERVICE_ROLE_KEY: Updated to sb_secret_ format

## Deployment Notes:
- Legacy JWT format keys have been disabled by Supabase
- New sb_publishable_ and sb_secret_ format keys are now active
- This deployment ensures the new keys are bundled into the production build