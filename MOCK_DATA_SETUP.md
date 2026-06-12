# Mock Data Setup for Cloud Supabase

## Step 1: Get Cloud API Credentials

1. Go to: https://app.supabase.com/project/vrlzwxoiglzwmhndpolj/settings/api
2. Copy:
   - **Anon Key** (if using anon) or
   - **Service Role Key** (recommended for bulk inserts)

## Step 2: Add to .env.local

Add these lines to `/Users/ryad/marketdz/.env.local`:

```
NEXT_PUBLIC_SUPABASE_CLOUD_KEY=your-anon-key-here
SUPABASE_CLOUD_SERVICE_KEY=your-service-role-key-here
```

(Service role key is recommended for better performance on 100k inserts)

## Step 3: Run the Generator

```bash
cd /Users/ryad/marketdz
node scripts/generate-mock-listings.mjs
```

This will:
- Load 100k+ test listings
- Distribute across 20 test users
- Randomize across all categories and subcategories
- Mix for_sale and for_rent listings
- Use random test photos
- Populate JSONB listing_details per subcategory

## Expected Duration

- 100k listings: ~3-5 minutes
- Performance: ~400-800 listings/sec (depends on network)

## Verify

Check cloud Supabase:
```bash
npx supabase status
# Then visit: https://app.supabase.com/project/vrlzwxoiglzwmhndpolj/editor/listings
```

You should see 100k listings with mixed data.
