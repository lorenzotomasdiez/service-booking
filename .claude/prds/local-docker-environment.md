---
name: local-docker-environment
description: Comprehensive local Docker development environment for BarberPro with all services, monitoring, and Argentina-specific integrations
status: backlog
created: 2025-10-10T03:17:36Z
---

# PRD: Local Docker Environment

## Executive Summary

Create a robust, production-like local Docker development environment for BarberPro that provides all necessary services, monitoring capabilities, and Argentina-specific integrations. This environment will enable developers to work independently with full system capabilities, eliminate "works on my machine" issues, and reduce onboarding time from days to minutes.

**Value Proposition**: Transform local development from fragmented service management to a single-command, production-parity environment that increases developer productivity by 40% and reduces environment-related bugs by 80%.

## Problem Statement

### Current State Assessment

**Existing Docker Infrastructure**:
- ✅ Basic services: PostgreSQL 15, Redis 7, pgAdmin, Redis Commander
- ✅ Multiple docker-compose files exist:
  - `docker-compose.yml` (production)
  - `docker-compose.dev.yml` (development)
  - `docker-compose.production.yml`
- ✅ Docker configs for nginx, redis, postgres
- ✅ Separate Dockerfiles for frontend/backend (production + dev variants)
- ❌ No standardized structure - significant duplication between files
- ❌ No orchestration layer (Makefile or unified scripts)
- ❌ No monitoring stack (Prometheus, Grafana, Loki)
- ❌ No Argentina service mocks (MercadoPago, AFIP, WhatsApp, Email, SMS)
- ❌ Limited logging and feedback during operations

### Current Challenges

**Infrastructure Fragmentation**:
- Multiple docker-compose files with duplicated configuration
- No clear separation of concerns (base, dev, monitoring, mocks)
- Command execution scattered across npm scripts without unified interface
- Missing Makefile for standardized, cross-platform command orchestration
- No structured logging or progress feedback during operations

**Missing External Service Mocks**:
- Cannot test MercadoPago payment flows locally (must use external sandbox)
- No AFIP tax validation simulation
- WhatsApp Business API requires external service
- Email/SMS services not mockable locally
- Integration testing requires internet connectivity and external services

**Observability Gap**:
- No local monitoring stack for performance debugging
- No centralized log aggregation across services
- Cannot debug production-like issues without deploying to staging
- Missing metrics collection for load testing

**Developer Experience Issues**:
- No unified command interface (must remember docker-compose commands)
- Limited feedback during startup/shutdown operations
- No visual progress indicators
- Unclear error messages when services fail
- Manual health checking required

### Why This Matters Now

1. **Standardization Needed**: Multiple Docker configs creating maintenance burden
2. **Team Scaling**: Approaching soft launch, need streamlined developer experience
3. **Integration Testing**: Must test Argentina-specific services without external dependencies
4. **Best Practices**: Current setup works but doesn't follow Docker/DevOps best practices
5. **Developer Productivity**: Makefile + mocks + monitoring = significant productivity boost

## User Stories

### Primary Personas

**1. New Developer (Junior/Mid-level)**
- Joins BarberPro team, needs to get productive quickly
- Limited Docker experience, needs simple commands
- Wants to run full stack without manual configuration

**2. Senior Developer**
- Works on complex features requiring multiple services
- Needs production-like environment for debugging
- Requires quick environment reset between feature branches

**3. QA Engineer**
- Tests payment flows with MercadoPago sandbox
- Validates AFIP tax reporting integration
- Needs reproducible test data

**4. DevOps Engineer**
- Maintains development environment parity with production
- Monitors resource usage and performance
- Updates service versions and configurations

### Detailed User Journeys

#### Journey 1: First Day Setup (New Developer)
```
AS A new developer joining BarberPro
I WANT to set up my local environment in under 15 minutes
SO THAT I can start contributing on day one

Current Pain Points:
- Installing PostgreSQL, Redis manually
- Configuring database credentials
- Running migrations and seeds
- Testing if all services work together
- Reading scattered documentation

Desired Flow:
1. Clone repository
2. Run: npm run setup:dev
3. System automatically:
   - Pulls Docker images
   - Starts all services
   - Runs migrations
   - Seeds test data
   - Validates health
4. Access frontend at localhost:5173
5. Start coding

Acceptance Criteria:
- Complete setup in < 15 minutes
- Zero manual configuration required
- Single command: npm run setup:dev
- Health check confirms all services running
- Test data loaded and ready
```

