# Docker Environment Changelog

This document tracks all significant changes to the Docker environment, including new services, configuration changes, breaking changes, and upgrade instructions.

## Format

Each release follows this format:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features or services

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security improvements

### Breaking Changes
- Changes that require manual intervention

### Migration Guide
- Steps to upgrade from previous version
```

---

## [2.0.0] - 2025-10-12

### Added

#### Comprehensive Makefile Interface
- **45+ make commands** for managing Docker environment
- Colored, user-friendly output with visual indicators
- Cross-platform compatibility (macOS, Linux, WSL2)
- Comprehensive health checks and diagnostics
- Commands organized into categories:
  - Setup & Info: `help`, `version`, `doctor`
  - Lifecycle: `up`, `down`, `restart`, `rebuild`, `clean`
  - Environments: `dev`, `full`, `monitoring`, `mocks`, `test`
  - Database: `db-migrate`, `db-seed`, `db-reset`, `db-backup`, `db-restore`, `db-shell`
  - Dev Tools: `shell-backend`, `shell-frontend`, `exec`
  - Monitoring: `logs`, `status`, `ps`, `stats`, `health`, `logs-backend`, `logs-frontend`
  - Maintenance: `reset`, `prune`, `update`, `validate`
  - Integration Testing: `test-integration`, `test-payment`, `test-notifications`, `test-db`

#### Argentina Mock Services
- **MercadoPago Mock** (port 3001) - Payment gateway simulation
- **AFIP Mock** (port 3002) - Tax authority invoice simulation
- **WhatsApp Mock** (port 3003) - Business messaging API
- **SMS Mock** (port 3004) - SMS gateway for Argentina
- **MailHog** (ports 1025/8025) - Email capture and testing
- See [docker/mocks/README.md](../docker/mocks/README.md) for details

#### Monitoring Stack
- **Prometheus** (port 9090) - Metrics collection
- **Grafana** (port 3001) - Metrics visualization with pre-built dashboards
- **Loki** (port 3100) - Log aggregation
- **cAdvisor** (port 8080) - Container resource monitoring
- Pre-configured dashboards for API, PostgreSQL, Redis, and containers
- See [docker/monitoring/README.md](../docker/monitoring/README.md) for details

#### Integration Testing
- Comprehensive test scripts in `scripts/` directory
- `test-integration.sh` - Full integration test suite
- `test-payment-flow.sh` - Payment flow testing
- `test-notifications.sh` - Notification services testing
- `test-database.sh` - Database operations testing
- Test scripts support `--verbose` and `--quick` modes
- CI/CD ready with `make test-ci`

#### Development Tools
- **Database backup/restore** functionality
- **Health check commands** with detailed status
- **Resource monitoring** with `make stats`
- **Shell access** to containers with `make shell-<service>`
- **Arbitrary command execution** with `make exec`

#### Documentation
- Comprehensive Makefile command reference in `docker/README.md`
- Platform-specific notes (macOS, Linux, WSL2)
- Common workflow examples
- Troubleshooting guide
- Environment variable documentation

### Changed

#### Docker Compose Structure
- **Multi-file composition** approach:
  - `docker-compose.yml` - Base infrastructure
  - `docker-compose.dev.yml` - Development overrides
  - `docker-compose.mocks.yml` - Argentina mock services
  - `docker-compose.monitoring.yml` - Observability stack
  - `docker-compose.test.yml` - Testing environment
- Services can be composed flexibly based on needs

#### Container Naming
- **Consistent naming convention**: `barberpro-<service>-<environment>`
- Examples:
  - `barberpro-postgres` (base services)
  - `barberpro-backend-dev` (development)
  - `barberpro-postgres-test` (testing)
  - `barberpro-mercadopago-mock` (mocks)

#### Network Architecture
- **Unified network**: `barberpro-network` for all services
- Container-to-container communication via service names
- Host-to-container communication via localhost
- Proper isolation between dev and test environments

#### Environment Variables
- Restructured for clarity and Docker networking
- Separate variables for container names vs localhost
- Webhook URLs use service names (e.g., `http://backend:3000`)
- Frontend URLs use localhost (e.g., `http://localhost:3000`)
- Comprehensive `.env.example` with inline documentation

