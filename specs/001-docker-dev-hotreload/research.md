# Research: Docker Development Environment with Hot Reload

**Feature**: 001-docker-dev-hotreload
**Phase**: 0 - Research & Technology Decisions
**Date**: 2025-10-25

## Executive Summary

This research phase evaluates technology choices and implementation patterns for creating a fully dockerized development environment with hot reload capabilities. All decisions prioritize developer productivity, cross-platform compatibility, and minimal configuration complexity.

---

## 1. Backend Hot Reload Strategy

### Decision: tsx with watch mode

**Rationale**:
- Already in dependencies (`tsx@4.20.5`)
- Native TypeScript execution without compilation step
- Built-in watch mode with fast restart
- Preserves module context and database connections better than nodemon
- Single binary, no additional dependencies

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| nodemon + ts-node | Industry standard | Slower restarts, requires compilation | tsx is faster and already present |
| ts-node-dev | Fast restarts | Deprecated, maintenance concerns | Project is no longer actively maintained |
| Native tsc --watch + node | Official TypeScript | Two-step process, slower | Adds complexity, slower than tsx |
| swc + nodemon | Fastest compilation | Additional dependency, build step | Over-engineered for dev environment |

**Implementation Pattern**:
```bash
tsx watch --clear-screen=false src/server.ts
```

**Expected Performance**: <3 second restart on file change

---

## 2. Frontend Hot Reload Strategy

### Decision: Vite HMR (Hot Module Replacement)

**Rationale**:
- SvelteKit uses Vite by default
- Native HMR support with state preservation
- Already configured in existing `vite.config.ts`
- Sub-second refresh times
- No additional configuration needed

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Webpack HMR | Mature ecosystem | Slower, deprecated by SvelteKit | SvelteKit uses Vite |
| Browser-sync | Simple | Full page reload, no state preservation | Worse developer experience |
| LiveReload | Lightweight | No HMR, just reload | State loss on every change |

**Implementation Pattern**:
- Use Vite's built-in dev server
- Configure network host for Docker access: `server.host: '0.0.0.0'`
- Enable HMR in Vite config

**Expected Performance**: <2 second browser refresh with state preservation

---

## 3. Docker Volume Strategy

### Decision: Bind mounts for source code + Named volumes for data

**Rationale**:
- **Bind mounts** for `/app` directories enable real-time code sync
- **Named volumes** for `/app/node_modules` prevent host/container conflicts
- **Named volumes** for PostgreSQL and Redis data ensure persistence
- Cross-platform compatibility (macOS, Linux, Windows)

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Only bind mounts | Simplest | node_modules conflicts, performance issues on macOS | Known performance problems |
| Docker copy (no mount) | Fast container performance | No hot reload possible | Defeats purpose of dev environment |
| Sync tools (mutagen, docker-sync) | Better macOS performance | Additional tools, complexity | Over-engineered, modern Docker is fast enough |

**Implementation Pattern**:
```yaml
volumes:
  - ./backend:/app                    # Source code bind mount
  - /app/node_modules                 # Anonymous volume for isolation
  - backend-dist:/app/dist            # Named volume for build artifacts
  - postgres-data:/var/lib/postgresql/data  # Database persistence
```

**Performance Notes**:
- On macOS: Use delegated mount option for performance (`delegated` flag)
- On Linux: Native performance, no special configuration
- On Windows (WSL2): Keep source in WSL2 filesystem for performance

---

## 4. Dockerfile Optimization for Development

### Decision: Multi-stage Dockerfile with development target

**Rationale**:
- Separate `development` and `production` stages in same file
- Development stage includes dev dependencies and debugging tools
- Shared base layers reduce image size
- Single source of truth for environment setup

**Pattern**:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install  # Includes devDependencies
COPY . .
CMD ["tsx", "watch", "src/server.ts"]