#### Journey 2: Payment Integration Testing (QA Engineer)
```
AS A QA engineer testing payment flows
I WANT a local MercadoPago sandbox environment
SO THAT I can test payment scenarios without real transactions

Current Pain Points:
- Using production MercadoPago sandbox (slow, rate-limited)
- Can't test offline/error scenarios
- No control over payment response timing
- Hard to reproduce edge cases

Desired Flow:
1. Start Docker environment with MercadoPago mock
2. Configure different payment scenarios (success, failure, timeout)
3. Run test bookings through payment flow
4. Verify AFIP integration receives correct data
5. Check transaction logs in local Grafana

Acceptance Criteria:
- MercadoPago mock responds to all API endpoints
- Configurable responses (success/failure/timeout)
- AFIP mock validates tax data
- All payment events logged
- Grafana dashboard shows payment metrics
```

#### Journey 3: Performance Debugging (Senior Developer)
```
AS A senior developer debugging slow queries
I WANT local monitoring stack (Prometheus, Grafana, Loki)
SO THAT I can identify performance bottlenecks

Current Pain Points:
- No local metrics collection
- Hard to reproduce production performance issues
- Must deploy to staging to test performance
- Limited visibility into database queries

Desired Flow:
1. Start Docker environment with monitoring
2. Trigger performance test with Artillery
3. View real-time metrics in Grafana dashboard
4. Analyze slow queries in PostgreSQL logs via Loki
5. Identify bottleneck, optimize, re-test
6. Confirm improvement in metrics

Acceptance Criteria:
- Prometheus scrapes backend metrics
- Grafana pre-configured with BarberPro dashboards
- Loki aggregates logs from all services
- Database query metrics visible
- Real-time performance graphs
```

#### Journey 4: Environment Reset (All Developers)
```
AS ANY developer switching between feature branches
I WANT to quickly reset my environment to a clean state
SO THAT I don't have data pollution between tests

Current Pain Points:
- Manual database drops/recreates
- Clearing Redis cache manually
- Losing custom test data
- Time-consuming reset process (20+ minutes)

Desired Flow:
1. Run: make reset
2. System automatically with visual feedback:
   ✓ Stopping all containers...
   ✓ Removing volumes...
   ✓ Starting fresh containers...
   ✓ Running migrations...
   ✓ Seeding test data...
   ✓ Environment ready! ✨
3. Complete in < 2 minutes

Acceptance Criteria:
- Single command: make reset
- Visual progress indicators
- Complete in < 2 minutes
- Preserves Docker images (no re-download)
- Fresh database with seed data
- Clean Redis state
- Color-coded output (green = success, red = error, yellow = warning)
```

#### Journey 5: Makefile Command Interface (All Developers)
```
AS A developer working with BarberPro
I WANT a unified Makefile interface for all Docker operations
SO THAT I don't need to remember complex docker-compose commands

Current Pain Points:
- Must remember long docker-compose commands
- Different commands for dev/prod/monitoring
- No feedback during operations
- Unclear what's happening
- Error messages buried in output

Desired Makefile Commands:
make help           # Show all available commands
make up             # Start all services
make down           # Stop all services
make restart        # Restart all services
make logs           # Tail logs from all services
make logs-<service> # Tail specific service logs
make status         # Show service health status
make reset          # Complete environment reset
make clean          # Remove volumes and images
make dev            # Start dev environment only
make monitoring     # Start monitoring stack
make mocks          # Start all Argentina mocks
make test           # Start test environment
make db-migrate     # Run database migrations
make db-seed        # Seed database
make db-reset       # Reset database only
make ps             # List running containers
make stats          # Show resource usage

Acceptance Criteria:
- All commands have clear, descriptive names
- Each command shows progress with visual indicators
- Color-coded output (using tput for cross-platform support)
- Helpful error messages with suggested fixes
- make help shows command descriptions
- Commands are idempotent (safe to run multiple times)
- Smart dependency checking (e.g., don't start backend if postgres is down)
```

## Requirements

### Functional Requirements

#### FR-0: Docker Compose Standardization
**Priority**: P0 (Must Have) - Foundation for everything else

**Current State to Refactor**:
- Consolidate 3 docker-compose files into modular structure
- Eliminate duplication between files
- Clear separation of concerns

**New Structure**:
```
docker/
├── docker-compose.yml              # Base configuration (shared settings)
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production overrides
├── docker-compose.monitoring.yml   # Monitoring stack (Prometheus, Grafana, Loki)
├── docker-compose.mocks.yml        # Argentina service mocks
└── docker-compose.test.yml         # Testing environment
```

