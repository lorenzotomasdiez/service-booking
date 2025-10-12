---
name: local-docker-environment
status: in-progress
created: 2025-10-10T11:09:26Z
updated: 2025-10-12T05:19:29Z
progress: 40%
prd: .claude/prds/local-docker-environment.md
github: https://github.com/lorenzotomasdiez/service-booking/issues/1
---

# Epic: Local Docker Environment Standardization & Enhancement

## Overview

Refactor and enhance the existing Docker infrastructure for BarberPro by consolidating 3 existing docker-compose files into a modular, best-practice structure with comprehensive Makefile orchestration, Argentina service mocks, and optional monitoring stack. This leverages existing Docker configs and focuses on developer experience through unified commands and visual feedback.

**Current State**:
- ✅ Basic Docker setup exists (PostgreSQL 15, Redis 7, pgAdmin, Redis Commander)
- ✅ 3 docker-compose files with duplication
- ✅ Dockerfiles for frontend/backend (dev + prod)
- ✅ Config files for nginx, redis, postgres
- ❌ No unified command interface (Makefile)
- ❌ No service mocks for local testing
- ❌ No monitoring stack

**Target State**:
- Production-parity local environment with single-command setup
- Modular docker-compose structure (base, dev, prod, monitoring, mocks, test)
- Comprehensive Makefile with 30+ commands and rich feedback
- All Argentina services mockable locally (MercadoPago, AFIP, WhatsApp, Email, SMS)
- Optional monitoring stack (Prometheus, Grafana, Loki)

## Architecture Decisions

### 1. Modular Docker Compose Architecture
**Decision**: Use Docker Compose profiles and multiple compose files instead of monolithic config

**Rationale**:
- Leverage existing docker-compose files as foundation
- Clear separation of concerns (base, dev, prod, monitoring, mocks, test)
- Developers can start only what they need (dev-only vs. full stack)
- Easier maintenance and reduced duplication

**Structure**:
```
docker/
├── docker-compose.yml              # Base (postgres, redis, nginx)
├── docker-compose.dev.yml          # Dev overrides (hot reload, volume mounts)
├── docker-compose.prod.yml         # Production config
├── docker-compose.monitoring.yml   # Prometheus, Grafana, Loki (optional)
├── docker-compose.mocks.yml        # Argentina mocks (optional)
├── docker-compose.test.yml         # Test environment
├── .env.example                    # Documented env vars
└── configs/                        # Existing configs (reuse!)
    ├── nginx.conf
    ├── redis.conf
    └── postgres.conf
```

### 2. Makefile as Unified Interface
**Decision**: Create comprehensive Makefile instead of scattered npm scripts

**Rationale**:
- Single source of truth for Docker operations
- Cross-platform compatibility (macOS, Linux, WSL2)
- Rich feedback with colored output and progress indicators
- Self-documenting (make help)
- Industry standard for DevOps workflows

**Key Features**:
- Color-coded output using `tput` (✓ ✗ ⚠ → symbols)
- Health checking before starting services
- Smart error messages with solutions
- Idempotent operations
- Environment variable support

### 3. Lightweight Mock Servers
**Decision**: Build simple Express.js mock servers for Argentina services

**Rationale**:
- Faster than external sandboxes
- Full control over responses and scenarios
- No internet dependency for integration tests
- Easy to configure via JSON files
- Can simulate edge cases and failures

**Services to Mock**:
1. **MercadoPago** (Port 3001): Payment gateway
2. **AFIP** (Port 3002): Tax reporting
3. **WhatsApp** (Port 3003): Business messaging
4. **Email** (MailHog - Ports 8025/1025): SMTP capture
5. **SMS** (Port 3004): SMS gateway

### 4. PostgreSQL 16 Upgrade
**Decision**: Upgrade from PostgreSQL 15 to 16 during standardization

**Rationale**:
- Latest stable with performance improvements
- Better Argentina timezone support
- Production parity (assuming prod will use 16)
- Minimal migration effort (Prisma handles it)

### 5. Optional Monitoring Stack
**Decision**: Make monitoring stack optional (separate docker-compose file)

**Rationale**:
- Not needed for all developers (resource intensive)
- Senior devs can enable for performance debugging
- QA can use for load testing
- Keeps minimal dev environment lightweight

