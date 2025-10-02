#!/bin/bash

echo "🔄 Recreating test users 2-10 via Supabase Auth API..."

# Store the new user IDs
declare -A new_user_ids

for i in {2..10}; do
    echo "Creating test${i}@example.com..."

    # Create user and capture the response
    response=$(curl -s -X POST "http://localhost:54321/auth/v1/signup" \
      -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"test${i}@example.com\",
        \"password\": \"password123\",
        \"data\": {
          \"first_name\": \"Test\",
          \"last_name\": \"User${i}\"
        }
      }")

    # Extract the user ID from the response
    user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$user_id" ]; then
        echo "✅ Created test${i}@example.com with ID: $user_id"
        new_user_ids["test${i}"]="$user_id"
    else
        echo "❌ Failed to create test${i}@example.com"
        echo "Response: $response"
    fi

    sleep 0.5  # Avoid rate limiting
done

echo ""
echo "📋 New User ID Mapping:"
for email in "${!new_user_ids[@]}"; do
    echo "$email@example.com -> ${new_user_ids[$email]}"
done

echo ""
echo "🎉 User recreation complete!"