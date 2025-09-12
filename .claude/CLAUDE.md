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
npm run dev              # Local development with turbopack (opens browser)
npm run build            # Build application with turbopack
npm run start            # Start production build
npm run lint             # Run ESLint
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

### File Upload Architecture
- **Client**: `src/components/FileUpload.tsx` - React component with drag/drop
- **Storage**: `src/lib/storage.ts` - Manages uploads via Supabase Edge Functions
- **Security**: Content moderation + file validation (JPEG, PNG, WebP only)
- **Flow**: Client validation → Content moderation → Secure upload → Metadata storage

### Docker Configuration
- **Main Config**: `docker-compose.yml` - Production setup with health checks
- **Networking**: Uses external `supabase_network_marketdz` network
- **Environment**: Secure injection via `.env.docker` (never commit actual keys)
- **Build**: Multi-stage Dockerfile with Alpine Linux for minimal image size

### API Structure
API routes in `src/app/api/` organized by domain:
- `auth/` - Authentication endpoints (signin, signup, signout)
- `listings/` - Marketplace item management
- `search/` - Advanced search with Arabic support
- `messages/` - Real-time messaging system
- `admin/` - Administrative functions
- `upload/` - File upload handling

### PWA Implementation
- **Manifest**: `public/manifest.json` with app metadata
- **Icons**: `public/icons/` with 192x192 and 512x512 SVG icons
- **Service Worker**: Automatic caching via next-pwa configuration
- **Config**: `next.config.ts` with PWA setup (temporarily disabled to prevent reload loops)

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

### Common Issues & Solutions

**Authentication fails**: Check cookie handling in middleware, verify session flow
**Photos not loading**: Use `fixPhotoUrl()` utility for Docker URL conversion
**Container won't start**: Verify Supabase running (`npx supabase status`)
**Build failures**: Ensure environment variables in `.env.docker`

### Debugging Commands
```bash
# Check middleware authentication
docker logs marketdz-app-1 --follow | grep "🔧 Middleware"

# Monitor upload attempts
docker logs marketdz-app-1 --follow | grep "Upload"

# Verify network connectivity
npm run docker:status
docker network ls | grep supabase
```

## Key URLs
- **Local Development**: http://localhost:3000 (npm run dev)
- **Docker Application**: http://localhost:3001 (Docker container)
- **Supabase Studio**: http://localhost:54323
- **Health Check**: http://localhost:3001/api/health (Docker) or http://localhost:3000/api/health (local)

## Critical Notes

### Security
- **Never commit**: Actual API keys, `.env.docker`, sensitive configs
- **Always use**: Environment variable placeholders in Docker configs
- **File uploads**: Go through Edge Functions for content moderation

### Performance  
- **Turbopack**: Fast bundler for development and builds
- **Connection Pooling**: Singleton Supabase clients to minimize connections
- **Docker Optimization**: Standalone output for minimal container size
- **Build Optimization**: Source maps disabled for faster production builds

### Networking
- **Internal**: `supabase_kong_marketdz:8000` (container-to-container)
- **External**: `localhost:54321` (browser access)
- **URL fixing**: Use dual pattern in server code for environment detection