**Stack**: Prometheus + Grafana + Loki + cAdvisor

## Technical Approach

### Phase 1: Docker Standardization & Makefile (Priority: P0)

**Refactor Existing Docker Configs**:
1. Analyze current 3 docker-compose files
2. Extract common base configuration
3. Create modular overrides for dev/prod
4. Pin all image versions (no `:latest`)
5. Add comprehensive health checks
6. Standardize naming conventions
7. Add resource limits

**Create Makefile**:
1. Implement core commands (up, down, restart, reset)
2. Add environment variants (dev, full, monitoring, mocks)
3. Database operations (migrate, seed, reset, backup, restore)
4. Monitoring commands (logs, status, health, stats)
5. Color-coded output with `tput`
6. Error handling with helpful messages
7. Self-documentation (`make help`)

**Deliverables**:
- 6 docker-compose files (base, dev, prod, monitoring, mocks, test)
- Makefile with 30+ commands
- .env.example with documentation
- docker/README.md

### Phase 2: Argentina Mock Servers (Priority: P0)

**Build Mock Services**:
1. **MercadoPago Mock** (Express.js):
   - Payment endpoint simulation
   - Configurable responses (JSON config)
   - Webhook simulation
   - Simple web UI for scenario selection

2. **AFIP Mock** (Express.js + SQLite):
   - CUIT/CUIL validation
   - Electronic invoice generation
   - CAE generation
   - Tax category validation

3. **WhatsApp Mock** (Express.js):
   - Message sending endpoint
   - Webhook callbacks
   - Message history UI

4. **SMS Mock** (Express.js):
   - SMS sending endpoint
   - Delivery status simulation
   - Simple dashboard

5. **Email** (MailHog - existing solution):
   - Integrate existing MailHog
   - No custom development needed

**Mock Architecture**:
```
docker/mocks/
├── shared/                    # Shared utilities
│   ├── logger.js             # JSON logging
│   └── health.js             # Health check endpoint
├── mercadopago/
│   ├── index.js              # Express server
│   ├── routes.js             # API endpoints
│   ├── scenarios.json        # Response configs
│   └── Dockerfile
├── afip/
│   ├── index.js
│   ├── validation.js         # CUIT/CUIL logic
│   ├── database.js           # SQLite
│   └── Dockerfile
├── whatsapp/
│   └── ...
└── sms/
    └── ...
```

**Deliverables**:
- 4 Express.js mock servers
- docker-compose.mocks.yml
- Mock server documentation
- Swagger/OpenAPI specs

### Phase 3: Monitoring Stack (Priority: P1 - Optional)

**Setup Observability**:
1. **Prometheus**:
   - Scrape backend /metrics endpoint
   - PostgreSQL exporter
   - Redis exporter
   - Service discovery config

2. **Grafana**:
   - Pre-built BarberPro dashboards
   - Database performance dashboard
   - API metrics dashboard
   - Booking analytics dashboard

3. **Loki**:
   - Log aggregation from all services
   - Grafana integration

4. **cAdvisor**:
   - Container resource monitoring

**Deliverables**:
- docker-compose.monitoring.yml
- Prometheus config
- Grafana dashboards (JSON)
- Loki config
- Monitoring documentation

### Phase 4: Integration, Testing & Documentation (Priority: P0)

**Integration**:
1. Connect mocks to main app via environment variables
2. Update backend to use mock URLs in dev mode
3. Test all user journeys from PRD
4. Performance testing (startup time, memory usage)

**Documentation**:
1. docker-setup-guide.md (getting started)
2. docker-troubleshooting.md (common issues)
3. Makefile cheat sheet
4. Architecture diagram
5. Video walkthrough (optional)

**Testing**:
1. Test on macOS, Linux, WSL2
2. Validate all Makefile commands
3. Health check all services
4. Load test with monitoring stack
5. Team feedback and iteration

**Deliverables**:
- Complete documentation
- Cross-platform testing results
- Team training materials
- Troubleshooting guide

## Implementation Strategy

### Simplification Opportunities