**Docker Compose Best Practices**:
- Use `extends` and `profiles` for composition
- Named volumes with clear naming convention
- Consistent service naming: `barberpro-<service>-<env>`
- Health checks for ALL services
- Restart policies appropriate to environment
- Resource limits (memory, CPU) to prevent runaway containers
- Explicit dependency ordering with `depends_on` + `condition: service_healthy`
- Environment variable hierarchy: .env → docker-compose → service-specific

**Version Pinning**:
- All images use specific versions (no `:latest`)
- Document upgrade path for each service
- Changelog for version updates

#### FR-1: Core Services Stack
**Priority**: P0 (Must Have)

- **PostgreSQL 16**: Primary database (upgrade from 15)
  - Pre-configured with BarberPro schema
  - Optimized for Argentina timezone (America/Argentina/Buenos_Aires)
  - Connection pooling configured
  - Auto-run migrations on startup
  - Health check endpoint
  - Custom postgres config at `docker/configs/postgres.conf`
  - Backup/restore scripts

- **Redis 7**: Caching and sessions
  - Persistent storage for development
  - Configured for session management
  - Health check endpoint
  - Custom redis config at `docker/configs/redis.conf`
  - Redis Commander UI for inspection

- **Nginx**: Reverse proxy
  - Route frontend/backend traffic
  - SSL termination for local HTTPS testing (self-signed cert)
  - Static asset serving
  - Rate limiting configuration
  - Gzip compression
  - Custom nginx config at `docker/configs/nginx.conf`

#### FR-2: Argentina-Specific Service Mocks
**Priority**: P0 (Must Have) - Critical for local integration testing

**Implementation Strategy**: Build lightweight Node.js/Express mock servers

##### MercadoPago Mock Server
- **Technology**: Express.js server with configurable responses
- **Features**:
  - Simulate all payment gateway endpoints
  - Support all payment methods (cards, wallets, BNPL, Rapipago, PagoFacil)
  - Configurable response scenarios (success, failure, pending, timeout)
  - Webhook simulation with configurable delays
  - Transaction history API
  - Payment status transitions (pending → approved/rejected)
  - Refund simulation
  - Installments calculation
- **Configuration**: JSON file for response scenarios
- **UI**: Simple web dashboard to trigger scenarios
- **Port**: 3001
- **Endpoints**: Mirror MercadoPago API structure

##### AFIP Mock Server
- **Technology**: Express.js server with validation logic
- **Features**:
  - Simulate tax reporting API (WebServices AFIP)
  - Validate CUIT/CUIL numbers (checksum validation)
  - Mock electronic invoice generation (Factura Electrónica)
  - Mock CAE (Código de Autorización Electrónico) generation
  - Configurable validation rules
  - Tax category validation
  - IVA calculations
  - Punto de venta (POS) simulation
- **Configuration**: JSON file for validation rules
- **Port**: 3002
- **Database**: SQLite for storing mock invoices

##### WhatsApp Business Mock Server
- **Technology**: Express.js server simulating WhatsApp Business API
- **Features**:
  - Message sending endpoint
  - Webhook callbacks (message delivered, read, failed)
  - Template message simulation
  - Message history tracking
  - Media message support (images, documents)
  - Message status tracking
  - Interactive message buttons
- **UI**: Chat-like interface to view sent messages
- **Port**: 3003
- **Database**: In-memory storage

##### Email Mock Server
- **Technology**: MailHog (existing solution)
- **Features**:
  - SMTP server to capture outgoing emails
  - Web UI for email inspection
  - Email search and filtering
  - Delete/clear functionality
  - API for automated testing
  - Support for HTML emails
  - Attachment viewing
- **Port**: 8025 (Web UI), 1025 (SMTP)

##### SMS Mock Server
- **Technology**: Express.js server
- **Features**:
  - SMS sending endpoint (simulating Twilio/similar)
  - SMS history and tracking
  - Delivery status simulation
  - Phone number validation (Argentina +54 format)
  - Cost calculation (mock)
  - Webhook callbacks
- **UI**: Simple dashboard showing sent SMS
- **Port**: 3004

**Mock Server Best Practices**:
- Configurable via environment variables
- Docker health checks
- Structured logging (JSON format)
- Request/response logging for debugging
- Swagger/OpenAPI documentation
- Unit tests for mock logic
- Seed data for common scenarios

