# Docker Environment Migration Guide

Complete guide for migrating from older Docker setups to the new comprehensive Docker environment. This guide covers migration scenarios, troubleshooting, and best practices.

## Table of Contents

- [Overview](#overview)
- [Migration Scenarios](#migration-scenarios)
- [Pre-Migration Checklist](#pre-migration-checklist)
- [Migration Paths](#migration-paths)
- [Post-Migration Verification](#post-migration-verification)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [FAQ](#faq)

## Overview

### What's Changing?

The new Docker environment introduces significant improvements:

| Aspect | Old Setup | New Setup |
|--------|-----------|-----------|
| **Interface** | Raw docker-compose commands | Comprehensive Makefile (45+ commands) |
| **Services** | Basic postgres + redis | Full stack with mocks and monitoring |
| **Container Names** | Generic names | Prefixed with `barberpro-` |
| **Networks** | Auto-generated | Named `barberpro-network` |
| **Configuration** | Scattered across files | Centralized in `.env` |
| **Health Checks** | Basic or missing | Comprehensive for all services |
| **Documentation** | Minimal | Extensive with examples |

### Migration Timeline

- **Planning**: 1-2 hours (read this guide, backup data)
- **Execution**: 30-60 minutes (follow migration steps)
- **Verification**: 15-30 minutes (test everything works)
- **Total**: 2-3 hours for a careful migration

### Who Should Migrate?

- **Developers** using local Docker environment
- **Teams** standardizing on new tooling
- **Projects** upgrading from v1.x to v2.0
- **New developers** setting up for the first time (use [Setup Guide](./docker-setup-guide.md) instead)

## Migration Scenarios

Choose the migration path that matches your situation:

### Scenario 1: Local Development (No Critical Data)

**Characteristics**:
- Working on feature branches
- Database can be reseeded
- No production data

**Recommended Path**: [Fast Migration](#fast-migration)

**Risk Level**: Low

**Downtime**: 10-15 minutes

### Scenario 2: Local Development (Want to Keep Data)

**Characteristics**:
- Have important local data
- Don't want to reseed database
- Need to preserve work in progress

**Recommended Path**: [Safe Migration with Backup](#safe-migration-with-backup)

**Risk Level**: Low-Medium

**Downtime**: 30-45 minutes

### Scenario 3: Shared Development Environment

**Characteristics**:
- Multiple developers sharing environment
- Need coordination
- Want zero data loss

**Recommended Path**: [Coordinated Migration](#coordinated-migration)

**Risk Level**: Medium

**Downtime**: 1-2 hours (including coordination)

### Scenario 4: Staging/Production

**Characteristics**:
- Production-like data
- Requires thorough testing
- Zero downtime requirement

**Recommended Path**: See [Production Migration Guide](#production-migration-not-covered-here)

**Risk Level**: High

**Note**: Production migrations should be planned separately with your DevOps team.

## Pre-Migration Checklist

Complete this checklist before starting migration:

### 1. Information Gathering

- [ ] Note your current Docker version: `docker --version`
- [ ] Note your current docker-compose version: `docker-compose --version`
- [ ] List running containers: `docker ps`
- [ ] List existing volumes: `docker volume ls | grep barberpro`
- [ ] Check disk space: `df -h` (need at least 10GB free)
- [ ] Identify custom environment variables in your `.env`
- [ ] Document any custom docker-compose modifications
- [ ] Note any local scripts that use docker-compose

### 2. Backup

- [ ] Backup database:
  ```bash
  # Using old setup
  docker-compose exec postgres pg_dump -U barberpro barberpro_dev > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Backup Redis data (if needed):
  ```bash
  docker-compose exec redis redis-cli SAVE
  docker cp <container_id>:/data/dump.rdb redis_backup_$(date +%Y%m%d_%H%M%S).rdb
  ```
- [ ] Backup your `.env` file:
  ```bash
  cp .env .env.backup
  ```
- [ ] Backup custom configurations:
  ```bash
  cp -r docker/configs docker/configs.backup
  ```

### 3. Prerequisites

- [ ] Docker Desktop 20.10+ installed
- [ ] Docker Compose V2 installed (included in Docker Desktop)
- [ ] Node.js 20.x installed
- [ ] Git repository up to date
- [ ] No uncommitted changes (or stash them)
- [ ] Makefile compatible system (macOS, Linux, or WSL2)
- [ ] At least 10GB free disk space
- [ ] 8GB RAM available for Docker

### 4. Team Coordination (for shared environments)

- [ ] Notify team of migration schedule
- [ ] Ensure no one is actively developing
- [ ] Schedule maintenance window
- [ ] Prepare communication channel for issues
- [ ] Have rollback plan ready

## Migration Paths

### Fast Migration

**Use when**: You can afford to lose local data and reseed the database.

**Time**: 10-15 minutes

#### Step 1: Cleanup Old Environment

```bash
# Stop all running containers
docker-compose down

# Remove old containers
docker container prune -f

# Remove old volumes (WARNING: deletes data!)
docker volume prune -f

# Remove old networks
docker network prune -f
```

#### Step 2: Pull Latest Code

```bash
# Pull latest changes
git pull origin main

# Or checkout specific version
git checkout v2.0.0
```

#### Step 3: Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

#### Step 4: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Review and customize if needed
# nano .env  # or use your preferred editor
```

#### Step 5: Start New Environment

```bash
# Verify prerequisites
make doctor

# Start services
make up

# Wait for services to be healthy
make health
```

#### Step 6: Setup Database

```bash
# Run migrations
make db-migrate

# Seed with test data
make db-seed
```

#### Step 7: Verify

```bash
# Check all services
make status

# View logs
make logs

# Test backend
curl http://localhost:3000/health

# Test frontend
open http://localhost:5173
```

**Done!** Fast migration complete.

---

### Safe Migration with Backup

**Use when**: You want to preserve your local database data.

**Time**: 30-45 minutes

#### Step 1: Backup Current State

```bash
# Create backup directory
mkdir -p ~/barberpro-migration-backup

# Backup database
docker-compose exec -T postgres pg_dump -U barberpro barberpro_dev > ~/barberpro-migration-backup/database.sql

# Backup environment
cp .env ~/barberpro-migration-backup/.env.old

# Backup custom configs (if any)
cp -r docker/configs ~/barberpro-migration-backup/configs 2>/dev/null || true

# Save list of running containers
docker ps > ~/barberpro-migration-backup/containers.txt

# Save list of volumes
docker volume ls > ~/barberpro-migration-backup/volumes.txt

echo "Backup created in ~/barberpro-migration-backup"
```

#### Step 2: Stop Old Environment (Keep Data)

```bash
# Stop containers but keep volumes
docker-compose down

# Don't run docker volume prune - we want to keep the data!
```

#### Step 3: Update Code

```bash
# Pull latest code
git pull origin main

# Or checkout specific version
git checkout v2.0.0

# Verify you have the new Makefile
ls -la Makefile
```

#### Step 4: Update Dependencies

```bash
# Install new dependencies
npm run install:all
```

#### Step 5: Migrate Environment Variables

```bash
# Create new .env from template
cp .env.example .env

# Migrate your old settings
# Open both files side by side and copy your custom values
# Pay special attention to:
# - Database credentials (should match old setup)
# - API keys and secrets
# - Custom ports if you changed them
```

**Important Environment Variable Changes**:

```bash
# Old format (browser access)
API_URL=http://localhost:3000

# New format (separate container and browser URLs)
VITE_API_URL=http://localhost:3000           # Browser access
BACKEND_URL=http://backend:3000              # Container-to-container
MERCADOPAGO_WEBHOOK_URL=http://backend:3000  # Webhook URLs

# Old format (database)
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# New format (use service name for containers)
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

#### Step 6: Start New Environment

```bash
# Check prerequisites
make doctor

# Start new services
make up

# Check services are running
make status

# Check health
make health
```

#### Step 7: Restore Data

```bash
# Option 1: Restore from backup
make db-restore FILE=~/barberpro-migration-backup/database.sql

# Option 2: If volumes were preserved, just run migrations
make db-migrate
```

#### Step 8: Verify Data Integrity

```bash
# Open database shell
make db-shell

# Check your data is there
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Service";
SELECT COUNT(*) FROM "Booking";

# Exit shell
\q
```

#### Step 9: Test Application

```bash
# Start backend
cd backend && npm run dev   # Terminal 1

# Start frontend
cd frontend && npm run dev  # Terminal 2

# Test in browser
open http://localhost:5173

# Test API
curl http://localhost:3000/health

# Test database connection
curl http://localhost:3000/api/health/db
```

**Done!** Safe migration with data preservation complete.

---

### Coordinated Migration

**Use when**: Multiple developers share an environment and need to coordinate.

**Time**: 1-2 hours (including coordination)

#### Pre-Migration (Team Coordination)

1. **Schedule Migration**:
   - Set date and time (e.g., "Tomorrow 10 AM - 12 PM")
   - Send calendar invite to all team members
   - Create Slack channel for migration (e.g., #migration-docker-2-0)

2. **Prepare Team**:
   - Share this migration guide
   - Assign roles (Migration Lead, Backup Person, Testing Person)
   - Ensure everyone has backed up their local work
   - Ask everyone to commit or stash changes

3. **Pre-Migration Meeting** (15 minutes):
   - Confirm everyone is ready
   - Walkthrough migration steps
   - Assign responsibilities
   - Set up screen sharing for troubleshooting

#### Migration Steps (Migration Lead)

**Step 1**: Stop Shared Environment
```bash
# On shared server
docker-compose down

# Verify all containers stopped
docker ps
```

**Step 2**: Backup Shared Data (Backup Person)
```bash
# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$TIMESTAMP

# Backup database
docker-compose up -d postgres  # Start only postgres temporarily
sleep 5
docker-compose exec -T postgres pg_dump -U barberpro barberpro_dev > backups/$TIMESTAMP/database.sql
docker-compose down

# Backup environment
cp .env backups/$TIMESTAMP/.env

# Verify backup
ls -lh backups/$TIMESTAMP/
```

**Step 3**: Update Shared Environment
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Create new .env (Migration Lead reviews and updates)
cp .env.example .env
# Manually update with shared credentials
```

**Step 4**: Start New Environment
```bash
# Start services
make up

# Wait for healthy status
make health

# Check logs for issues
make logs
```

**Step 5**: Restore Data and Migrate
```bash
# Restore backup
make db-restore FILE=backups/$TIMESTAMP/database.sql

# Run any new migrations
make db-migrate

# Verify data
make db-shell
# Run verification queries
\q
```

**Step 6**: Team Verification (All Team Members)

Each team member should:
```bash
# Pull latest code
git pull origin main

# Update dependencies
npm run install:all

# Update local .env (copy from shared environment)
# Create .env.local for personal overrides

# Verify connection to shared environment
# Test that services are accessible
curl http://<shared-server>:3000/health
```

**Step 7**: Post-Migration Testing (Testing Person)

```bash
# Run integration tests
make test-integration

# Test key workflows:
# 1. User registration
# 2. Service booking
# 3. Payment processing
# 4. Notifications

# Check monitoring
make monitoring
open http://<shared-server>:3001  # Grafana

# Check logs for errors
make logs
```

#### Post-Migration

1. **Status Meeting** (15 minutes):
   - Confirm everything works
   - Address any issues
   - Document problems and solutions

2. **Documentation**:
   - Update team wiki with new commands
   - Share Makefile cheat sheet
   - Add notes about issues encountered

3. **Cleanup**:
   - Archive old backups
   - Remove old Docker resources
   - Update team documentation

**Done!** Coordinated migration complete.

---

## Post-Migration Verification

After completing migration, verify everything works correctly:

### 1. Service Health Check

```bash
# All services should be healthy
make health

# Expected output:
# postgres:         [✓] Healthy
# redis:            [✓] Healthy
# pgadmin:          [ℹ] Running
# redis-commander:  [ℹ] Running
```

### 2. Database Verification

```bash
# Check database is accessible
make db-shell

# Run verification queries
\dt                              # List all tables
SELECT COUNT(*) FROM "User";     # Check users
SELECT COUNT(*) FROM "Service";  # Check services
SELECT COUNT(*) FROM "Booking";  # Check bookings
\q
```

### 3. Application Testing

```bash
# Start backend
cd backend && npm run dev

# In another terminal, start frontend
cd frontend && npm run dev

# Test in browser
open http://localhost:5173

# Test key features:
# - User login
# - Service browsing
# - Booking creation
# - Admin dashboard
```

### 4. API Testing

```bash
# Health check
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/health/db

# Redis health
curl http://localhost:3000/api/health/redis

# Test API endpoints
curl http://localhost:3000/api/services
curl http://localhost:3000/api/users/me  # (with auth token)
```

### 5. Admin Tools Testing

**pgAdmin** (http://localhost:8080):
- Login with credentials from `.env`
- Connect to PostgreSQL server
- Verify you can see all tables and data

**Redis Commander** (http://localhost:8081):
- Login with credentials from `.env`
- Verify you can see Redis keys
- Check session data exists

### 6. Mock Services (if enabled)

```bash
# Start mocks
make mocks

# Test each mock
curl http://localhost:3001/health  # MercadoPago
curl http://localhost:3002/health  # AFIP
curl http://localhost:3003/health  # WhatsApp
curl http://localhost:3004/health  # SMS

# Check dashboards
open http://localhost:3001/dashboard  # MercadoPago
open http://localhost:3003/dashboard  # WhatsApp
```

### 7. Integration Tests

```bash
# Run full test suite
make test-all

# Or run individually
make test-integration
make test-payment
make test-notifications
make test-db
```

### Verification Checklist

- [ ] `make health` shows all services healthy
- [ ] Database contains expected data
- [ ] Can query database with `make db-shell`
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login to application
- [ ] Can perform core workflows (booking, payment)
- [ ] pgAdmin connects to database
- [ ] Redis Commander shows Redis data
- [ ] API endpoints respond correctly
- [ ] No errors in `make logs`
- [ ] Integration tests pass

## Troubleshooting

### Issue: Makefile Commands Don't Work

**Symptoms**:
```bash
make: command not found
# or
make: *** No rule to make target 'up'. Stop.
```

**Solution**:
```bash
# Check you pulled the latest code
git pull origin main

# Verify Makefile exists
ls -la Makefile

# Check you're in the project root
pwd  # Should be /path/to/service-booking

# Install make if missing (Linux/WSL2)
sudo apt install make

# macOS
xcode-select --install
```

### Issue: Port Conflicts

**Symptoms**:
```bash
Error: port 5432 is already in use
```

**Solution**:
```bash
# Option 1: Stop old services
docker stop $(docker ps -q)

# Option 2: Find and kill process using port
lsof -ti:5432
lsof -ti:5432 | xargs kill

# Option 3: Change port in docker-compose.yml
# Edit docker/docker-compose.yml
# Change "5432:5432" to "5433:5432"
# Update DATABASE_URL in .env accordingly
```

### Issue: Container Names Conflict

**Symptoms**:
```bash
Error: The container name "/barberpro-postgres" is already in use
```

**Solution**:
```bash
# Stop and remove old containers
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

# Or use make clean (will prompt for confirmation)
make clean

# Then try again
make up
```

### Issue: Volume Data Not Preserved

**Symptoms**:
- Database is empty after migration
- Lost all local data

**Solution**:
```bash
# Stop services
make down

# Check if volumes still exist
docker volume ls | grep barberpro

# If volumes exist, restore from backup
make up
make db-restore FILE=~/barberpro-migration-backup/database.sql

# If volumes were deleted, restore from SQL backup
make up
make db-migrate
make db-restore FILE=backup_YYYYMMDD_HHMMSS.sql
```

### Issue: Environment Variables Not Working

**Symptoms**:
- Services can't connect to database
- API calls fail with connection errors
- Webhooks not working

**Solution**:
```bash
# Check .env file exists
ls -la .env

# Review key variables
grep DATABASE_URL .env
grep REDIS_URL .env

# Important: Use service names, not localhost
# ✓ Correct:
DATABASE_URL=postgresql://user:pass@postgres:5432/db
REDIS_URL=redis://redis:6379

# ✗ Wrong:
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379

# Restart services after fixing
make restart
```

### Issue: Database Connection Failed

**Symptoms**:
```bash
Error: connect ECONNREFUSED postgres:5432
```

**Solution**:
```bash
# Check postgres is running
make ps
docker logs barberpro-postgres

# Check postgres health
docker inspect barberpro-postgres | grep Health -A 10

# Wait for postgres to be healthy
sleep 10 && make health

# If still failing, check DATABASE_URL
echo $DATABASE_URL
# Should use 'postgres' as host, not 'localhost'

# Restart backend
make restart
```

### Issue: Dependencies Installation Failed

**Symptoms**:
```bash
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Solution**:
```bash
# Clean everything
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm run install:all

# If still failing, check Node.js version
node --version  # Should be v20.x.x

# Update Node.js if needed
nvm install 20
nvm use 20
```

### Issue: Services Show as Unhealthy

**Symptoms**:
```bash
make health
postgres:  [✗] Unhealthy
```

**Solution**:
```bash
# Check logs for errors
make logs

# Check specific service
docker logs barberpro-postgres

# Wait longer (services may still be starting)
sleep 30 && make health

# If still unhealthy, restart service
make restart

# Nuclear option
make clean
make up
```

## Rollback Procedures

If migration fails, you can rollback to the previous state.

### Quick Rollback (Within Same Day)

```bash
# Step 1: Stop new environment
make down

# Step 2: Checkout previous version
git checkout v1.0.0

# Step 3: Restore old .env
cp ~/barberpro-migration-backup/.env.old .env

# Step 4: Start old environment
docker-compose up -d

# Step 5: Restore database
docker-compose exec -T postgres psql -U barberpro barberpro_dev < ~/barberpro-migration-backup/database.sql

# Step 6: Verify
docker-compose ps
curl http://localhost:3000/health
```

### Full Rollback (Next Day or Later)

```bash
# Step 1: Document issues
# Create a GitHub issue with:
# - What went wrong
# - Error messages
# - Output of `make doctor`
# - Output of `make logs`

# Step 2: Notify team
# Post in #engineering Slack channel

# Step 3: Stop current environment
make down
# or
docker stop $(docker ps -aq)

# Step 4: Restore from backup
cd ~/barberpro-migration-backup

# Checkout old version
git checkout v1.0.0

# Restore environment
cp .env.old /path/to/project/.env

# Start old environment
cd /path/to/project
docker-compose up -d

# Restore database
docker-compose exec -T postgres psql -U barberpro barberpro_dev < ~/barberpro-migration-backup/database.sql

# Step 5: Verify everything works
docker-compose ps
curl http://localhost:3000/health

# Step 6: Clean up new resources
docker system prune -a
```

## FAQ

### Q: Can I use docker-compose commands directly?

**A**: Yes, but the Makefile provides a better experience. The Makefile handles:
- Prerequisite checks (Docker running, ports available)
- Colored output for better readability
- Cross-platform compatibility
- Safety checks and confirmations
- Health checks and diagnostics

### Q: What if I'm on Windows (not WSL2)?

**A**: The Makefile requires Unix-like environment. Options:
1. **Recommended**: Use WSL2 (follow [Setup Guide](./docker-setup-guide.md#windows-wsl2))
2. Use npm scripts as alternative (limited functionality):
   ```bash
   npm run docker:up
   npm run docker:down
   ```
3. Use raw docker-compose commands (no safety checks)

### Q: Do I need to migrate if everything works?

**A**: Not immediately, but you should plan to migrate because:
- New features and improvements (monitoring, mocks, testing)
- Better developer experience (Makefile commands)
- Ongoing support and bug fixes
- Team standardization
- Better documentation

Old setup (v1.x) will not receive updates after 2025-12-31.

### Q: Can I migrate without downtime?

**A**: For local development, some downtime is expected (10-30 minutes). For production:
- Plan migration during maintenance window
- Use blue-green deployment strategy
- Have rollback plan ready
- Test thoroughly in staging first

### Q: What if I customized docker-compose files?

**A**: Document your customizations, then:
1. Backup custom docker-compose files
2. Migrate to new structure
3. Apply customizations to new files
4. Test thoroughly
5. Document changes in team wiki

### Q: How do I know if migration was successful?

**A**: Complete the [Post-Migration Verification](#post-migration-verification) checklist. All checks should pass.

### Q: Can I run old and new environments side by side?

**A**: No, they use same ports. You must choose one. However, you can:
1. Change ports in new environment
2. Run old environment first, test it
3. Stop old, start new, test it
4. Choose which one to keep

### Q: What happens to my local branches?

**A**: Git branches are unaffected. Docker environment is infrastructure, not code. Your feature branches will work with the new environment.

### Q: Do I need to tell my team?

**A**: Yes, if you share an environment. For personal local development, no coordination needed.

### Q: How often should I update the Docker environment?

**A**: Check for updates monthly. Apply security updates immediately. Major version upgrades (2.0 → 3.0) should be planned.

### Q: Where can I get help?

**A**:
1. Check this guide and [Troubleshooting](#troubleshooting)
2. Run `make doctor` for diagnostics
3. Check logs with `make logs`
4. Ask in #docker-environment Slack channel
5. Create GitHub issue with `docker` label

## Production Migration (Not Covered Here)

Production migrations require careful planning. This guide covers development environment migration only.

For production migrations, consult with your DevOps team and follow these general guidelines:

1. **Plan thoroughly** (1-2 weeks of planning)
2. **Test in staging** (1 week of testing)
3. **Schedule maintenance window** (with customer notice)
4. **Prepare rollback plan** (tested and documented)
5. **Have on-call team ready** (during and after migration)
6. **Monitor closely** (24-48 hours post-migration)
7. **Document lessons learned**

Contact devops@barberpro.com.ar for production migration support.

---

## Additional Resources

- **[Setup Guide](./docker-setup-guide.md)** - For first-time setup
- **[Docker README](../docker/README.md)** - Makefile command reference
- **[Makefile Cheat Sheet](./makefile-cheat-sheet.md)** - Quick command reference
- **[Troubleshooting Guide](./docker-troubleshooting.md)** - Common issues
- **[Changelog](./docker-changelog.md)** - What's new in each version

## Support

Need help with migration?

1. **Documentation**: Read this guide thoroughly
2. **Diagnostics**: Run `make doctor`
3. **Logs**: Check `make logs` for errors
4. **Team**: Ask in #docker-environment Slack
5. **GitHub**: Create issue with `migration` label
6. **Email**: devops@barberpro.com.ar

---

**Last Updated**: 2025-10-12
**Guide Version**: 2.0.0
**Covers Migration From**: v1.0.0 → v2.0.0