#### Health Checks
- **All services** now have health checks
- Configurable intervals, timeouts, and retries
- Health status visible with `make health`
- Faster startup detection

### Removed

- **Direct docker-compose commands** (replaced by Makefile)
- **Manual service management** (replaced by make targets)
- **Undocumented environment variables**

### Fixed

- **Port conflicts** detection before service startup
- **Docker daemon** status checking before operations
- **Volume persistence** across restarts
- **Network connectivity** between services
- **Database connection** reliability with proper health checks
- **Container startup order** with proper depends_on and health checks

### Security

- **Admin credentials** separated into `.env` (not committed)
- **Default passwords** clearly marked as "CHANGE IN PRODUCTION"
- **JWT secrets** with minimum length requirements
- **Database passwords** with strong default generation instructions
- **Production security checklist** in documentation

### Breaking Changes

#### 1. Makefile is Now Primary Interface

**Before**:
```bash
docker-compose up -d
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

**After**:
```bash
make up
make dev
```

**Migration**: All docker-compose commands have Makefile equivalents. Use `make help` to see full command list.

#### 2. Container Naming Changed

**Before**:
- `postgres`
- `redis`
- `backend`

**After**:
- `barberpro-postgres`
- `barberpro-redis`
- `barberpro-backend-dev`

**Migration**: Update any scripts that reference container names. Use `make ps` to see current names.

#### 3. Network Name Changed

**Before**:
- `service-booking_default`
- `service-booking-network`

**After**:
- `barberpro-network`

**Migration**: Docker will create the new network automatically. Old networks can be removed with `docker network prune`.

#### 4. Environment Variable Structure

**Before**:
```bash
API_URL=http://localhost:3000
```

**After**:
```bash
# For browser/host access
VITE_API_URL=http://localhost:3000
# For container-to-container
BACKEND_URL=http://backend:3000
# For webhooks
MERCADOPAGO_WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago
```

**Migration**: Copy `.env.example` to `.env` and review all variables. Pay special attention to URLs and service names.

#### 5. Volume Names Changed

**Before**:
- `service-booking_postgres_data`
- `service-booking_redis_data`

**After**:
- `barberpro-postgres-data`
- `barberpro-redis-data`

**Migration**:
1. Backup existing data: `make db-backup`
2. Stop old services: `docker-compose down`
3. Start new services: `make up`
4. Restore data if needed: `make db-restore FILE=backup.sql`

### Migration Guide from 1.x to 2.0

#### Prerequisites
- Backup your database: `docker-compose exec postgres pg_dump -U barberpro barberpro_dev > backup.sql`
- Note your custom environment variables
- Ensure Docker Desktop is running

#### Step 1: Update Code
```bash
git pull origin main
```

#### Step 2: Stop Old Environment
```bash
# Using old commands
docker-compose down

# Or manually
docker stop $(docker ps -aq --filter name=service-booking)
```

#### Step 3: Update Environment Variables
```bash
# Backup your old .env
cp .env .env.backup

# Copy new template
cp .env.example .env

# Manually merge your custom values from .env.backup
# Pay attention to:
# - Database URLs (now use 'postgres' instead of 'localhost')
# - Redis URLs (now use 'redis' instead of 'localhost')
# - Webhook URLs (now use 'backend' instead of 'localhost')
```

#### Step 4: Install/Update Dependencies
```bash
npm run install:all
```

#### Step 5: Start New Environment
```bash
# Check system is ready
make doctor

# Start services
make up

# Run migrations
make db-migrate

# Restore data (if needed)
make db-restore FILE=backup.sql

# Or seed fresh data
make db-seed
```

#### Step 6: Verify
```bash
# Check all services are healthy
make health

# Check status
make status

# View logs
make logs
```

#### Step 7: Clean Up Old Resources (Optional)
```bash
# Remove old containers
docker container prune -f

# Remove old volumes (WARNING: deletes old data)
docker volume prune -f

# Remove old networks
docker network prune -f