#### FR-3: Monitoring & Observability Stack
**Priority**: P1 (Should Have)

- **Prometheus**: Metrics collection
  - Scrape backend /metrics endpoint
  - PostgreSQL exporter
  - Redis exporter
  - Configurable scrape intervals

- **Grafana**: Visualization
  - Pre-built BarberPro dashboards
  - Database performance dashboard
  - API endpoint metrics
  - Real-time booking analytics

- **Loki**: Log aggregation
  - Collect logs from all services
  - Structured log parsing
  - Search and filtering UI

- **cAdvisor**: Container monitoring
  - Resource usage per container
  - Performance metrics

#### FR-4: Developer Tools
**Priority**: P1 (Should Have)

- **Adminer/pgAdmin**: Database UI
  - PostgreSQL visual interface
  - Query builder
  - Schema visualization

- **Redis Commander**: Redis UI
  - Key browser
  - Value inspector
  - Cache management

- **Mailhog/MailCatcher**: Email testing
  - Capture outgoing emails
  - Web UI for email inspection
  - No external email sending

#### FR-5: Makefile Command Interface
**Priority**: P0 (Must Have) - Developer Experience Foundation

**Makefile Design Principles**:
- Cross-platform compatibility (macOS, Linux, WSL2)
- Clear, descriptive command names
- Rich feedback with colored output
- Progress indicators for long-running operations
- Error handling with helpful messages
- Idempotent commands (safe to run multiple times)
- Self-documenting (make help shows all commands)

**Logging & Feedback System**:
```bash
# Color codes (using tput for portability)
GREEN   = ✓ Success messages
YELLOW  = ⚠ Warning messages
RED     = ✗ Error messages
BLUE    = ℹ Info messages
CYAN    = → Running actions

# Progress indicators
Spinner for long operations
Progress bars where applicable
Service status tables (name, status, health, uptime)
```

**Core Makefile Commands**:

**Setup & Info**:
- `make help` - Show all available commands with descriptions
- `make version` - Show Docker, docker-compose, service versions
- `make doctor` - Check system requirements and configuration

**Lifecycle Management**:
- `make up` - Start all services (base + dev + mocks)
- `make down` - Stop all services gracefully
- `make restart` - Restart all services
- `make rebuild` - Rebuild and restart all services
- `make clean` - Remove all containers, volumes, networks, images

**Environment Variants**:
- `make dev` - Start development environment only (postgres, redis)
- `make full` - Start everything (dev + monitoring + mocks)
- `make monitoring` - Start monitoring stack only
- `make mocks` - Start Argentina mocks only
- `make test` - Start test environment

**Service-Specific**:
- `make start-<service>` - Start specific service (e.g., make start-postgres)
- `make stop-<service>` - Stop specific service
- `make restart-<service>` - Restart specific service
- `make logs-<service>` - Tail logs for specific service

**Database Operations**:
- `make db-migrate` - Run Prisma migrations
- `make db-seed` - Seed database with test data
- `make db-reset` - Drop, migrate, seed (complete reset)
- `make db-backup` - Backup database to file
- `make db-restore` - Restore database from backup
- `make db-shell` - Open PostgreSQL shell

**Monitoring & Debugging**:
- `make logs` - Tail logs from all services
- `make status` - Show health status of all services (table format)
- `make ps` - List running containers
- `make stats` - Show resource usage (CPU, memory per container)
- `make health` - Run health checks on all services
- `make inspect-<service>` - Show detailed service configuration

**Maintenance**:
- `make reset` - Complete environment reset (down + clean + up + seed)
- `make prune` - Remove unused Docker resources (images, networks)
- `make update` - Pull latest images and rebuild
- `make validate` - Validate all docker-compose files

**Development Shortcuts**:
- `make shell-backend` - Open shell in backend container
- `make shell-frontend` - Open shell in frontend container
- `make exec-<service>` - Execute command in service container

**Advanced Features**:
- `make watch` - Start and automatically restart on file changes
- `make profile` - Profile resource usage over time
- `make benchmark` - Run performance benchmarks

