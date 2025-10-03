# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarketDZ is a Next.js 15 marketplace application optimized for Algeria users with:
- **PWA Support**: Installable app with offline functionality via next-pwa
- **Bilingual Interface**: Arabic RTL + French localization
- **Authentication**: Supabase PKCE flow with Docker networking fixes
- **File Uploads**: Secure photo storage with content moderation via Edge Functions
- **Real-time**: Messaging and notifications
- **Search**: Advanced Arabic full-text search with geographic filtering
- **Admin System**: Complete role-based admin panel with security definer functions
- **Image Optimization**: ResponsiveImage component with compression utilities

## Essential Commands

### Quick Start (New Developers)
```bash
# 1. Start Supabase (required first)
npx supabase start

# 2. Setup environment
cp .env.docker.example .env.docker
# Edit .env.docker with keys from: npx supabase status

# 3. Start application
npm run docker:up
```

### Development Commands
```bash
npm run dev              # Local development with turbopack (opens browser automatically)
npm run build            # Build application with turbopack
npm run start            # Start production build
npm run lint             # Run ESLint with new flat config (use this before committing)
npm run health           # Check health endpoint (requires app running)
```

### Docker Management
```bash
npm run docker:up        # Start application container
npm run docker:down      # Stop container
npm run docker:restart   # Restart container
npm run docker:build     # Rebuild container
npm run docker:logs      # View container logs (follow mode)
npm run docker:shell     # Access container shell
npm run docker:status    # Check container & network status
npm run docker:reset     # Full reset (down + up)
npm run docker:dev       # Start development container
```

### Testing & Debugging
```bash
# Playwright E2E Testing
npm run test             # Run all Playwright tests
npm run test:headed      # Run tests with browser UI visible
npm run test:ui          # Run tests with Playwright UI mode
npm run test:report      # Show test report after running

# Mock Data Generation
npm run mock:test        # Generate minimal test data
npm run mock:medium      # Generate medium dataset
npm run mock:full        # Generate full dataset with all features

# Connection & Performance Testing
npm run test:pool        # Test database connection pool
npm run docker:logs | grep "Middleware"    # Debug authentication
docker logs marketdz-app-1 --follow       # Raw container logs
```

## Architecture

### Authentication System
The app uses Supabase PKCE authentication with complex Docker networking:

- **Client** (`src/lib/supabase/client.ts`): Browser-side auth with implicit flow
- **Server** (`src/lib/supabase/server.ts`): SSR auth with cookie handling  
- **Server Pool** (`src/lib/supabase/serverPool.ts`): Connection pooling for API routes
- **Middleware** (`middleware.ts`): Request interception and session validation

**Key Issue**: Session cookies in Docker require specific configuration:
- Cookie attributes: `httpOnly: false`, `secure: false`, `sameSite: 'lax'`
- Dual URL pattern: `SUPABASE_URL` (container) vs `NEXT_PUBLIC_SUPABASE_URL` (browser)

**Connection Pooling**: Uses singleton pattern in `serverPool.ts` for optimal performance on Nano tier

### Admin System Architecture
- **Frontend**: Admin pages in `src/app/admin/` with role-based access control
- **Backend**: Secure functions in `admin_secure` schema with SECURITY DEFINER
- **Authentication**: `src/lib/admin/` utilities for admin session management
- **Security**: All admin functions use proper RLS policies and secure search_path
- **Context Management**: `src/contexts/AuthContext.tsx` for global authentication state

**Admin Features**:
- **User Management**: `src/app/admin/users/` - Manage user accounts and status
- **Admin Management**: `src/app/admin/admins/` - Invite and manage admin accounts
- **Analytics Dashboard**: `src/app/admin/analytics/` - System metrics and insights
- **Audit Logs**: `src/app/admin/logs/` - Track all admin actions and changes
- **Notifications**: `src/app/admin/notifications/` - System-wide notification management
- **Listings Management**: `src/app/admin/listings/` - Moderate marketplace content
- **Settings**: `src/app/admin/settings/` - System configuration

