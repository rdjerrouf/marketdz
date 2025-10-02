#!/bin/bash

# Prepare All Migrations for Supabase Cloud Deployment
# This script creates individual files ready for copy-paste to SQL Editor

echo "🚀 Preparing all 12 migrations for Supabase Cloud deployment..."

MIGRATIONS_DIR="supabase/migrations"
OUTPUT_DIR="deployment_ready"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Array of migration files in order
migrations=(
    "20250906215239_clean_start.sql"
    "20250907000001_messaging_system.sql"
    "20250907000004_realtime_messaging.sql"
    "20250907000005_realtime_notifications.sql"
    "20250907000006_listing_aggregates.sql"
    "20250908000001_fix_notification_policies.sql"
    "20250909000001_add_category_specific_columns.sql"
    "20250909000002_create_storage_buckets.sql"
    "20250910000001_lean_launch_optimization.sql"
    "20250923000001_fix_message_notifications.sql"
    "20250925000001_fix_messaging_triggers.sql"
    "20250928000001_complete_secure_system.sql"
)

echo "📋 Creating deployment-ready files..."

# Copy migrations to deployment directory with order numbers
for i in "${!migrations[@]}"; do
    migration_file="${migrations[$i]}"
    order=$((i + 1))

    if [ -f "$MIGRATIONS_DIR/$migration_file" ]; then
        # Pad order number with zeros
        padded_order=$(printf "%02d" $order)
        output_file="$OUTPUT_DIR/${padded_order}_${migration_file}"

        # Add header comment to each file
        {
            echo "-- =========================================="
            echo "-- MIGRATION $order OF 12: $migration_file"
            echo "-- =========================================="
            echo "-- Copy this entire content to Supabase SQL Editor"
            echo "-- Then click 'RUN' to apply this migration"
            echo ""
            cat "$MIGRATIONS_DIR/$migration_file"
        } > "$output_file"

        echo "✅ Created: $output_file"
    else
        echo "❌ Missing: $MIGRATIONS_DIR/$migration_file"
    fi
done

# Create a single combined file as well
echo ""
echo "📄 Creating combined migration file..."
{
    echo "-- =============================================="
    echo "-- ALL MARKETDZ MIGRATIONS - COMBINED"
    echo "-- =============================================="
    echo "-- This file contains all 12 migrations in order"
    echo "-- Copy and paste this entire content to Supabase SQL Editor"
    echo "-- WARNING: This is a large migration - consider applying individually"
    echo ""

    for i in "${!migrations[@]}"; do
        migration_file="${migrations[$i]}"
        order=$((i + 1))

        if [ -f "$MIGRATIONS_DIR/$migration_file" ]; then
            echo ""
            echo "-- =========================================="
            echo "-- MIGRATION $order: $migration_file"
            echo "-- =========================================="
            echo ""
            cat "$MIGRATIONS_DIR/$migration_file"
            echo ""
        fi
    done
} > "$OUTPUT_DIR/ALL_MIGRATIONS_COMBINED.sql"

echo "✅ Created: $OUTPUT_DIR/ALL_MIGRATIONS_COMBINED.sql"

# Create deployment instructions
{
    echo "# 🚀 MarketDZ Migration Deployment Instructions"
    echo ""
    echo "## Files Ready for Deployment (in order):"
    echo ""

    for i in "${!migrations[@]}"; do
        migration_file="${migrations[$i]}"
        order=$((i + 1))
        padded_order=$(printf "%02d" $order)
        echo "$order. \`${padded_order}_${migration_file}\`"
    done

    echo ""
    echo "## Deployment Options:"
    echo ""
    echo "### Option 1: Individual Migrations (RECOMMENDED)"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Copy content from each file (01_ through 12_) in order"
    echo "3. Run each migration and verify it succeeds before proceeding"
    echo ""
    echo "### Option 2: Combined Migration (ADVANCED)"
    echo "1. Copy entire content of \`ALL_MIGRATIONS_COMBINED.sql\`"
    echo "2. Paste into Supabase SQL Editor"
    echo "3. Run the combined migration (may take several minutes)"
    echo ""
    echo "## ⚠️ Important:"
    echo "- Apply migrations in the exact order listed"
    echo "- Verify each migration succeeds before continuing"
    echo "- Backup your database before starting"
    echo ""
    echo "## 🔍 Verification:"
    echo "After deployment, run these queries to verify:"
    echo ""
    echo "\`\`\`sql"
    echo "-- Check admin system exists"
    echo "SELECT COUNT(*) FROM information_schema.tables"
    echo "WHERE table_schema = 'public' AND table_name LIKE 'admin_%';"
    echo ""
    echo "-- Should return 4 admin tables"
    echo ""
    echo "-- Check secure functions exist"
    echo "SELECT COUNT(*) FROM information_schema.routines"
    echo "WHERE routine_schema = 'admin_secure';"
    echo ""
    echo "-- Should return 5+ secure functions"
    echo "\`\`\`"
} > "$OUTPUT_DIR/DEPLOYMENT_INSTRUCTIONS.md"

echo "✅ Created: $OUTPUT_DIR/DEPLOYMENT_INSTRUCTIONS.md"

echo ""
echo "🎯 All files prepared in: $OUTPUT_DIR/"
echo ""
echo "📋 Next steps:"
echo "1. Open: $OUTPUT_DIR/DEPLOYMENT_INSTRUCTIONS.md"
echo "2. Follow the deployment instructions"
echo "3. Apply migrations to your Supabase Cloud project"
echo ""
echo "🔗 Your project: https://supabase.com/dashboard/project/vrlzwxoiglzwmhndpolj"