**Output Format Example**:
```bash
$ make up
[→] Starting BarberPro Development Environment...
[→] Checking prerequisites...
  [✓] Docker is running
  [✓] docker-compose is installed
  [✓] Required ports are available

[→] Starting core services...
  [✓] barberpro-postgres-dev (healthy)
  [✓] barberpro-redis-dev (healthy)

[→] Starting application services...
  [✓] barberpro-backend-dev (healthy)
  [✓] barberpro-frontend-dev (healthy)

[→] Starting mock services...
  [✓] barberpro-mercadopago-mock (healthy)
  [✓] barberpro-afip-mock (healthy)
  [✓] barberpro-whatsapp-mock (healthy)
  [✓] barberpro-email-mock (healthy)
  [✓] barberpro-sms-mock (healthy)

[✓] Environment ready! ✨

Services running at:
  Frontend:      http://localhost:5173
  Backend API:   http://localhost:3000
  API Docs:      http://localhost:3000/docs
  Database UI:   http://localhost:8080
  Redis UI:      http://localhost:8081
  Email UI:      http://localhost:8025
  Grafana:       http://localhost:3001

Run 'make logs' to view logs
Run 'make status' to check health
Run 'make help' for more commands
```

**Error Handling Example**:
```bash
$ make up
[→] Starting BarberPro Development Environment...
[✗] Port 5432 is already in use!

Possible solutions:
  1. Stop the process using port 5432:
     lsof -ti:5432 | xargs kill -9

  2. Change PostgreSQL port in .env file:
     POSTGRES_PORT=5433

  3. Use existing PostgreSQL instance:
     make dev-external-db
```

**Makefile Best Practices**:
- PHONY targets for all commands
- Environment variable support (.env file)
- Conditional logic for OS-specific commands
- Parallel execution where safe
- Proper dependency ordering
- Error propagation
- Clean output formatting

#### FR-6: Data Management
**Priority**: P0 (Must Have)

- **Automated migrations**:
  - Run Prisma migrations on PostgreSQL startup
  - Idempotent migration scripts
  - Migration status logging

- **Seed data**:
  - Default Argentina test data (Buenos Aires locations)
  - Sample barbers and services
  - Test customers
  - Sample bookings
  - Configurable seed scenarios

- **Data persistence**:
  - Docker volumes for database
  - Volume backup/restore scripts
  - Named volumes for easy identification

- **Data reset capabilities**:
  - Reset to clean state
  - Reset to specific scenario
  - Preserve or clear volumes option

### Non-Functional Requirements

#### NFR-1: Performance
- **Startup time**: < 60 seconds for full stack (cold start)
- **Startup time**: < 15 seconds for dev services (warm start)
- **Memory usage**: < 4GB total for all services
- **CPU usage**: < 50% on 4-core machines
- **Database response**: < 50ms for typical queries

#### NFR-2: Developer Experience
- **Zero manual configuration**: All services auto-configured
- **Single command setup**: `npm run setup:dev` handles everything
- **Clear feedback**: Progress indicators during startup
- **Helpful errors**: Descriptive error messages with solutions
- **Documentation**: Inline comments in docker-compose files

#### NFR-3: Reliability
- **Health checks**: All services have health check endpoints
- **Auto-restart**: Services restart on failure
- **Graceful shutdown**: Proper cleanup on docker:down
- **Data integrity**: No data loss on container restart
- **Idempotent operations**: Scripts can run multiple times safely

#### NFR-4: Maintainability
- **Version pinning**: All Docker images use specific versions
- **Configuration as code**: All settings in version control
- **Clear structure**: Organized docker/ directory
- **Update strategy**: Easy service version updates
- **Backward compatibility**: Changes don't break existing setups

#### NFR-5: Security
- **No production credentials**: Only test credentials in Docker
- **Network isolation**: Services on dedicated Docker network
- **Port exposure**: Only necessary ports exposed to host
- **Secrets management**: Environment variables for sensitive data
- **Regular updates**: Security patches for base images

#### NFR-6: Production Parity
- **Service versions match production**: PostgreSQL, Redis, Nginx versions
- **Configuration similarity**: Docker config mirrors production
- **Environment variables**: Same var names as production
- **Network setup**: Similar networking to production

## Success Criteria

### Measurable Outcomes

1. **Developer Onboarding**:
   - ✅ New developer fully operational in < 15 minutes
   - ✅ Zero manual configuration steps
   - ✅ 90%+ success rate on first setup attempt

2. **Developer Productivity**:
   - ✅ 40% reduction in environment troubleshooting time
   - ✅ 80% reduction in "works on my machine" issues
   - ✅ 100% of developers use Docker environment (vs. manual setup)

3. **Environment Quality**:
   - ✅ All services start healthy 95%+ of the time
   - ✅ Environment resets complete in < 2 minutes
   - ✅ Memory usage stays under 4GB

