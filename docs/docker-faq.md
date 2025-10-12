# Docker Environment FAQ

Frequently Asked Questions about the BarberPro Docker development environment. Find answers to common questions about setup, usage, troubleshooting, and best practices.

## Table of Contents

- [General Questions](#general-questions)
- [Setup & Installation](#setup--installation)
- [Usage & Workflow](#usage--workflow)
- [Performance & Resources](#performance--resources)
- [Troubleshooting](#troubleshooting)
- [Database Questions](#database-questions)
- [Mock Services](#mock-services)
- [Architecture & Design](#architecture--design)
- [Best Practices](#best-practices)
- [Advanced Topics](#advanced-topics)

---

## General Questions

### What is the Docker environment?

The Docker environment is a containerized development setup that includes:
- **PostgreSQL** (database)
- **Redis** (cache)
- **pgAdmin & Redis Commander** (admin tools)
- **Argentina service mocks** (MercadoPago, AFIP, WhatsApp, SMS)
- **Monitoring stack** (Prometheus, Grafana, Loki) - optional
- **Test infrastructure** (isolated test databases)

It allows all team members to have identical development environments regardless of their operating system.

---

### Why use Docker instead of installing services locally?

**Benefits**:
1. **Consistency**: Same environment across all developers
2. **Isolation**: Services don't conflict with your local system
3. **Easy cleanup**: Remove everything with one command
4. **Version control**: Service versions defined in code
5. **Quick setup**: New developers productive in minutes
6. **No system pollution**: Doesn't install services globally

**Drawbacks**:
1. **Resource overhead**: Docker uses more memory than native
2. **Learning curve**: Need basic Docker knowledge
3. **Platform differences**: Some features work differently on macOS/Windows/Linux

---

### Is Docker required or optional?

**For development**: Strongly recommended but technically optional. You could install PostgreSQL and Redis locally, but you'd need to:
- Match exact versions
- Configure services identically
- Set up mock services manually
- Handle port conflicts yourself

**For production**: Not used. We deploy to Railway/AWS, not Docker containers.

**Bottom line**: Use Docker for development. It's designed to make your life easier.

---

### Do I need to know Docker to use this?

**No**. The Makefile abstracts Docker complexity. You only need to know:
- `make up` - Start everything
- `make down` - Stop everything
- `make logs` - View logs
- `make reset` - Fresh start

**Advanced users** can use Docker commands directly, but it's not required for daily development.

---

### What's the difference between `make up`, `make dev`, and `make full`?

| Command | Services | Use Case | Memory |
|---------|----------|----------|--------|
| `make dev` | Postgres, Redis, Admin tools only | Backend-only development | ~500MB |
| `make up` | Dev + Mocks (default) | Full development | ~1.5GB |
| `make full` | Dev + Mocks + Monitoring | Complete testing/debugging | ~3GB |

**Most developers use** `make up` for daily work.

---

## Setup & Installation

### How long does initial setup take?

**First time setup**: 3-5 minutes
- Installing Docker Desktop: 2-3 minutes
- Running `make up`: 30-60 seconds (downloads images)
- Running migrations/seed: 30 seconds

**Subsequent startups**: 10-30 seconds

---

### Do I need Docker Desktop or Docker Engine?

**macOS**: Docker Desktop (required)

**Windows**: Docker Desktop with WSL2 backend (required)

**Linux**: Docker Engine (free) or Docker Desktop (optional)
- Docker Engine: `sudo apt install docker.io docker-compose`
- Lighter weight and sufficient for development

---

### What are the minimum system requirements?

**Minimum**:
- 4GB RAM (8GB recommended)
- 10GB disk space (20GB recommended)
- 2 CPU cores (4 recommended)

**Comfortable**:
- 8-16GB RAM
- 20-40GB disk space
- 4-8 CPU cores

**Performance impact**: More resources = faster builds and better performance.

---

### Can I use this on Windows?

**Yes**, but use WSL2 (Windows Subsystem for Linux):

1. **Install WSL2**: `wsl --install`
2. **Install Docker Desktop** with WSL2 backend
3. **Clone project in WSL2** (not `/mnt/c/`): `~/projects/service-booking`
4. **Run commands in WSL2 terminal**: `make up`

**Do not**: Try to run on Windows Command Prompt or PowerShell. The Makefile requires a Unix shell.

---

### What if ports 5432 or 6379 are already in use?

**Option 1**: Stop the conflicting service
```bash
# Stop local PostgreSQL
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS

# Stop local Redis
sudo systemctl stop redis       # Linux
brew services stop redis        # macOS
```

**Option 2**: Change ports in `docker-compose.yml`
```yaml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

**Option 3**: Use test environment (different ports)
```bash
make test
# PostgreSQL: 5433, Redis: 6380
```

See [Troubleshooting Guide](./docker-troubleshooting.md#issue-port-already-in-use) for details.

---

## Usage & Workflow

### When should I use `make restart` vs `make reset`?

**Use `make restart`** when:
- Services become unresponsive
- After configuration changes
- Need fresh start but want to keep data
- No confirmation prompt

**Use `make reset`** when:
- Database is corrupted
- Major schema conflicts
- Need completely fresh environment
- Prompts for confirmation (destructive!)

**Key difference**: `restart` keeps data, `reset` deletes all data.

---

### How do I know if services are running?

**Quick check**:
```bash
make status
```

**Detailed check**:
```bash
make health
```

**Access services**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- pgAdmin: http://localhost:8080
- Redis Commander: http://localhost:8081

---

### Do I need to run `make up` every time I work?

**Yes**, if you shut down your computer or ran `make down`.

**No**, if services are still running from yesterday.

**Check first**:
```bash
make status
```

If services are already running, just start your dev servers:
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

---

### Should I run `make down` at the end of the day?

**Pros of stopping**:
- Saves battery on laptops
- Frees RAM/CPU for other tasks
- Clean state for next day

**Pros of leaving running**:
- Faster startup next morning (already running)
- Don't lose uncommitted work in containers

**Recommendation**: On laptops, run `make down`. On desktops, optional.

---

### What's the difference between `make logs` and `make logs-backend`?

**`make logs`**: Shows logs from ALL services
- Good for: Seeing big picture, debugging multi-service issues
- Can be overwhelming with many services

**`make logs-backend`**: Shows ONLY backend logs
- Good for: Focused debugging, cleaner output
- Use when you know which service has issues

**Also available**: `make logs-frontend`, `make mocks-logs`, `make monitoring-logs`

---

## Performance & Resources

### Why is Docker using so much memory?

**Normal usage**: 1-3GB depending on services running

**High usage causes**:
1. **Too many services**: Use `make dev` instead of `make full`
2. **Memory leaks**: Check `make stats` to identify culprits
3. **Docker Desktop settings**: Increase memory limit in settings
4. **Unused containers**: Run `make prune` to clean up

**Check usage**:
```bash
make stats
```

---

### How do I improve Docker performance?

**1. Increase Docker resources**:
- Docker Desktop → Settings → Resources
- Increase CPUs to 4+, Memory to 8GB+

**2. Use minimal environment**:
```bash
make dev  # Only essential services
```

**3. Stop unused services**:
```bash
make mocks-down        # Stop mocks
make monitoring-down   # Stop monitoring
```

**4. Regular cleanup**:
```bash
make prune  # Monthly maintenance
```

**5. WSL2 specific** (Windows):
Edit `C:\Users\<username>\.wslconfig`:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

---

### Why is `make up` slow?

**First time**: Normal (downloading images)
- PostgreSQL: ~100MB
- Redis: ~30MB
- Mocks: ~50MB each

**Subsequent starts**: Should be 10-30 seconds

**If consistently slow**:
1. Check disk space: `df -h`
2. Check resources: `make stats`
3. Restart Docker Desktop
4. Prune unused resources: `make prune`

---

### Can I use Docker with limited RAM (4GB)?

**Yes, but carefully**:

**Use minimal setup**:
```bash
make dev  # Only postgres + redis (~500MB)
```

**Don't use**:
- `make full` (requires 3GB+)
- Monitoring stack (requires 1GB+)
- All mocks at once

**Optimize Docker Desktop**:
- Settings → Resources → Memory: 3GB
- Close other applications
- Use lightweight IDE (VS Code over IntelliJ)

---

## Troubleshooting

### Services start but are unhealthy

**Check health details**:
```bash
make health
```

**Common causes**:
1. **Services still starting**: Wait 30-60 seconds
2. **Port conflicts**: Check with `lsof -ti:5432`
3. **Configuration errors**: Check logs with `make logs`

**Solution**:
```bash
# Wait and check again
sleep 30 && make health

# If still unhealthy, restart
make restart

# If restart doesn't help, reset
make reset
```

---

### Backend can't connect to database

**Error**: `ECONNREFUSED 127.0.0.1:5432`

**Cause**: Using `localhost` instead of `postgres` in DATABASE_URL

**Fix**:
```bash
# In backend/.env, use service name:
DATABASE_URL=postgresql://user:pass@postgres:5432/db

# Not:
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**Why**: Inside Docker network, services use container names, not `localhost`.

See [Troubleshooting Guide](./docker-troubleshooting.md#issue-backend-cant-connect-to-database) for details.

---

### Migrations fail with "connection refused"

**Check database is running**:
```bash
make status
```

**Restart backend** (may have started before DB was ready):
```bash
docker restart barberpro-backend-dev
make db-migrate
```

**If still failing**:
```bash
make restart
make db-migrate
```

---

### What does "Error response from daemon" mean?

**Full error**: `Error response from daemon: ...`

**Means**: Docker daemon encountered an error

**Common causes**:
1. Docker not running
2. Permission issues (Linux)
3. Port conflicts
4. Out of disk space

**First steps**:
```bash
# Check Docker is running
docker info

# Check disk space
df -h

# Check permissions (Linux)
groups | grep docker
```

---

### Nothing works, what should I do?

**Nuclear reset** (last resort):
```bash
# 1. Stop everything
make down

# 2. Remove all BarberPro data
make clean

# 3. Clean Docker system
make prune

# 4. Restart Docker Desktop
# (Restart the application)

# 5. Start fresh
make up
make db-migrate
make db-seed
```

If this doesn't work, see [Getting Help](./docker-troubleshooting.md#getting-help).

---

## Database Questions

### When do I need to run migrations?

**Run migrations when**:
1. **First time setup**: After `make up`
2. **After git pull**: If schema changed
3. **After reset**: `make reset` clears database
4. **Switching branches**: With schema differences

**Check if needed**:
```bash
make shell-backend
npm run db:migrate:status
```

---

### What's the difference between `make db-reset` and `make db-seed`?

**`make db-seed`**:
- Adds test data to existing database
- Does NOT delete existing data
- Safe to run multiple times (idempotent)
- Fast (~10 seconds)

**`make db-reset`**:
- Drops ALL tables
- Runs migrations from scratch
- Seeds test data
- **DELETES ALL DATA**
- Use when database is broken

**When to use each**:
- Need more test data? → `make db-seed`
- Database corrupted? → `make db-reset`

---

### How do I backup my database?

**Create backup**:
```bash
make db-backup
```

**Creates**: `docker/backup/barberpro_YYYYMMDD_HHMMSS.sql`

**Restore backup**:
```bash
make db-restore FILE=docker/backup/barberpro_20251012_143022.sql
```

**Best practice**: Backup before:
- `make db-reset`
- `make clean`
- Major schema changes
- Deleting production-like data

---

### Can I access the database from outside Docker?

**Yes**, PostgreSQL is exposed on `localhost:5432`

**Connect with any tool**:
- **TablePlus**: postgres://barberpro:password@localhost:5432/barberpro_dev
- **DBeaver**: localhost:5432, user: barberpro
- **psql**: `psql -h localhost -p 5432 -U barberpro barberpro_dev`

**Or use included tools**:
- **pgAdmin**: http://localhost:8080
- **Makefile**: `make db-shell`

---

### What happens to data when I stop containers?

**`make down`**: Data is PRESERVED (stored in Docker volumes)

**`make reset` / `make clean`**: Data is DELETED

**Volumes persist** unless explicitly removed:
```bash
# List volumes
docker volume ls | grep barberpro

# Data is in:
barberpro-postgres-data
barberpro-redis-data
```

---

## Mock Services

### What are mock services?

Mock services simulate Argentina-specific external APIs:
- **MercadoPago**: Payment gateway
- **AFIP**: Tax authority (invoicing)
- **WhatsApp Business**: Customer messaging
- **SMS**: SMS gateway
- **MailHog**: Email capture (not a mock, but testing tool)

**Why mock?**:
- Test without real credentials
- Faster than real APIs
- Simulate errors and edge cases
- No API rate limits
- No costs

---

### Do I need mock services for backend development?

**No**, not always:

**Use mocks when**:
- Testing payment flows
- Testing notifications
- Integration testing
- Full-stack feature development

**Don't need mocks for**:
- Backend API development
- Database work
- Frontend UI work
- Unit testing

**Start without mocks**: `make dev`

**Add mocks later**: `make mocks`

---

### How do I use the mock services?

**1. Start mocks**:
```bash
make mocks
```

**2. Access dashboards**:
- MercadoPago: http://localhost:3001/dashboard
- WhatsApp: http://localhost:3003/dashboard
- SMS: http://localhost:3004/dashboard
- Email: http://localhost:8025

**3. Use in backend**:
```javascript
// Backend automatically uses mocks in development
// Just use normal API calls:
await mercadopago.createPayment(...)
await whatsapp.sendMessage(...)
```

**4. View captured data**:
- Check dashboards to see payments, messages, emails

---

### Can I simulate payment failures with mocks?

**Yes**, MercadoPago mock supports scenarios:

**Current implementation**: Check mock documentation
```bash
# View mock dashboard
open http://localhost:3001/dashboard

# Check mock logs
make mocks-logs
```

**Future enhancement**: Environment variables to control behavior
```bash
MERCADOPAGO_DEFAULT_SCENARIO=failure make mocks
```

See [Mock Services README](../docker/mocks/README.md) for details.

---

## Architecture & Design

### Why use the Makefile instead of docker-compose directly?

**Makefile benefits**:
1. **User-friendly**: `make up` vs `docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d`
2. **Safety checks**: Validates Docker is running, ports are free
3. **Better output**: Colored, formatted messages
4. **Cross-platform**: Works on macOS, Linux, WSL2
5. **Helpful errors**: Suggests fixes when things fail
6. **Convenience**: Combines multiple steps (up + migrate + seed)

**You can still use docker-compose** directly if you prefer:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

---

### Why multiple docker-compose files?

**Composition pattern**: Combine different configurations

**Files**:
- `docker-compose.yml`: Base (postgres, redis)
- `docker-compose.dev.yml`: Development overrides
- `docker-compose.monitoring.yml`: Monitoring stack
- `docker-compose.mocks.yml`: Argentina mocks
- `docker-compose.test.yml`: Test environment

**Benefits**:
1. **Modular**: Choose what you need
2. **Flexible**: Combine in different ways
3. **Clear**: Each file has single responsibility
4. **Maintainable**: Easy to update one aspect

**Example combinations**:
```bash
# Minimal
docker-compose -f docker/docker-compose.yml up

# Development
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# Full
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml -f docker/docker-compose.mocks.yml -f docker/docker-compose.monitoring.yml up
```

---

### Why not use a single .env file?

**We use multiple .env files**:
- `.env`: Root level (general)
- `backend/.env`: Backend-specific
- `frontend/.env`: Frontend-specific
- `docker/docker.env`: Docker overrides

**Benefits**:
1. **Separation**: Services don't see each other's secrets
2. **Clarity**: Know which env vars are for which service
3. **Security**: Easier to exclude from version control
4. **Flexibility**: Override at different levels

---

### Why expose ports to host?

**Exposed ports** (accessible from host):
- PostgreSQL: 5432
- Redis: 6379
- pgAdmin: 8080
- Backend: 3000
- Frontend: 5173

**Why expose**:
1. **Development tools**: Connect from IDE, database clients
2. **Browser access**: Frontend, admin tools, dashboards
3. **Debugging**: Connect from host machine
4. **Integration**: Test from Postman, curl

**Production**: Ports are NOT exposed (services communicate internally)

---

## Best Practices

### Should I commit docker/backup/ folder?

**No**, add to `.gitignore`:
```
docker/backup/*.sql
```

**Reasons**:
1. Backups are local-only
2. Can be large (>100MB)
3. May contain sensitive data
4. Not needed for collaboration

**Share backups**: Use external storage (S3, Dropbox) if needed

---

### How often should I run `make prune`?

**Recommended**: Monthly or when disk space low

**Check disk usage first**:
```bash
docker system df
```

**Prune if**:
- "Reclaimable" is > 10GB
- Docker using > 50GB
- Disk space warnings

**Note**: `make prune` affects ALL Docker projects, not just BarberPro

---

### Should I use `make dev` or `make up` daily?

**Use `make dev` if**:
- Backend-only work
- Don't need mocks
- Want minimal resources
- Laptop battery life matters

**Use `make up` if** (default):
- Full-stack work
- Testing payments/notifications
- More complete environment
- Desktop machine

**Recommendation**: Start with `make dev`, add mocks with `make mocks` when needed

---

### How do I update Docker images?

**Monthly maintenance**:
```bash
# 1. Pull latest images
make update

# 2. Restart services
make restart

# 3. Verify everything works
make health
```

**What gets updated**:
- PostgreSQL: Security patches
- Redis: Bug fixes
- Monitoring tools: New features
- Base images: OS updates

---

### Should I delete volumes when troubleshooting?

**Try this order**:
1. `make restart` - Keep volumes
2. `make db-reset` - Reset database only
3. `make reset` - Delete all volumes
4. `make clean` then `make up` - Manual volume deletion

**Deleting volumes**:
- ✅ Fixes corruption issues
- ✅ Gives completely fresh start
- ❌ Loses all data
- ❌ Need to re-run migrations/seed

**Bottom line**: Try restarts first, delete volumes as last resort

---

## Advanced Topics

### Can I customize Docker Compose configuration?

**Yes, but don't modify directly**. Instead:

**Option 1**: Environment variables
```bash
# In .env file
POSTGRES_PORT=5433
REDIS_PORT=6380
```

**Option 2**: Override file (future)
```bash
# Create docker/docker-compose.override.yml
# This file is gitignored and local to your machine
```

**Why not modify directly**: Causes git conflicts when pulling updates

---

### Can I run multiple projects simultaneously?

**Yes, but**:

**Option 1**: Use different ports
```bash
# Project 1: default ports
cd project1 && make up

# Project 2: modify ports in .env
cd project2
# Edit .env: POSTGRES_PORT=5433, BACKEND_PORT=3001
make up
```

**Option 2**: Use Docker networks
```bash
# Each project gets own network
# No conflicts as long as ports don't overlap
```

**Limitation**: High resource usage (2-6GB per project)

---

### How do I add a new service to Docker Compose?

**1. Add to appropriate compose file**:
```yaml
# In docker/docker-compose.dev.yml
services:
  new-service:
    image: service-name:latest
    ports:
      - "8080:8080"
    networks:
      - barberpro-network
```

**2. Validate**:
```bash
make validate
```

**3. Update Makefile** if needed (add commands)

**4. Document**:
- Update README
- Update this FAQ
- Add to troubleshooting guide

**5. Test**:
```bash
make rebuild
make health
```

---

### Can I use this in CI/CD?

**Yes**, several commands are CI-friendly:

**GitHub Actions example**:
```yaml
- name: Start Docker environment
  run: make test  # Test environment (isolated)

- name: Run integration tests
  run: make test-ci  # Non-interactive tests

- name: Cleanup
  run: make down
```

**CI-specific commands**:
- `make test`: Isolated test environment
- `make test-ci`: Quick, non-interactive tests
- `make test-integration-quick`: Smoke tests

---

### How do I debug inside containers?

**Backend debugging**:
```bash
# 1. Open shell in backend
make shell-backend

# 2. Install debugging tools
npm install -D nodemon

# 3. Run with debugging
node --inspect=0.0.0.0:9229 src/index.js
```

**Attach debugger**:
- VS Code: Use "Attach to Node" configuration
- Chrome DevTools: chrome://inspect

**Database debugging**:
```bash
# SQL shell
make db-shell

# Or connect from IDE
# Connection: localhost:5432
```

---

### Can I use this on a remote server?

**Not recommended**. Docker setup is for **local development only**.

**Production**: Use Railway, AWS, or other platforms

**Remote development** (if needed):
1. SSH to server
2. Install Docker
3. Run `make up`
4. Forward ports: `ssh -L 5432:localhost:5432 user@server`

**Better approach**: Use VS Code Remote Development or GitHub Codespaces

---

## Getting More Help

### Where can I find more information?

**Documentation**:
- [Setup Guide](./docker-setup-guide.md) - Detailed setup instructions
- [Architecture](./docker-architecture.md) - System design
- [Troubleshooting](./docker-troubleshooting.md) - Problem solving
- [Makefile Cheat Sheet](./makefile-cheat-sheet.md) - Command reference
- [Docker README](../docker/README.md) - Complete documentation

**Community**:
- Slack: #dev-environment channel
- Slack: #barberpro-dev general channel
- GitHub Issues: Bug reports and questions

---

### How do I report a bug?

**Before reporting**:
1. Check [Troubleshooting Guide](./docker-troubleshooting.md)
2. Search existing GitHub issues
3. Try `make doctor` and `make reset`

**When reporting, include**:
```bash
# Run these commands and include output
make version
make doctor
make status
make logs --tail=50
```

**Open issue**: [GitHub Issues](https://github.com/your-org/service-booking/issues/new)

---

### How do I suggest improvements?

**Documentation improvements**:
- Open PR with changes
- Update relevant docs
- Add to FAQ if commonly asked

**Makefile improvements**:
- Open issue describing use case
- Propose command syntax
- Explain benefits

**Service improvements**:
- Open issue with requirements
- Discuss in #dev-environment Slack
- Submit PR with implementation

---

### Who maintains this?

**Primary maintainers**: DevOps Team

**Contributing**:
- Anyone can submit PRs
- Documentation especially welcome
- Test changes before submitting

**Support**:
- Team support: Slack channels
- On-call: Critical production issues
- Self-service: This documentation

---

## Quick Reference

### Most Common Commands

```bash
# Daily workflow
make up          # Start environment
make down        # Stop environment
make restart     # Restart services

# Database
make db-migrate  # Run migrations
make db-seed     # Add test data
make db-reset    # Fresh database

# Debugging
make logs        # All logs
make health      # Check health
make status      # Service status

# Maintenance
make reset       # Fresh start
make prune       # Clean up disk space
```

---

### Most Common Issues

| Problem | Command | Section |
|---------|---------|---------|
| Services won't start | `make doctor` | [Troubleshooting](#troubleshooting) |
| Port conflict | `lsof -ti:5432 \| xargs kill` | [Setup](#what-if-ports-5432-or-6379-are-already-in-use) |
| Backend can't connect | Check DATABASE_URL | [Database](#backend-cant-connect-to-database) |
| Slow performance | `make dev` + increase resources | [Performance](#how-do-i-improve-docker-performance) |
| Out of disk space | `make prune` | [Performance](#why-is-docker-using-so-much-memory) |

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Maintainers**: DevOps Team

---

**Didn't find your answer?**
- Check [Troubleshooting Guide](./docker-troubleshooting.md)
- Ask in Slack: #dev-environment
- Open GitHub issue with details

We update this FAQ regularly based on team questions. If you found the answer elsewhere, please submit a PR to add it here!
