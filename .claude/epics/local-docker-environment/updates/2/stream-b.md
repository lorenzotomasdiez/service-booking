---
issue: 2
stream: Environment-Specific Overrides (Dev & Production)
agent: devops-specialist
started: 2025-10-10T17:35:27Z
completed: 2025-10-10T17:45:00Z
status: completed
---

# Stream B: Environment-Specific Overrides (Dev & Production)

## Scope
Create docker-compose.dev.yml and docker-compose.prod.yml with environment-specific overrides, plus comprehensive .env.example documentation.

## Files
- `docker/docker-compose.dev.yml` (new file)
- `docker/docker-compose.prod.yml` (new file)
- `docker/.env.example` (new file)

## Dependencies
- Stream A COMPLETED ✅ (base docker-compose.yml exists)

## Progress
- Starting implementation at 2025-10-10T17:35:27Z
- Created `docker/docker-compose.dev.yml` ✅
  - Development environment overrides extending base configuration
  - Container naming with `-dev` suffix (e.g., `barberpro-postgres-dev`)
  - Development network: `barberpro-network-dev`
  - Hot reload volume mounts for backend and frontend
  - Lower resource limits for laptop development (0.25-1.0 CPU, 256M-1G RAM)
  - More frequent health checks for faster feedback (5-15s intervals)
  - Added backend and frontend services with development configurations
  - Environment variables optimized for development (debug mode, CORS=*, etc.)
  - Volume names with `-dev` suffix for isolation
- Created `docker/docker-compose.prod.yml` ✅
  - Production environment overrides extending base configuration
  - Container naming with `-prod` suffix (e.g., `barberpro-postgres-prod`)
  - Production network: `barberpro-network-prod` with custom subnet (172.20.0.0/16)
  - Higher resource limits for performance (1-2 CPU, 512M-4G RAM)
  - Production-specific PostgreSQL tuning (max_connections=200, shared_buffers=1GB)
  - No volume mounts (use container images only)
  - Ports restricted (not exposed to host, only internal network)
  - Admin tools (pgAdmin, redis-commander) disabled by default (use profiles)
  - Backend with production Dockerfile target and replicas=2
  - Frontend with production Dockerfile target
  - Argentina-specific optimizations (locale, timezone, encoding)
  - Security hardened (APP_DEBUG=false, ENABLE_SWAGGER=false)
  - Volume names with `-prod` suffix for isolation
- Created `docker/.env.example` ✅
  - Comprehensive environment variable documentation (300+ lines)
  - All database credentials documented (POSTGRES_*)
  - Redis configuration documented (REDIS_URL, REDIS_PASSWORD)
  - Admin tools credentials (PGADMIN_*, REDIS_COMMANDER_*)
  - Backend variables (NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, etc.)
  - Frontend variables (VITE_API_URL, VITE_WS_URL, etc.)
  - Argentina-specific variables (TIMEZONE, LOCALE, CURRENCY)
  - Payment integration (MercadoPago, AFIP)
  - WhatsApp Business integration
  - Monitoring and APM (Sentry, New Relic, Datadog)
  - Analytics (Google Analytics, Hotjar)
  - Rate limiting configuration
  - Security configuration (BCrypt, debug flags)
  - Email/SMTP configuration
  - Backup configuration (S3)
  - Grafana monitoring password
  - Environment variable hierarchy documented at top
  - Environment-specific notes (dev vs prod vs test)
  - Quick start commands documented
- Completed at 2025-10-10T17:45:00Z ✅

## Success Criteria Checklist
- [x] `docker/docker-compose.dev.yml` created with hot reload and dev overrides
- [x] `docker/docker-compose.prod.yml` created with production optimizations
- [x] `docker/.env.example` created with comprehensive documentation
- [x] No duplication between files (only environment-specific configs in overrides)
- [x] Dev file has container names with `-dev` suffix
- [x] Prod file has container names with `-prod` suffix
- [x] Environment variable hierarchy documented
- [x] All backend/frontend variables included
- [x] Progress file updated with completion status

## Key Features Implemented

### Development Override (docker-compose.dev.yml)
1. **Hot Reload Configuration**
   - Backend: Volume mount `../backend:/app` with exclusions for node_modules/dist
   - Frontend: Volume mount `../frontend:/app` with exclusions for node_modules/build/.svelte-kit
2. **Development-Specific Settings**
   - Debug mode enabled (APP_DEBUG=true, ENABLE_SWAGGER=true)
   - CORS set to `*` for easy development
   - Detailed logging (LOG_LEVEL=debug)
   - Faster health checks (5-15s intervals)
3. **Resource Optimization**
   - Lower CPU/memory limits for laptop development
   - Postgres: 0.5 CPU / 512M RAM
   - Redis: 0.25 CPU / 256M RAM
   - Backend/Frontend: 1 CPU / 1G RAM
4. **Network Isolation**
   - Development network: `barberpro-network-dev`
   - Development volumes: all suffixed with `-dev`

### Production Override (docker-compose.prod.yml)
1. **Production Security**
   - No volume mounts (immutable container images)
   - Ports not exposed to host (only internal network)
   - Admin tools disabled by default (require `--profile admin-tools`)
   - Debug tools disabled (APP_DEBUG=false, ENABLE_SWAGGER=false)
   - Strict CORS to production domain
2. **Performance Optimization**
   - PostgreSQL production tuning (200 connections, 1GB shared_buffers)
   - Higher resource limits (2 CPU / 4G for postgres, 1 CPU / 2G for redis)
   - Backend replicas: 2 (high availability)
   - Custom network subnet for production isolation
3. **Argentina-Specific Configuration**
   - PostgreSQL locale: es_AR.UTF-8
   - Timezone: America/Argentina/Buenos_Aires
   - Payment integrations: MercadoPago, AFIP
   - WhatsApp Business integration
4. **Monitoring Ready**
   - Sentry DSN configured
   - New Relic support
   - Datadog support
   - Health checks optimized for production (30s intervals)

### Environment Variables (.env.example)
1. **Complete Documentation**
   - 15+ sections covering all configuration areas
   - Development vs Production examples for each variable
   - Inline comments explaining purpose and usage
2. **Security Guidance**
   - Clear warnings about changing defaults in production
   - Password strength recommendations
   - Secret management best practices
3. **Argentina Integration**
   - MercadoPago (sandbox and production modes)
   - AFIP tax agency integration
   - WhatsApp Business configuration
   - Argentina locale and currency settings
4. **Quick Reference**
   - Environment variable loading hierarchy explained
   - Quick start commands for dev/prod/test
   - Common Docker commands documented

## Status
**COMPLETED** ✅

All three files have been successfully created with:
- No duplication between base and override files
- Proper environment-specific configurations
- Comprehensive documentation
- Ready for validation by Stream D
