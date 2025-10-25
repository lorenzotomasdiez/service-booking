# Data Model: Docker Development Environment Configuration

**Feature**: 001-docker-dev-hotreload
**Phase**: 1 - Design
**Date**: 2025-10-25

## Overview

This document defines the configuration structures, file formats, and data relationships for the Docker development environment. Unlike traditional data models with database entities, this feature's "data" consists of configuration files, environment variables, and orchestration definitions.

---

## 1. Docker Compose Service Definition

### Structure

```yaml
services:
  <service-name>:
    container_name: string              # Unique container identifier
    build:
      context: path                     # Build context directory
      dockerfile: filename              # Dockerfile to use
      target: string                    # Multi-stage build target
    image: string                       # Base or built image name
    ports:
      - "host:container"               # Port mappings
    volumes:
      - "source:destination:mode"      # Volume mounts
    environment:
      KEY: value                       # Environment variables
    env_file:
      - path                           # External env file
    depends_on:
      service:
        condition: health_state        # Dependency conditions
    healthcheck:
      test: [command]                  # Health check command
      interval: duration               # Check frequency
      timeout: duration                # Check timeout
      retries: number                  # Retry count
      start_period: duration           # Grace period
    networks:
      - network_name                   # Network attachment
    restart: policy                    # Restart policy
```

### Validation Rules

- `container_name` MUST be unique across all docker-compose files
- `ports` MUST NOT conflict with host system ports
- `volumes` source paths MUST exist or be creatable
- `depends_on.condition` MUST be one of: `service_started`, `service_healthy`, `service_completed_successfully`
- `healthcheck.interval` MUST be ≥ `healthcheck.timeout`
- `restart` MUST be one of: `no`, `always`, `on-failure`, `unless-stopped`

---

## 2. Environment Configuration Hierarchy

### Root .env (Service Infrastructure)

```ini
# Database Service
POSTGRES_USER=string              # PostgreSQL username
POSTGRES_PASSWORD=string          # PostgreSQL password (minimum 8 chars)
POSTGRES_DB=string               # Database name

# Admin Tools
PGADMIN_DEFAULT_EMAIL=email      # Valid email format required
PGADMIN_DEFAULT_PASSWORD=string  # Minimum 8 characters
REDIS_COMMANDER_USER=string      # Redis UI username
REDIS_COMMANDER_PASSWORD=string  # Redis UI password (minimum 8 chars)
```

**Validation**:
- `PGADMIN_DEFAULT_EMAIL` MUST match regex: `^[\w\.-]+@[\w\.-]+\.\w+$`
- All passwords MUST be ≥8 characters
- No spaces in usernames or database names

### Backend .env (Application Config)

```ini
# Runtime
NODE_ENV=development|production|test

# Database Connection
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis Connection
REDIS_URL=redis://host:port

# API Configuration
PORT=number                      # 1024-65535
API_BASE_URL=url                # Must start with http:// or https://
LOG_LEVEL=trace|debug|info|warn|error

# Authentication
JWT_SECRET=string               # Minimum 32 characters
JWT_EXPIRES_IN=duration        # e.g., "7d", "24h"

# Argentina-Specific
TIMEZONE=string                # IANA timezone
LOCALE=string                  # ISO locale (es-AR)
CURRENCY=string                # ISO currency code (ARS)

# Features
ENABLE_SWAGGER=boolean         # true|false
```

**Validation**:
- `PORT` MUST be integer between 1024-65535
- `DATABASE_URL` MUST follow PostgreSQL connection string format
- `JWT_SECRET` MUST be ≥32 characters for security
- `TIMEZONE` MUST be valid IANA timezone identifier

### Frontend .env (Public Config)

```ini
# API Endpoints (exposed to browser)
PUBLIC_API_URL=url              # Backend API base URL
PUBLIC_SOCKET_URL=url           # WebSocket server URL

# Application
PUBLIC_APP_NAME=string
PUBLIC_APP_VERSION=semver

# Localization
PUBLIC_TIMEZONE=string          # IANA timezone
PUBLIC_LOCALE=string            # ISO locale
PUBLIC_CURRENCY=string          # ISO currency code

# Features
PUBLIC_ENABLE_SOCIAL_LOGIN=boolean
PUBLIC_ENABLE_WHATSAPP_SUPPORT=boolean
```