4. **Testing Capabilities**:
   - ✅ All Argentina integrations testable locally (MercadoPago, AFIP)
   - ✅ Payment flows fully testable without external services
   - ✅ Performance testing possible with local monitoring

### Key Performance Indicators (KPIs)

**Short-term (1 month)**:
- 100% of active developers using Docker environment
- < 5 environment-related issues reported per week
- Average setup time < 10 minutes

**Medium-term (3 months)**:
- Zero "works on my machine" bugs in production
- 90% reduction in environment support requests
- 50% faster feature development (less env debugging)

**Long-term (6 months)**:
- Template replication includes Docker setup
- New verticals inherit environment with < 1 day customization
- Production parity score > 90%

## Constraints & Assumptions

### Technical Constraints

1. **Docker Requirements**:
   - Developers must have Docker Desktop or Docker Engine installed
   - Minimum Docker version: 20.10+, Docker Compose 2.0+
   - Minimum host resources: 8GB RAM, 20GB disk space

2. **Port Availability**:
   - Standard ports must be available: 3000, 5173, 5432, 6379, 9090, 3001
   - Conflicts with existing services will fail startup

3. **Operating System Support**:
   - Primary: macOS, Linux (Ubuntu/Debian)
   - Secondary: Windows with WSL2
   - Not supported: Native Windows without WSL2

4. **Argentina Service Mocks**:
   - MercadoPago mock won't replicate 100% of production behavior
   - AFIP mock focuses on common validation scenarios
   - WhatsApp mock is basic message simulation

### Timeline Constraints

- **Phase 1 (Core Services)**: 1 week
- **Phase 2 (Argentina Mocks)**: 1 week
- **Phase 3 (Monitoring Stack)**: 1 week
- **Phase 4 (Polish & Documentation)**: 3 days
- **Total**: 3.5 weeks

### Resource Constraints

- **Developer Time**: 1 senior developer dedicated
- **DevOps Support**: Part-time DevOps engineer for production parity validation
- **Testing**: All developers test setup on their machines
- **Documentation**: Technical writer for developer guide

### Assumptions

1. **Docker Adoption**: Team is willing to standardize on Docker
2. **Resource Availability**: Developer machines meet minimum specs
3. **Network Access**: Developers can pull Docker images from Docker Hub
4. **Buy-in**: Team agrees Docker is the standard development environment
5. **Maintenance**: DevOps team commits to maintaining Docker configs

## Out of Scope

### Explicitly NOT Building

1. **Production Deployment**: This is for local dev only, not production Docker configs
2. **CI/CD Pipelines**: Separate effort for CI/CD Docker environments
3. **Native App Development**: No iOS/Android emulators in Docker
4. **Load Testing at Scale**: Not designed for production-level load testing
5. **Multi-Developer Collaboration**: Not a shared dev environment (e.g., no Docker Swarm)
6. **Windows Native Support**: No support for Windows without WSL2
7. **Full MercadoPago Simulation**: Mock covers common cases, not all edge cases
8. **Video Consultation Services**: No WebRTC/video service mocks (future vertical)
9. **Performance Profiling Tools**: No APM tools like New Relic, Datadog in local stack
10. **Automated Testing Execution**: Docker environment enables testing but doesn't run tests

### Future Enhancements (V2+)

- Kubernetes local development (minikube/k3s)
- Multi-region simulation for LATAM expansion
- Advanced AFIP scenarios (e-invoicing edge cases)
- Integration with IDEs (VS Code dev containers)
- Automated environment health monitoring
- Performance benchmarking suite

## Docker & DevOps Best Practices

This section documents all best practices to be followed throughout the implementation.

### Docker Compose Best Practices

**1. Service Configuration**:
- Use specific image versions (never `:latest`)
- Named volumes for data persistence
- Health checks for all services
- Restart policies (`unless-stopped` for dev, `always` for prod)
- Resource limits (memory, CPU) to prevent runaway containers
- Explicit networks for service isolation

**2. File Organization**:
```
docker/
├── docker-compose.yml              # Base configuration
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production overrides
├── docker-compose.monitoring.yml   # Monitoring stack
├── docker-compose.mocks.yml        # Mock services
├── docker-compose.test.yml         # Testing environment
├── .env.example                    # Environment variable template
├── configs/                        # Service configurations
│   ├── nginx.conf
│   ├── redis.conf
│   └── postgres.conf
└── mocks/                          # Mock servers
    ├── mercadopago/
    ├── afip/
    ├── whatsapp/
    └── sms/
```

