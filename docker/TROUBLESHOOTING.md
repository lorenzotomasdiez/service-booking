# Docker Environment Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when running the BarberPro Docker development environment. Issues are organized by category with clear symptoms, causes, and step-by-step solutions.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Common Issues](#common-issues)
  - [Services Won't Start](#services-wont-start)
  - [Port Already in Use](#port-already-in-use)
  - [Database Connection Fails](#database-connection-fails)
  - [Redis Connection Fails](#redis-connection-fails)
  - [Frontend Won't Hot Reload](#frontend-wont-hot-reload)
  - [Docker Out of Space](#docker-out-of-space)
  - [Performance Is Slow](#performance-is-slow)
  - [Health Checks Never Pass](#health-checks-never-pass)
  - [Mocks Not Working](#mocks-not-working)
- [Platform-Specific Issues](#platform-specific-issues)
  - [macOS](#macos)
  - [Linux](#linux)
  - [Windows WSL2](#windows-wsl2)
- [Advanced Troubleshooting](#advanced-troubleshooting)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Before diving into specific issues, run these diagnostic commands:

```bash
# 1. Check Docker is running and configured correctly
make doctor

# 2. Check service health
make health

# 3. Check container status
make status

# 4. View logs for errors
make logs | head -100

# 5. Check resource usage
docker stats --no-stream
```

**Understanding the output**:
- Green checkmarks (✓): Everything is OK
- Yellow warnings (!): Needs attention but not critical
- Red crosses (✗): Critical issues that need fixing

---

## Common Issues

### Services Won't Start

**Symptom**: Running `make up` fails or services crash immediately

**Possible Causes**:
1. Docker is not running
2. Ports are already in use
3. Insufficient system resources
4. Corrupted images or volumes
5. Configuration file errors

**Solutions**:

#### Step 1: Check Docker Status

```bash
# Run diagnostics
make doctor

# If Docker is not running:
# macOS: Open Docker Desktop from Applications
# Linux: sudo systemctl start docker
# WSL2: Start Docker Desktop on Windows
```

#### Step 2: Check Port Conflicts

```bash
# Automatic check
make doctor

# Manual check for PostgreSQL
lsof -ti:5432

# Manual check for Redis
lsof -ti:6379

# If ports are in use, see "Port Already in Use" section below
```

#### Step 3: Check Logs

```bash
# View all logs
make logs

# Check specific service
docker logs barberpro-postgres
docker logs barberpro-redis
```

#### Step 4: Try a Clean Start

```bash
# Stop everything
make down

# Start fresh
make up

# If still failing, try reset
make reset
```

#### Step 5: Check System Resources

```bash
# Check Docker resource allocation
docker system info | grep -E 'CPUs|Memory'

# macOS: Increase in Docker Desktop > Settings > Resources
# WSL2: Update .wslconfig file
```

---

### Port Already in Use

**Symptom**: Error message: "port 5432 is already in use" or similar

**Cause**: Another service is using the port (often a local PostgreSQL or Redis installation)

**Solutions**:

#### Option 1: Kill the Conflicting Process

```bash
# Find what's using port 5432
lsof -ti:5432

# Kill the process (replace <PID> with actual PID)
kill -9 <PID>

# Or kill directly
lsof -ti:5432 | xargs kill -9

# For Redis (port 6379)
lsof -ti:6379 | xargs kill -9
```

#### Option 2: Stop Local Service

**macOS**:
```bash
# Stop PostgreSQL
brew services stop postgresql

# Stop Redis
brew services stop redis
```

**Linux**:
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Stop Redis
sudo systemctl stop redis
```

#### Option 3: Change Port in Docker Compose

Edit `docker/docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432

  redis:
    ports:
      - "6380:6379"  # Use 6380 instead of 6379
```

**Note**: If changing ports, update connection strings in `.env`:

```bash
DATABASE_URL=postgresql://barberpro:password@localhost:5433/barberpro_dev
REDIS_URL=redis://localhost:6380
```

#### Option 4: Use Dev Mode with External DB

```bash
# If you want to use your local PostgreSQL
make dev-external-db

# Configure connection in .env to point to your local DB
```

---

### Database Connection Fails

**Symptom**: Backend can't connect to PostgreSQL, errors like "connection refused" or "database does not exist"

**Solutions**:

#### Step 1: Check PostgreSQL is Running

```bash
# Check container status
docker ps | grep postgres

# Should show: barberpro-postgres   Up X minutes   (healthy)

# If not running:
make up
```

#### Step 2: Check PostgreSQL Health

```bash
# Check health status
make health

# Check PostgreSQL logs
docker logs barberpro-postgres

# Should see: "database system is ready to accept connections"
```

#### Step 3: Wait for Health Checks

```bash
# PostgreSQL takes 10-15 seconds to be fully ready
sleep 15

# Then check again
make health
```

#### Step 4: Verify Connection String

Check `.env` file:

```bash
# Should match docker-compose.yml settings
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@localhost:5432/barberpro_dev

# Check if port is correct (5432 by default)
# Check if password matches docker-compose.yml
```

#### Step 5: Test Connection Manually

```bash
# Open database shell
make db-shell

# If connection succeeds, PostgreSQL is working
# If fails, issue is with PostgreSQL itself

# Try restarting PostgreSQL
docker restart barberpro-postgres
```

#### Step 6: Reset Database

```bash
# If all else fails, reset database
make db-reset

# Or complete reset
make reset
```

---

### Redis Connection Fails

**Symptom**: Backend can't connect to Redis, cache operations fail

**Solutions**:

#### Step 1: Check Redis is Running

```bash
# Check container status
docker ps | grep redis

# Should show: barberpro-redis   Up X minutes   (healthy)

# If not running:
make up
```

#### Step 2: Check Redis Health

```bash
# Test Redis connection
docker exec barberpro-redis redis-cli ping

# Should respond: PONG

# Check Redis logs
docker logs barberpro-redis
```

#### Step 3: Verify Connection String

Check `.env` file:

```bash
# Should be:
REDIS_URL=redis://localhost:6379

# Or if using password:
REDIS_URL=redis://:password@localhost:6379
```

#### Step 4: Restart Redis

```bash
# Restart Redis container
docker restart barberpro-redis

# Wait a few seconds
sleep 5

# Test again
docker exec barberpro-redis redis-cli ping
```

#### Step 5: Clear Redis Data

```bash
# Flush all Redis data
docker exec barberpro-redis redis-cli FLUSHALL

# Or restart with fresh volume
docker-compose -f docker/docker-compose.yml down -v
make up
```

---

### Frontend Won't Hot Reload

**Symptom**: Code changes in frontend don't reflect in browser, have to manually refresh

**Cause**: File watching not working properly due to volume mount issues

**Solutions**:

#### macOS

Add to `.env`:

```bash
# Enable polling mode for file watching
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
CHOKIDAR_INTERVAL=1000
```

Restart frontend:

```bash
docker restart barberpro-frontend
# Or restart from terminal where you run npm run dev
```

#### Linux

Usually works out of the box. If not:

```bash
# Increase inotify watches limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

#### WSL2

1. **Ensure project is in WSL filesystem**:

```bash
# Check current location
pwd

# Should be: /home/username/projects/service-booking
# NOT: /mnt/c/Users/.../service-booking

# If in wrong location, move project:
cd ~
mkdir -p projects
cp -r /mnt/c/.../service-booking ~/projects/
cd ~/projects/service-booking
```

2. **Enable polling mode**:

Add to `.env`:

```bash
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
```

#### All Platforms

Check Vite logs:

```bash
# View frontend logs
make logs-frontend

# Should see: "ready in X ms" when files change
# If not seeing updates, restart:
docker restart barberpro-frontend
```

---

### Docker Out of Space

**Symptom**: Error: "no space left on device" when building or starting services

**Cause**: Docker images, volumes, and build cache consuming too much disk space

**Solutions**:

#### Step 1: Check Disk Usage

```bash
# Check Docker disk usage
docker system df

# Shows:
# - Images: Size of all images
# - Containers: Size of container filesystem layers
# - Volumes: Size of volumes
# - Build Cache: Size of build cache
```

#### Step 2: Prune Unused Resources

```bash
# Guided cleanup with confirmation
make prune

# Or manual cleanup:

# Remove stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes (CAUTION: deletes data!)
docker volume prune -f

# Remove build cache
docker builder prune -a -f
```

#### Step 3: Remove Specific Resources

```bash
# List all images
docker images

# Remove specific image
docker rmi <image-id>

# List all volumes
docker volume ls

# Remove specific volume (CAUTION)
docker volume rm <volume-name>
```

#### Step 4: Clean Everything (Nuclear Option)

```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove everything
docker system prune -a --volumes -f

# This removes:
# - All stopped containers
# - All networks not used by at least one container
# - All images without at least one container
# - All build cache
# - All volumes

# Then restart:
make up
```

#### Step 5: Increase Docker Disk Allocation

**macOS**:
- Docker Desktop > Settings > Resources > Disk image size
- Increase as needed (50GB minimum)

**WSL2**:
- Clean up Windows: `wsl --shutdown` then restart
- Or allocate more space to WSL2

---

### Performance Is Slow

**Symptom**: Docker operations take a long time, services are sluggish

**See**: [PERFORMANCE.md](./PERFORMANCE.md) for detailed troubleshooting

**Quick Fixes**:

#### Check Resource Usage

```bash
# Check CPU and memory usage
docker stats --no-stream

# If any container is using >80% CPU or memory, investigate
```

#### WSL2: Verify Project Location

```bash
# CRITICAL: Must be in WSL filesystem
pwd

# Correct: /home/username/projects/service-booking
# Wrong: /mnt/c/Users/.../service-booking (10-50x slower!)

# If wrong, move project:
cd ~
mkdir -p projects
cp -r /mnt/c/.../service-booking ~/projects/
```

#### Increase Docker Resources

**macOS**: Docker Desktop > Settings > Resources
- RAM: 8GB minimum (12GB recommended)
- CPUs: 4 minimum (6 recommended)

**WSL2**: Edit `C:\Users\YourName\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
```

Then restart: `wsl --shutdown`

#### Clear Caches and Restart

```bash
# Stop services
make down

# Clear Docker caches
docker system prune -f

# Restart
make up
```

---

### Health Checks Never Pass

**Symptom**: Services stuck in "starting" state, never become "healthy"

**Solutions**:

#### Step 1: Check Logs

```bash
# View all logs
make logs

# Check specific service
docker logs barberpro-postgres
docker logs barberpro-redis
```

#### Step 2: Wait Longer

```bash
# Some services take time to initialize
# Wait 60 seconds then check
sleep 60
make health
```

#### Step 3: Check Health Check Configuration

View `docker-compose.yml`:

```yaml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U barberpro"]
      interval: 10s
      timeout: 5s
      retries: 5
```

#### Step 4: Test Health Check Manually

```bash
# PostgreSQL
docker exec barberpro-postgres pg_isready -U barberpro

# Redis
docker exec barberpro-redis redis-cli ping
```

#### Step 5: Disable Health Checks Temporarily

Edit `docker-compose.yml` (for debugging only):

```yaml
services:
  postgres:
    # healthcheck:
    #   test: ["CMD-SHELL", "pg_isready"]
```

#### Step 6: Reset and Retry

```bash
# Complete reset
make reset

# Start fresh
make up

# Wait and check
sleep 30
make health
```

---

### Mocks Not Working

**Symptom**: MercadoPago/AFIP mocks not responding, tests failing

**Solutions**:

#### Step 1: Check Mocks Are Running

```bash
# Check mock containers
docker ps | grep mock

# Should show:
# - barberpro-mercadopago-mock
# - barberpro-afip-mock
# - barberpro-whatsapp-mock
# - barberpro-sms-mock
```

#### Step 2: Start Mocks

```bash
# Start mocks if not running
make mocks

# Check status
docker ps | grep mock
```

#### Step 3: Check Mock Logs

```bash
# View all mock logs
make mocks-logs

# Or specific mock
docker logs barberpro-mercadopago-mock
docker logs barberpro-afip-mock
```

#### Step 4: Verify Ports

```bash
# Check mocks are accessible
curl http://localhost:3001/health  # MercadoPago
curl http://localhost:3002/health  # AFIP
curl http://localhost:3003/health  # WhatsApp
curl http://localhost:3004/health  # SMS
```

#### Step 5: Reset Mocks

```bash
# Stop and remove mock volumes
make mocks-down
docker volume rm barberpro-mercadopago-data 2>/dev/null || true

# Start fresh
make mocks
```

#### Step 6: Check Mock Configuration

Check `docker/docker-compose.mocks.yml`:

```yaml
services:
  mercadopago-mock:
    ports:
      - "3001:3000"  # Correct port mapping
    environment:
      - NODE_ENV=development
```

---

## Platform-Specific Issues

### macOS

#### Apple Silicon Image Issues

**Symptom**: "image platform does not match host platform" warnings

**Solution**:

```bash
# Most images now support arm64, but if you encounter issues:

# Option 1: Use Rosetta 2 (automatic)
# Docker Desktop > Settings > General > Use Rosetta for x86/amd64

# Option 2: Force specific platform
docker run --platform linux/amd64 <image-name>

# In docker-compose.yml:
services:
  service-name:
    platform: linux/amd64
```

#### File Watching Not Working

**Symptom**: Hot reload doesn't work

**Solution**: See [Frontend Won't Hot Reload](#frontend-wont-hot-reload) section

#### Resource Limits

**Symptom**: "Not enough memory" errors

**Solution**:

```bash
# Increase Docker Desktop resources
# Docker Desktop > Settings > Resources > Memory: 8GB minimum
# Restart Docker Desktop

# Verify
docker system info | grep Memory
```

#### Docker Desktop Crashes

**Symptom**: Docker Desktop hangs or crashes on startup

**Solutions**:

1. **Restart**:
   ```bash
   # Quit Docker Desktop (Command+Q)
   # Reopen Docker Desktop
   ```

2. **Clear cache**:
   ```bash
   # Quit Docker Desktop
   rm -rf ~/Library/Containers/com.docker.docker
   # Restart Docker Desktop
   ```

3. **Reset to factory defaults**:
   - Docker Desktop > Troubleshoot > Reset to factory defaults

---

### Linux

#### Permission Denied

**Symptom**: "permission denied while trying to connect to Docker daemon"

**Solution**:

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes
newgrp docker

# Verify
docker ps

# If still issues, check Docker socket permissions
ls -l /var/run/docker.sock

# Should be: srw-rw---- ... docker
```

#### Docker Service Not Running

**Symptom**: "Cannot connect to the Docker daemon"

**Solution**:

```bash
# Check Docker service status
sudo systemctl status docker

# If not running, start it
sudo systemctl start docker

# Enable on boot
sudo systemctl enable docker

# Verify
docker info
```

#### SELinux Blocks Volume Mounts

**Symptom**: Permission denied accessing mounted volumes (Fedora/RHEL)

**Solution**:

```bash
# Option 1: Add :z flag to volumes (recommended)
# In docker-compose.yml:
volumes:
  - ./data:/var/lib/postgresql/data:z

# Option 2: Check SELinux status
getenforce

# Option 3: Temporarily set to permissive (not recommended for production)
sudo setenforce 0
```

#### Port Conflicts with System Services

**Symptom**: Port already in use by system service

**Solution**:

```bash
# Find what's using the port
sudo lsof -i :5432
# Or
sudo ss -tulpn | grep 5432

# Stop system service
sudo systemctl stop postgresql
sudo systemctl disable postgresql

# Or change port in docker-compose.yml
```

---

### Windows (WSL2)

#### Slow Performance

**Symptom**: Everything is extremely slow (minutes instead of seconds)

**Root Cause**: Project is in Windows filesystem (`/mnt/c/`)

**Solution** (CRITICAL):

```bash
# 1. Check current location
pwd

# If it shows /mnt/c/... you MUST move the project

# 2. Move project to WSL filesystem
cd ~
mkdir -p projects

# 3. Copy project
cp -r /mnt/c/Users/YourName/projects/service-booking ~/projects/

# 4. Navigate to new location
cd ~/projects/service-booking

# 5. Verify (should be fast now)
make up
```

**Performance comparison**:
- Windows filesystem: Cold start 3-5 minutes
- WSL filesystem: Cold start 45-60 seconds

#### Scripts Won't Execute

**Symptom**: `bash: ./script.sh: /bin/bash^M: bad interpreter`

**Root Cause**: Windows CRLF line endings

**Solution**:

```bash
# Install dos2unix
sudo apt install dos2unix

# Fix all shell scripts
find . -name "*.sh" -exec dos2unix {} \;

# Or fix specific script
dos2unix scripts/setup.sh

# Make executable
chmod +x scripts/*.sh

# Configure git to prevent future issues
git config --global core.autocrlf input
git config --global core.eol lf
```

#### Docker Not Found in WSL

**Symptom**: `docker: command not found` in WSL terminal

**Solution**:

1. **Enable WSL2 integration**:
   - Open Docker Desktop on Windows
   - Settings > Resources > WSL Integration
   - Enable integration with your Ubuntu distribution
   - Click "Apply & Restart"

2. **Restart WSL**:
   ```powershell
   # From PowerShell
   wsl --shutdown
   # Reopen Ubuntu terminal
   ```

3. **Verify**:
   ```bash
   docker --version
   docker ps
   ```

#### Permission Denied on Scripts

**Symptom**: Permission denied when running scripts

**Solution**:

```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x Makefile

# Verify
ls -la scripts/
# Should show: -rwxr-xr-x
```

#### High Memory Usage

**Symptom**: Windows becomes slow, WSL using too much memory

**Solution**:

Create or edit `C:\Users\YourName\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

Restart WSL:

```powershell
wsl --shutdown
# Reopen Ubuntu terminal
```

---

## Advanced Troubleshooting

### Check Docker Daemon Logs

**macOS**:
```bash
# Docker Desktop logs
~/Library/Containers/com.docker.docker/Data/log/
```

**Linux**:
```bash
# systemd logs
sudo journalctl -u docker -f

# Or
sudo cat /var/log/docker.log
```

**WSL2**:
```bash
# Check Docker Desktop logs on Windows
```

### Inspect Container Details

```bash
# Full container details
docker inspect barberpro-postgres

# Check specific field
docker inspect --format='{{.State.Health.Status}}' barberpro-postgres

# Check environment variables
docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' barberpro-postgres
```

### Network Debugging

```bash
# List Docker networks
docker network ls

# Inspect BarberPro network
docker network inspect barberpro-network

# Test connectivity between containers
docker exec barberpro-backend ping barberpro-postgres

# Check DNS resolution
docker exec barberpro-backend nslookup barberpro-postgres
```

### Volume Debugging

```bash
# List volumes
docker volume ls | grep barberpro

# Inspect volume
docker volume inspect barberpro-postgres-data

# Check volume mount
docker inspect barberpro-postgres | grep -A 10 Mounts
```

### Force Rebuild

```bash
# Stop everything
make down

# Remove all images
docker rmi $(docker images -q 'barberpro*')

# Rebuild from scratch
make rebuild
```

### Enable Docker Debug Mode

**macOS**:
- Docker Desktop > Settings > Docker Engine
- Add: `"debug": true`
- Restart Docker Desktop

**Linux**:
Edit `/etc/docker/daemon.json`:

```json
{
  "debug": true,
  "log-level": "debug"
}
```

Restart:

```bash
sudo systemctl restart docker
```

---

## Getting Help

If you've tried the solutions above and still have issues:

### 1. Run Full Diagnostics

```bash
# Collect diagnostic information
make doctor > diagnostics.txt
make status >> diagnostics.txt
make logs >> diagnostics.txt 2>&1
docker system info >> diagnostics.txt
```

### 2. Check Documentation

- [PLATFORM-NOTES.md](./PLATFORM-NOTES.md) - Platform-specific quirks
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimization
- [README.md](./README.md) - Main documentation

### 3. Search Similar Issues

```bash
# Search project issues on GitHub
# https://github.com/your-org/service-booking/issues

# Include keywords:
# - Your error message
# - Platform (macOS/Linux/WSL2)
# - Docker version
```

### 4. Ask for Help

When asking for help, include:

1. **Platform**: macOS (Intel/M1), Linux (distribution), WSL2
2. **Docker version**: `docker --version`
3. **Error message**: Full error output
4. **Diagnostic output**: `make doctor`
5. **Logs**: `make logs`
6. **What you've tried**: List solutions attempted

**Support channels**:
- Team Slack: #barberpro-dev
- GitHub Issues: Include `[docker]` tag
- Email: devops@barberpro.com

### 5. Create a Minimal Reproduction

```bash
# Create fresh clone
cd /tmp
git clone <repo-url> test-repo
cd test-repo

# Follow setup
make doctor
make up

# Document results
```

---

## Checklist for Troubleshooting

Use this checklist when debugging:

- [ ] Docker is running (`docker ps`)
- [ ] Ports are available (`make doctor`)
- [ ] Sufficient disk space (`docker system df`)
- [ ] Sufficient RAM (8GB+ for Docker)
- [ ] Project in correct location (WSL: `~/` not `/mnt/c/`)
- [ ] Config files exist (`ls docker/docker-compose.yml`)
- [ ] No syntax errors (`make validate`)
- [ ] Services are healthy (`make health`)
- [ ] Logs show no errors (`make logs`)
- [ ] Can restart successfully (`make restart`)

---

**Last Updated**: 2025-10-12
**Applies to**: Docker Desktop 4.25+, Docker Engine 24.0+, WSL2 on Windows 10/11