FROM base AS production
RUN npm ci --only=production
COPY src ./src
RUN npm run build
CMD ["node", "dist/server.js"]
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Separate Dockerfiles | Clear separation | Duplication, maintenance burden | Violates DRY principle |
| Single stage (dev only) | Simplest | Can't build production image | Need both environments |
| BuildKit syntax only | Modern features | Requires Docker 18.09+ | Acceptable requirement |

---

## 5. Node Modules Synchronization

### Decision: Anonymous volume + separate npm install in container

**Rationale**:
- Prevents host/container architecture conflicts (arm64 vs amd64)
- Container manages its own node_modules independently
- Host can have different node_modules for IDE support
- No synchronization issues between platforms

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Shared node_modules | Single copy | Platform conflicts, symlink issues | Fails on multi-arch teams |
| Package managers cache | Faster installs | Complex configuration | Not worth complexity |
| Pre-built images | Fastest startup | Large images, hard to update | Slows iteration |

**Implementation**:
- Add `/app/node_modules` as anonymous volume in docker-compose
- Add `node_modules/` to `.dockerignore`
- Container runs `npm install` during build

---

## 6. Database Migration Strategy

### Decision: Prisma migrate deploy on container startup

**Rationale**:
- Existing project uses Prisma for migrations
- `prisma migrate deploy` applies pending migrations automatically
- Runs on container startup via entrypoint script
- Idempotent operation (safe to run multiple times)

**Implementation Pattern**:
```dockerfile
# In backend Dockerfile.dev
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# docker-entrypoint.sh
#!/bin/sh
npx prisma migrate deploy
exec "$@"  # Run CMD
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Manual migration command | More control | Developers forget to run it | Poor developer experience |
| Migration container (separate service) | Clean separation | Additional complexity | Over-engineered |
| Wait-for-it + migration | Standard pattern | Race conditions | Entrypoint is more reliable |

---

## 7. Service Health Checks

### Decision: Docker native healthcheck with application endpoints

**Rationale**:
- Docker Compose natively supports `healthcheck` directive
- Application can provide `/health` endpoint
- Prevents dependent services from starting until ready
- No external health check tools needed

**Implementation Pattern**:
```yaml
backend:
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3000/api/health"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
  depends_on:
    postgres:
      condition: service_healthy
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| wait-for-it script | Flexible | Extra dependency, doesn't verify app health | Native Docker is better |
| dockerize tool | Feature-rich | Additional binary | Over-engineered |
| No health checks | Simplest | Services may not be ready | Poor reliability |

---

## 8. Port Conflict Detection

### Decision: Makefile pre-flight checks using lsof

**Rationale**:
- Detects conflicts before Docker starts
- Provides helpful error messages
- Cross-platform compatible (macOS/Linux)
- Existing Makefile already has `check-ports` function

**Implementation**:
```makefile
check-ports:
    @if lsof -ti:5432 > /dev/null 2>&1; then \
        echo "Port 5432 in use"; \
        exit 1; \
    fi
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Docker error handling | No extra code | Poor error messages | Bad developer experience |
| netstat | Cross-platform | Different syntax per OS | lsof is more consistent |
| Let Docker fail | Simplest | Cryptic errors | Confusing for developers |

---

## 9. Environment Configuration

### Decision: Hierarchical .env files with docker-compose env_file

**Rationale**:
- Existing pattern: `.env` (root), `backend/.env`, `frontend/.env`
- Docker Compose loads root `.env` automatically
- Services load their specific configs via `env_file` directive
- Clear separation of concerns

**Structure**:
```
.env                  # Service credentials (POSTGRES_PASSWORD, etc.)
backend/.env          # Backend-specific (JWT_SECRET, DATABASE_URL)
frontend/.env         # Frontend-specific (PUBLIC_API_URL)
```

**Current Issue to Fix**:
- pgAdmin email validation: Change `admin@barberpro.local` → `admin@barberpro.com`

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Single .env file | Simplest | Mixing concerns | Hard to maintain |
| docker-compose.override.yml | Standard pattern | Less explicit | Harder for developers to find |
| Environment variables only | Cloud-native | Hard to manage locally | Poor local dev experience |

---

## 10. Log Aggregation

### Decision: docker-compose logs with --follow and color

**Rationale**:
- Native Docker Compose functionality
- No additional tools needed
- Color-coded output per service
- Existing Makefile has `logs` command

**Implementation**:
```makefile
logs:
    docker-compose logs -f --tail=100 --timestamps
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| ELK stack | Production-grade | Heavy, complex setup | Over-engineered for dev |
| Grafana Loki | Modern, efficient | Additional services | Too complex |
| stern (Kubernetes) | Powerful | Requires Kubernetes | Not using K8s locally |

