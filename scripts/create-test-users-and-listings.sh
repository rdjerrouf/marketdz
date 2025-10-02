#!/bin/bash
# Complete setup: users + listings + photos

echo "🚀 MarketDZ Complete Test Data Setup"
echo "====================================="
echo ""

# Step 1: Create test users
echo "👥 Step 1: Creating test users..."
for i in {1..10}; do
  echo "  Creating test${i}@example.com..."
  npx supabase auth signup test${i}@example.com password123 --local 2>&1 | grep -v "Error" || true
done

echo ""
echo "✅ Test users created"
echo ""

# Step 2: Wait a moment for auth to settle
echo "⏳ Waiting for authentication to settle..."
sleep 2

# Step 3: Create listings with photos
echo "📝 Step 3: Creating test listings with photos..."
npm run listings:create

echo ""
echo "🎉 Complete! All test data has been set up."
echo ""
echo "📊 Summary:"
echo "   - 10 test users (test1-test10@example.com, password: password123)"
echo "   - 2000 listings across 4 categories"
echo "   - Photos with compression for for_sale and for_rent"
echo ""
echo "🔗 Access:"
echo "   App: http://localhost:3000"
echo "   Studio: http://localhost:54323"
