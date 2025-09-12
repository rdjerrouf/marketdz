# 🐳 Docker Setup & Management Guide

## Quick Start Commands

```bash
# Development (with hot reloading)
npm run docker:dev

# Production
npm run docker:up

# View logs
npm run docker:logs

# Restart container
npm run docker:restart

# Reset everything
npm run docker:reset

# Check status
npm run docker:status

# Shell into container
npm run docker:shell
```

## Docker Environments

### Production (`docker-compose.yml`)
- **Port**: 3001 → 3000
- **Environment**: production
- **Features**: Optimized build, health checks
- **Use case**: Production deployment, testing final build

### Development (`docker-compose.dev.yml`)
- **Port**: 3001 → 3000
- **Environment**: development  
- **Features**: Hot reloading, volume mounts, debugging
- **Use case**: Development with Docker benefits

## Environment Variables

### Build-time (Dockerfile)
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_key]
```

### Runtime (docker-compose)
```env
# Client access (browser)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

# Server access (container-to-container)
SUPABASE_URL=http://supabase_kong_marketdz:8000
```

## Network Architecture

```
Browser → localhost:3001 → Docker Container (port 3000)
                ↓
Container → supabase_kong_marketdz:8000 → Supabase Services
```

## Health Checks

- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

Check health: `curl http://localhost:3001/api/health`

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   npm run docker:logs
   # Check for port conflicts, environment variables
   ```

2. **Photos not loading**
   - Check if URLs use `localhost:54321` (not `127.0.0.1:54321`)
   - Verify Supabase is running: `npx supabase status`

3. **Build failures**
   ```bash
   docker system prune -a  # Clean up space
   npm run docker:build   # Rebuild
   ```

4. **Network issues**
   ```bash
   docker network ls  # Check networks exist
   npx supabase start  # Ensure Supabase network is up
   ```

### Debugging Commands

```bash
# View container processes
docker ps

# Inspect container
docker inspect marketdz-app-1

# Check networks
docker network inspect supabase_network_marketdz

# Container resource usage
docker stats marketdz-app-1

# Clean up unused resources
docker system prune
```

## Performance Optimization

### Build Optimization
- Multi-stage builds (deps → builder → runner)
- Layer caching for dependencies
- Copy files by change frequency
- Production-only dependencies in final stage

### Runtime Optimization
- Health checks for monitoring
- Non-root user for security
- Resource limits (add to docker-compose if needed)

### Development Optimization
- Volume mounts for hot reloading
- Separate dev dependencies
- Debug environment variables

## Security Best Practices

1. **Environment Variables**
   - Never commit real API keys to Dockerfile
   - Use docker-compose for runtime secrets
   - Different keys for dev/prod

2. **Container Security**
   - Non-root user (nextjs:nodejs)
   - Minimal base image (alpine)
   - Regular dependency updates

3. **Network Security**
   - Internal network for service communication
   - Exposed ports only as needed
   - Health check endpoints

## Docker AI Consultation Questions

When consulting Docker AI, ask about:

1. **"Best practices for Next.js Docker containers with Supabase"**
2. **"How to optimize Docker build times for Node.js applications"**
3. **"Container networking patterns for microservices with external databases"**
4. **"Security hardening for production Node.js containers"**
5. **"Docker Compose strategies for development vs production environments"**

## File Structure

```
├── Dockerfile              # Production optimized
├── Dockerfile.optimized    # Enhanced version with better caching
├── docker-compose.yml      # Production environment
├── docker-compose.dev.yml  # Development environment
├── .dockerignore           # Files to exclude from build context
└── DOCKER.md              # This documentation
```

## Next Steps

1. **Try the optimized Dockerfile**: `cp Dockerfile.optimized Dockerfile`
2. **Test development environment**: `npm run docker:dev`
3. **Set up monitoring**: Add logging aggregation
4. **Production deployment**: Configure CI/CD with Docker
5. **Scale**: Add load balancing, multiple containers

---

**Need help?** Run `npm run docker:status` to check current state or `npm run docker:logs` to debug issues.