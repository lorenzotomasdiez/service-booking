# Makefile Command Reference

Quick reference guide for all Docker environment commands. This cheat sheet provides fast access to common commands organized by workflow and use case.

## Table of Contents

- [Essential Commands](#essential-commands)
- [Environment Variants](#environment-variants)
- [Database Operations](#database-operations)
- [Monitoring & Debugging](#monitoring--debugging)
- [Service Control](#service-control)
- [Mock Services](#mock-services)
- [Monitoring Stack](#monitoring-stack)
- [Development Tools](#development-tools)
- [Maintenance](#maintenance)
- [Integration Testing](#integration-testing)
- [Quick Workflows](#quick-workflows)
- [Command Comparison](#command-comparison)

---

## Essential Commands

The core commands you'll use daily.

### `make help`
Show all available commands with descriptions.

```bash
make help
```

**Use when**: You forget a command or want to discover new commands.

---

### `make up`
Start the development environment (PostgreSQL, Redis, admin tools, mocks).

```bash
make up
```

**What it starts**:
- PostgreSQL (port 5432)
- pgAdmin (port 8080)
- Redis (port 6379)
- Redis Commander (port 8081)
- Argentina service mocks (ports 3001-3004, 8025)

**Use when**: Starting your workday or after `make down`.

**Time**: ~30 seconds

---

### `make down`
Stop all services gracefully (preserves data).

```bash
make down
```

**What it does**: Stops containers but keeps volumes (data safe).

**Use when**: End of workday or switching environments.

**Time**: ~10 seconds

---

### `make restart`
Restart all services (equivalent to `make down && make up`).

```bash
make restart
```

**Use when**:
- After configuration changes
- Services become unresponsive
- Need fresh start without data loss

**Time**: ~1 minute

---

### `make reset`
Complete environment reset (stop, clean, restart, ready for seed).

```bash
make reset
```

**Warning**: Deletes all data! Prompts for confirmation.

**What it does**:
1. Stops all services
2. Removes volumes (data loss!)
3. Starts fresh environment
4. Ready for `make db-migrate` and `make db-seed`

**Use when**:
- Major issues that restart doesn't fix
- Need completely fresh environment
- After major version updates

**Time**: ~2 minutes

---

### `make status`
Show health status of all services in table format.

```bash
make status
```

**Output**: Container names, status, and port mappings.

**Use when**: Quick check if services are running.

**Time**: Instant

---

### `make logs`
Tail logs from all services in real-time.

```bash
make logs
```

**Output**: Timestamped, colorized logs from all services.

**Exit**: Press Ctrl+C

**Use when**: Debugging multi-service interactions.

---

## Environment Variants

Different environment configurations for different development needs.

### `make dev`
Start minimal development environment (PostgreSQL, Redis, admin tools only).

```bash
make dev
```

**Services**: postgres, redis, pgadmin, redis-commander

**Use when**:
- Backend development without external services
- Want minimal resource usage
- Laptop battery saving

**Memory**: ~500MB

**Time**: ~20 seconds

---

### `make full`
Start everything (dev + monitoring + mocks).

```bash
make full
```

**Services**: All base + monitoring + mocks

**Use when**:
- Full-stack integration testing
- Testing payment flows
- Testing notifications
- Performance testing with monitoring

**Memory**: ~2-3GB

**Time**: ~1 minute

---

### `make monitoring`
Start base services + monitoring stack.

```bash
make monitoring
```

**Services**: Prometheus, Grafana, Loki, cAdvisor

**Access**:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Loki: http://localhost:3100
- cAdvisor: http://localhost:8080

**Use when**: Testing monitoring dashboards and metrics.

**Memory**: ~1GB

---

### `make mocks`
Start base services + Argentina service mocks.

```bash
make mocks
```

**Services**: MercadoPago, AFIP, WhatsApp, SMS, MailHog

**Access**:
- MercadoPago: http://localhost:3001/dashboard
- AFIP: http://localhost:3002/docs
- WhatsApp: http://localhost:3003/dashboard
- SMS: http://localhost:3004/dashboard
- Email (MailHog): http://localhost:8025

**Use when**: Testing payment flows and notifications.

**Memory**: ~1GB

---

### `make test`
Start isolated test environment (separate databases on different ports).

```bash
make test
```

**Services**:
- PostgreSQL Test (port 5433)
- Redis Test (port 6380)

**Use when**:
- Running integration tests
- CI/CD pipelines
- Don't want to affect dev database

**Environment variables**:
```bash
DATABASE_URL=postgresql://barberpro_test:test_password_change_in_ci@localhost:5433/barberpro_test
REDIS_URL=redis://localhost:6380
```

**Time**: ~15 seconds

---

## Database Operations

Commands for managing database migrations, seeding, backups, and shell access.

**Note**: Requires backend container to be running (use `make up` first).

### `make db-migrate`
Run Prisma migrations to update database schema.

```bash
make db-migrate
```

**Use when**:
- First-time setup
- After pulling code with new migrations
- New schema changes added

**Time**: ~5 seconds

---

### `make db-seed`
Seed database with test data.

```bash
make db-seed
```

**What it creates**: Users, services, bookings, test data.

**Use when**:
- After migrations
- Need fresh test data
- After `make db-reset`

**Time**: ~10 seconds

---

### `make db-reset`
Drop all tables, run migrations, and seed (complete database reset).

```bash
make db-reset
```

**Warning**: Deletes ALL data in database!

**What it does**: drop → migrate → seed

**Use when**:
- Major schema conflicts
- Corrupted data
- Need clean slate

**Time**: ~20 seconds

---

### `make db-backup`
Create a backup of the database to `docker/backup/` directory.

```bash
make db-backup
```

**Output**: `docker/backup/barberpro_YYYYMMDD_HHMMSS.sql`

**Use when**:
- Before risky operations
- Before `make clean` or `make db-reset`
- Creating data snapshots

**Time**: ~5-30 seconds (depends on data size)

---

### `make db-restore`
Restore database from a backup file.

```bash
make db-restore FILE=docker/backup/barberpro_20251012_143022.sql
```

**Warning**: Replaces ALL current data!

**Use when**:
- Recovering from data loss
- Restoring to previous state

**Time**: ~10-60 seconds (depends on backup size)

---

### `make db-shell`
Open interactive PostgreSQL shell.

```bash
make db-shell
```

**Commands inside shell**:
```sql
\dt                    -- List tables
\d users              -- Describe users table
\q                    -- Quit
SELECT * FROM users;  -- Run queries
```

**Use when**:
- Manual database queries
- Debugging data
- Inspecting schema

**Exit**: Type `\q` and press Enter

---

## Monitoring & Debugging

Commands for viewing logs, checking status, and monitoring health.

### `make logs`
Tail logs from all services (last 100 lines, then follow).

```bash
make logs
```

**Exit**: Press Ctrl+C

**Alias**: `make logs-all`

---

### `make logs-backend`
Show only backend service logs.

```bash
make logs-backend
```

**Use when**: Focused backend debugging.

---

### `make logs-frontend`
Show only frontend service logs.

```bash
make logs-frontend
```

**Use when**: Focused frontend debugging.

---

### `make status`
Show health status of all services in table format.

```bash
make status
```

**Output**: Container name, status, ports.

---

### `make ps`
List all BarberPro containers (running and stopped).

```bash
make ps
```

**Output**: Filtered list of BarberPro containers.

---

### `make stats`
Show real-time resource usage (CPU, memory, network, disk I/O).

```bash
make stats
```

**Exit**: Press Ctrl+C

**Use when**: Identifying performance bottlenecks.

---

### `make health`
Run comprehensive health checks on all services.

```bash
make health
```

**Output**: Health status of each service.

**Use when**:
- After `make up`
- Verifying environment is ready
- Troubleshooting failures

---

## Service Control

Commands for controlling individual services (advanced usage).

### `make shell-backend`
Open shell in backend container.

```bash
make shell-backend
```

**Commands inside**:
```bash
npm run lint           # Run linting
npm run test          # Run tests
npx prisma studio     # Open Prisma Studio
exit                  # Exit shell
```

**Use when**: Need to run backend commands manually.

---

### `make shell-frontend`
Open shell in frontend container.

```bash
make shell-frontend
```

**Use when**: Need to run frontend commands manually.

---

### `make exec`
Execute arbitrary commands in any service container.

```bash
make exec SERVICE=backend CMD='npm run test'
make exec SERVICE=frontend CMD='npm run build'
make exec SERVICE=postgres CMD='psql -U barberpro'
```

**Parameters**:
- `SERVICE`: Container name (backend, frontend, postgres, redis)
- `CMD`: Command to execute (wrap in quotes)

**Examples**:
```bash
# Run backend tests
make exec SERVICE=backend CMD='npm run test:unit'

# Check frontend build
make exec SERVICE=frontend CMD='npm run build'

# Check Redis
make exec SERVICE=redis CMD='redis-cli ping'
```

---

## Mock Services

Commands for managing Argentina service mocks.

### `make mocks`
Start all Argentina mock services.

```bash
make mocks
```

**Services started**:
- MercadoPago (port 3001)
- AFIP (port 3002)
- WhatsApp (port 3003)
- SMS (port 3004)
- MailHog (ports 1025, 8025)

---

### `make mocks-down`
Stop all mock services.

```bash
make mocks-down
```

---

### `make mocks-logs`
View logs from all mock services.

```bash
make mocks-logs
```

**Exit**: Press Ctrl+C

---

### `make mocks-reset`
Reset mock services (stop, remove volumes, start).

```bash
make mocks-reset
```

**Use when**: Need fresh mock data/state.

---

## Monitoring Stack

Commands for managing monitoring stack (Prometheus, Grafana, Loki).

### `make monitoring`
Start monitoring stack.

```bash
make monitoring
```

**Services**:
- Prometheus (http://localhost:9090)
- Grafana (http://localhost:3001)
- Loki (http://localhost:3100)
- cAdvisor (http://localhost:8080)

---

### `make monitoring-down`
Stop monitoring stack.

```bash
make monitoring-down
```

---

### `make monitoring-logs`
View monitoring stack logs.

```bash
make monitoring-logs
```

---

### `make grafana`
Open Grafana in browser.

```bash
make grafana
```

**Opens**: http://localhost:3001

**Credentials**: admin/admin (default)

---

## Development Tools

System information and diagnostic commands.

### `make version`
Show Docker, Docker Compose, Node.js, and npm versions.

```bash
make version
```

**Output**: System and tool versions.

---

### `make doctor`
Run comprehensive system diagnostics.

```bash
make doctor
```

**Checks**:
- Docker Engine status
- Docker Compose installation
- Node.js and npm
- Configuration files
- Port availability

**Use when**:
- Troubleshooting environment issues
- First-time setup verification
- Before reporting bugs

---

## Maintenance

Commands for environment maintenance and cleanup.

### `make reset`
Complete environment reset (covered in [Essential Commands](#make-reset)).

```bash
make reset
```

---

### `make clean`
Remove all containers, volumes, and networks (DESTRUCTIVE).

```bash
make clean
```

**Warning**: Deletes ALL data! Prompts for confirmation.

**Use when**:
- Need completely fresh start
- Before major version updates
- Resolving persistent Docker issues

**Time**: ~30 seconds

---

### `make rebuild`
Rebuild all Docker images and restart services.

```bash
make rebuild
```

**What it does**:
1. Stops services
2. Pulls latest base images
3. Rebuilds custom images
4. Starts services

**Use when**:
- After updating Dockerfiles
- After updating package.json
- Base images have updates

**Time**: ~2-5 minutes

---

### `make prune`
Remove unused Docker resources system-wide.

```bash
make prune
```

**Warning**: Affects ALL Docker projects on your system! Prompts for confirmation.

**Removes**:
- Stopped containers
- Unused networks
- Dangling images
- Build cache

**Use when**:
- Freeing disk space
- Regular maintenance
- Docker using too much disk

**Time**: ~30 seconds

---

### `make update`
Pull latest base images and rebuild services.

```bash
make update
```

**What it does**:
1. Pulls latest postgres, redis, etc.
2. Rebuilds custom images with `--no-cache`

**Use when**:
- Monthly maintenance
- Getting security updates
- Updating base images

**Follow with**: `make restart` to use updated images.

**Time**: ~5 minutes

---

### `make validate`
Validate all docker-compose files for syntax errors.

```bash
make validate
```

**Checks**: All .yml files in docker/ directory.

**Use when**:
- After editing compose files
- Before committing changes
- Troubleshooting startup issues

**Time**: ~5 seconds

---

## Integration Testing

Commands for running integration tests (added in Issue #9).

### `make test-integration`
Run full integration test suite.

```bash
make test-integration
```

**Tests**:
- Service connectivity
- Database operations
- API endpoints
- Health checks

**Time**: ~2-3 minutes

---

### `make test-integration-verbose`
Run integration tests with verbose output.

```bash
make test-integration-verbose
```

---

### `make test-integration-quick`
Run quick smoke test (essential checks only).

```bash
make test-integration-quick
```

**Time**: ~30 seconds

---

### `make test-payment`
Test payment flow (MercadoPago mock).

```bash
make test-payment
```

**Tests**:
- Payment creation
- Payment status queries
- Webhook delivery
- Refund processing

**Time**: ~1 minute

---

### `make test-payment-verbose`
Test payment flow with verbose output.

```bash
make test-payment-verbose
```

---

### `make test-notifications`
Test notification services (WhatsApp, SMS, Email).

```bash
make test-notifications
```

**Tests**:
- WhatsApp message sending
- SMS delivery
- Email capture (MailHog)

**Time**: ~1 minute

---

### `make test-notifications-verbose`
Test notifications with verbose output.

```bash
make test-notifications-verbose
```

---

### `make test-db`
Test database operations.

```bash
make test-db
```

**Tests**:
- Connection establishment
- Query execution
- Transaction handling
- Migration status

**Time**: ~30 seconds

---

### `make test-db-verbose`
Test database with verbose output.

```bash
make test-db-verbose
```

---

### `make test-db-skip-migrations`
Test database without running migrations.

```bash
make test-db-skip-migrations
```

---

### `make test-all`
Run all integration tests (integration, payment, notifications, database).

```bash
make test-all
```

**Time**: ~5-7 minutes

---

### `make test-ci`
Run tests suitable for CI/CD (quick, non-interactive).

```bash
make test-ci
```

**Time**: ~2 minutes

---

## Quick Workflows

Common task sequences organized by scenario.

### First-Time Setup

Complete setup from scratch:

```bash
# 1. Check system requirements
make doctor

# 2. Start environment
make up

# 3. Run database migrations
make db-migrate

# 4. Seed database
make db-seed

# 5. Verify everything works
make health

# 6. Start development servers (in separate terminals)
cd backend && npm run dev
cd frontend && npm run dev
```

**Total time**: ~3-4 minutes

---

### Daily Development Workflow

Typical start-of-day routine:

```bash
# Morning: Start environment
make up

# Check everything is healthy
make status

# Start development servers (separate terminals)
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# ... work work work ...

# Check logs if issues arise
make logs

# Evening: Stop environment
make down
```

---

### Switching Git Branches

When switching to a branch with schema changes:

```bash
# 1. Stop current environment
make down

# 2. Switch branch
git checkout feature/new-schema

# 3. Pull latest changes
git pull

# 4. Restart with fresh database
make reset

# 5. Run migrations
make db-migrate

# 6. Seed database
make db-seed
```

---

### Debugging Issues

Systematic debugging workflow:

```bash
# 1. Check overall health
make health

# 2. Check service status
make status

# 3. View logs
make logs

# 4. Check specific service logs
make logs-backend
# or
make logs-frontend

# 5. Check resource usage
make stats

# 6. Run diagnostics
make doctor

# 7. If still broken, try restart
make restart

# 8. If restart doesn't help, reset
make reset
```

---

### Testing Payment Flow

Complete payment testing workflow:

```bash
# 1. Start full environment with mocks
make full

# 2. Verify mocks are running
curl http://localhost:3001/health  # MercadoPago
curl http://localhost:8025         # MailHog

# 3. Run payment tests
make test-payment

# 4. Open mock dashboards
open http://localhost:3001/dashboard  # Payments
open http://localhost:8025            # Emails

# 5. Test manually in application
# Create booking → Process payment → Check email

# 6. Check logs if issues
make mocks-logs
```

---

### Database Maintenance

Backup before risky operations:

```bash
# 1. Create backup
make db-backup

# 2. Note the backup file name
# Output: docker/backup/barberpro_20251012_143022.sql

# 3. Perform risky operation
make db-reset
# or make changes...

# 4. If something breaks, restore
make db-restore FILE=docker/backup/barberpro_20251012_143022.sql
```

---

### Weekly Maintenance

Regular weekly cleanup:

```bash
# 1. Check Docker disk usage
docker system df

# 2. Update images (monthly)
make update
make restart

# 3. Clean up unused resources
make prune

# 4. Verify compose files
make validate

# 5. Run integration tests
make test-all
```

---

### Complete Fresh Start

Nuclear option when nothing else works:

```bash
# 1. Stop everything
make down

# 2. Remove all BarberPro data
make clean

# 3. Remove all Docker resources (careful!)
make prune

# 4. Rebuild everything
make rebuild

# 5. Run migrations and seed
make db-migrate
make db-seed

# 6. Verify everything works
make health
```

**Total time**: ~5-10 minutes

---

## Command Comparison

### Start Commands

| Command | Services | Memory | Time | Use Case |
|---------|----------|--------|------|----------|
| `make dev` | Postgres, Redis, Admin | ~500MB | 20s | Minimal development |
| `make up` | Dev + Mocks | ~1.5GB | 30s | Full development (default) |
| `make full` | Dev + Mocks + Monitoring | ~3GB | 1m | Complete testing |
| `make test` | Test DB + Redis | ~300MB | 15s | Integration testing |

---

### Reset Commands

| Command | Data Loss | Scope | Time | Confirmation |
|---------|-----------|-------|------|--------------|
| `make restart` | None | Services only | 1m | No |
| `make db-reset` | Database only | Database only | 20s | No |
| `make reset` | All BarberPro | BarberPro only | 2m | Yes |
| `make clean` | All BarberPro | BarberPro only | 30s | Yes |
| `make prune` | All Docker | System-wide | 30s | Yes |

---

### Log Commands

| Command | Output | Use Case |
|---------|--------|----------|
| `make logs` | All services | General debugging |
| `make logs-backend` | Backend only | Backend debugging |
| `make logs-frontend` | Frontend only | Frontend debugging |
| `make mocks-logs` | All mocks | Mock service debugging |
| `make monitoring-logs` | Monitoring stack | Monitoring debugging |

---

### Health Commands

| Command | Output | Speed |
|---------|--------|-------|
| `make status` | Container status table | Instant |
| `make ps` | Container list | Instant |
| `make health` | Detailed health checks | 3s |
| `make stats` | Real-time resource usage | Continuous |
| `make doctor` | Full system diagnostics | 5s |

---

## Tips & Best Practices

### Daily Usage

1. **Start of day**: `make up` → `make status` → Start dev servers
2. **End of day**: `make down` (preserves data for tomorrow)
3. **Before breaks**: `make down` (saves battery/resources)

### Debugging

1. **Always start with**: `make health` or `make status`
2. **Check logs**: `make logs` before asking for help
3. **Try restart first**: `make restart` before `make reset`
4. **Save diagnostics**: `make doctor > diagnostics.txt`

### Performance

1. **Use minimal setup**: `make dev` for backend-only work
2. **Stop unused services**: `make mocks-down`, `make monitoring-down`
3. **Regular cleanup**: `make prune` monthly
4. **Monitor resources**: `make stats` to identify bottlenecks

### Data Safety

1. **Backup before resets**: `make db-backup` before `make db-reset`
2. **Use test environment**: `make test` for destructive tests
3. **Understand data loss**: Commands with confirmations delete data
4. **Regular backups**: `make db-backup` before major changes

### Troubleshooting

1. **Read command output**: Make commands provide helpful error messages
2. **Check prerequisites**: Some commands require services running
3. **Use verbose flags**: Add `--verbose` to test commands for details
4. **Escalate gradually**: restart → reset → clean → prune

---

## Command Categories Summary

### System Info (3 commands)
`help`, `version`, `doctor`

### Lifecycle (5 commands)
`up`, `down`, `restart`, `rebuild`, `clean`

### Environments (5 commands)
`dev`, `full`, `monitoring`, `mocks`, `test`

### Database (6 commands)
`db-migrate`, `db-seed`, `db-reset`, `db-backup`, `db-restore`, `db-shell`

### Monitoring (7 commands)
`logs`, `logs-backend`, `logs-frontend`, `status`, `ps`, `stats`, `health`

### Development (3 commands)
`shell-backend`, `shell-frontend`, `exec`

### Mock Services (4 commands)
`mocks`, `mocks-down`, `mocks-logs`, `mocks-reset`

### Monitoring Stack (4 commands)
`monitoring`, `monitoring-down`, `monitoring-logs`, `grafana`

### Maintenance (4 commands)
`reset`, `prune`, `update`, `validate`

### Integration Testing (11 commands)
`test-integration`, `test-payment`, `test-notifications`, `test-db`, `test-all`, etc.

**Total**: 52+ commands

---

## Additional Resources

- **Detailed Documentation**: [Docker README](../docker/README.md)
- **Setup Guide**: [Docker Setup Guide](./docker-setup-guide.md)
- **Architecture**: [Docker Architecture](./docker-architecture.md)
- **Troubleshooting**: [Docker Troubleshooting](./docker-troubleshooting.md)
- **FAQ**: [Docker FAQ](./docker-faq.md)

---

**Last Updated**: 2025-10-12
**Makefile Version**: 1.0.0
**Total Commands**: 52+

For updates to this document, please submit a pull request or create an issue.