---

## 11. Cross-Platform Compatibility

### Decision: Platform-specific optimizations in Makefile

**Rationale**:
- Detect OS using `uname -s`
- Provide platform-specific guidance in error messages
- Use consistent Docker Compose syntax across platforms

**Implementation**:
```makefile
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    OS := macOS
    OPEN := open
endif
ifeq ($(UNAME_S),Linux)
    OS := Linux
    OPEN := xdg-open
endif
```

**Platform-Specific Notes**:
- **macOS**: Use `:delegated` mount option for performance
- **Linux**: Native Docker, best performance
- **Windows**: Must use WSL2, keep files in WSL filesystem

---

## 12. Startup Orchestration

### Decision: Enhanced docker-compose.dev.yml with service dependencies

**Rationale**:
- Use `depends_on` with `condition: service_healthy`
- Ensures services start in correct order
- Backend waits for PostgreSQL and Redis to be healthy
- Frontend waits for backend API availability

**Implementation**:
```yaml
backend:
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

frontend:
  depends_on:
    backend:
      condition: service_healthy
```

**Alternatives Considered**:

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Sequential startup script | Full control | Race conditions | Docker Compose is more reliable |
| Kubernetes-style init containers | Cloud-native | Over-engineered | Not needed for local dev |
| Retry loops in code | Self-healing | Slower startup | Docker does this better |

---

## Implementation Checklist

Based on research decisions, implementation requires:

- [ ] **Backend Dockerfile.dev**: Node 20 alpine, tsx watch mode, prisma entrypoint
- [ ] **Frontend Dockerfile.dev**: Node 20 alpine, Vite dev server with HMR
- [ ] **docker-compose.dev.yml**: Service definitions with health checks and dependencies
- [ ] **.dockerignore files**: Exclude node_modules, dist, .git
- [ ] **Makefile updates**: Enhanced dev, dev-infra-only, and reset commands
- [ ] **.env fixes**: Correct pgAdmin email validation issue
- [ ] **vite.config.ts**: Network host configuration for Docker
- [ ] **Backend entrypoint**: Prisma migration on startup
- [ ] **Health endpoints**: Ensure backend /api/health exists
- [ ] **Documentation**: Update docker/README.md and root README.md

---

## Performance Expectations

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Environment startup | <5 minutes | Time from `make up` to all services healthy |
| Backend hot reload | <3 seconds | Time from file save to server restart |
| Frontend hot reload | <2 seconds | Time from file save to browser update |
| Memory usage | <4GB | `docker stats` all containers |
| Database migration | <10 seconds | Time for `prisma migrate deploy` |
| Environment reset | <30 seconds | Time for `make reset` command |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Port conflicts | Pre-flight checks in Makefile |
| Out of disk space | Check in `make doctor` command |
| node_modules conflicts | Use anonymous volumes |
| Migration failures | Entrypoint script with error handling |
| Platform incompatibility | Platform detection and specific instructions |
| Database connection loss | Fastify connection pooling configuration |

---

## Next Steps (Phase 1)

1. Create `data-model.md` defining configuration structures
2. Create contracts for Dockerfile and docker-compose specifications
3. Generate `quickstart.md` for developer onboarding
4. Update agent context with technology stack decisions

**Status**: ✅ Research phase complete. All technology decisions resolved. Ready for Phase 1 design.
