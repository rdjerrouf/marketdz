#!/bin/bash

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 DETAILED PERFORMANCE & SECURITY TEST"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "✅ Test 1: Category Search (for_sale)"
echo "────────────────────────────────────────────────────────────────"
START=$(date +%s%N)
RESULT=$(curl -s "http://localhost:3000/api/search?category=for_sale&limit=50")
END=$(date +%s%N)
TIME=$((($END - $START) / 1000000))
echo "⏱️  Response time: ${TIME}ms"
echo "$RESULT" | jq -r '"📊 Results: " + (.listings | length | tostring) + " listings"'
echo "$RESULT" | jq -r '"👤 Profiles loaded: " + (if .listings[0].profiles then "Yes ✅" else "No ❌" end)'
echo ""

echo "✅ Test 2: Category + Subcategory"
echo "────────────────────────────────────────────────────────────────"
START=$(date +%s%N)
RESULT=$(curl -s "http://localhost:3000/api/search?category=for_rent&subcategory=Apartments&limit=50")
END=$(date +%s%N)
TIME=$((($END - $START) / 1000000))
echo "⏱️  Response time: ${TIME}ms"
echo "$RESULT" | jq -r '"📊 Results: " + (.listings | length | tostring) + " listings"'
echo ""

echo "✅ Test 3: Geographic Filter (Algiers)"
echo "────────────────────────────────────────────────────────────────"
START=$(date +%s%N)
RESULT=$(curl -s "http://localhost:3000/api/search?wilaya=Algiers&limit=50")
END=$(date +%s%N)
TIME=$((($END - $START) / 1000000))
echo "⏱️  Response time: ${TIME}ms"
echo "$RESULT" | jq -r '"📊 Results: " + (.listings | length | tostring) + " listings"'
echo ""

echo "✅ Test 4: Multi-Filter Combo"
echo "────────────────────────────────────────────────────────────────"
START=$(date +%s%N)
RESULT=$(curl -s "http://localhost:3000/api/search?category=for_rent&subcategory=Apartments&wilaya=Algiers&limit=50")
END=$(date +%s%N)
TIME=$((($END - $START) / 1000000))
echo "⏱️  Response time: ${TIME}ms"
echo "$RESULT" | jq -r '"📊 Results: " + (.listings | length | tostring) + " listings"'
echo ""

echo "🔐 Test 5: Security - Invalid Category (should reject)"
echo "────────────────────────────────────────────────────────────────"
RESULT=$(curl -s "http://localhost:3000/api/search?category=INVALID_HACK&limit=5")
echo "$RESULT" | jq '.'
echo ""

echo "🔐 Test 6: Security - Excessive Limit (should reject)"
echo "────────────────────────────────────────────────────────────────"
RESULT=$(curl -s "http://localhost:3000/api/search?category=for_sale&limit=9999")
echo "$RESULT" | jq '.'
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ ALL TESTS COMPLETE"
echo "════════════════════════════════════════════════════════════════"
