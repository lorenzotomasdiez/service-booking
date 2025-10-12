# Docker Environment Troubleshooting Guide

Comprehensive troubleshooting guide for the BarberPro Docker development environment. This guide covers common issues, their causes, and step-by-step solutions.

## Table of Contents

- [Quick Diagnostic Commands](#quick-diagnostic-commands)
- [Services Won't Start](#services-wont-start)
- [Performance Issues](#performance-issues)
- [Connection Issues](#connection-issues)
- [Database Issues](#database-issues)
- [Mock Service Issues](#mock-service-issues)
- [Monitoring Stack Issues](#monitoring-stack-issues)
- [Reset Strategies](#reset-strategies)
- [Platform-Specific Issues](#platform-specific-issues)
- [Getting Help](#getting-help)

## Quick Diagnostic Commands

When something goes wrong, start with these diagnostic commands:

```bash
# Check overall system health
make doctor

# Check service status
make status

# View all logs
make logs

# Check resource usage
make stats

# Run health checks
make health
```

---

## Services Won't Start

### Issue: Port Already in Use

**Symptoms**:
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
Error: Ports are not available: exposing port TCP 0.0.0.0:6379
```

**Cause**: Another service (local PostgreSQL, Redis, or another Docker container) is using the required port.

**Solutions**:

**Option 1: Stop the conflicting service** (Recommended)
```bash
# Find what's using the port
lsof -ti:5432      # PostgreSQL
lsof -ti:6379      # Redis
lsof -ti:3000      # Backend
lsof -ti:5173      # Frontend

# Stop the process (if safe to do so)
# Replace 5432 with the conflicting port
lsof -ti:5432 | xargs kill

# Or use sudo for system services
sudo systemctl stop postgresql
sudo systemctl stop redis
```

**Option 2: Change the port in docker-compose**
```bash
# Edit docker/docker-compose.yml
# Change the port mapping (HOST:CONTAINER)
# Example for PostgreSQL:
ports:
  - "5433:5432"  # Use 5433 on host instead of 5432

# Update your DATABASE_URL accordingly
# postgresql://user:pass@localhost:5433/db
```

**Option 3: Use the test environment** (different ports)
```bash
# Test environment uses alternative ports
make test
# PostgreSQL: 5433
# Redis: 6380
```

---

### Issue: Docker Not Running

**Symptoms**:
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
Error response from daemon: dial unix /var/run/docker.sock: connect: no such file or directory
```

**Cause**: Docker Desktop (macOS/Windows) is not started, or Docker daemon (Linux) is not running.

**Solutions**:

**macOS / Windows**:
```bash
# Start Docker Desktop application
# Wait for the whale icon to be solid (not animated)

# Verify Docker is running
docker info
```

**Linux**:
```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify Docker is running
docker info

# Check Docker service status
sudo systemctl status docker
```

**WSL2**:
```bash
# Ensure Docker Desktop's WSL2 integration is enabled
# 1. Open Docker Desktop
# 2. Settings → Resources → WSL Integration
# 3. Enable integration for your WSL2 distro

# Verify in WSL2 terminal
docker info
```

---

### Issue: Docker Compose Version Conflict

**Symptoms**:
```
ERROR: Version in "./docker-compose.yml" is unsupported
docker-compose: command not found
```

**Cause**: Docker Compose v1 vs v2 incompatibility, or Docker Compose not installed.

**Solutions**:

**Check Docker Compose version**:
```bash
docker-compose --version  # V1 (standalone)
docker compose version    # V2 (plugin)
```

**If using Docker Compose V2** (recommended):
```bash
# V2 uses "docker compose" (no hyphen)
# The Makefile should work with both versions
# If issues persist, ensure Docker Desktop includes Compose V2
```

**If Docker Compose is missing** (Linux):
```bash
# Install Docker Compose V2
sudo apt update
sudo apt install docker-compose-plugin

# Verify installation
docker compose version
```

---

### Issue: Permission Denied (Linux)

**Symptoms**:
```
permission denied while trying to connect to the Docker daemon socket
Got permission denied while trying to connect to the Docker daemon
```

**Cause**: Your user is not in the `docker` group.

**Solution**:
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# IMPORTANT: Log out and log back in for changes to take effect
# Or use newgrp (temporary)
newgrp docker

# Verify you're in the docker group
groups | grep docker

# Test Docker access
docker ps
```

---

### Issue: Network Already Exists

**Symptoms**:
```
Error response from daemon: network barberpro-network already exists
Creating network "barberpro-network" with driver "bridge"
ERROR: failed to create network: network already exists
```

**Cause**: Previous Docker environment left network behind.

**Solution**:
```bash
# Remove existing network
docker network rm barberpro-network

# Or use docker-compose down to clean up
make down

# Then restart
make up
```

---

## Performance Issues

### Issue: Slow Container Startup

**Symptoms**:
- Services take 2+ minutes to become healthy
- `make up` hangs on "Waiting for services..."
- Containers show as "Starting" for extended periods

**Causes**:
- Insufficient Docker resources
- Too many services running simultaneously
- Disk space issues
- Image layers not cached

**Solutions**:

**1. Increase Docker Desktop Resources** (macOS/Windows):
```bash
# Open Docker Desktop → Settings → Resources
# Increase:
#   CPUs: 4+ (from default 2)
#   Memory: 8GB+ (from default 4GB)
#   Disk: 60GB+ (from default 40GB)

# Restart Docker Desktop after changes
```

**2. Use Minimal Development Environment**:
```bash
# Start only essential services
make dev  # Only postgres, redis, admin tools

# Instead of:
# make full  # Includes monitoring + mocks
```

**3. Check Disk Space**:
```bash
# Check available space
df -h

# Check Docker disk usage
docker system df

# Clean up if needed
make prune
```

**4. Prune Unused Resources**:
```bash
# Remove unused Docker resources
make prune

# More aggressive cleanup (careful!)
docker system prune -a --volumes
```

---

### Issue: High Memory Usage

**Symptoms**:
- System becomes slow/unresponsive
- Docker Desktop shows high memory usage
- `make stats` shows containers using excessive memory

**Solutions**:

**1. Check Current Usage**:
```bash
# Monitor container resource usage
make stats

# Check Docker system usage
docker system df
```

**2. Stop Unnecessary Services**:
```bash
# Stop monitoring stack if running
make monitoring-down

# Stop mock services if not needed
make mocks-down

# Use minimal environment
make down
make dev  # Only postgres + redis
```

**3. Increase Docker Memory Limit**:
```bash
# Docker Desktop → Settings → Resources
# Increase Memory limit to 8GB or more
```

**4. Check for Memory Leaks**:
```bash
# Monitor specific service over time
docker stats barberpro-postgres

# Check logs for memory-related errors
make logs-backend
```

**5. Restart Services**:
```bash
# Quick restart
make restart

# If memory issues persist, complete reset
make reset
```

---

### Issue: Slow Database Queries

**Symptoms**:
- API endpoints timeout
- Frontend shows long loading times
- Backend logs show slow query warnings

**Solutions**:

**1. Check Database Connection Pool**:
```bash
# Access database shell
make db-shell

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

**2. Restart Database**:
```bash
# Restart PostgreSQL container
docker restart barberpro-postgres

# Or restart everything
make restart
```

**3. Check Indexes**:
```bash
# Access database shell
make db-shell

# List tables without indexes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Connection Issues

### Issue: Backend Can't Connect to Database

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: getaddrinfo ENOTFOUND postgres
Connection refused: Could not connect to database
```

**Causes**:
- Database not started or not healthy
- Wrong DATABASE_URL configuration
- Network configuration issues

**Solutions**:

**1. Check Database Status**:
```bash
# Check if postgres container is running
make status

# Check database health specifically
make health

# View database logs
docker logs barberpro-postgres
```

**2. Verify DATABASE_URL**:
```bash
# Inside Docker network, use service name "postgres"
# ✅ Correct:
DATABASE_URL=postgresql://barberpro:password@postgres:5432/barberpro_dev

# ❌ Wrong (localhost won't work inside containers):
DATABASE_URL=postgresql://barberpro:password@localhost:5432/barberpro_dev

# Check backend .env file
cat backend/.env | grep DATABASE_URL
```

**3. Wait for Database to Be Healthy**:
```bash
# Sometimes database needs more time to start
sleep 10 && make health

# Check if database accepts connections
docker exec barberpro-postgres pg_isready -U barberpro
```

**4. Restart Backend**:
```bash
# If backend started before database was ready
docker restart barberpro-backend-dev

# Or restart everything
make restart
```

**5. Network Issues**:
```bash
# Verify network exists
docker network ls | grep barberpro

# Recreate network
make down
docker network rm barberpro-network
make up
```

---

### Issue: CORS Errors in Frontend

**Symptoms**:
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Causes**:
- Backend CORS_ORIGIN not configured correctly
- Backend not running
- Frontend making requests to wrong backend URL

**Solutions**:

**1. Check CORS Configuration**:
```bash
# Check backend .env file
cat backend/.env | grep CORS_ORIGIN

# Should include frontend URL:
CORS_ORIGIN=http://localhost:5173,http://frontend:5173
```

**2. Restart Backend**:
```bash
# After updating CORS_ORIGIN
docker restart barberpro-backend-dev

# Or use make command
make restart
```

**3. Clear Browser Cache**:
```bash
# Browser may have cached CORS headers
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
# Or clear browser cache completely
```

**4. Check Backend is Running**:
```bash
# Verify backend is accessible
curl http://localhost:3000/health

# Check backend logs
make logs-backend
```

**5. Verify Frontend URL**:
```bash
# Check frontend .env file
cat frontend/.env | grep VITE_API_URL

# Should point to backend:
VITE_API_URL=http://localhost:3000
```

---

### Issue: Cannot Access Services from Host

**Symptoms**:
- `curl http://localhost:5432` fails
- Cannot access pgAdmin at http://localhost:8080
- Services are running but not accessible from browser

**Causes**:
- Port mapping not configured
- Firewall blocking ports
- Services bound to wrong interface

**Solutions**:

**1. Check Port Mappings**:
```bash
# List running containers with ports
make ps

# Or use docker ps
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**2. Verify Service is Running**:
```bash
# Check health
make health

# Check specific service
docker logs barberpro-pgadmin
```

**3. Test Port Connectivity**:
```bash
# Test if port is open
nc -zv localhost 8080

# Or use telnet
telnet localhost 8080
```

**4. Check Firewall** (Linux):
```bash
# Check if port is blocked
sudo ufw status

# Allow port if needed
sudo ufw allow 8080
```

**5. WSL2 Port Forwarding** (Windows):
```bash
# WSL2 may need manual port forwarding
# In PowerShell (as Administrator):
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL2_IP>

# Find WSL2 IP:
# In WSL2: ip addr show eth0
```

---

## Database Issues

### Issue: Migrations Fail

**Symptoms**:
```
make db-migrate
Error: Migration failed
Database connection error
P3009: Migration failed to apply cleanly
```

**Causes**:
- Database schema conflicts
- Incomplete previous migrations
- Connection issues

**Solutions**:

**1. Check Database Connection**:
```bash
# Verify database is accessible
make db-shell

# If this fails, see "Backend Can't Connect to Database" above
```

**2. Check Migration Status**:
```bash
# View migration status in backend container
docker exec barberpro-backend-dev npm run db:migrate:status

# Or access backend shell
make shell-backend
npm run db:migrate:status
```

**3. Reset Migrations** (DESTRUCTIVE):
```bash
# WARNING: This deletes all data
make db-reset

# This runs: drop → migrate → seed
```

**4. Manual Migration**:
```bash
# Access backend shell
make shell-backend

# Run Prisma commands manually
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate resolve --applied <migration_name>
```

**5. Check Logs**:
```bash
# View backend logs for detailed errors
make logs-backend

# Check database logs
docker logs barberpro-postgres
```

---

### Issue: Seed Data Missing or Incorrect

**Symptoms**:
- Login fails (no users)
- Empty database after `make up`
- Missing test data

**Solutions**:

**1. Run Seed Command**:
```bash
# Seed database
make db-seed

# Check logs for errors
make logs-backend
```

**2. Verify Data**:
```bash
# Open database shell
make db-shell

# Check if users exist
SELECT id, email, name FROM users LIMIT 5;

# Check all tables
\dt

# Check row counts
SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

**3. Re-run Seed**:
```bash
# Seed is idempotent, safe to run multiple times
make db-seed
```

**4. Complete Reset** (if seed is corrupted):
```bash
# WARNING: Deletes all data
make db-reset
```

---

### Issue: Database Connection Pool Exhausted

**Symptoms**:
```
Error: Connection pool timeout
Error: Too many clients already
remaining connection slots are reserved
```

**Causes**:
- Too many open connections
- Connections not being closed properly
- Connection pool too small

**Solutions**:

**1. Check Active Connections**:
```bash
# Access database shell
make db-shell

# Count active connections
SELECT count(*) FROM pg_stat_activity;

# View connection details
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query
FROM pg_stat_activity;

# Kill idle connections (careful!)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < current_timestamp - INTERVAL '10 minutes';
```

**2. Restart Backend**:
```bash
# Restart backend to reset connection pool
docker restart barberpro-backend-dev
```

**3. Increase Connection Pool**:
```bash
# Edit backend Prisma configuration
# In backend/prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20  # Increase this
}

# Regenerate Prisma client
cd backend && npm run db:generate
```

**4. Restart Database**:
```bash
# Restart PostgreSQL
docker restart barberpro-postgres

# Or full reset
make restart
```

---

### Issue: Cannot Backup/Restore Database

**Symptoms**:
```
make db-backup
Error: Backup failed
make db-restore FILE=backup.sql
Error: Restore failed
```

**Solutions**:

**1. Verify Database is Running**:
```bash
# Check database status
make status
docker ps | grep postgres
```

**2. Check Backup Directory**:
```bash
# Create backup directory if missing
mkdir -p docker/backup

# Check permissions
ls -la docker/backup
```

**3. Manual Backup**:
```bash
# Create backup manually
docker exec barberpro-postgres pg_dump -U barberpro barberpro_dev > backup.sql

# Or with timestamp
docker exec barberpro-postgres pg_dump -U barberpro barberpro_dev > docker/backup/barberpro_$(date +%Y%m%d_%H%M%S).sql
```

**4. Manual Restore**:
```bash
# Restore from backup
cat backup.sql | docker exec -i barberpro-postgres psql -U barberpro barberpro_dev

# Check for errors in output
```

**5. Check Disk Space**:
```bash
# Verify sufficient disk space
df -h

# Large backups may fail if disk is full
```

---

## Mock Service Issues

### Issue: Mock Services Not Responding

**Symptoms**:
- Mock API endpoints return 404 or connection refused
- `curl http://localhost:3001/health` fails
- Mock dashboards not accessible

**Solutions**:

**1. Check Mock Services Status**:
```bash
# Check if mocks are running
make status

# Verify health endpoints
curl http://localhost:3001/health  # MercadoPago
curl http://localhost:3002/health  # AFIP
curl http://localhost:3003/health  # WhatsApp
curl http://localhost:3004/health  # SMS
curl http://localhost:8025         # MailHog
```

**2. Start Mock Services**:
```bash
# Mocks may not start with 'make dev'
# Use full environment or start mocks explicitly
make mocks

# Or start full environment
make full
```

**3. Check Logs**:
```bash
# View all mock service logs
make mocks-logs

# Or check specific service
docker logs barberpro-mercadopago-mock
docker logs barberpro-afip-mock
docker logs barberpro-whatsapp-mock
docker logs barberpro-sms-mock
docker logs barberpro-mailhog
```

**4. Restart Mock Services**:
```bash
# Restart all mocks
make mocks-down
make mocks

# Or restart individual service
docker restart barberpro-mercadopago-mock
```

**5. Rebuild Mock Images**:
```bash
# If mock code was updated
docker-compose -f docker/docker-compose.mocks.yml build --no-cache
make mocks
```

---

### Issue: Mock Services Show Wrong Behavior

**Symptoms**:
- Payment always succeeds (even when testing failures)
- Mock doesn't simulate expected scenarios
- Webhook not being called

**Solutions**:

**1. Check Mock Configuration**:
```bash
# View mock service environment variables
docker exec barberpro-mercadopago-mock env

# Check default scenario
docker exec barberpro-mercadopago-mock cat /app/.env
```

**2. Change Mock Scenario**:
```bash
# Some mocks support scenario configuration
# Update environment variable in docker-compose.mocks.yml:
environment:
  DEFAULT_SCENARIO: "failure"  # or "timeout", "declined"

# Restart mocks
make mocks-down
make mocks
```

**3. Check Webhook Configuration**:
```bash
# Verify webhook URLs point to backend
docker exec barberpro-mercadopago-mock env | grep WEBHOOK

# Should be:
WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago

# Not:
WEBHOOK_URL=http://localhost:3000/api/webhooks/mercadopago
```

**4. Access Mock Dashboards**:
```bash
# View captured data in mock dashboards
open http://localhost:3001/dashboard  # MercadoPago (macOS)
open http://localhost:3003/dashboard  # WhatsApp
open http://localhost:8025            # MailHog (emails)

# Linux:
xdg-open http://localhost:3001/dashboard
```

**5. Reset Mock Data**:
```bash
# Clear mock data and restart
make mocks-reset
```

---

## Monitoring Stack Issues

### Issue: Grafana Dashboard Not Loading

**Symptoms**:
- http://localhost:3001 not accessible
- Grafana shows "502 Bad Gateway"
- Grafana login fails

**Solutions**:

**1. Check Monitoring Stack Status**:
```bash
# Verify monitoring services are running
docker ps | grep -E "grafana|prometheus|loki"

# Check logs
make monitoring-logs
```

**2. Start Monitoring Stack**:
```bash
# Monitoring stack is separate from dev environment
make monitoring

# Or start full environment
make full
```

**3. Wait for Grafana to Initialize**:
```bash
# Grafana may take 30-60 seconds to fully start
sleep 30

# Check health
curl http://localhost:3001/api/health
```

**4. Check Grafana Credentials**:
```bash
# Default credentials:
Username: admin
Password: admin

# Or check environment variables
docker exec barberpro-grafana env | grep GF_SECURITY
```

**5. Restart Grafana**:
```bash
# Restart Grafana container
docker restart barberpro-grafana

# Or restart entire monitoring stack
make monitoring-down
make monitoring
```

---

### Issue: Prometheus Not Scraping Metrics

**Symptoms**:
- Grafana shows "No data"
- Prometheus targets show as "down"
- Metrics not appearing

**Solutions**:

**1. Access Prometheus UI**:
```bash
# Open Prometheus
open http://localhost:9090  # macOS
xdg-open http://localhost:9090  # Linux

# Check targets: http://localhost:9090/targets
```

**2. Verify Service Discovery**:
```bash
# Check Prometheus configuration
docker exec barberpro-prometheus cat /etc/prometheus/prometheus.yml

# Verify services are accessible from Prometheus
docker exec barberpro-prometheus wget -O- http://backend:3000/metrics
```

**3. Check Network Configuration**:
```bash
# Verify Prometheus is on correct network
docker inspect barberpro-prometheus | grep NetworkMode

# Should be: barberpro-dev-network or barberpro-network
```

**4. Restart Prometheus**:
```bash
# Restart Prometheus to reload config
docker restart barberpro-prometheus
```

---

## Reset Strategies

Depending on the severity of your issues, choose the appropriate reset strategy:

### Soft Reset (Restart Services)

**Use when**: Services are unresponsive but data is fine.

```bash
# Quick restart
make restart

# Expected time: 30-60 seconds
```

**What it does**:
- Stops all containers
- Starts all containers
- Preserves volumes (data safe)

---

### Medium Reset (Reset Database)

**Use when**: Database is corrupted or migrations are broken.

```bash
# Reset database only
make db-reset

# Expected time: 10-20 seconds
```

**What it does**:
- Drops all tables
- Runs migrations
- Seeds test data
- **Deletes all data in database**

---

### Hard Reset (Clean Environment)

**Use when**: Persistent issues across multiple services.

```bash
# Complete environment reset
make reset

# Expected time: 1-2 minutes
```

**What it does**:
1. Stops all services
2. Removes all volumes (data loss!)
3. Removes networks
4. Starts fresh environment
5. Ready for migrations and seeding

---

### Nuclear Reset (System-Wide Cleanup)

**Use when**: Nothing else works, or extreme disk space issues.

```bash
# DANGER: Affects all Docker projects on your system!
make down
docker system prune -a --volumes

# Then rebuild
make rebuild

# Expected time: 5-10 minutes
```

**What it does**:
- Removes all stopped containers (all projects)
- Removes all unused images (all projects)
- Removes all unused volumes (all projects)
- Removes all unused networks (all projects)
- Clears build cache

**Warning**: This affects ALL Docker projects on your system, not just BarberPro!

---

### Comparison of Reset Strategies

| Strategy | Time | Data Loss | Scope | Use Case |
|----------|------|-----------|-------|----------|
| Soft Reset | 1 min | None | Services only | Quick fix |
| Database Reset | 20 sec | Database only | Database only | Migration issues |
| Hard Reset | 2 min | All BarberPro data | BarberPro only | Major issues |
| Nuclear Reset | 10 min | All Docker data | System-wide | Last resort |

---

## Platform-Specific Issues

### macOS Issues

#### Issue: Docker Desktop Won't Start

**Solutions**:
```bash
# Reset Docker Desktop
# Docker Desktop → Troubleshoot → Reset to factory defaults

# Or via command line
rm -rf ~/Library/Group\ Containers/group.com.docker
rm -rf ~/Library/Containers/com.docker.docker

# Reinstall Docker Desktop
```

#### Issue: Port Forwarding Issues on macOS

**Solution**:
```bash
# macOS may require explicit port binding
# Already handled in docker-compose.yml with 0.0.0.0:PORT

# Verify port is listening
lsof -i :5432
```

---

### Linux Issues

#### Issue: systemd-resolve Conflict (Port 53)

**Solution**:
```bash
# If using DNS mock on port 53
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved

# Or change DNS mock to different port
```

#### Issue: SELinux Blocking Docker

**Solution**:
```bash
# Check SELinux status
sestatus

# Option 1: Add Docker to SELinux policy
sudo setsebool -P container_manage_cgroup on

# Option 2: Disable SELinux (not recommended for production)
sudo setenforce 0
```

---

### WSL2 Issues

#### Issue: WSL2 Memory Issues

**Solution**:
```bash
# Create/edit .wslconfig in Windows user directory
# C:\Users\<username>\.wslconfig

[wsl2]
memory=8GB
processors=4
swap=2GB

# Restart WSL2
wsl --shutdown
```

#### Issue: Clock Drift in WSL2

**Symptoms**:
- JWT tokens expire immediately
- CORS issues
- Certificate errors

**Solution**:
```bash
# Sync WSL2 clock
sudo hwclock -s

# Or restart WSL2
wsl --shutdown
```

#### Issue: File Permission Issues in WSL2

**Solution**:
```bash
# Project should be in WSL2 filesystem, not /mnt/c/
# Move project to WSL2:
mv /mnt/c/projects/service-booking ~/projects/service-booking
cd ~/projects/service-booking

# Update git if needed
git config --global core.fileMode false
```

---

## Getting Help

### Self-Service Diagnostics

**Run these commands and gather output**:
```bash
# 1. System diagnostics
make doctor > diagnostics.txt

# 2. Service status
make status >> diagnostics.txt

# 3. Service health
make health >> diagnostics.txt

# 4. Recent logs (last 50 lines)
make logs --tail=50 >> diagnostics.txt

# 5. Resource usage
docker system df >> diagnostics.txt
```

### Before Asking for Help

1. **Check this troubleshooting guide** - 80% of issues are covered here
2. **Run diagnostics** - `make doctor` and `make health`
3. **Check logs** - `make logs` or `make logs-backend`
4. **Try a reset** - Start with `make restart`, escalate to `make reset`
5. **Search existing issues** - Check GitHub issues for similar problems

### Where to Get Help

1. **Documentation**:
   - [Setup Guide](./docker-setup-guide.md)
   - [Architecture](./docker-architecture.md)
   - [Makefile Cheat Sheet](./makefile-cheat-sheet.md)
   - [FAQ](./docker-faq.md)

2. **Team Communication**:
   - Slack: #dev-environment channel
   - Slack: #barberpro-dev general channel

3. **GitHub Issues**:
   - [Open an issue](https://github.com/your-org/service-booking/issues/new)
   - Include output from `make doctor`
   - Include relevant logs
   - Mention your OS and Docker version

### Creating a Good Bug Report

When reporting Docker environment issues, include:

```bash
# 1. Environment information
make version

# 2. System diagnostics
make doctor

# 3. Service status
make status

# 4. Recent logs (if relevant)
make logs --tail=100

# 5. Steps to reproduce
# List exact commands that caused the issue

# 6. Expected vs actual behavior
# What should happen vs what actually happened
```

### Emergency Contacts

For critical production issues:
- On-call engineer: [Slack @oncall]
- DevOps lead: [Slack @devops-lead]
- Emergency escalation: [Phone number]

---

## Common Error Messages Reference

| Error Message | Section | Quick Fix |
|--------------|---------|-----------|
| "Port already allocated" | [Services Won't Start](#issue-port-already-in-use) | `lsof -ti:PORT \| xargs kill` |
| "Cannot connect to Docker daemon" | [Services Won't Start](#issue-docker-not-running) | Start Docker Desktop |
| "Permission denied" | [Services Won't Start](#issue-permission-denied-linux) | `sudo usermod -aG docker $USER` |
| "ECONNREFUSED" | [Connection Issues](#issue-backend-cant-connect-to-database) | Check DATABASE_URL |
| "CORS policy" | [Connection Issues](#issue-cors-errors-in-frontend) | Update CORS_ORIGIN |
| "Migration failed" | [Database Issues](#issue-migrations-fail) | `make db-reset` |
| "Connection pool exhausted" | [Database Issues](#issue-database-connection-pool-exhausted) | Restart backend |
| "No such service" | [Mock Service Issues](#issue-mock-services-not-responding) | `make mocks` |

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Maintainer**: DevOps Team

For updates to this document, please submit a pull request or create an issue.