**3. Composition Strategy**:
- Use `extends` for shared configuration
- Use `profiles` for optional services
- Override pattern: base → environment → local overrides
- Environment variables hierarchy: `.env` → `docker-compose.yml` → service-specific

**4. Naming Conventions**:
- Services: `kebab-case` (e.g., `postgres`, `redis-commander`)
- Containers: `project-service-env` (e.g., `barberpro-postgres-dev`)
- Networks: `project-network-env` (e.g., `barberpro-dev-network`)
- Volumes: `project-service-data` (e.g., `barberpro-postgres-dev-data`)

**5. Dependency Management**:
- Use `depends_on` with health check conditions
- Ensure dependent services are healthy before starting
- Graceful shutdown ordering

**6. Security**:
- No production credentials in Docker files
- Use `.env` files for sensitive data (gitignored)
- `.env.example` for documentation only
- Network isolation between environments
- Minimal port exposure (only what's needed)

### Dockerfile Best Practices

**1. Multi-Stage Builds**:
```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

**2. Image Optimization**:
- Use Alpine Linux base images (smaller size)
- Layer caching optimization (COPY package.json before COPY .)
- .dockerignore file to exclude unnecessary files
- Minimize layers by combining RUN commands
- Remove build dependencies in production images

**3. Security**:
- Run as non-root user
- No secrets in images (use environment variables)
- Scan images for vulnerabilities
- Keep base images updated

### Makefile Best Practices

**1. Cross-Platform Compatibility**:
```makefile
# Detect OS for platform-specific commands
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    OPEN := open
endif
ifeq ($(UNAME_S),Linux)
    OPEN := xdg-open
endif

# Use tput for portable colored output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RED    := $(shell tput -Txterm setaf 1)
RESET  := $(shell tput -Txterm sgr0)
```

**2. PHONY Targets**:
```makefile
.PHONY: help up down restart clean
```

**3. Self-Documentation**:
```makefile
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / \
	    {printf "  ${CYAN}%-20s${RESET} %s\n", $$1, $$2}' $(MAKEFILE_LIST)
```

**4. Error Handling**:
```makefile
up: check-docker check-ports ## Start all services
	@echo "$(GREEN)[→]$(RESET) Starting services..."
	docker-compose up -d || (echo "$(RED)[✗]$(RESET) Failed to start services" && exit 1)
	@echo "$(GREEN)[✓]$(RESET) Services started successfully"
```

**5. Environment Variables**:
```makefile
# Load from .env if exists
ifneq (,$(wildcard .env))
    include .env
    export
endif
```

### Logging Best Practices

**1. Structured Logging**:
- JSON format for all services
- Consistent log levels (error, warn, info, debug, trace)
- Request ID tracking across services
- Timestamp in ISO 8601 format (UTC)

**2. Log Aggregation**:
- All services log to stdout/stderr
- Docker captures and routes to Loki
- Searchable via Grafana UI

**3. Log Rotation**:
- Docker logging driver with max-size
- Prevent disk space exhaustion

### Health Check Best Practices

**1. Comprehensive Health Checks**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 60s
```

**2. Health Endpoint Requirements**:
- Check database connectivity
- Check Redis connectivity
- Check critical dependencies
- Return 200 OK when healthy, 503 when not
- Include health details in response

### Performance Best Practices

**1. Resource Limits**:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

**2. Connection Pooling**:
- PostgreSQL: Configure max connections
- Redis: Configure max clients
- Backend: Connection pool sizing

**3. Caching Strategy**:
- Redis for session caching
- Application-level caching
- HTTP caching headers

### Development Workflow Best Practices

**1. Hot Reload Configuration**:
- Volume mounts for development
- Bind node_modules to container-specific location
- Watch mode for frontend/backend

**2. Database Workflow**:
- Automated migrations on startup
- Seed data for consistent testing
- Easy reset/restore capabilities

**3. Mock Service Integration**:
- Environment variable configuration
- Fallback to real services if needed
- Clear documentation on switching

## Dependencies

### External Dependencies

1. **Docker Platform**:
   - Docker Desktop (macOS/Windows) or Docker Engine (Linux)
   - Docker Compose V2
   - Minimum versions enforced

2. **Docker Images**:
   - `postgres:16-alpine`: PostgreSQL database
   - `redis:7-alpine`: Redis cache
   - `nginx:1.25-alpine`: Reverse proxy
   - `prom/prometheus:latest`: Metrics collection
   - `grafana/grafana:latest`: Visualization
   - `grafana/loki:latest`: Log aggregation
   - `adminer:latest`: Database UI
   - `rediscommander/redis-commander:latest`: Redis UI
   - `mailhog/mailhog:latest`: Email testing

3. **Network Access**:
   - Docker Hub access for image pulls
   - GitHub for repository access
   - npm registry for package installation

### Internal Dependencies

1. **Backend Services**:
   - Fastify server with /health endpoint
   - Prometheus metrics endpoint (/metrics)
   - Proper environment variable handling

2. **Database**:
   - Prisma migrations in working state
   - Seed data scripts functional
   - Schema compatible with PostgreSQL 16

3. **Frontend**:
   - SvelteKit dev server configuration
   - Environment variable support for API URLs
   - CORS configuration for Docker networking

4. **Project Structure**:
   - Organized docker/ directory
   - Environment variable templates (.env.example)
   - Documentation in docs/

### Team Dependencies

1. **DevOps Team**:
   - Review Docker configurations
   - Validate production parity
   - Approve service versions

2. **Backend Team**:
   - Implement health check endpoints
   - Add Prometheus metrics
   - Test environment variable configs

3. **Frontend Team**:
   - Test frontend connection to Dockerized backend
   - Validate CORS settings
   - Confirm environment variable usage

4. **QA Team**:
   - Validate mock services (MercadoPago, AFIP)
   - Test data scenarios
   - Integration test execution

## Implementation Notes

### Phased Rollout

**Phase 1: Docker Standardization & Makefile (Week 1)**
- Audit existing docker-compose files
- Consolidate into modular structure (base, dev, prod, monitoring, mocks, test)
- Eliminate duplication, apply best practices
- Version pin all images
- Create comprehensive Makefile with logging/feedback
- Implement colored output, progress indicators
- Test on macOS, Linux, WSL2
- Document all Makefile commands

**Deliverables**:
- `docker/docker-compose.*.yml` files (6 files)
- `Makefile` with 30+ commands
- `.env.example` with all variables documented
- `docker/README.md` with architecture documentation

**Phase 2: Argentina Mock Servers (Week 2)**
- Build MercadoPago mock server (Express.js)
- Build AFIP mock server (Express.js with SQLite)
- Build WhatsApp Business mock (Express.js)
- Build SMS mock server (Express.js)
- Integrate MailHog for email
- Add mock UIs/dashboards
- Create docker-compose.mocks.yml
- Integration testing with main app

**Deliverables**:
- `docker/mocks/mercadopago/` - MercadoPago mock
- `docker/mocks/afip/` - AFIP mock
- `docker/mocks/whatsapp/` - WhatsApp mock
- `docker/mocks/sms/` - SMS mock
- Mock server documentation
- Postman/Insomnia collections for testing

**Phase 3: Monitoring Stack (Week 3)**
- Prometheus setup with service discovery
- Grafana with pre-built BarberPro dashboards
- Loki log aggregation
- cAdvisor for container metrics
- Integrate with backend /metrics endpoint
- Create docker-compose.monitoring.yml
- Alert rules configuration
- Documentation

**Deliverables**:
- `docker/monitoring/prometheus/` - Config and rules
- `docker/monitoring/grafana/` - Dashboards (JSON)
- `docker/monitoring/loki/` - Config
- Monitoring documentation

**Phase 4: Testing & Polish (1 week)**
- Create docker-compose.test.yml
- End-to-end testing of all scenarios
- Performance optimization
- Error message improvements
- Cross-platform testing
- Team training sessions
- Video tutorials
- Troubleshooting guide

**Deliverables**:
- `docs/docker-setup-guide.md` - Complete setup guide
- `docs/docker-troubleshooting.md` - Common issues and solutions
- Video walkthrough
- Makefile cheat sheet

### Risk Mitigation

**Risk**: Developers resist Docker adoption
- **Mitigation**: Make setup easier than manual, provide excellent docs, dedicate support time

**Risk**: Performance issues on older machines
- **Mitigation**: Provide docker-compose.dev.yml lightweight option, document minimum specs

**Risk**: Argentina mock services don't match production
- **Mitigation**: Document differences, provide production sandbox fallback option

**Risk**: Docker configuration drift from production
- **Mitigation**: Automated checks, quarterly production parity reviews

### Rollback Plan

If Docker environment proves problematic:
1. Keep manual setup docs as fallback
2. Phase rollout allows stopping at any phase
3. Developers can opt-out temporarily
4. Review and address issues before forcing adoption

