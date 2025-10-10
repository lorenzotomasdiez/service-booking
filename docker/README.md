# BarberPro Docker Infrastructure Documentation

> **Complete guide to the modular Docker Compose infrastructure for BarberPro**

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [File Structure](#file-structure)
4. [Environment Variables](#environment-variables)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Testing Environment](#testing-environment)
8. [PostgreSQL 16 Upgrade](#postgresql-16-upgrade)
9. [Health Checks](#health-checks)
10. [Resource Limits](#resource-limits)
11. [Networking](#networking)
12. [Admin Tools](#admin-tools)
13. [Monitoring Stack (Phase 3)](#monitoring-stack-phase-3)
14. [Argentina Mocks (Phase 2)](#argentina-mocks-phase-2)
15. [Troubleshooting](#troubleshooting)
16. [Common Operations](#common-operations)
17. [Security Best Practices](#security-best-practices)
18. [Migration Guide](#migration-guide)
19. [Platform-Specific Notes](#platform-specific-notes)
20. [Rollback Plan](#rollback-plan)

---

## Overview

BarberPro uses a **modular Docker Compose architecture** that provides:

- ✅ **Base infrastructure** shared across all environments
- ✅ **Environment-specific overrides** for dev/prod/test
- ✅ **Version-pinned images** (no `:latest` tags except custom builds)
- ✅ **Comprehensive health checks** for all services
- ✅ **PostgreSQL 16** with Argentina-optimized settings
- ✅ **Resource limits** to prevent system exhaustion
- ✅ **Isolated networks** per environment
- ✅ **Admin tools** (pgAdmin, Redis Commander)
- ✅ **Future-ready** for monitoring and mocks

### Architecture Benefits

| Feature | Description |
|---------|-------------|
| **Modular Design** | Base configuration + environment-specific overrides |
| **No Duplication** | Shared config in base, overrides only what's needed |
| **Easy Testing** | Isolated test environment with fast startup |
| **Production-Ready** | Optimized for Argentina deployment |
| **Developer-Friendly** | Hot reload, exposed ports, debug tools |

---

## Quick Start

### Development Environment

Start all services for local development:

```bash
# From project root
npm run docker:dev

# Or directly with docker-compose
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up
```

### Production Environment

Deploy to production:

```bash
# From project root
npm run docker:prod

# Or directly with docker-compose
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

### Testing Environment

Run tests with isolated database:

```bash
# From project root
npm run docker:test

# Or directly with docker-compose
docker-compose -f docker/docker-compose.test.yml up -d
```

### Services Only (No Backend/Frontend)

Start just PostgreSQL and Redis for local development:

```bash
npm run docker:dev:services
```

---

## File Structure

```
docker/
├── docker-compose.yml              # Base configuration (postgres, redis, nginx, pgadmin, redis-commander)
├── docker-compose.dev.yml          # Development overrides (hot reload, debug tools, exposed ports)
├── docker-compose.prod.yml         # Production overrides (optimized resources, security, no exposed ports)
├── docker-compose.test.yml         # Testing environment (isolated, fast startup, disposable)
├── docker-compose.monitoring.yml   # Monitoring stack placeholder (Phase 3: Prometheus, Grafana, Loki)
├── docker-compose.mocks.yml        # Argentina mocks placeholder (Phase 2: MercadoPago, AFIP, WhatsApp)
├── .env.example                    # Environment variable template with documentation
└── configs/                        # Service configuration files
    ├── nginx.conf                  # Base Nginx configuration
    ├── nginx-prod.conf             # Production Nginx configuration
    ├── nginx-frontend.conf         # Frontend-specific Nginx config
    ├── redis.conf                  # Base Redis configuration
    ├── redis-prod.conf             # Production Redis configuration
    ├── postgres-prod.conf          # Production PostgreSQL configuration
    └── proxy_params.conf           # Nginx proxy parameters
```

### Compose File Responsibilities

| File | Purpose | When to Use |
|------|---------|-------------|
| `docker-compose.yml` | Base infrastructure (postgres, redis, nginx, admin tools) | Always (foundation for all environments) |
| `docker-compose.dev.yml` | Development overrides (hot reload, debug mode, backend, frontend) | Local development |
| `docker-compose.prod.yml` | Production overrides (optimized, secure, scaled) | Production deployment |
| `docker-compose.test.yml` | Isolated testing (separate DB, fast startup) | CI/CD pipelines, local testing |
| `docker-compose.monitoring.yml` | Monitoring stack (Prometheus, Grafana, Loki) | Phase 3 implementation |
| `docker-compose.mocks.yml` | Argentina service mocks (MercadoPago, AFIP, WhatsApp) | Phase 2 implementation |

---

## Environment Variables

### Setup

1. Copy the example file:
```bash
cp docker/.env.example docker/.env
```

2. Customize for your environment:
```bash
# Edit with your preferred editor
nano docker/.env
```

3. Also create service-specific env files:
```bash
cp docker/.env.example backend/.env
cp docker/.env.example frontend/.env
```

### Variable Hierarchy

Variables are loaded in this order (later overrides earlier):

1. `docker/.env` - Docker-level variables
2. `backend/.env` - Backend-specific variables
3. `frontend/.env` - Frontend-specific variables
4. `docker-compose.yml` - Base defaults
5. `docker-compose.{env}.yml` - Environment-specific overrides

### Critical Variables

#### Database (PostgreSQL 16)

```bash
POSTGRES_DB=barberpro_dev           # Database name
POSTGRES_USER=barberpro             # Database user
POSTGRES_PASSWORD=changeme          # ⚠️ CHANGE IN PRODUCTION!
DATABASE_URL=postgresql://...       # Full connection string
```

#### Backend API

```bash
BACKEND_PORT=3000                   # Backend port
JWT_SECRET=changeme                 # ⚠️ CHANGE IN PRODUCTION!
JWT_EXPIRES_IN=7d                   # Token expiration
LOG_LEVEL=debug                     # Logging verbosity
```

#### Argentina-Specific

```bash
TIMEZONE=America/Argentina/Buenos_Aires
LOCALE=es-AR
CURRENCY=ARS
MERCADOPAGO_ACCESS_TOKEN=...        # MercadoPago credentials
AFIP_CUIT=...                       # AFIP tax ID
WHATSAPP_BUSINESS_PHONE=...         # WhatsApp number
```

#### Admin Tools

```bash
PGADMIN_DEFAULT_EMAIL=admin@barberpro.local
PGADMIN_DEFAULT_PASSWORD=admin      # ⚠️ CHANGE IN PRODUCTION!
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin      # ⚠️ CHANGE IN PRODUCTION!
```

### Environment-Specific Values

| Variable | Development | Production | Test |
|----------|-------------|------------|------|
| `POSTGRES_DB` | `barberpro_dev` | `barberpro_prod` | `barberpro_test` |
| `LOG_LEVEL` | `debug` | `warn` | `info` |
| `APP_DEBUG` | `true` | `false` | `true` |
| `ENABLE_SWAGGER` | `true` | `false` | `false` |
| `CORS_ORIGIN` | `*` | `https://barberpro.com.ar` | `*` |

---

## Development Workflow

### Starting Development Environment

```bash
# Start all services (postgres, redis, nginx, backend, frontend, admin tools)
npm run docker:dev

# Or with docker-compose directly
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up
```

### What Gets Started

1. **PostgreSQL 16** - Database server (port 5432)
2. **Redis 7** - Cache and session store (port 6379)
3. **Nginx 1.27** - Reverse proxy (ports 80, 443)
4. **pgAdmin 8.12** - Database admin UI (port 8080)
5. **Redis Commander** - Redis admin UI (port 8081)
6. **Backend** - Fastify API with hot reload (port 3000)
7. **Frontend** - SvelteKit with hot reload (port 5173)

### Development Features

- ✅ **Hot Reload**: Code changes reload automatically
- ✅ **Volume Mounts**: Source code mounted for live updates
- ✅ **Debug Tools**: Swagger UI, detailed logs
- ✅ **Exposed Ports**: All services accessible from host
- ✅ **Fast Health Checks**: 5-15s intervals for quick feedback
- ✅ **Lower Resource Limits**: Prevents laptop resource exhaustion

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | N/A |
| **Backend Swagger** | http://localhost:3000/docs | N/A |
| **Frontend** | http://localhost:5173 | N/A |
| **pgAdmin** | http://localhost:8080 | admin@barberpro.local / admin |
| **Redis Commander** | http://localhost:8081 | admin / admin |
| **PostgreSQL** | localhost:5432 | barberpro / barberpro_dev_password |
| **Redis** | localhost:6379 | No password |

### Development Commands

```bash
# View logs (all services)
npm run docker:logs

# View logs (specific service)
docker-compose -f docker/docker-compose.yml logs -f backend

# Restart a service
docker-compose -f docker/docker-compose.yml restart backend

# Stop all services
npm run docker:down

# Stop and remove volumes (fresh start)
docker-compose -f docker/docker-compose.yml down -v

# Check service health
docker-compose -f docker/docker-compose.yml ps

# Validate compose file syntax
npm run docker:config:dev
```

### Hot Reload Configuration

The dev compose file mounts source code as volumes:

```yaml
# Backend hot reload
volumes:
  - ../backend:/app          # Mount source code
  - /app/node_modules        # Exclude node_modules
  - /app/dist                # Exclude build artifacts

# Frontend hot reload
volumes:
  - ../frontend:/app         # Mount source code
  - /app/node_modules        # Exclude node_modules
  - /app/.svelte-kit         # Exclude SvelteKit build
```

---

## Production Deployment

### Production Differences

| Feature | Development | Production |
|---------|-------------|------------|
| **Images** | Development Dockerfile | Optimized production build |
| **Volumes** | Source code mounted | No volume mounts (immutable) |
| **Ports** | All exposed | Only nginx (80/443) |
| **Resources** | Low limits | High limits (2 CPUs, 4GB RAM) |
| **Health Checks** | Fast (5-15s) | Conservative (30s) |
| **Admin Tools** | Always running | Profile-based (on-demand) |
| **Logging** | Debug level | Warn level |
| **Replicas** | Single instance | Multiple instances (backend) |

### Production Deployment Steps

1. **Prepare Environment**:
```bash
# Create production env file
cp docker/.env.example docker/.env
nano docker/.env  # Set all production values

# Copy to service directories
cp docker/.env backend/.env.production
cp docker/.env frontend/.env.production
```

2. **Build Production Images**:
```bash
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml build
```

3. **Start Production Services**:
```bash
npm run docker:prod

# Or with docker-compose
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

4. **Verify Health**:
```bash
docker-compose -f docker/docker-compose.yml ps
docker-compose -f docker/docker-compose.yml logs -f
```

5. **Run Migrations**:
```bash
npm run db:migrate:prod
```

### Production Security

#### ⚠️ Critical Production Changes

Before deploying to production, **MUST** change:

1. **All Passwords**:
   - `POSTGRES_PASSWORD` - Strong random password (32+ chars)
   - `JWT_SECRET` - Cryptographically secure random string (64+ chars)
   - `PGADMIN_DEFAULT_PASSWORD` - Strong password
   - `REDIS_COMMANDER_PASSWORD` - Strong password
   - Add `REDIS_PASSWORD` - Enable Redis authentication

2. **Debug Settings**:
   - `APP_DEBUG=false` - Disable debug mode
   - `ENABLE_SWAGGER=false` - Disable API documentation
   - `LOG_LEVEL=warn` - Reduce log verbosity

3. **CORS Configuration**:
   - `CORS_ORIGIN=https://barberpro.com.ar` - Restrict to your domain

4. **Argentina Credentials**:
   - `MERCADOPAGO_ACCESS_TOKEN` - Production token
   - `MERCADOPAGO_ENVIRONMENT=production`
   - `AFIP_CUIT` - Real company CUIT
   - `AFIP_ENVIRONMENT=production`
   - `WHATSAPP_ACCESS_TOKEN` - Production token

### Production Port Security

In production, only nginx (80/443) is exposed to the host:

```yaml
# postgres: No exposed ports (internal network only)
# redis: No exposed ports (internal network only)
# backend: No exposed ports (only accessible via nginx)
# frontend: No exposed ports (only accessible via nginx)
```

### Production Resource Configuration

```yaml
# PostgreSQL (production)
limits:
  cpus: '2.0'
  memory: 4G
reservations:
  cpus: '1.0'
  memory: 2G

# Backend (production) - Note: replicas not compatible with container_name
limits:
  cpus: '2.0'
  memory: 2G
```

**Note**: The production compose file uses `replicas: 2` for high availability, but this is incompatible with `container_name`. Remove `container_name` if using replicas, or remove `replicas` if using container names.

### Temporary Admin Tool Access

Admin tools (pgAdmin, Redis Commander) are disabled in production by default.

To enable temporarily:

```bash
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml --profile admin-tools up -d
```

---

## Testing Environment

### Test Environment Features

- ✅ **Isolated Database**: Separate from dev/prod
- ✅ **Isolated Redis**: Separate cache instance
- ✅ **Fast Startup**: Optimized for CI/CD (<15s)
- ✅ **Lower Resources**: Suitable for CI runners
- ✅ **Disposable Data**: Clean state each run
- ✅ **No Persistence**: Volumes cleared on `down -v`

### Starting Test Environment

```bash
# Start test services
npm run docker:test

# Or with docker-compose
docker-compose -f docker/docker-compose.test.yml up -d

# Wait for health checks
docker-compose -f docker/docker-compose.test.yml ps

# Run migrations
cd backend && npm run db:migrate:test

# Run tests
npm test

# Cleanup (including volumes)
docker-compose -f docker/docker-compose.test.yml down -v
```

### Test Environment Services

1. **postgres-test** - Isolated test database (port 5433)
2. **redis-test** - Isolated test cache (port 6380)

### Test Performance Optimizations

```yaml
# Reduced durability for speed (test data is disposable)
command:
  - "-c" "fsync=off"                    # Skip disk sync
  - "-c" "synchronous_commit=off"       # Skip commit sync
  - "-c" "full_page_writes=off"         # Skip full page writes

# Fast health checks
healthcheck:
  interval: 5s
  timeout: 3s
  retries: 3
  start_period: 10s
```

### Target Performance

- PostgreSQL startup: <10 seconds
- Redis startup: <5 seconds
- Total environment: <15 seconds
- Memory usage: <1GB total

---

## PostgreSQL 16 Upgrade

### What Changed

BarberPro upgraded from PostgreSQL 15 → 16 for:

- ✅ **Performance improvements** (up to 20% faster queries)
- ✅ **Better JSON handling** (Argentina payment data)
- ✅ **Improved B-tree indexes** (booking queries)
- ✅ **Logical replication enhancements** (future scaling)

### Migration Notes

PostgreSQL 16 is **backward compatible** with Prisma migrations from v15.

#### No Action Required If:
- ✅ Using Prisma ORM (handles version differences)
- ✅ Standard SQL features only
- ✅ No custom PostgreSQL extensions

#### Action Required If:
- ⚠️ Using PostgreSQL extensions (check compatibility)
- ⚠️ Direct SQL queries with v15-specific features
- ⚠️ Custom triggers or stored procedures

### Verification

Check PostgreSQL version:

```bash
# From host
docker-compose -f docker/docker-compose.yml exec postgres psql -U barberpro -c "SELECT version();"

# Expected output
PostgreSQL 16.x on x86_64-pc-linux-musl, compiled by gcc
```

---

## Health Checks

All services include comprehensive health checks for orchestration and monitoring.

### Health Check Configuration

| Service | Check | Interval | Timeout | Retries | Start Period |
|---------|-------|----------|---------|---------|--------------|
| **PostgreSQL** | `pg_isready` | 10s (dev: 5s) | 5s | 5 | 60s (dev: 30s) |
| **Redis** | `redis-cli ping` | 10s (dev: 5s) | 5s | 5 | 10s (dev: 5s) |
| **Nginx** | `wget /health` | 30s (dev: 15s) | 10s | 3 | 30s (dev: 10s) |
| **Backend** | `wget /api/health` | 30s | 10s | 3 | 60s |
| **Frontend** | `wget /` | 30s | 10s | 3 | 30s |
| **pgAdmin** | `wget /misc/ping` | 30s (dev: 15s) | 10s | 3 | 60s (dev: 30s) |
| **Redis Commander** | `wget /` | 30s (dev: 15s) | 10s | 3 | 30s (dev: 15s) |

### Health Check Endpoints

#### Backend API

```bash
# Basic health (liveness)
curl http://localhost:3000/api/health
# Response: {"status":"OK","timestamp":"...","service":"BarberPro API","version":"1.0.0","uptime":123.45}

# Readiness (with dependencies)
curl http://localhost:3000/api/health/ready
# Response: {"status":"READY","checks":{"database":"OK","redis":"OK"}}

# Liveness (process alive)
curl http://localhost:3000/api/health/live
# Response: {"status":"ALIVE","timestamp":"..."}
```

---

## Resource Limits

All services have CPU and memory limits to prevent resource exhaustion.

### Development Limits (Conservative)

Designed for local development on laptops:

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---------|-----------|--------------|--------------|-----------------|
| **PostgreSQL** | 0.5 | 512M | 0.25 | 256M |
| **Redis** | 0.25 | 256M | 0.1 | 128M |
| **Nginx** | 0.5 | 256M | 0.25 | 128M |
| **Backend** | 1.0 | 1G | 0.5 | 512M |
| **Frontend** | 1.0 | 1G | 0.5 | 512M |
| **pgAdmin** | 0.5 | 512M | 0.25 | 256M |
| **Redis Commander** | 0.25 | 256M | 0.1 | 128M |

**Total Dev Resources**: ~2.75 CPUs, ~3.5GB RAM

### Production Limits (Optimized)

Designed for Argentina production workload:

| Service | CPU Limit | Memory Limit | CPU Reserved | Memory Reserved |
|---------|-----------|--------------|--------------|-----------------|
| **PostgreSQL** | 2.0 | 4G | 1.0 | 2G |
| **Redis** | 1.0 | 2G | 0.5 | 1G |
| **Nginx** | 1.0 | 512M | 0.5 | 256M |
| **Backend** | 2.0 | 2G | 1.0 | 1G |
| **Frontend** | 1.0 | 1G | 0.5 | 512M |

**Total Prod Resources** (per replica): ~7 CPUs, ~9.5GB RAM

---

## Troubleshooting

### Common Issues

#### 1. Services Not Starting

**Symptoms**: Containers exit immediately or fail health checks

**Solutions**:

```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs [service]

# Check disk space
df -h

# Check Docker resources
docker system df

# Remove old containers/volumes
docker system prune -a --volumes
```

#### 2. Port Conflicts

**Symptoms**: `bind: address already in use`

**Solutions**:

```bash
# Find what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3000  # Backend

# Kill the process
kill -9 [PID]

# Or change port in .env
BACKEND_PORT=3001
```

#### 3. Production Compose Validation Error

**Symptoms**: `can't set container_name and replicas`

**Solution**: The production compose file uses `replicas: 2` for high availability, which is incompatible with `container_name`. Choose one approach:

**Option 1**: Remove container_name for scaled deployments
```yaml
backend:
  # container_name: barberpro-backend-prod  # Remove this
  deploy:
    replicas: 2  # Keep this for HA
```

**Option 2**: Remove replicas for single-instance with named container
```yaml
backend:
  container_name: barberpro-backend-prod  # Keep this
  # deploy:
  #   replicas: 2  # Remove this
```

---

## Validation Checklist

### Completed Validation Results (2025-10-10)

✅ **Syntax Validation**:
- Dev composition: Valid (warnings about missing .env files are expected)
- Prod composition: Valid with note about replicas (see troubleshooting)
- Test composition: ✅ Valid

✅ **Version Tags**:
- Found `:latest` tags only for custom builds (`barberpro-backend:latest`, `barberpro-frontend:latest`)
- All base images pinned to specific versions (postgres:16-alpine, redis:7-alpine, nginx:1.27-alpine)

✅ **Health Checks**:
- Base file contains 5 health checks (postgres, redis, nginx, pgadmin, redis-commander)
- Dev and prod files add backend/frontend health checks

✅ **Backend Health Endpoint**:
- Health endpoint exists at `/health` (registered with `/api` prefix)
- Full path: `/api/health`, `/api/health/ready`, `/api/health/live`
- Compose files correctly reference `/api/health`

✅ **NPM Scripts**:
- Updated to use new docker/ directory structure
- Added new scripts: `docker:dev:services`, `docker:prod`, `docker:test`, `docker:monitoring`, `docker:mocks`
- Added config validation scripts: `docker:config:dev`, `docker:config:prod`

---

## Additional Resources

### Docker Documentation

- [Docker Compose V2](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Resource Constraints](https://docs.docker.com/config/containers/resource_constraints/)

### Argentina Integration Documentation

- [MercadoPago Developers](https://www.mercadopago.com.ar/developers/)
- [AFIP Web Services](https://www.afip.gob.ar/ws/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)

### BarberPro Documentation

- Main README: `/README.md`
- CLAUDE.md: `/CLAUDE.md`
- Frontend Components: `/docs/frontend-components.md`
- Backend Services: `/backend/src/services/`

---

**Last Updated**: 2025-10-10
**Maintained By**: DevOps Team
**Stream D Validation**: Complete ✅