**Admin Authentication Flow**:
- **Invitations**: `src/lib/admin/invitations.ts` - Secure admin invite system
- **MFA Support**: `src/lib/admin/mfa.ts` - Two-factor authentication for admins
- **Session Management**: `src/lib/admin/auth.ts` - Secure admin session handling
- **Role-based Access**: Three tiers (super_admin, admin, moderator)

### File Upload Architecture
- **Client**: `src/components/FileUpload.tsx` - React component with drag/drop
- **Storage**: `src/lib/storage.ts` - Manages uploads via Supabase Edge Functions
- **Security**: Content moderation + file validation (JPEG, PNG, WebP only)
- **Flow**: Client validation → Content moderation → Secure upload → Metadata storage
- **Image Optimization**: `src/lib/image-compression.ts` - Client-side compression utilities
- **Responsive Images**: `src/components/common/ResponsiveImage.tsx` - Optimized image display

### Docker Configuration
- **Main Config**: `docker-compose.yml` - Production setup with health checks
- **Networking**: Uses external `supabase_network_marketdz` network
- **Environment**: Secure injection via `.env.docker` (never commit actual keys)
- **Build**: Multi-stage Dockerfile with Alpine Linux for minimal image size

### API Structure
API routes in `src/app/api/` organized by domain:
- `auth/` - Authentication endpoints (signin, signup, signout, session, reset-password, update-password)
- `listings/` - Marketplace item management with search endpoints
- `search/` - Advanced search with Arabic support (analytics, suggestions, lean, count, health)
- `messages/` - Real-time messaging system with conversations
- `admin/` - Administrative functions (users, stats, check-status, user-management)
- `upload/` - File upload handling with content moderation
- `favorites/` - User favorites management
- `reviews/` - User reviews and ratings
- `profile/` - User profile management
- `notifications/` - Push notifications
- `monitoring/` - System monitoring
- `health/` - Application health checks
- `exec-sql/` - Database execution utilities
- `debug/` - Debugging endpoints

### PWA Implementation
- **Manifest**: `public/manifest.json` with app metadata
- **Icons**: `public/icons/` with 192x192 and 512x512 SVG icons
- **Service Worker**: Automatic caching via next-pwa configuration
- **Config**: `next.config.ts` with PWA setup (currently enabled for beta testing)
- **Caching Strategy**: NetworkFirst for API routes, CacheFirst for static assets, NetworkOnly for admin/auth routes

### Testing Architecture
- **Framework**: Playwright for end-to-end testing across Chromium, Firefox, and WebKit
- **Configuration**: `playwright.config.ts` with auto dev server startup
- **Test Location**: `tests/` directory with parallel execution support
- **Base URL**: Automatically uses `http://localhost:3000` for local development
- **Reporting**: HTML reporter with trace collection on retry
- **Test Types**: E2E tests, admin functionality tests, and authentication flow tests

### Performance Configuration
- **Turbopack**: Enabled for faster development builds
- **Source Maps**: Disabled in production (`productionBrowserSourceMaps: false`)
- **Standalone Output**: Optimized for Docker deployment

## Environment Setup

### File Structure
```
├── .env.docker.example     # Template (commit this)
├── .env.docker            # Your keys (NEVER commit)
├── docker-compose.yml     # Uses ${VARIABLES} for security
```