**Validation**:
- All PUBLIC_* variables MUST be safe for browser exposure
- NO secrets or API keys in frontend .env
- `PUBLIC_APP_VERSION` MUST follow semver format

---

## 3. Dockerfile Configuration Structure

### Multi-Stage Dockerfile Schema

```dockerfile
# Stage 1: Base (shared)
FROM node:${NODE_VERSION}-alpine AS base
ARG NODE_VERSION=20             # Parameterized version
WORKDIR /app                    # Working directory
COPY package*.json ./           # Dependency manifests

# Stage 2: Development
FROM base AS development
ENV NODE_ENV=development
RUN npm install                 # Include devDependencies
COPY . .                        # Copy all source
EXPOSE ${PORT}                  # Runtime port
CMD ["tsx", "watch", "src/server.ts"]

# Stage 3: Production
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production    # Production dependencies only
COPY src ./src                  # Source only
RUN npm run build               # Compile TypeScript
EXPOSE ${PORT}
CMD ["node", "dist/server.js"]
```

### Build Arguments

| Argument | Default | Purpose |
|----------|---------|---------|
| NODE_VERSION | 20 | Node.js version |
| PORT | 3000 (backend), 5173 (frontend) | Application port |

### File Exclusions (.dockerignore)

```
node_modules/
dist/
build/
.git/
.env*
*.log
coverage/
.DS_Store
*.md
!README.md
```

**Rules**:
- Exclude `node_modules/` to prevent host conflicts
- Exclude build artifacts (`dist/`, `build/`)
- Exclude version control (`.git/`)
- Exclude environment files (`.env*`) - use docker-compose env injection
- Include README.md for container documentation

---

## 4. Volume Configuration

### Volume Types

```yaml
volumes:
  # Named Volumes (persistent data)
  postgres-data:
    driver: local

  redis-data:
    driver: local

  backend-dist:
    driver: local

  # Bind Mounts (source code)
  - ./backend:/app              # Host path : Container path
  - ./frontend:/app

  # Anonymous Volumes (isolation)
  - /app/node_modules           # No host mapping
  - /app/dist
  - /app/.svelte-kit
```

### Volume Mapping Rules

| Source Type | Use Case | Persistence | Performance |
|-------------|----------|-------------|-------------|
| Named volume | Database data, build artifacts | Survives container deletion | Fast |
| Bind mount | Source code | Reflects host changes | Slower on macOS |
| Anonymous volume | node_modules isolation | Lost on container deletion | Fast |

**Best Practices**:
- Use **named volumes** for data that must persist (databases)
- Use **bind mounts** for source code that changes frequently
- Use **anonymous volumes** to isolate dependencies from host

---

## 5. Network Configuration

### Network Definition

```yaml
networks:
  barberpro-dev-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16   # Optional: explicit subnet
```

### Service Network Configuration

```yaml
services:
  postgres:
    networks:
      - barberpro-dev-network
    # Accessible via: postgres:5432 from other containers

  backend:
    networks:
      - barberpro-dev-network
    # Accessible via: backend:3000 from other containers
```

**DNS Resolution**:
- Containers can reference each other by service name
- Example: Backend connects to `postgres:5432` instead of `localhost:5432`
- External access uses published ports: `localhost:5432`

---

## 6. Health Check Configuration

### Health Check Schema

```yaml
healthcheck:
  test: [command, arg1, arg2, ...]  # Health check command
  interval: duration                # How often to check (e.g., "10s")
  timeout: duration                 # Max time to wait (e.g., "5s")
  retries: integer                  # Failures before unhealthy (e.g., 5)
  start_period: duration            # Grace period (e.g., "30s")
```

### Health Check Commands by Service

| Service | Test Command | Interval | Timeout | Retries | Start Period |
|---------|-------------|----------|---------|---------|--------------|
| postgres | `pg_isready -U barberpro -d barberpro_dev` | 10s | 5s | 5 | 10s |
| redis | `redis-cli ping` | 10s | 5s | 5 | 10s |
| backend | `wget --spider http://localhost:3000/api/health` | 30s | 10s | 3 | 60s |
| frontend | `wget --spider http://localhost:5173` | 30s | 10s | 3 | 30s |

