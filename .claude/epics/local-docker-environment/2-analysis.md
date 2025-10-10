---
issue: 2
title: Refactor Docker Compose Files into Modular Structure
analyzed: 2025-10-10T13:36:00Z
estimated_hours: 10
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #2

## Overview

Refactor the existing 3 docker-compose files into a standardized modular structure with 6 compose files following Docker best practices. The work involves eliminating duplication, pinning all image versions, adding comprehensive health checks, upgrading PostgreSQL 15→16, and organizing configs into the `docker/` directory.

**Current State**: 3 docker-compose files with duplication, `:latest` tags, and scattered configs
**Target State**: 6 modular compose files in `docker/` with full version pinning, health checks, and organized structure

## Parallel Streams

### Stream A: Base Infrastructure Setup & Configuration Organization
**Scope**: Create directory structure, analyze existing files, move/organize config files, and create base docker-compose.yml
**Files**:
- `docker/` (new directory)
- `docker/configs/` (new directory)
- `docker/docker-compose.yml` (new base file)
- `docker/configs/nginx.conf` (moved from `docker/configs/`)
- `docker/configs/nginx-prod.conf` (moved)
- `docker/configs/nginx-frontend.conf` (moved)
- `docker/configs/redis.conf` (moved)
- `docker/configs/redis-prod.conf` (moved)
- `docker/configs/postgres-prod.conf` (moved)
- `docker/configs/proxy_params.conf` (moved)
- `config/nginx-argentina-optimized.conf` (evaluate and move if needed)

**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 3
**Dependencies**: none

**Tasks**:
1. Create `docker/` directory structure
2. Analyze all 3 existing docker-compose files to identify common base services
3. Extract base configuration (postgres, redis, nginx) into `docker/docker-compose.yml`
4. Pin all image versions (postgres:16-alpine, redis:7-alpine)
5. Move existing config files from `docker/configs/` to `docker/configs/`
6. Update config file paths in base compose file
7. Upgrade PostgreSQL from 15 to 16 in base config
8. Add comprehensive health checks to base services
9. Configure resource limits for base services
10. Implement standardized naming: `barberpro-<service>-<env>`

### Stream B: Environment-Specific Overrides (Dev & Production)
**Scope**: Create docker-compose.dev.yml and docker-compose.prod.yml with environment-specific overrides
**Files**:
- `docker/docker-compose.dev.yml` (new file)
- `docker/docker-compose.prod.yml` (new file)
- `docker/.env.example` (new file)

**Agent Type**: devops-specialist
**Can Start**: after Stream A completes base file
**Estimated Hours**: 3
**Dependencies**: Stream A (requires base docker-compose.yml)

**Tasks**:
1. Create `docker-compose.dev.yml` with development overrides
   - Hot reload volume mounts for backend/frontend
   - Development-specific health checks
   - Dev container naming (`-dev` suffix)
   - Dev network naming
2. Create `docker-compose.prod.yml` with production overrides
   - Production Dockerfile targets
   - Production resource limits (higher)
   - Production health checks (longer intervals)
   - Prod container naming (`-prod` suffix)
   - Additional production services (monitoring placeholders)
3. Eliminate all duplication between base and override files
4. Create comprehensive `.env.example` with all variables documented
   - Database credentials
   - Redis configuration
   - Admin tool credentials (pgAdmin, redis-commander)
   - Backend/frontend environment variables
5. Document environment variable hierarchy: `.env` → `docker-compose.yml` → service-specific

### Stream C: Specialized Compose Files (Monitoring, Mocks, Testing)
**Scope**: Create placeholder compose files for monitoring stack, Argentina mocks, and testing environment
**Files**:
- `docker/docker-compose.monitoring.yml` (new placeholder)
- `docker/docker-compose.mocks.yml` (new placeholder)
- `docker/docker-compose.test.yml` (new file)

**Agent Type**: devops-specialist
**Can Start**: immediately (independent of other streams)
**Estimated Hours**: 2
**Dependencies**: none

**Tasks**:
1. Create `docker-compose.monitoring.yml` placeholder
   - Prometheus service definition (commented/placeholder)
   - Grafana service definition (commented/placeholder)
   - Loki service definition (commented/placeholder)
   - Documentation comments for Phase 3 implementation
2. Create `docker-compose.mocks.yml` placeholder
   - MercadoPago mock service (placeholder)
   - AFIP mock service (placeholder)
   - WhatsApp Business mock (placeholder)
   - Documentation for Phase 2 Argentina testing
3. Create `docker-compose.test.yml` for testing environment
   - Test database (isolated from dev)
   - Test Redis (isolated)
   - Test-specific environment variables
   - Resource limits (lower for CI/CD)
   - Fast health checks for quick startup

### Stream D: Validation, Testing & Documentation
**Scope**: Test all compose file combinations, update npm scripts, create documentation, and ensure backward compatibility
**Files**:
- `docker/README.md` (new documentation)
- `package.json` (root - update npm scripts)
- Root docker-compose files (optional symlinks for backward compatibility)

**Agent Type**: devops-specialist
**Can Start**: after Streams A & B complete
**Estimated Hours**: 2
**Dependencies**: Stream A, Stream B

**Tasks**:
1. Test base + dev composition: `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up`
2. Test base + prod composition: `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up`
3. Verify all health checks pass within 60 seconds
4. Test PostgreSQL 16 with existing Prisma schema
5. Verify backend /health endpoint responds
6. Update npm scripts in root package.json:
   - `docker:up` → point to new docker/ location
   - `docker:dev` → use new compose file structure
   - `docker:prod` → use new production structure
