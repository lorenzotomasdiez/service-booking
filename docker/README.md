# BarberPro Docker Environment

This directory contains all Docker-related configurations for the BarberPro service booking platform, optimized for Argentina deployment. The environment is managed through a comprehensive **Makefile** that provides a unified, cross-platform interface for all Docker operations.

## Table of Contents

- [Quick Start](#quick-start)
- [Why Use the Makefile?](#why-use-the-makefile)
- [Complete Command Reference](#complete-command-reference)
  - [Setup & Info](#setup--info)
  - [Lifecycle Management](#lifecycle-management)
  - [Environment Variants](#environment-variants)
  - [Database Operations](#database-operations)
  - [Development Tools](#development-tools)
  - [Monitoring & Debugging](#monitoring--debugging)
  - [Maintenance](#maintenance)
- [Common Workflows](#common-workflows)
- [Platform-Specific Notes](#platform-specific-notes)
- [npm Script Integration](#npm-script-integration)
- [Troubleshooting](#troubleshooting)
- [Directory Structure](#directory-structure)
- [Environment Variables](#environment-variables)

## Quick Start

The Makefile provides a simple, consistent interface for managing your Docker environment. Here are the four essential commands to get started:

```bash
# 1. Check your system is ready
make doctor

# 2. Start the development environment
make up

# 3. View all available commands
make help

# 4. Stop everything when done
make down
```

That's it! You're ready to develop. Start your backend and frontend services:

```bash
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

## Why Use the Makefile?

The Makefile provides several advantages over raw docker-compose commands:

1. **Colored, User-Friendly Output**: Easy-to-read status messages with visual indicators
2. **Cross-Platform Compatibility**: Works consistently on macOS, Linux, and WSL2
3. **Safety Checks**: Validates Docker is running and ports are available before starting
4. **Simplified Commands**: Short, memorable commands instead of long docker-compose flags
5. **Environment Management**: Easily switch between dev, test, monitoring, and full environments
6. **Comprehensive Health Checks**: Built-in diagnostics and health monitoring
7. **Consistent Interface**: Same commands work across all team members' machines

## Complete Command Reference

### Setup & Info

Commands to check your system and get information about the environment.

#### `make help`
Show all available commands with descriptions and usage examples.

```bash
make help
```

**Output**: Displays a formatted help menu with all commands organized by category.

#### `make version`
Display versions of Docker, Docker Compose, Node.js, npm, and system information.

```bash
make version
```

**Example Output**:
```
System Information:
  OS:              macOS (Darwin)

Docker Environment:
  Docker version 24.0.6, build ed223bc
  docker-compose version 1.29.2, build 5becea4c

Node.js Environment:
  Node.js:         v20.11.0
  npm:             10.2.4
```

#### `make doctor`
Run comprehensive system diagnostics to check prerequisites, configuration files, and port availability.

```bash
make doctor
```

**Checks**:
- Docker Engine status
- Docker Compose installation
- Node.js and npm versions
- Required configuration files
- Port availability (3000, 5173, 5432, 6379)

**Use Cases**:
- Troubleshooting environment issues
- Verifying setup after fresh installation
- Checking for port conflicts before starting services

---

### Lifecycle Management

Commands for starting, stopping, and managing service lifecycles.

#### `make up`
Start the full development environment (PostgreSQL, Redis, admin tools, and Argentina mocks).

```bash
make up
```

**What it does**:
- Checks Docker is running
- Validates ports are available
- Starts all development services
- Waits for services to be healthy
- Displays service URLs and next steps

**Services Started**:
- PostgreSQL (localhost:5432)
- pgAdmin (http://localhost:8080)
- Redis (localhost:6379)
- Redis Commander (http://localhost:8081)

**Note**: This is the default command most developers will use daily.

#### `make down`
Stop all services gracefully.

```bash
make down
```

**What it does**:
- Stops all running containers
- Preserves volumes (data is not lost)
- Cleans up networks

**Use Cases**:
- End of work day
- Switching between environments
- Before running `make clean`

#### `make restart`
Restart all services (equivalent to `make down && make up`).

```bash
make restart
```

**Use Cases**:
- Apply configuration changes
- Recover from service failures
- Reset service state without losing data

#### `make rebuild`
Rebuild all Docker images and restart services.

```bash
make rebuild
```

**What it does**:
1. Stops all services
2. Pulls latest base images
3. Rebuilds custom images
4. Starts services with new images

**Use Cases**:
- After updating Dockerfiles
- After updating dependencies in package.json
- When base images have security updates

**Note**: This does NOT delete volumes (your data is safe).

#### `make clean`
Remove all containers, volumes, and networks (DESTRUCTIVE).

```bash
make clean
```

**Warning**: This deletes ALL data including database contents. You will be prompted to confirm.

**What it does**:
1. Stops all services
2. Removes all containers
3. Removes all volumes (PostgreSQL data, Redis data, pgAdmin data)
4. Removes networks

**Use Cases**:
- Complete fresh start needed
- Resolving persistent Docker issues
- Before major version updates

---

### Environment Variants

Commands to start specific environment configurations based on your development needs.

#### `make dev`
Start minimal development environment (PostgreSQL, Redis, admin tools only).

```bash
make dev
```

**Services**: postgres, redis, pgadmin, redis-commander
**Use Cases**: Backend development without mocks or monitoring

#### `make full`
Start everything (dev + monitoring + mocks).

```bash
make full
```

**Services**: All base services + monitoring stack + Argentina mocks
**Use Cases**:
- Full-stack integration testing
- Performance testing with monitoring
- Testing payment integrations

**Note**: Monitoring and mocks are currently placeholders (planned for future phases).

#### `make monitoring`
Start base services + monitoring stack.

```bash
make monitoring
```

**Future Services**: Prometheus, Grafana, Loki
**Use Cases**: Testing monitoring dashboards and metrics collection

**Note**: Currently a placeholder (Phase 3 implementation).

#### `make mocks`
Start base services + Argentina service mocks.

```bash
make mocks
```

**Future Services**: MercadoPago mock, AFIP mock, WhatsApp mock
**Use Cases**: Testing payment flows without real API credentials

**Note**: Currently a placeholder (Phase 2 implementation).

#### `make test`
Start isolated test environment (separate databases on different ports).

```bash
make test
```

**Services**:
- PostgreSQL Test (localhost:5433)
- Redis Test (localhost:6380)

**Use Cases**:
- Running integration tests
- CI/CD pipelines
- Isolated testing without affecting dev database

**Environment Variables**:
```bash
DATABASE_URL=postgresql://barberpro_test:test_password_change_in_ci@localhost:5433/barberpro_test
REDIS_URL=redis://localhost:6380
```

---

### Database Operations

Commands for managing database migrations, seeding, backups, and shell access.

**Important**: These commands require the backend container to be running (use `make up` first).

#### `make db-migrate`
Run Prisma migrations to update database schema.

```bash
make db-migrate
```

**What it does**: Executes `npm run db:migrate` inside the backend container

**Use Cases**:
- Apply new schema changes
- After pulling code with new migrations
- Setting up database for first time

#### `make db-seed`
Seed database with test data.

```bash
make db-seed
```

**What it does**: Executes `npm run seed` inside the backend container

**Use Cases**:
- Populate database with sample data
- After `make db-reset`
- Setting up demo environments

#### `make db-reset`
Drop all tables, run migrations, and seed (complete database reset).

```bash
make db-reset
```

**Warning**: This deletes ALL data in the database!

**What it does**: Executes `npm run db:reset` inside the backend container (equivalent to Prisma's reset command)

**Use Cases**:
- Major schema changes requiring fresh start
- Resolving migration conflicts
- Resetting to clean state

#### `make db-backup`
Create a backup of the database to `docker/backup/` directory.

```bash
make db-backup
```

**What it does**:
- Creates timestamped SQL dump file
- Saves to `docker/backup/barberpro_YYYYMMDD_HHMMSS.sql`

**Example**:
```bash
make db-backup
# Creates: docker/backup/barberpro_20251010_143022.sql
```

**Use Cases**:
- Before major migrations
- Before running `make clean` or `make db-reset`
- Creating snapshots of important data states

#### `make db-restore`
Restore database from a backup file.

```bash
make db-restore FILE=docker/backup/barberpro_20251010_143022.sql
```

**Warning**: This replaces ALL current data!

**What it does**:
- Restores database from specified SQL dump
- Lists recent backups if FILE parameter is omitted

**Use Cases**:
- Recovering from accidental data loss
- Restoring to previous state
- Copying production data to development

#### `make db-shell`
Open interactive PostgreSQL shell.

```bash
make db-shell
```

**What it does**: Opens `psql` connected to the development database

**Example Session**:
```sql
psql (16.0)
Type "help" for help.

barberpro_dev=# \dt
-- List all tables

barberpro_dev=# SELECT * FROM users LIMIT 5;
-- Query data

barberpro_dev=# \q
-- Exit
```

**Use Cases**:
- Manual database queries
- Debugging data issues
- Inspecting schema

---

### Development Tools

Commands for interactive access to service containers.

#### `make shell-backend`
Open shell in backend container.

```bash
make shell-backend
```

**Use Cases**:
- Inspect backend file system
- Run npm commands manually
- Debug backend issues

**Example**:
```bash
make shell-backend
# Now in backend container
$ npm run lint
$ exit
```

#### `make shell-frontend`
Open shell in frontend container.

```bash
make shell-frontend
```

**Use Cases**:
- Inspect frontend file system
- Run build commands
- Debug frontend issues

#### `make exec`
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

# Check Redis connection
make exec SERVICE=redis CMD='redis-cli ping'
```

---

### Monitoring & Debugging

Commands for viewing logs, checking status, and monitoring health.

#### `make logs`
Tail logs from all services in real-time.

```bash
make logs
```

**What it does**: Shows last 100 lines of logs and follows new output

**Output**: Timestamped, colorized logs from all services
**Exit**: Press Ctrl+C to stop

**Use Cases**:
- Monitoring all services simultaneously
- Debugging multi-service interactions
- Watching startup sequence

#### `make status`
Show health status of all services in table format.

```bash
make status
```

**Example Output**:
```
╔════════════════════════════════════════════════════════════════╗
║                       Service Status                          ║
╚════════════════════════════════════════════════════════════════╝

NAME                   STATUS              PORTS
barberpro-postgres     Up 5 minutes        0.0.0.0:5432->5432/tcp
barberpro-redis        Up 5 minutes        0.0.0.0:6379->6379/tcp
barberpro-pgadmin      Up 5 minutes        0.0.0.0:8080->80/tcp
```

**Use Cases**:
- Quick overview of running services
- Checking if services are up
- Viewing port mappings

#### `make ps`
List all BarberPro containers (running and stopped).

```bash
make ps
```

**Output**: Filtered list showing only BarberPro-related containers

**Use Cases**:
- Checking container count
- Identifying stopped containers
- Viewing container names

#### `make stats`
Show real-time resource usage (CPU, memory, network, disk I/O).

```bash
make stats
```

**Output**: Live updating table with resource metrics for each container

**Exit**: Press Ctrl+C to stop

**Use Cases**:
- Identifying resource-heavy services
- Monitoring memory leaks
- Performance optimization

#### `make health`
Run comprehensive health checks on all services.

```bash
make health
```

**Example Output**:
```
Running health checks on all services...

  postgres:            [✓] Healthy
  redis:               [✓] Healthy
  pgadmin:             [ℹ] Running (no health check)
  redis-commander:     [ℹ] Running (no health check)
  backend:             [✓] Healthy
  frontend:            [✓] Healthy

[✓] All services are healthy (6/6)
```

**Use Cases**:
- Verifying environment after `make up`
- Troubleshooting service failures
- Pre-deployment checks

#### `make logs-backend`
Show only backend service logs.

```bash
make logs-backend
```

**Use Cases**: Focused debugging of backend issues

#### `make logs-frontend`
Show only frontend service logs.

```bash
make logs-frontend
```

**Use Cases**: Focused debugging of frontend issues

---

### Maintenance

Commands for environment maintenance, cleanup, and validation.

#### `make reset`
Complete environment reset (down, clean, up, ready for seed).

```bash
make reset
```

**Warning**: This is destructive! You will be prompted to confirm.

**What it does**:
1. Stop all services (`make down`)
2. Remove all volumes (data loss!)
3. Start fresh environment (`make up`)
4. Display next steps (migrate, seed)

**Use Cases**:
- Starting completely fresh
- Resolving persistent issues
- Major version upgrades

**Difference from `make clean`**: `make reset` also restarts services after cleaning.

#### `make prune`
Remove unused Docker resources system-wide.

```bash
make prune
```

**Warning**: Affects all Docker resources, not just BarberPro!

**What it does**:
- Removes stopped containers
- Removes unused networks
- Removes dangling images
- Removes build cache

**Use Cases**:
- Freeing disk space
- Cleaning up after development
- Regular maintenance

**Caution**: This is a system-wide cleanup. Other Docker projects may be affected.

#### `make update`
Pull latest base images and rebuild services.

```bash
make update
```

**What it does**:
1. Pull latest versions of postgres, redis, nginx, etc.
2. Rebuild custom images with `--no-cache`
3. Display instructions to restart

**Use Cases**:
- Getting security updates
- Updating base images
- Monthly maintenance routine

**Note**: Run `make restart` after this to use the updated images.

#### `make validate`
Validate all docker-compose files for syntax errors.

```bash
make validate
```

**What it does**: Runs `docker-compose config` on all compose files to check for errors

**Example Output**:
```
Checking compose files:

  docker/docker-compose.yml              [✓] Valid
  docker/docker-compose.monitoring.yml   [✓] Valid
  docker/docker-compose.mocks.yml        [✓] Valid
  docker/docker-compose.test.yml         [✓] Valid

[✓] All compose files are valid (4/4)
```

**Use Cases**:
- After editing compose files
- Before committing changes
- Troubleshooting startup issues

---

## Common Workflows

### Daily Development Workflow

```bash
# Morning: Start environment
make up

# Start development servers
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# Check logs if something isn't working
make logs

# Evening: Stop environment
make down
```

### First-Time Setup

```bash
# 1. Check system requirements
make doctor

# 2. Start environment
make up

# 3. Run database migrations
make db-migrate

# 4. Seed database
make db-seed

# 5. Start development
cd backend && npm run dev
```

### Debugging Issues

```bash
# Check overall health
make health

# View all logs
make logs

# Check specific service
make logs-backend

# Check resource usage
make stats

# Run system diagnostics
make doctor
```

### Working with Database

```bash
# Create backup before changes
make db-backup

# Make changes, test them
# ...

# If something breaks, restore backup
make db-restore FILE=docker/backup/barberpro_20251010_143022.sql

# For complete reset
make db-reset
```

### Testing Changes

```bash
# Start test environment
make test

# Run tests (in another terminal)
cd backend && npm run test:integration

# Stop test environment when done
docker-compose -f docker/docker-compose.test.yml down -v
```

### Clean Slate Restart

```bash
# Complete reset (prompted for confirmation)
make reset

# Or manual steps
make down
make clean
make up
make db-migrate
make db-seed
```

### Regular Maintenance

```bash
# Update images (monthly)
make update
make restart

# Clean up disk space (as needed)
make prune

# Validate configuration (before commits)
make validate
```

---

## Platform-Specific Notes

### macOS

The Makefile is fully compatible with macOS. All commands work as documented.

**Prerequisites**:
- Docker Desktop for Mac
- GNU Make (pre-installed)
- Xcode Command Line Tools (for `lsof`)

**Port checking**: Uses `lsof -ti:PORT` to check port availability

**Note**: If using Apple Silicon (M1/M2), ensure you're using ARM-compatible images.

### Linux

The Makefile works seamlessly on Linux distributions.

**Prerequisites**:
- Docker Engine
- Docker Compose
- GNU Make
- `lsof` command (usually pre-installed)

**Port checking**: Uses `lsof -ti:PORT` to check port availability

**Permissions**: You may need to add your user to the `docker` group:
```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

### WSL2 (Windows Subsystem for Linux)

The Makefile is fully compatible with WSL2.

**Prerequisites**:
- Docker Desktop for Windows with WSL2 backend enabled
- WSL2 Ubuntu/Debian distribution
- GNU Make (install with `sudo apt install make`)

**Port checking**: Uses `lsof -ti:PORT` to check port availability

**Tips**:
- Ensure Docker Desktop's WSL2 integration is enabled for your distribution
- Run commands from within WSL2, not Windows Command Prompt
- File performance is better when project is in WSL2 filesystem (`~/projects/`) rather than Windows filesystem (`/mnt/c/`)

### Windows (Native)

The Makefile is **not** compatible with Windows Command Prompt or PowerShell. Use WSL2 instead (see above).

**Alternative**: Use npm scripts (see next section) which work on Windows.

---

## npm Script Integration

For developers who prefer npm scripts or work on Windows, the `package.json` includes npm equivalents for common make commands:

### Available npm Scripts

```bash
# Help and diagnostics
npm run docker:help         # Same as: make help
npm run docker:doctor       # Same as: make doctor

# Lifecycle
npm run docker:up           # Same as: make up
npm run docker:down         # Same as: make down
npm run docker:restart      # Same as: make restart
npm run docker:reset        # Same as: make reset

# Logs and status
npm run docker:logs         # Same as: make logs
npm run docker:status       # Same as: make status

# Environment
npm run docker:dev          # Same as: make dev

# Database
npm run db:migrate          # Same as: make db-migrate
npm run db:seed             # Same as: make db-seed
npm run db:reset            # Same as: make db-reset
```

### Using npm Scripts

```bash
# Cross-platform alternative to make commands
npm run docker:up

# Chaining npm scripts
npm run docker:up && npm run db:migrate && npm run db:seed
```

### Makefile vs npm Scripts

**Use Makefile when**:
- You're on macOS, Linux, or WSL2
- You want colored output and better UX
- You need the full range of 30+ commands
- You want comprehensive health checks

**Use npm scripts when**:
- You're on Windows (without WSL2)
- You prefer npm-based workflows
- You only need the most common commands
- You want cross-platform CI/CD scripts

**Note**: For the complete set of 30+ commands with full features, use the Makefile directly.

---

## Troubleshooting

### "Docker is not running"

**Error**: `Docker is not running. Please start Docker Desktop.`

**Solution**:
1. Start Docker Desktop (macOS/Windows) or Docker daemon (Linux)
2. Wait for Docker to fully start
3. Run `make doctor` to verify

### Port Already in Use

**Error**: `Port 5432 (PostgreSQL) is already in use.`

**Solutions**:

**Option 1**: Stop the conflicting service
```bash
# Find what's using the port
lsof -ti:5432

# Kill the process (if safe to do so)
lsof -ti:5432 | xargs kill
```

**Option 2**: Change the port in docker-compose files
```yaml
# In docker/docker-compose.yml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead
```

### Backend/Frontend Container Not Running

**Error**: `Backend container is not running`

**Solution**:
```bash
# These commands require full environment
make up  # Not just 'make dev'

# Check what's running
make status
make ps
```

**Note**: Some commands (db-migrate, db-seed, db-reset, shell-backend, shell-frontend) require the backend or frontend containers, which are only started in certain environments.

### Migration Failed

**Error**: `Migration failed`

**Solutions**:

**Check database is accessible**:
```bash
make db-shell
# If this works, database is fine
```

**Reset database** (if safe to do so):
```bash
make db-reset
```

**Check logs**:
```bash
make logs-backend
```

### Volume Permissions Issues (Linux)

**Error**: Permission denied when accessing volumes

**Solution**:
```bash
# Ensure your user is in docker group
sudo usermod -aG docker $USER

# Log out and back in, then verify
groups | grep docker
```

### "No such service" Error

**Error**: `ERROR: No such service: backend`

**Cause**: Trying to access a service that isn't started in current environment

**Solution**:
```bash
# Make sure you're using the right environment
make up          # Full dev environment (has backend/frontend)
# Not: make dev  # Base only (no backend/frontend containers)
```

### Cleanup Not Working

**Problem**: `make clean` or `make reset` fails to remove volumes

**Solution**:
```bash
# Manual cleanup
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.dev.yml down -v
docker volume prune -f

# List remaining volumes
docker volume ls | grep barberpro

# Remove specific volume
docker volume rm barberpro-postgres-data
```

### Health Checks Show Unhealthy

**Problem**: `make health` shows services as unhealthy

**Solutions**:

**Wait longer**: Services may still be starting
```bash
# Wait 30 seconds, then check again
sleep 30 && make health
```

**Check logs**:
```bash
make logs
```

**Restart service**:
```bash
make restart
```

**Nuclear option** (if nothing works):
```bash
make clean
make up
```

### Make Command Not Found

**Error**: `make: command not found`

**Solution**:

**macOS**:
```bash
xcode-select --install
```

**Linux/WSL2**:
```bash
sudo apt update
sudo apt install make
```

**Windows**: Use WSL2 or npm scripts instead

---

## Directory Structure

```
docker/
├── backup/                          # Database backups (created by make db-backup)
│   └── barberpro_*.sql             # Timestamped backup files
├── configs/                         # Service configurations
│   ├── nginx.conf                   # Main nginx configuration
│   ├── proxy_params.conf           # Proxy parameters
│   ├── redis.conf                  # Redis configuration
│   └── postgres-prod.conf          # PostgreSQL production config
├── docker-compose.yml               # Base infrastructure (postgres, redis, admin tools)
├── docker-compose.dev.yml           # Development overrides
├── docker-compose.monitoring.yml    # Monitoring stack (Prometheus, Grafana, Loki)
├── docker-compose.mocks.yml         # Argentina service mocks
├── docker-compose.test.yml          # Test environment
└── README.md                        # This file
```

### Docker Compose File Layering

The Makefile uses Docker Compose's file override feature to compose different environments:

- **Base**: `docker-compose.yml` (postgres, redis, admin tools)
- **Dev**: Base + `docker-compose.dev.yml` (development settings)
- **Full**: Dev + Mocks + Monitoring (everything)
- **Test**: `docker-compose.test.yml` (isolated test infrastructure)

---

## Environment Variables

### .env File Structure

The project uses multiple .env files for different environments:

```
.env                    # Main environment file (development defaults)
.env.example           # Template with all required variables
.env.production        # Production overrides
backend/.env           # Backend-specific variables
frontend/.env          # Frontend-specific variables
docker/docker.env      # Docker-specific overrides
```

### Docker-Specific Variables

Key environment variables used by Docker services:

#### Database Configuration
```bash
POSTGRES_USER=barberpro
POSTGRES_PASSWORD=barberpro_dev_password
POSTGRES_DB=barberpro_dev
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev
```

#### Redis Configuration
```bash
REDIS_URL=redis://redis:6379
```

#### pgAdmin Configuration
```bash
PGADMIN_DEFAULT_EMAIL=admin@barberpro.local
PGADMIN_DEFAULT_PASSWORD=admin123
```

#### Redis Commander Configuration
```bash
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin123
```

### Security Notes

1. **Never commit real passwords** to version control
2. **Change default passwords** in production
3. **Use strong passwords** for production databases
4. **Rotate credentials** regularly
5. **Use Docker secrets** for production deployments

---

## Additional Resources

### Related Documentation

- **Project README**: `/README.md` - Main project documentation
- **Claude AI Guide**: `/CLAUDE.md` - AI assistant instructions
- **Backend README**: `/backend/README.md` - Backend-specific docs
- **Frontend README**: `/frontend/README.md` - Frontend-specific docs

### Docker Compose Documentation

- [Docker Compose Overview](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Compose CLI Reference](https://docs.docker.com/compose/reference/)

### Service Documentation

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

---

## Contributing

When modifying Docker configurations:

1. **Test changes** in development first
2. **Update this documentation** with new commands or changes
3. **Validate compose files**: `make validate`
4. **Test on multiple platforms** if possible (macOS, Linux, WSL2)
5. **Update Makefile help text** for new commands

### Adding New Make Commands

When adding new commands to the Makefile:

1. Add the command to the appropriate section
2. Include a `##` comment for help text
3. Use colored output for consistency
4. Add to `.PHONY` declarations
5. Document in this README under the appropriate category

### Makefile Code Style

- Use tabs (not spaces) for indentation in Makefile
- Use `$(CYAN)[$(ARROW)]$(RESET)` for progress messages
- Use `$(GREEN)[$(CHECK)]$(RESET)` for success messages
- Use `$(RED)[$(CROSS)]$(RESET)` for error messages
- Use `$(YELLOW)[$(WARN)]$(RESET)` for warnings
- Add `@` prefix to hide command echo (unless debugging)

---

## Support

For Docker-related issues:

1. **Check logs**: `make logs [service]`
2. **Check health**: `make health`
3. **Run diagnostics**: `make doctor`
4. **Check this documentation** for troubleshooting steps
5. **Ask team members** in Slack #barberpro-dev
6. **Create GitHub issue** with output from `make doctor` and `make logs`

---

**Last Updated**: 2025-10-10
**Makefile Version**: 1.0.0
**Total Commands**: 32
