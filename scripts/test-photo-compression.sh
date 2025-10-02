#!/bin/bash
# Complete test flow for photo compression and listings

echo "🚀 MarketDZ Photo Compression & Listings Test"
echo "=============================================="
echo ""

# Step 1: Download test photos
echo "📥 Step 1: Downloading test photos..."
npm run photos:download

if [ $? -ne 0 ]; then
    echo "❌ Failed to download photos"
    exit 1
fi

echo ""
echo "✅ Photos downloaded successfully"
echo ""

# Step 2: Check Supabase status
echo "🔍 Step 2: Checking Supabase status..."
npx supabase status > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Supabase is not running"
    echo "   Run: npx supabase start"
    exit 1
fi

echo "✅ Supabase is running"
echo ""

# Step 3: Create listings with photos
echo "📝 Step 3: Creating test listings with photo compression..."
npm run listings:create

if [ $? -ne 0 ]; then
    echo "❌ Failed to create listings"
    exit 1
fi

echo ""
echo "🎉 Test complete!"
echo ""
echo "📊 Summary:"
echo "   - 10 test users (test1-test10@example.com, password: password123)"
echo "   - 4 categories: for_sale, job, service, for_rent"
echo "   - 50 listings per category per user = 2000 total listings"
echo "   - Photos: for_sale (3), for_rent (5)"
echo ""
echo "🔗 View your data:"
echo "   Supabase Studio: http://localhost:54323"
echo "   Application: http://localhost:3000"
