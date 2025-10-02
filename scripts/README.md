# Scripts Directory

This directory contains utility scripts for MarketDZ administration.

## Security Note

⚠️ **NEVER commit scripts with hardcoded credentials!**

Scripts that require Supabase credentials should:
1. Use environment variables (`process.env.SUPABASE_SERVICE_ROLE_KEY`)
2. Be added to `.gitignore` if they contain sensitive data
3. Use credential files that are explicitly excluded from git

## Available Scripts

- Use Supabase Dashboard for admin operations
- Use Supabase AI for database policy management
- Contact system administrator for credential-requiring operations