### Required Variables
```env
# Get from: npx supabase status
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Development Workflow

### Making Changes
1. Edit files in host filesystem (hot reload works in Docker)
2. For major changes: `npm run docker:build && npm run docker:up`
3. Monitor logs: `npm run docker:logs`

### Utility Scripts
The `scripts/` directory contains specialized utilities:

**Data Management:**
- `setup-complete-test-data.js` - Complete test data setup
- `create-test-listings-with-photos.js` - Create listings with photo uploads
- `create-test-users-with-listings.js` - Generate test users with listings
- `upload-test-photos.js` - Upload test photos to storage
- `quick-setup.js` - Quick environment setup

**Admin Management:**
- `create-admin-user.js` - Create new admin user
- `create-super-admin.js` - Create super admin account
- `create-first-admin.js` - Initial admin setup
- `test-admin-api.js` - Test admin API endpoints
- `test-admin-system.js` - Verify admin system functionality
- `test-admin-users-page.js` - Test admin UI pages

**Verification & Testing:**
- `verify-listings.js` - Verify listing data integrity
- `simple-verify.js` - Quick system verification
- `check-search-vector.js` - Verify search index status
- `check-plumbing-listings.js` - Check specific category data
- `test-rpc-function.js` - Test database RPC functions

### Common Issues & Solutions

**Authentication fails**: Check cookie handling in middleware, verify session flow. Use `src/lib/auth-error-handler.ts` for debugging
**Photos not loading**: Use `fixPhotoUrl()` utility for Docker URL conversion
**Container won't start**: Verify Supabase running (`npx supabase status`)
**Build failures**: Ensure environment variables in `.env.local`
**Test failures**: Run `npm run test:report` to view detailed test results
**Admin access denied**: Check admin session using `src/lib/admin/` utilities
**Image upload failures**: Check Edge Function logs and content moderation status
**Performance issues**: All optimizations completed - now running on production Supabase cloud
**Database errors**: **RESOLVED** - System migrated to production cloud (2025-10-03)
**Production deployment**: **COMPLETED** - Application running on real Supabase cloud
**PWA reload loops**: **RESOLVED** - Improved caching strategies with proper NetworkOnly for admin/auth routes

### Debugging Commands
```bash
# Check middleware authentication
docker logs marketdz-app-1 --follow | grep "🔧 Middleware"

# Monitor upload attempts
docker logs marketdz-app-1 --follow | grep "Upload"

# Verify network connectivity (Docker - for local development)
npm run docker:status
docker network ls | grep supabase

# PRODUCTION CLOUD COMMANDS (Current Environment):
# Test cloud Supabase functionality
node scripts/test-cloud-supabase.js

# Generate additional test data on cloud
node scripts/generate-cloud-test-data.js

# Access production application
open http://localhost:3002

# Check production performance
node -e "console.log('Production app: http://localhost:3002')"
```

## Key URLs
- **🚀 LOCAL DEVELOPMENT**: http://localhost:3000 (npm run dev - opens automatically)
- **🚀 PRODUCTION APPLICATION**: http://localhost:3002 (npm run dev with cloud backend)
- **Cloud Supabase**: https://vrlzwxoiglzwmhndpolj.supabase.co
- **Docker Application** (dev only): http://localhost:3001 (Docker container)
- **Local Supabase Studio** (dev only): http://localhost:54323
- **Health Check**: http://localhost:3000/api/health (local dev) or http://localhost:3002/api/health (production)

## Critical Notes

### Security
- **Never commit**: Actual API keys, `.env.docker`, sensitive configs
- **Always use**: Environment variable placeholders in Docker configs
- **File uploads**: Go through Edge Functions for content moderation
- **Admin Functions**: All admin operations use SECURITY DEFINER with secure search_path
- **Authentication Errors**: Use `src/lib/auth-error-handler.ts` for safe error handling

### Performance
- **Turbopack**: Fast bundler for development and builds
- **Connection Pooling**: Singleton Supabase clients to minimize connections
- **Docker Optimization**: Standalone output for minimal container size
- **Build Optimization**: Source maps disabled for faster production builds
- **🚀 PRODUCTION PERFORMANCE**:
  - **Cloud Database**: Real Supabase cloud with production scaling
  - **Query Performance**: 150-300ms (real network latency)
  - **Message Notifications**: 100% working on cloud
  - **507+ User Profiles**: Production-scale testing completed
  - **Migration Completed**: All Docker issues resolved (2025-10-03)
  - **PWA Enabled**: Progressive Web App with optimized caching strategies

### Networking
- **🚀 PRODUCTION**: `https://vrlzwxoiglzwmhndpolj.supabase.co` (cloud database)
- **Local Development**: `localhost:54321` (Docker Supabase for development)
- **Container**: `supabase_kong_marketdz:8000` (Docker internal networking)
- **Environment Detection**: Automatic switching based on `.env.local` configuration

