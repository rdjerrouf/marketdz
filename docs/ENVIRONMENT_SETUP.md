# Environment Configuration Guide

This guide explains how to set up and manage environment variables for MarketDZ.

## Quick Start

### Local Development (Default)

```bash
# 1. Ensure .env.local exists with local Supabase configuration
# 2. Start local Supabase
npx supabase start

# 3. Get your local keys
npx supabase status

# 4. Run development server
npm run dev
```

Your app will connect to local Supabase at `http://127.0.0.1:54321`

### Production/Cloud Testing

```bash
# 1. Create .env.production.local with cloud credentials
cp .env.example .env.production.local

# 2. Fill in cloud Supabase keys from:
# https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj/settings/api

# 3. Build and run production mode
npm run build
npm start
```

Your app will connect to cloud Supabase at `https://vrlzwxoiglzwmhndpolj.supabase.co`

---

## Environment Files Explained

### File Priority (Next.js loading order)

Next.js loads environment files in this order (later files override earlier ones):

1. `.env` - Shared across all environments
2. `.env.local` - Local overrides (used by default for `npm run dev`)
3. `.env.production` - Production defaults
4. `.env.production.local` - Production overrides (used for `npm run build` && `npm start`)

**Current Setup:**
- `.env.local` → Local Supabase (development)
- `.env.production.local` → Cloud Supabase (production testing)

### File Details

| File | Purpose | Committed to Git? | Used By |
|------|---------|-------------------|---------|
| `.env.example` | Template with documentation | ✅ Yes | Reference only |
| `.env.local` | Local development config | ❌ No | `npm run dev` |
| `.env.production.local` | Production/cloud config | ❌ No | `npm run build` + `npm start` |

---

## Configuration per Environment

### Local Development (.env.local)

```bash
# Local Supabase
SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Get from: npx supabase status
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Local URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Local database
SUPABASE_DB_PASSWORD=postgres
```

**Get keys from:** Run `npx supabase status` and copy the keys

### Production (.env.production.local)

```bash
# Cloud Supabase
SUPABASE_URL=https://vrlzwxoiglzwmhndpolj.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://vrlzwxoiglzwmhndpolj.supabase.co

# Get from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Production URLs
NEXT_PUBLIC_APP_URL=https://marketdz.vercel.app
NEXT_PUBLIC_SITE_URL=https://marketdz.vercel.app
```

**Get keys from:** https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj/settings/api

---

## How to Switch Environments

### Method 1: Use Different Commands (Recommended)

```bash
# Development (uses .env.local)
npm run dev

# Production (uses .env.production.local)
npm run build
npm start
```

### Method 2: Temporarily Rename Files

```bash
# To use cloud for development
mv .env.local .env.local.backup
mv .env.production.local .env.local

npm run dev  # Now connects to cloud

# Restore when done
mv .env.local .env.production.local
mv .env.local.backup .env.local
```

---

## Important Notes

### Security

- ✅ All `.env*` files are excluded from git via `.gitignore`
- ✅ Never commit API keys or secrets
- ✅ Use separate keys for local vs production
- ⚠️ The `SUPABASE_SERVICE_ROLE_KEY` is extremely sensitive - it bypasses RLS policies

### Environment Variables in Next.js

**Server-side only (no `NEXT_PUBLIC_` prefix):**
- `SUPABASE_SERVICE_ROLE_KEY` - API routes only
- `SUPABASE_DB_PASSWORD` - Database connections only
- `VAPID_PRIVATE_KEY` - Push notifications only

**Client-side (with `NEXT_PUBLIC_` prefix):**
- `NEXT_PUBLIC_SUPABASE_URL` - Frontend Supabase client
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Frontend authentication
- `NEXT_PUBLIC_APP_URL` - App URLs for redirects

### Vercel Deployment

Vercel environment variables are set in the dashboard:
- https://vercel.com/your-username/marketdz/settings/environment-variables

**IMPORTANT:** Vercel does NOT use `.env.production.local` - you must manually set environment variables in the Vercel dashboard.

---

## Troubleshooting

### Issue: "permission denied" errors

**Cause:** JWT token from wrong environment

**Fix:**
1. Check which Supabase URL your browser is using (DevTools → Network tab)
2. Clear all browser cookies
3. Restart dev server
4. Sign in again

### Issue: Changes not reflecting

**Cause:** Environment variables cached

**Fix:**
```bash
# Stop dev server
# Delete .next build cache
rm -rf .next

# Restart
npm run dev
```

### Issue: Can't connect to Supabase

**Local:**
```bash
# Check if Supabase is running
npx supabase status

# If not running
npx supabase start
```

**Cloud:**
- Verify keys are correct in `.env.production.local`
- Check project status at https://supabase.com/dashboard

---

## Quick Reference

### Get Local Supabase Keys
```bash
npx supabase status
```

### Get Cloud Supabase Keys
https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj/settings/api

### Reset Local Database
```bash
npx supabase db reset
```

### Check Current Environment
```bash
# In your app
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### View All Environment Variables
```bash
# Development
npm run dev
# Then visit: http://localhost:3000/api/health

# Or in terminal
node -e "console.log(process.env)" | grep SUPABASE
```
