# Contract: docker-compose.dev.yml Specification

**Feature**: 001-docker-dev-hotreload
**Contract Type**: Docker Compose Development Orchestration
**Version**: 1.0.0
**Date**: 2025-10-25

## Purpose

This contract defines the requirements for the `docker/docker-compose.dev.yml` file that orchestrates all development services for the BarberPro project. This configuration MUST enable hot reload, data persistence, health monitoring, and cross-platform compatibility.

---

## File Structure

```yaml
version: '3.8'

env_file:
  - ../.env  # Root environment variables

services:
  # Infrastructure services
  postgres: {...}
  redis: {...}

  # Application services
  backend: {...}
  frontend: {...}

  # Admin tools
  pgadmin: {...}
  redis-commander: {...}

volumes:
  postgres_dev_data: {...}
  redis_dev_data: {...}
  pgadmin_dev_data: {...}

networks:
  barberpro-dev-network: {...}
```

---

## Service Contracts

### 1. PostgreSQL Database Service

```yaml
postgres:
  image: postgres:15-alpine
  container_name: barberpro-postgres-dev
  environment:
    POSTGRES_DB: ${POSTGRES_DB:-barberpro_dev}
    POSTGRES_USER: ${POSTGRES_USER:-barberpro}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-barberpro_dev_password}
    PGDATA: /var/lib/postgresql/data/pgdata
  ports:
    - "5432:5432"
  volumes:
    - postgres_dev_data:/var/lib/postgresql/data
    - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
  networks:
    - barberpro-dev-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-barberpro} -d ${POSTGRES_DB:-barberpro_dev}"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST use postgres:15-alpine for consistency
- ✅ MUST expose port 5432 for host access
- ✅ MUST use named volume for data persistence
- ✅ MUST mount init-db.sql as read-only
- ✅ MUST provide health check with pg_isready
- ✅ MUST use environment variable defaults

---

### 2. Redis Cache Service

```yaml
redis:
  image: redis:7-alpine
  container_name: barberpro-redis-dev
  ports:
    - "6379:6379"
  volumes:
    - redis_dev_data:/data
    - ../docker/configs/redis.conf:/usr/local/etc/redis/redis.conf:ro
  command: redis-server /usr/local/etc/redis/redis.conf
  networks:
    - barberpro-dev-network
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST use redis:7-alpine
- ✅ MUST expose port 6379
- ✅ MUST persist data with named volume
- ✅ MUST use custom redis.conf
- ✅ MUST health check with PING command

---

### 3. Backend API Service