## Database Migrations & Deployment

### Current Migration Status (2025-10-03)
The database has been reset with a clean, lean schema approach. Current migrations:

1. `20250929000000_initial_lean_schema.sql` - Core marketplace schema with essential features
2. `20250929000001_add_full_text_search.sql` - Arabic full-text search implementation
3. `20250929000002_add_listings_security_optimization.sql` - Security and performance optimizations
4. `20251001000001_add_hot_deals_support.sql` - Hot deals functionality
5. `20251001000002_add_admin_system.sql` - Admin system with role-based access
6. `20251001000004_add_role_based_rls.sql` - Enhanced RLS policies
7. `20251002000000_pre_migration_cleanup.sql` - Database cleanup
8. `20251002000001_align_search_with_cloud.sql` - Search optimization for cloud

### Deploying Migrations to Production

**Check current migration status:**
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

**Deploy all migrations:**
```bash
# Link to your Supabase project (first time only)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations to production
npx supabase db push --linked

# Or push individual migration
npx supabase db push --linked --include-all=false --file supabase/migrations/FILE_NAME.sql
```

### Post-Deployment Verification
```sql
-- Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check full-text search is configured
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE '%fulltext%';

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename;

-- Confirm migration count
SELECT COUNT(*) as total_migrations FROM supabase_migrations.schema_migrations;
```

### Migration Best Practices
- **Always test locally first**: Run migrations in local Supabase before production
- **Backup before deploying**: Use `pg_dump` or Supabase dashboard backup
- **Monitor after deployment**: Check application logs and database performance
- **Use migrations for ALL schema changes**: Never manually edit production database

## Database Philosophy: KEEP IT LEAN 🎯

### ⚠️ CRITICAL: Do NOT Add Unnecessary Database Objects
**Why this matters**: The previous version of this system got completely out of control by manually adding excessive indexes, triggers, and other database objects in the cloud environment, which **broke the entire system**.

### Golden Rules:
1. **NEVER manually add indexes** unless absolutely proven necessary through performance testing
2. **NEVER add triggers** without thorough testing and documentation
3. **ALWAYS use migrations** for any schema changes - never manual SQL in cloud
4. **STICK to the golden schema** - it contains exactly what we need, nothing more
5. **TEST performance first** - don't assume you need more indexes

### Current Lean State ✅
Our golden schema contains exactly **11 essential indexes** - this is intentional:
- `idx_profiles_wilaya` - Geographic filtering
- `idx_listings_user_id` - User's listings
- `idx_listings_fulltext` - Search functionality
- `idx_listings_search_compound` - Complex filtering
- `idx_favorites_listing_id` - Favorite lookups
- `idx_reviews_reviewed_id` - User reviews
- `idx_conversations_users` - User conversations
- `idx_messages_conversation_time` - Message ordering
- `idx_messages_unread` - Unread counts
- `idx_notifications_user_unread` - Unread notifications
- `idx_notifications_user_all` - Notification history

### Before Adding ANY Database Object:
1. **Prove it's needed** with actual performance testing
2. **Document the reason** in a migration file with comments
3. **Test thoroughly** in local environment first
4. **Get approval** before deploying to cloud
5. **Monitor impact** after deployment

### Database Bloat Prevention:
- ✅ **Regular testing confirms** current indexes handle all queries efficiently
- ✅ **No additional indexes needed** for favorites, messaging, or notifications
- ✅ **System performs well** with minimal, strategic indexing
- ⚠️ **Adding more can hurt performance** by slowing down writes and consuming memory

**Remember**: More database objects ≠ better performance. Often the opposite is true.