# Remove old images
docker image prune -a -f
```

---

## [1.0.0] - 2024-09-15

### Added

Initial Docker environment with basic infrastructure:

- PostgreSQL 16 for database
- Redis 7 for caching
- pgAdmin 4 for database management
- Redis Commander for Redis management
- Basic docker-compose.yml configuration
- Development and production compose files
- Basic environment variable configuration

### Configuration

- Default ports: 3000 (backend), 5173 (frontend), 5432 (postgres), 6379 (redis)
- Basic health checks for postgres and redis
- Volume mounts for development hot-reload
- Network configuration for service communication

---

## [0.5.0] - 2024-08-01 (Pre-Docker)

### Removed

- Local installation of PostgreSQL
- Local installation of Redis
- Manual service management
- Platform-specific installation scripts

### Migration Notes

This was the transition from local development to Docker-based development. No backwards compatibility needed as this was a complete architecture change.

---

## Upcoming Changes

### Planned for 2.1.0 (Q1 2025)

#### Production Optimizations
- Multi-stage builds for smaller images
- Health check optimization for faster startups
- Resource limit tuning based on load testing
- Logging configuration optimization

#### Security Enhancements
- Docker secrets integration
- Non-root container users
- Security scanning integration
- TLS certificate management

#### CI/CD Improvements
- GitHub Actions integration
- Automated testing in CI
- Docker image caching
- Deployment automation

#### Developer Experience
- VS Code dev container configuration
- IntelliJ IDEA run configurations
- Browser extension for quick access to services
- Auto-open services after startup

### Under Consideration for 2.2.0

- Kubernetes deployment configurations
- Helm charts for production
- Service mesh integration (Istio/Linkerd)
- Distributed tracing (Jaeger/Zipkin)
- Advanced monitoring dashboards
- Auto-scaling configurations
- Blue-green deployment support
- Canary deployment support

---

## Version History Summary

| Version | Date       | Major Changes |
|---------|------------|---------------|
| 2.0.0   | 2025-10-12 | Comprehensive Makefile, Mock Services, Monitoring, Integration Testing |
| 1.0.0   | 2024-09-15 | Initial Docker environment with basic infrastructure |
| 0.5.0   | 2024-08-01 | Pre-Docker (local development) |

---

## How to Stay Updated

### For Developers

1. **Watch this file** for changes
2. **Run `make doctor`** after pulling updates to check for issues
3. **Review migration guides** when major versions change
4. **Test in development** before deploying to production
5. **Subscribe to release notifications** on GitHub

### For DevOps

1. **Review breaking changes** before deploying
2. **Test migrations** in staging environment
3. **Backup databases** before major updates
4. **Monitor service health** after updates
5. **Keep Docker images updated** monthly

### Notification Channels

- **Slack**: #docker-updates channel
- **GitHub**: Release notifications
- **Email**: dev@barberpro.com.ar for critical updates

---

## Contributing

When making changes to the Docker environment:

1. **Update this changelog** with your changes
2. **Follow semantic versioning**:
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes
3. **Document migration steps** for breaking changes
4. **Test on all platforms** (macOS, Linux, WSL2)
5. **Update related documentation**

### Change Request Process

1. Create an issue describing the proposed change
2. Discuss with team in #docker-environment
3. Create a PR with changes + changelog update
4. Test thoroughly in development
5. Get review from at least one DevOps team member
6. Merge and announce in #engineering

---

## Rollback Procedures

If you need to rollback to a previous version:

### Quick Rollback (Same Day)
```bash
# Stop current environment
make down

# Checkout previous version
git checkout v1.0.0

# Start old environment
docker-compose up -d

# Restore database backup if needed
docker-compose exec postgres psql -U barberpro barberpro_dev < backup.sql
```

### Full Rollback (Production)
```bash
# 1. Stop services
make down

# 2. Checkout stable version
git checkout v1.0.0

# 3. Backup current data
make db-backup

# 4. Start old environment
make up

# 5. Verify health
make health

# 6. Restore data if needed
make db-restore FILE=backup.sql

# 7. Monitor logs
make logs
```

---

## Support

For questions about Docker environment changes:

- **Documentation**: [docker/README.md](../docker/README.md)
- **Slack**: #docker-environment
- **GitHub Issues**: Tag with `docker` label
- **Email**: devops@barberpro.com.ar

---

**Document Maintenance**: This changelog is updated with every Docker environment change. Last reviewed: 2025-10-12
