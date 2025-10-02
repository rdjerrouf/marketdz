#!/bin/bash

# Create test users 2-10 using proper Supabase auth API

for i in {2..10}; do
    echo "Creating test${i}@example.com..."

    curl -X POST "http://localhost:54321/auth/v1/signup" \
      -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"test${i}@example.com\",
        \"password\": \"password123\",
        \"data\": {
          \"first_name\": \"Test\",
          \"last_name\": \"User${i}\"
        }
      }" > /dev/null 2>&1

    echo "✅ Created test${i}@example.com"
    sleep 0.5  # Small delay to avoid rate limiting
done

echo "🎉 All test users created!"