**Leverage Existing Infrastructure**:
1. ✅ **Reuse existing Docker configs** instead of rewriting
2. ✅ **Keep existing Dockerfiles** (just refactor compose files)
3. ✅ **Reuse nginx/redis/postgres configs** in docker/configs/
4. ✅ **Use MailHog** for email (don't build custom)
5. ✅ **Existing pgAdmin/Redis Commander** (keep as-is)

**Reduce Scope**:
1. ✅ **Mock servers are lightweight** (Express.js, minimal features)
2. ✅ **Monitoring is optional** (P1, separate compose file)
3. ✅ **Reuse Prisma migrations** (no custom migration logic)
4. ✅ **JSON configs for mocks** (no complex UI needed)

**Parallel Development**:
1. Mock servers are independent (can be built in parallel)
2. Makefile and Docker refactor can happen simultaneously
3. Monitoring stack is standalone

### Development Phases

**Week 1: Foundation**
- Days 1-2: Audit and refactor docker-compose files
- Days 3-4: Build Makefile with core commands
- Day 5: Testing and iteration

**Week 2: Mocks**
- Days 1-2: MercadoPago + AFIP mocks
- Days 3-4: WhatsApp + SMS mocks + MailHog integration
- Day 5: Integration testing

**Week 3: Monitoring (Optional)**
- Days 1-2: Prometheus + Grafana setup
- Days 3-4: Loki + dashboards
- Day 5: Testing and optimization

**Week 4: Polish**
- Days 1-2: Documentation
- Days 3-4: Cross-platform testing
- Day 5: Team training

### Risk Mitigation

**Technical Risks**:
- **Port conflicts**: Makefile checks ports before starting, suggests solutions
- **Performance issues**: Lightweight dev mode (just postgres + redis)
- **Mock accuracy**: Document differences from production, provide fallback

**Adoption Risks**:
- **Learning curve**: Comprehensive docs + video walkthrough
- **Resistance to change**: Make it easier than manual setup
- **Support burden**: Troubleshooting guide covers common issues

## Task Breakdown Preview

High-level task categories (≤10 tasks as requested):

- [x] **Task 1**: Refactor Docker Compose Files (consolidate 3 → 6 modular files)
- [x] **Task 2**: Create Comprehensive Makefile (30+ commands with colored output)
- [x] **Task 3**: Build MercadoPago Mock Server (Express.js + JSON config)
- [x] **Task 4**: Build AFIP Mock Server (Express.js + SQLite)
- [x] **Task 5**: Build WhatsApp & SMS Mocks (2 Express.js servers)
- [x] **Task 6**: Integrate MailHog & Update docker-compose.mocks.yml
- [x] **Task 7**: Setup Monitoring Stack (Prometheus, Grafana, Loki, cAdvisor)
- [x] **Task 8**: Integration Testing & Environment Variable Configuration
- [x] **Task 9**: Documentation & Training Materials
- [x] **Task 10**: Cross-Platform Testing & Final Polish

**Note**: Tasks are designed to be independent where possible, allowing parallel work.

## Dependencies

### External Dependencies
- **Docker Desktop/Engine**: 20.10+ (developers must have installed)
- **Docker Compose**: V2+ (required)
- **Docker Hub access**: Pull images (postgres, redis, nginx, etc.)
- **Node.js 20+**: For mock servers (build-time only, run in containers)

### Internal Dependencies
- **Backend /health endpoint**: Required for health checks (likely exists)
- **Backend /metrics endpoint**: Required for Prometheus (may need to add)
- **Prisma migrations**: Must be working (assumed working)
- **Frontend CORS config**: Must allow Docker network IPs (update .env)

### Team Dependencies
- **DevOps Engineer**: Review Docker configs, validate production parity (part-time)
- **Backend Developer**: Test mock integrations, update environment variables (1-2 days)
- **Frontend Developer**: Test frontend connection to Dockerized backend (1 day)
- **QA Engineer**: Validate mock behavior, test scenarios (ongoing)

## Success Criteria (Technical)

### Performance Benchmarks
- ✅ **Cold start** (full stack): < 60 seconds
- ✅ **Warm start** (dev only): < 15 seconds
- ✅ **Reset time**: < 2 minutes
- ✅ **Memory usage**: < 4GB (all services)
- ✅ **CPU usage**: < 50% (4-core machine)

### Quality Gates
- ✅ **Health checks**: All services report healthy within 60s
- ✅ **Cross-platform**: Works on macOS, Linux, WSL2
- ✅ **Idempotent**: All Makefile commands safe to run multiple times
- ✅ **Error handling**: Helpful messages with solutions
- ✅ **Documentation**: Complete setup guide + troubleshooting

### Acceptance Criteria
1. **New developer setup**: < 15 minutes from clone to running
2. **Mock coverage**: MercadoPago, AFIP, WhatsApp, Email, SMS all functional
3. **Makefile commands**: 30+ commands, all documented in `make help`
4. **Visual feedback**: Color-coded output with progress indicators
5. **Production parity**: Service versions match production (PostgreSQL 16, Redis 7)
6. **Zero manual steps**: `make up` handles everything

## Estimated Effort

### Timeline
- **Phase 1** (Docker + Makefile): 1 week (5 days)
- **Phase 2** (Argentina Mocks): 1 week (5 days)
- **Phase 3** (Monitoring - Optional): 1 week (5 days)
- **Phase 4** (Testing + Docs): 1 week (5 days)
- **Total**: 4 weeks (20 working days)

### Resource Requirements
- **Senior Developer**: 1 person, full-time for 4 weeks
- **DevOps Engineer**: Part-time support (2-3 hours/week)
- **QA Engineer**: Testing support (5-10 hours total)
- **Technical Writer**: Documentation review (optional, 2-3 hours)

### Critical Path
1. Docker refactor (blocks everything)
2. Makefile (enables developer workflow)
3. Mock servers (enables integration testing)
4. Documentation (enables adoption)

**Monitoring is NOT on critical path** (optional P1 feature)

## Tasks Created

- [ ] #2 - Refactor Docker Compose Files into Modular Structure (parallel: false)
- [ ] #3 - Create Comprehensive Makefile with Colored Output (parallel: false)
- [ ] #4 - Build MercadoPago Mock Server (parallel: true)
- [ ] #5 - Build AFIP Mock Server (parallel: true)
- [ ] #6 - Build WhatsApp & SMS Mock Servers (parallel: true)
- [ ] #7 - Integrate MailHog and Create docker-compose.mocks.yml (parallel: false)
- [ ] #8 - Setup Monitoring Stack (Prometheus, Grafana, Loki, cAdvisor) (parallel: true)
- [ ] #9 - Integration Testing & Environment Variable Configuration (parallel: false)
- [ ] #10 - Documentation & Training Materials (parallel: false)
- [ ] #11 - Cross-Platform Testing & Final Polish (parallel: false)

**Total tasks**: 10
**Parallel tasks**: 4 (tasks #4, #5, #6, #8 can run in parallel)
**Sequential tasks**: 6 (tasks #2, #3, #7, #9, #10, #11 must run sequentially)
**Estimated total effort**: 90-110 hours (4-5 weeks for 1 developer)

**Critical Path** (sequential dependencies):
1. Task #2 (Docker refactor) → 2. Task #3 (Makefile) → 3. Tasks #4-#6 (Mocks in parallel) → 4. Task #7 (Integrate mocks) → 5. Task #9 (Integration testing) → 6. Task #10 (Documentation) → 7. Task #11 (Final testing)

**Parallel Opportunities**:
- Tasks #4, #5, #6 can be built simultaneously (mock servers are independent)
- Task #8 (monitoring) can be done anytime after Task #2 (optional P1 feature)
## Notes

### Simplification Decisions Made

To keep tasks ≤10, we made these simplifications:

1. **Reuse Existing**:
   - Keep existing Dockerfiles (just refactor compose)
   - Reuse docker/configs/ files
   - Use MailHog (don't build email mock)
   - Keep pgAdmin and Redis Commander as-is

2. **Minimal Mock Features**:
   - JSON config files (no admin UI needed)
   - Simple Express.js servers (no frameworks)
   - Basic scenarios only (not 100% API coverage)
   - Swagger for docs (auto-generated)

3. **Optional Monitoring**:
   - Separate task, P1 priority
   - Can be done later if needed
   - Not blocking core workflow

4. **Combined Tasks**:
   - WhatsApp + SMS mocks in one task (similar code)
   - Integration testing + env config in one task
   - Documentation + training in one task

### Future Enhancements (Out of Scope)

- Kubernetes local development (minikube/k3s)
- VS Code dev containers integration
- Automated performance benchmarking
- Advanced AFIP scenarios
- Video consultation service mocks
- Multi-region simulation