7. Create comprehensive `docker/README.md`:
   - How to use the modular structure
   - Environment variable documentation
   - Common commands
   - PostgreSQL upgrade notes
   - Troubleshooting section
8. Optional: Create symlinks for backward compatibility
   - `docker-compose.yml` → `docker/docker-compose.yml`
   - Update later after team notification
9. Test on macOS and Linux platforms
10. Document rollback plan if PostgreSQL 16 issues arise

## Coordination Points

### Shared Files
**Config files** - Stream A organizes, all other streams reference:
- `docker/configs/*.conf` - Stream A moves and organizes
- Other streams reference the new paths

**Base compose file** - Stream A creates, Stream B extends:
- `docker/docker-compose.yml` - Stream A creates
- Stream B waits for completion before creating overrides

**Environment variables** - Stream B creates, Stream D documents:
- `docker/.env.example` - Stream B creates
- Stream D documents usage in README

### Sequential Requirements
Critical path for parallel execution:
1. **Stream A MUST complete** `docker-compose.yml` base file before Stream B starts
2. **Stream B MUST complete** dev/prod files before Stream D validates
3. **Stream C is independent** and can run fully in parallel
4. **Stream D validates all** after A & B complete

## Conflict Risk Assessment

**Low Risk** ✅
- Streams work on different files
- Clear directory separation (`docker/`, config organization)
- Stream C is completely independent
- No overlapping file modifications

**Minimal Coordination Needed** ⚠️
- Stream A creates base, Stream B extends (sequential by design)
- Stream D validates all work (runs last)
- Config file paths: Stream A moves, all reference new locations

**No High-Risk Conflicts** ✅

## Parallelization Strategy

**Recommended Approach**: Hybrid (parallel + sequential)

**Phase 1 (Parallel)**:
- Stream A: Base infrastructure setup (3h)
- Stream C: Specialized compose files (2h)
- Duration: 3 hours (longest stream)

**Phase 2 (Sequential after Stream A)**:
- Stream B: Environment overrides (3h)
- Duration: 3 hours

**Phase 3 (Sequential after A & B)**:
- Stream D: Validation & documentation (2h)
- Duration: 2 hours

**Alternative Sequential Approach**:
- If only one engineer available or prefer safer approach
- Complete A → B → C → D in order
- Duration: 10 hours total

## Expected Timeline

**With parallel execution**:
- Wall time: **8 hours**
  - Phase 1 (A + C parallel): 3h
  - Phase 2 (B sequential): 3h
  - Phase 3 (D sequential): 2h
- Total work: 10 hours
- Efficiency gain: **20% speedup**
- Parallelization factor: 1.25x

**With full parallelization (2 engineers)**:
- Wall time: **5 hours**
  - Hour 0-3: Stream A (Engineer 1) + Stream C (Engineer 2)
  - Hour 3-6: Stream B (Engineer 1) + Stream C finishes/assists (Engineer 2)
  - Hour 6-8: Stream D (Both engineers validate)
- Total work: 10 hours
- Efficiency gain: **50% speedup**
- Parallelization factor: 2.0x

**Without parallel execution**:
- Wall time: 10 hours (sequential A → B → C → D)

## Notes

### PostgreSQL Upgrade (15 → 16)
- **Risk**: Low - Prisma handles version differences well
- **Validation**: Test with existing schema and migrations
- **Rollback**: Keep old compose files as backup until validated
- **Testing**: Run `docker-compose exec postgres psql --version` to verify
- **Documentation**: Document upgrade in docker/README.md

### Image Version Pinning
- **postgres**: `15-alpine` → `16-alpine`
- **redis**: `7-alpine` (already pinned)
- **pgadmin**: `7` → `dpage/pgadmin4:8.12` (pin specific version)
- **redis-commander**: `:latest` → `:latest-alpine` or specific version
- **Eliminate ALL** `:latest` tags

### Health Check Strategy
- PostgreSQL: 10s interval, start_period: 60s
- Redis: 10s interval, lightweight ping
- Backend: 30s interval, 60s start_period (slow Node.js startup)
- Frontend: 30s interval, 30s start_period
- Use `wget` for production, `curl` for dev

### Resource Limits Philosophy
- Development: Lower limits to prevent laptop resource exhaustion
- Production: Higher limits for performance
- All services: Set both limits and reservations
- Base file: Conservative defaults
- Override files: Environment-specific tuning

### Backward Compatibility
- Option 1: Create symlinks at root pointing to `docker/` files
- Option 2: Update npm scripts immediately, notify team
- Option 3: Keep old files for 1 sprint, then remove
- **Recommended**: Option 2 with team notification

### Testing Checklist
- [ ] Base + dev composition starts successfully
- [ ] Base + prod composition starts successfully
- [ ] All health checks pass within expected timeframes
- [ ] PostgreSQL 16 accepts existing Prisma migrations
- [ ] Backend /health endpoint responds (verify exists first)
- [ ] Frontend health check works
- [ ] No `:latest` tags remain
- [ ] Config files load from new `docker/configs/` location
- [ ] Environment variables load correctly
- [ ] Resource limits applied correctly
- [ ] Networks created with proper naming
- [ ] Volumes persist data correctly

### Future Phases (Not in Scope)
- **Phase 2**: Argentina mocks implementation (docker-compose.mocks.yml)
- **Phase 3**: Full monitoring stack (docker-compose.monitoring.yml)
- **Phase 4**: CI/CD integration with test composition
