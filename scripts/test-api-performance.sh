#!/bin/bash

echo "🧪 Performance Test Suite"
echo "===================================="
echo ""

echo "Test 1: Category-only (for_sale)"
time curl -s "http://localhost:3000/api/search?category=for_sale&limit=50" | jq -r '"Results: " + (.listings | length | tostring)'
echo ""

echo "Test 2: Category + Subcategory"
time curl -s "http://localhost:3000/api/search?category=for_sale&subcategory=Electronics&limit=50" | jq -r '"Results: " + (.listings | length | tostring)'
echo ""

echo "Test 3: Geographic (Wilaya)"
time curl -s "http://localhost:3000/api/search?wilaya=Algiers&limit=50" | jq -r '"Results: " + (.listings | length | tostring)'
echo ""

echo "Test 4: Full-text search"
time curl -s "http://localhost:3000/api/search?q=apartment&limit=50" | jq -r '"Results: " + (.listings | length | tostring)'
echo ""

echo "Test 5: Multi-filter combo"
time curl -s "http://localhost:3000/api/search?category=for_rent&subcategory=Apartments&wilaya=Algiers&limit=50" | jq -r '"Results: " + (.listings | length | tostring)'
echo ""

echo "===================================="
echo "✅ All tests complete!"
