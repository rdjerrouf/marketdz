# MarketDZ - Claude Development Guide

> **🔒 SECURITY NOTICE**: This file contains development setup instructions. Never commit actual API keys, secrets, or sensitive configuration data to version control. Use environment variables and .env files that are properly gitignored.

## Project Overview
MarketDZ is a Next.js 15 marketplace application optimized for Algeria users, featuring authentication, listings management, file uploads, and real-time messaging. The application runs in Docker containers with Supabase as the backend.

## Docker Setup & Commands

### Prerequisites
- Docker and Docker Compose installed
- Supabase local development environment running

### Key Docker Commands
```bash
# Build and start the application
cd /c/Users/rdjer/marketdz
docker-compose build app
docker-compose up -d app

# Restart after code changes
docker-compose restart app

# View logs (essential for debugging)
docker logs marketdz-app-1 --follow
docker logs marketdz-app-1 --tail 50 --follow

# Stop services
docker-compose down
```

### Environment Variables Required
```env
# Build-time variables (in Dockerfile)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY_HERE]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY_HERE]

# Runtime variables (in docker-compose.yml)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_URL=http://supabase_kong_marketdz:8000
```

**⚠️ Security Note**: Never commit actual API keys to version control. Use environment files (.env.local) that are in .gitignore.

## Authentication Architecture

### PKCE Flow Issues & Solutions
**Problem**: Session cookies set by client-side authentication not recognized by server-side middleware in Docker environment.

**Root Cause**: Cookie domain/path mismatch between client-side Supabase auth and server-side middleware.

**Solution Applied**:
1. **Client Configuration** (`src/lib/supabase/client.ts`):
   - Uses standard PKCE flow without custom storage
   - Relies on Supabase's built-in cookie handling

2. **Middleware Configuration** (`middleware.ts`):
   - Proper cookie attributes for Docker: `httpOnly: false`, `secure: false`, `sameSite: 'lax'`
   - Domain handling: `domain: undefined` (lets browser handle)
   - Consistent path: `path: '/'`

3. **Server Configuration** (`src/lib/supabase/server.ts`):
   - Dual URL pattern: `SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL`
   - Container-to-container communication vs client access

### Authentication Flow
1. User logs in via client-side form → `/api/auth/signin`
2. Supabase sets PKCE cookies with proper domain/path
3. Middleware reads and validates session from cookies
4. Server-side components access authenticated user data

## File Upload System

### Architecture
- **Client**: `src/components/FileUpload.tsx` - React component with drag/drop
- **Storage**: `src/lib/storage.ts` - Handles uploads via Supabase Edge Functions
- **Security**: Content moderation + file validation

### Upload Flow
1. Client validates file (type, size, suspicious names)
2. Content moderation check via Edge Function
3. Secure upload via `secure-file-upload` Edge Function
4. Server stores metadata and returns public URL

### Common Issues
- **Authentication Required**: Ensure user session exists before upload
- **File Validation**: Check allowed types (JPEG, PNG, WebP) and size limits
- **Edge Function Access**: Verify Supabase Edge Functions are deployed and accessible

## Development Workflow

### Making Code Changes
1. Edit files in the host filesystem
2. Rebuild Docker image: `docker-compose build app`
3. Restart container: `docker-compose up -d app`
4. Monitor logs: `docker logs marketdz-app-1 --follow`

### Debugging Authentication Issues
```bash
# Check middleware logs for cookie handling
docker logs marketdz-app-1 --follow | grep "🔧 Middleware"

# Check authentication API calls
docker logs marketdz-app-1 --follow | grep "=== Signin"

# Monitor file upload attempts
docker logs marketdz-app-1 --follow | grep "Upload"
```

### Testing Commands
```bash
# Run linting and type checking
npm run lint
npm run typecheck

# Test build locally (if needed)
npm run build
```

## Network Configuration

### Docker Compose Network
- **App Container**: `marketdz-app-1` on port 3000
- **Supabase Network**: `supabase_default_marketdz`
- **Kong Gateway**: `supabase_kong_marketdz:8000` (internal)
- **Public Access**: `localhost:54321` (external)

### URL Patterns
```javascript
// Client-side (browser)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

// Server-side (container-to-container)
SUPABASE_URL=http://supabase_kong_marketdz:8000

// Dual pattern in server code
process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
```

## Common Issues & Solutions

### 1. Authentication Session Missing
**Symptom**: `AuthSessionMissingError` in middleware logs
**Solution**: Check cookie handling in middleware, ensure proper PKCE flow

### 2. File Upload Fails
**Symptom**: "Authentication required" during upload
**Solution**: Verify session cookies are properly set and middleware recognizes user

### 3. Container Build Failures
**Symptom**: Docker build fails with missing environment variables
**Solution**: Ensure all required env vars are in Dockerfile and docker-compose.yml

### 4. Supabase Connection Issues
**Symptom**: "fetch failed" errors in server-side operations
**Solution**: Use correct URL pattern (container vs browser access)

## Code Structure

### Key Files
- `middleware.ts` - Authentication and cookie handling
- `src/lib/supabase/client.ts` - Client-side Supabase configuration
- `src/lib/supabase/server.ts` - Server-side Supabase configuration
- `src/lib/storage.ts` - File upload and management
- `src/components/FileUpload.tsx` - Upload UI component

### Docker Files
- `Dockerfile` - Multi-stage build with Alpine Linux
- `docker-compose.yml` - Service configuration and networking
- `.dockerignore` - Files excluded from Docker context

## Performance Considerations

### Docker Optimization
- Multi-stage build to minimize image size
- Standalone output mode: `output: 'standalone'` in next.config.ts
- Disabled linting/TypeScript in production build for faster builds

### Monitoring
- Response time headers: `X-Response-Time`
- Request logging in middleware
- Background log monitoring for real-time debugging

## Next Steps
- Monitor authentication flow after login attempts
- Test photo upload functionality once session sync is confirmed
- Verify all protected routes work properly with authenticated sessions

---

**Last Updated**: Session cookie synchronization implemented and PKCE flow optimized for Docker environment.