```yaml
backend:
  build:
    context: ../backend
    dockerfile: Dockerfile.dev
    target: development
  container_name: barberpro-backend-dev
  env_file:
    - ../backend/.env
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER:-barberpro}:${POSTGRES_PASSWORD:-barberpro_dev_password}@postgres:5432/${POSTGRES_DB:-barberpro_dev}
    REDIS_URL: redis://redis:6379
    NODE_ENV: development
  ports:
    - "3000:3000"
  volumes:
    - ../backend:/app                    # Source code bind mount
    - /app/node_modules                  # Isolate node_modules
    - /app/dist                          # Isolate build artifacts
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - barberpro-dev-network
  healthcheck:
    test: ["CMD", "wget", "--spider", "--quiet", "http://localhost:3000/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST build from Dockerfile.dev with development target
- ✅ MUST override DATABASE_URL for Docker network (postgres:5432 not localhost)
- ✅ MUST override REDIS_URL for Docker network (redis:6379 not localhost)
- ✅ MUST bind mount source code for hot reload
- ✅ MUST use anonymous volumes for node_modules and dist
- ✅ MUST wait for postgres and redis healthy state
- ✅ MUST have start_period of 60s for initial migration
- ✅ MUST expose port 3000

**Hot Reload Mechanism**:
- Source code changes trigger tsx watch restart
- Restart time: <3 seconds
- Database connections preserved

---

### 4. Frontend Service

```yaml
frontend:
  build:
    context: ../frontend
    dockerfile: Dockerfile.dev
    target: development
  container_name: barberpro-frontend-dev
  env_file:
    - ../frontend/.env
  environment:
    NODE_ENV: development
  ports:
    - "5173:5173"
  volumes:
    - ../frontend:/app                   # Source code bind mount
    - /app/node_modules                  # Isolate node_modules
    - /app/.svelte-kit                   # Isolate SvelteKit cache
    - /app/build                         # Isolate build directory
  depends_on:
    backend:
      condition: service_healthy
  networks:
    - barberpro-dev-network
  healthcheck:
    test: ["CMD", "wget", "--spider", "--quiet", "http://localhost:5173"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST build from Dockerfile.dev with development target
- ✅ MUST bind mount source code for hot reload
- ✅ MUST isolate node_modules, .svelte-kit, and build
- ✅ MUST wait for backend healthy state
- ✅ MUST expose port 5173
- ✅ MUST have start_period of 30s

**Hot Reload Mechanism**:
- Vite HMR automatically enabled
- Browser refresh time: <2 seconds
- Application state preserved when possible

---

### 5. pgAdmin Service

```yaml
pgadmin:
  image: dpage/pgadmin4:7
  container_name: barberpro-pgadmin-dev
  environment:
    PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
    PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    PGADMIN_CONFIG_SERVER_MODE: 'False'
  ports:
    - "8080:80"
  volumes:
    - pgadmin_dev_data:/var/lib/pgadmin
  depends_on:
    - postgres
  networks:
    - barberpro-dev-network
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST use dpage/pgadmin4:7
- ✅ MUST validate PGADMIN_DEFAULT_EMAIL is proper email format
- ✅ MUST expose on port 8080
- ✅ MUST persist configuration data
- ✅ MUST wait for postgres service

**Critical Fix**:
- Root `.env` MUST have valid email: `PGADMIN_DEFAULT_EMAIL=admin@barberpro.com` (not .local)

---

### 6. Redis Commander Service

```yaml
redis-commander:
  image: rediscommander/redis-commander:latest
  container_name: barberpro-redis-commander-dev
  environment:
    REDIS_HOSTS: local:redis:6379
    HTTP_USER: ${REDIS_COMMANDER_USER}
    HTTP_PASSWORD: ${REDIS_COMMANDER_PASSWORD}
  ports:
    - "8081:8081"
  depends_on:
    - redis
  networks:
    - barberpro-dev-network
  restart: unless-stopped
```

**Requirements**:
- ✅ MUST connect to redis service via service name
- ✅ MUST expose on port 8081
- ✅ MUST use HTTP basic auth

---

## Volume Contracts

### Named Volumes

```yaml
volumes:
  postgres_dev_data:
    driver: local
  redis_dev_data:
    driver: local
  pgadmin_dev_data:
    driver: local
```

**Requirements**:
- ✅ MUST use local driver
- ✅ MUST persist across container restarts
- ✅ MUST be destroyed only with `docker-compose down -v`

### Bind Mounts

```yaml
volumes:
  - ../backend:/app                    # Host : Container
  - ../frontend:/app
```

**Requirements**:
- ✅ MUST use relative paths from docker/ directory
- ✅ MUST be read-write by default
- ✅ MUST reflect host changes immediately

### Anonymous Volumes

```yaml
volumes:
  - /app/node_modules                  # No host mapping
```

**Requirements**:
- ✅ MUST prevent host node_modules conflicts
- ✅ MUST be container-specific
- ✅ MUST be destroyed on container removal

---

## Network Contract

```yaml
networks:
  barberpro-dev-network:
    driver: bridge
```

**Requirements**:
- ✅ MUST use bridge driver for container isolation
- ✅ MUST enable service name DNS resolution
- ✅ MUST allow published ports for host access

**DNS Resolution**:
- `postgres:5432` resolves to postgres container
- `redis:6379` resolves to redis container
- `backend:3000` resolves to backend container

---

## Dependency Graph Contract

```
postgres (healthy) ──┐
                     ├──> backend (healthy) ──> frontend
redis (healthy) ─────┘

postgres (started) ──> pgadmin
redis (started) ─────> redis-commander
```

**Requirements**:
- ✅ Backend MUST wait for postgres and redis to be `healthy`
- ✅ Frontend MUST wait for backend to be `healthy`
- ✅ Admin tools MUST wait for respective services to `start` (not healthy)

**Rationale**:
- Application services need working databases, not just started containers
- Admin tools can connect to starting databases

---

## Environment Variable Contract

### Hierarchy

1. `docker-compose.yml` inline `environment` (highest priority)
2. Service-specific `env_file` (e.g., backend/.env)
3. Root `env_file` (e.g., .env)

### Required Variables (.env)

```ini
# Database
POSTGRES_USER=barberpro
POSTGRES_PASSWORD=barberpro_dev_password
POSTGRES_DB=barberpro_dev

# Admin Tools
PGADMIN_DEFAULT_EMAIL=admin@barberpro.com       # MUST be valid email
PGADMIN_DEFAULT_PASSWORD=admin123
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin123
```

### Backend Override

```yaml
environment:
  DATABASE_URL: postgresql://...@postgres:5432/...  # Override for Docker network
  REDIS_URL: redis://redis:6379                     # Override for Docker network
```

**Why Override**:
- Backend .env has `DATABASE_URL=...@localhost:5432`
- Inside Docker, postgres is not on localhost
- Must override to use service name DNS

---

## Port Mapping Contract

| Service | Container Port | Host Port | Purpose |
|---------|---------------|-----------|---------|
| postgres | 5432 | 5432 | Database access |
| redis | 6379 | 6379 | Cache access |
| backend | 3000 | 3000 | API endpoints |
| frontend | 5173 | 5173 | Web UI |
| pgadmin | 80 | 8080 | Database admin |
| redis-commander | 8081 | 8081 | Cache admin |

**Requirements**:
- ✅ Host ports MUST NOT conflict
- ✅ Host ports MUST be available (checked by Makefile)
- ✅ Container ports MUST match application configuration

---

## Health Check Contract

### Timing Parameters

| Service | Interval | Timeout | Retries | Start Period |
|---------|----------|---------|---------|--------------|
| postgres | 10s | 5s | 5 | 0s (none) |
| redis | 10s | 5s | 5 | 0s (none) |
| backend | 30s | 10s | 3 | 60s |
| frontend | 30s | 10s | 3 | 30s |

### Health States

- `starting` - Within start_period, failures ignored
- `healthy` - Test passes consistently
- `unhealthy` - Retries exceeded

**Requirements**:
- ✅ Infrastructure services (DB, cache) have no start_period (start healthy)
- ✅ Application services have start_period for initialization
- ✅ Backend start_period accounts for Prisma migrations (60s)

---

## Restart Policy Contract

All services MUST use:

```yaml
restart: unless-stopped
```

**Behavior**:
- Container restarts automatically on failure
- Container does NOT restart after explicit `docker-compose stop`
- Container DOES restart after `docker-compose down && docker-compose up`

**Alternatives NOT Used**:
- `no` - Would not auto-recover from crashes
- `always` - Would restart even after `docker-compose stop`
- `on-failure` - Only restarts on error exit code

---

## Performance Requirements

### Startup Time

| Phase | Target | Measurement |
|-------|--------|-------------|
| Image pull (first time) | <2 minutes | `docker-compose pull` |
| Image build (first time) | <3 minutes | `docker-compose build` |
| Container start | <60 seconds | `docker-compose up` to all healthy |
| Full startup (cold) | <5 minutes | Pull + build + start |
| Warm restart | <30 seconds | After `docker-compose restart` |

### Resource Limits

```yaml
# Optional: Add to services for resource control
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

**Current Decision**: No limits for development (max performance)

---

## Cross-Platform Compatibility

### macOS-Specific

```yaml
volumes:
  - ../backend:/app:delegated  # Improves write performance
```

### Linux

No special configuration needed (best performance)

### Windows (WSL2)

**Requirements**:
- Source code MUST be in WSL2 filesystem (`/home/user/...`)
- Do NOT use `/mnt/c/...` (very slow)

---

## Testing Contract

### Validation Tests

```bash
# 1. Syntax validation
docker-compose -f docker/docker-compose.dev.yml config

# 2. Service start test
docker-compose -f docker/docker-compose.dev.yml up -d

# 3. Health check test
docker-compose -f docker/docker-compose.dev.yml ps
# All services should show (healthy)

# 4. Hot reload test (backend)
echo "// test" >> backend/src/server.ts
# Wait 3 seconds, verify backend restarted

# 5. Hot reload test (frontend)
echo "<!-- test -->" >> frontend/src/routes/+page.svelte
# Wait 2 seconds, verify browser refreshed

# 6. Data persistence test
docker-compose down
docker-compose up -d
# Verify database data still exists

# 7. Port conflict test
# Start environment, then try to start again
# Should fail with clear error message
```

---

## Error Handling Contract

### Build Failures

```yaml
# If backend build fails:
ERROR: backend service failed to build
Hint: Check backend/Dockerfile.dev and backend/package.json
```

### Startup Failures

```yaml
# If postgres fails health check:
backend service unhealthy: waiting for postgres
postgres health check failed: connection refused
Hint: Check POSTGRES_PASSWORD in .env
```

### Dependency Failures

```yaml
# If backend starts before postgres ready:
depends_on prevents this scenario
backend waits for postgres healthy state
```

---

## Compliance Checklist

Before merging docker-compose.dev.yml:

- [ ] Uses version 3.8
- [ ] All 6 services defined (postgres, redis, backend, frontend, pgadmin, redis-commander)
- [ ] All services have health checks (except admin tools)
- [ ] All services use barberpro-dev-network
- [ ] Backend and frontend use Dockerfile.dev
- [ ] Correct depends_on with service_healthy conditions
- [ ] Named volumes for data persistence
- [ ] Bind mounts for source code
- [ ] Anonymous volumes for node_modules
- [ ] Restart policy: unless-stopped
- [ ] No port conflicts
- [ ] Valid email in PGADMIN_DEFAULT_EMAIL
- [ ] DATABASE_URL and REDIS_URL overridden for backend
- [ ] All ports exposed to host
- [ ] File passes `docker-compose config` validation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial contract specification |

**Status**: ✅ Contract approved for implementation