**Health States**:
- `starting` - Within start_period, failures don't count
- `healthy` - Consecutive successes reached
- `unhealthy` - Consecutive failures exceeded retries

---

## 7. Service Dependency Graph

```
┌─────────────┐
│  postgres   │◄─────────┐
└─────────────┘          │
                         │
┌─────────────┐          │  depends_on
│    redis    │◄─────────┤  (healthy)
└─────────────┘          │
                         │
                    ┌────┴────┐
                    │ backend │
                    └────┬────┘
                         │
                         │  depends_on
                         │  (healthy)
                         │
                    ┌────▼────┐
                    │frontend │
                    └─────────┘

┌─────────────┐
│  pgadmin    │◄──── postgres (started)
└─────────────┘

┌─────────────┐
│redis-cmd    │◄──── redis (started)
└─────────────┘
```

**Startup Order**:
1. postgres, redis (parallel)
2. Wait for postgres + redis healthy
3. backend starts
4. Wait for backend healthy
5. frontend starts
6. pgadmin, redis-commander (parallel, after DB services)

---

## 8. Configuration Validation Schema

### Pre-Flight Checks (Makefile)

```yaml
checks:
  docker_daemon:
    command: docker info
    error: "Docker daemon not running"

  ports:
    - port: 5432
      service: PostgreSQL
      check: lsof -ti:5432
    - port: 6379
      service: Redis
      check: lsof -ti:6379
    - port: 3000
      service: Backend
      check: lsof -ti:3000
    - port: 5173
      service: Frontend
      check: lsof -ti:5173

  disk_space:
    minimum: 10GB
    command: df -h

  memory:
    minimum: 8GB
    command: free -h  # Linux
    command: vm_stat  # macOS
```

---

## 9. Makefile Command Structure

### Command Schema

```makefile
command-name: dependencies ## Help text description
    @echo "Status message"
    @$(PREREQUISITE_CHECK)
    @$(DOCKER_COMPOSE) $(COMPOSE_FLAGS) action
    @echo "Success message"
```

### Key Commands

| Command | Dependencies | Action | Output |
|---------|-------------|--------|--------|
| `dev-infra-only` | check-docker, check-ports | Start postgres, redis only | Service URLs |
| `dev` | check-docker, check-ports | Start all containers | Service status |
| `down` | none | Stop all containers | Confirmation |
| `logs` | none | Stream container logs | Color-coded logs |
| `reset` | confirmation | Drop DB, migrate, seed | New state |
| `doctor` | none | Validate environment | Health report |

---

## 10. File Relationships

```
.env ──────────┬──────────────┬─────────────┐
               │              │             │
               ▼              ▼             ▼
          postgres        redis        pgadmin
               │              │
               └──────┬───────┘
                      │
backend/.env ─────────┼────────► backend container
                      │              │
                      │              ├──► DATABASE_URL
                      │              └──► REDIS_URL
                      │
frontend/.env ────────┼────────► frontend container
                      │              │
                      │              └──► PUBLIC_API_URL
                      │
docker-compose.dev.yml├────────► Service orchestration
                      │              │
Makefile ─────────────┴────────► Command wrappers
                                     │
                                     └──► User interface
```

---

## Data Integrity Rules

1. **Environment Variable Overrides**:
   - docker-compose.yml environment > env_file > .env
   - Never store secrets in docker-compose.yml (use .env)

2. **Volume Persistence**:
   - Named volumes survive `docker-compose down`
   - Use `docker-compose down -v` to destroy volumes
   - Bind mounts are never affected by Docker commands

3. **Network Isolation**:
   - Services in same network can communicate
   - Published ports allow external access
   - Unpublished ports are only internal

4. **Health Check Dependencies**:
   - Dependent service waits for healthy state
   - Unhealthy services trigger dependent restarts
   - start_period prevents premature unhealthy status

---

## Next Steps

- **Phase 1**: Create contracts for Dockerfile and docker-compose specifications
- **Phase 1**: Generate quickstart.md with configuration examples
- **Phase 2**: Generate tasks.md for implementation

**Status**: ✅ Data model complete. Configuration structures defined. Ready for contract creation.
