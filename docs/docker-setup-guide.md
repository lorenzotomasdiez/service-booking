# Docker Environment Setup Guide

Complete step-by-step guide to setting up the BarberPro Docker development environment from scratch. This guide assumes no prior Docker knowledge and will have you up and running in under 15 minutes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Detailed Setup Steps](#detailed-setup-steps)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Verification](#verification)
- [First Run Checklist](#first-run-checklist)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before starting, ensure you have the following installed on your machine:

### Required Software

| Software | Minimum Version | Why You Need It |
|----------|----------------|-----------------|
| **Docker Desktop** (macOS/Windows) or **Docker Engine** (Linux) | 20.10+ | Runs containers |
| **Docker Compose** | V2 (included in Docker Desktop) | Orchestrates multiple services |
| **Node.js** | 20.x LTS | Backend and frontend runtime |
| **npm** | 10.x | Package manager |
| **Git** | 2.x | Version control |

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended for full environment
- **Disk Space**: 20GB free space (10GB for Docker images, 10GB for data)
- **Network**: Internet connection for pulling Docker images

### Required Ports

The following ports must be available (not in use by other applications):

| Port | Service | Can Change? |
|------|---------|-------------|
| 3000 | Backend API | Yes (edit .env) |
| 5173 | Frontend | Yes (edit .env) |
| 5432 | PostgreSQL | Yes (edit docker-compose.yml) |
| 6379 | Redis | Yes (edit docker-compose.yml) |
| 8080 | pgAdmin | Yes (edit docker-compose.yml) |
| 8081 | Redis Commander | Yes (edit docker-compose.yml) |
| 3001-3004 | Argentina Mocks | Yes (edit docker-compose.mocks.yml) |
| 8025 | MailHog | Yes (edit docker-compose.mocks.yml) |
| 9090 | Prometheus | Yes (edit docker-compose.monitoring.yml) |

## Quick Setup

For experienced developers, here's the 5-minute setup:

```bash
# 1. Clone repository
git clone https://github.com/lorenzotomasdiez/service-booking.git
cd service-booking

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm run install:all

# 4. Start Docker environment
make up

# 5. Run database setup
make db-migrate
make db-seed

# 6. Start development servers
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

Access your application:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- pgAdmin: http://localhost:8080
- API Docs: http://localhost:3000/docs

## Detailed Setup Steps

Follow these steps if you're new to Docker or want a thorough explanation of each step.

### Step 1: Install Docker

#### macOS

1. Download Docker Desktop for Mac:
   - **Intel Macs**: https://desktop.docker.com/mac/main/amd64/Docker.dmg
   - **Apple Silicon (M1/M2/M3)**: https://desktop.docker.com/mac/main/arm64/Docker.dmg

2. Install Docker Desktop:
   - Open the downloaded DMG file
   - Drag Docker to Applications folder
   - Launch Docker from Applications
   - Wait for Docker to start (whale icon in menu bar)

3. Verify installation:
   ```bash
   docker --version
   # Expected: Docker version 24.0.6 or higher

   docker-compose --version
   # Expected: Docker Compose version v2.23.0 or higher
   ```

4. Configure Docker Desktop:
   - Open Docker Desktop preferences
   - **Resources** → **Advanced**:
     - CPUs: 4 or more
     - Memory: 8GB or more
     - Disk: 64GB or more
   - Click "Apply & Restart"

#### Linux (Ubuntu/Debian)

1. Update package index:
   ```bash
   sudo apt-get update
   ```

2. Install Docker:
   ```bash
   # Add Docker's official GPG key
   sudo apt-get install ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   # Add Docker repository
   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker Engine
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

3. Add your user to the docker group (to run docker without sudo):
   ```bash
   sudo usermod -aG docker $USER
   ```

4. Log out and back in for group changes to take effect

5. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   docker info
   ```

#### Windows (WSL2)

1. Install WSL2:
   - Open PowerShell as Administrator
   - Run:
     ```powershell
     wsl --install
     ```
   - Restart your computer
   - Set up Ubuntu username and password when prompted

2. Install Docker Desktop for Windows:
   - Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   - Run installer
   - During installation, ensure "Use WSL 2 instead of Hyper-V" is checked
   - Restart when prompted

3. Configure Docker Desktop for WSL2:
   - Open Docker Desktop
   - Settings → Resources → WSL Integration
   - Enable integration for your Ubuntu distribution
   - Click "Apply & Restart"

4. Verify from WSL2:
   - Open Ubuntu from Start Menu
   - Run:
     ```bash
     docker --version
     docker-compose --version
     ```

### Step 2: Install Node.js

#### Using nvm (Recommended - All Platforms)

1. Install nvm:
   ```bash
   # macOS/Linux/WSL2
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # Restart terminal or run:
   source ~/.bashrc
   ```

2. Install Node.js 20:
   ```bash
   nvm install 20
   nvm use 20
   nvm alias default 20
   ```

3. Verify:
   ```bash
   node --version  # Should show v20.x.x
   npm --version   # Should show 10.x.x
   ```

#### Using Package Manager

**macOS (Homebrew)**:
```bash
brew install node@20
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Clone Repository

```bash
# Clone the repository
git clone https://github.com/lorenzotomasdiez/service-booking.git

# Navigate into the directory
cd service-booking

# Verify you're in the right place
ls -la
# You should see: backend/, frontend/, docker/, Makefile, package.json, etc.
```

### Step 4: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# The .env file contains all required environment variables
# Default values work for local development
```

**Important**: The `.env.example` file contains comprehensive documentation for each variable. Review it to understand configuration options.

### Step 5: Install Dependencies

```bash
# Install dependencies for both backend and frontend
npm run install:all
```

This command installs:
- Root workspace dependencies
- Backend dependencies (backend/package.json)
- Frontend dependencies (frontend/package.json)

**Expected output**:
```
[→] Installing dependencies...
✓ Root dependencies installed
✓ Backend dependencies installed
✓ Frontend dependencies installed
Dependencies installed successfully!
```

### Step 6: Check Port Availability

Before starting Docker services, check that required ports are available:

```bash
# Check for port conflicts
make doctor
```

This command checks:
- Docker is running
- Required ports are available
- Configuration files exist
- System requirements met

**If ports are in use**, you have two options:

**Option 1**: Stop the conflicting service
```bash
# Find what's using the port
lsof -ti:5432

# Kill the process (example for PostgreSQL)
lsof -ti:5432 | xargs kill
```

**Option 2**: Change the port
```bash
# Edit docker/docker-compose.yml
# Change the port mapping, for example:
#   ports:
#     - "5433:5432"  # Use 5433 instead of 5432
```

### Step 7: Start Docker Environment

```bash
# Start all required services
make up
```

This command:
1. Checks Docker is running
2. Validates ports are available
3. Pulls Docker images (first time only - takes 2-5 minutes)
4. Creates Docker network
5. Starts services (postgres, redis, pgadmin, redis-commander)
6. Waits for services to be healthy

**Expected output**:
```
[→] Starting BarberPro Development Environment...

[→] Starting services with:
  - Base infrastructure (PostgreSQL, Redis, Admin tools)
  - Argentina service mocks

[→] Waiting for services to be healthy...

[✓] Services started successfully!

Services available at:
  PostgreSQL:        localhost:5432
  pgAdmin:           http://localhost:8080
  Redis:             localhost:6379
  Redis Commander:   http://localhost:8081

Next steps:
  - Start backend:  cd backend && npm run dev
  - Start frontend: cd frontend && npm run dev
  - View logs:      make logs
  - Check status:   make status
```

**First-time setup**: The first `make up` will take 2-5 minutes to download Docker images. Subsequent starts take 10-15 seconds.

### Step 8: Set Up Database

```bash
# Run Prisma migrations to create database schema
make db-migrate
```

This creates all database tables based on the Prisma schema.

**Expected output**:
```
[→] Running Prisma migrations...
✓ Migrations applied successfully
```

```bash
# Seed the database with test data
make db-seed
```

This populates the database with:
- Sample users (customers, providers, admins)
- Sample services (haircut, beard trim, etc.)
- Sample bookings
- Test data for Argentina-specific features

**Expected output**:
```
[→] Seeding database with test data...
✓ Database seeded successfully
```

### Step 9: Verify Services

Check that all services are healthy:

```bash
# Run health checks
make health
```

**Expected output**:
```
[→] Running health checks on all services...

  postgres:            [✓] Healthy
  redis:               [✓] Healthy
  pgadmin:             [ℹ] Running (no health check)
  redis-commander:     [ℹ] Running (no health check)

[✓] All services are healthy (4/4)
```

### Step 10: Start Development Servers

Open two terminal windows/tabs:

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Expected output**:
```
[INFO] Starting backend server...
[INFO] Database connected
[INFO] Redis connected
[INFO] Server listening on http://localhost:3000
[INFO] API Documentation: http://localhost:3000/docs
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Expected output**:
```
VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Platform-Specific Instructions

### macOS-Specific Tips

1. **File Sharing**: Docker Desktop → Preferences → Resources → File Sharing
   - Ensure your project directory is in a shared location
   - Default: `/Users`, `/Volumes`, `/tmp` are shared

2. **Performance**:
   - Use Docker Desktop's Virtualization Framework (Settings → General)
   - Allocate at least 4GB RAM and 2 CPUs

3. **Opening URLs**:
   ```bash
   # macOS can use 'open' command
   open http://localhost:5173
   open http://localhost:3000/docs
   ```

### Linux-Specific Tips

1. **Permissions**:
   ```bash
   # Ensure you can run docker without sudo
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

2. **Docker Daemon**:
   ```bash
   # Start Docker daemon on boot
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

3. **Opening URLs**:
   ```bash
   # Linux can use xdg-open
   xdg-open http://localhost:5173
   ```

### WSL2-Specific Tips

1. **File Location**: Store your project in WSL2 filesystem for better performance
   ```bash
   # Good: /home/username/projects/service-booking
   # Slow: /mnt/c/Users/username/projects/service-booking
   ```

2. **Docker Integration**:
   - Ensure Docker Desktop's WSL2 integration is enabled
   - Settings → Resources → WSL Integration → Enable for your distro

3. **Memory**:
   - Create/edit `~/.wslconfig`:
     ```ini
     [wsl2]
     memory=8GB
     processors=4
     ```

4. **Accessing from Windows**:
   - WSL2 services are accessible from Windows browser
   - Use localhost URLs (Windows automatically forwards)

## Verification

After completing setup, verify everything is working:

### 1. Check Services Status

```bash
make status
```

Should show all services running with "Up" status.

### 2. Test Database Connection

```bash
# Open database shell
make db-shell

# Run a test query
\dt  # List all tables
SELECT COUNT(*) FROM "User";  # Should return number of seeded users
\q   # Exit
```

### 3. Test Backend API

```bash
# Check backend health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-12T..."}

# View API documentation
open http://localhost:3000/docs  # macOS
xdg-open http://localhost:3000/docs  # Linux
```

### 4. Test Frontend

Open http://localhost:5173 in your browser. You should see the BarberPro homepage.

### 5. Test Admin Tools

**pgAdmin** (PostgreSQL management):
- Open http://localhost:8080
- Login:
  - Email: `admin@barberpro.local`
  - Password: `admin`
- Add Server:
  - Host: `postgres`
  - Port: `5432`
  - Username: `barberpro`
  - Password: `barberpro_dev_password`

**Redis Commander** (Redis management):
- Open http://localhost:8081
- Login:
  - Username: `admin`
  - Password: `admin`
- You should see Redis keys and data

## First Run Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Docker Desktop is running (whale icon in system tray)
- [ ] `docker --version` shows 20.10 or higher
- [ ] `docker-compose --version` shows v2.x or higher
- [ ] `node --version` shows v20.x.x
- [ ] Project cloned and `.env` file created
- [ ] `npm run install:all` completed successfully
- [ ] `make doctor` shows all checks passing
- [ ] `make up` started all services without errors
- [ ] `make db-migrate` applied migrations successfully
- [ ] `make db-seed` populated database with test data
- [ ] `make health` shows all services healthy
- [ ] Backend server running on http://localhost:3000
- [ ] Frontend server running on http://localhost:5173
- [ ] Frontend homepage loads in browser
- [ ] Backend API documentation accessible at http://localhost:3000/docs
- [ ] pgAdmin accessible at http://localhost:8080
- [ ] Redis Commander accessible at http://localhost:8081
- [ ] Can query database with `make db-shell`
- [ ] No errors in `make logs`

## Troubleshooting

### Docker Not Running

**Problem**: `make up` fails with "Cannot connect to the Docker daemon"

**Solution**:
1. Start Docker Desktop (macOS/Windows)
2. Or start Docker service (Linux):
   ```bash
   sudo systemctl start docker
   ```
3. Wait 30 seconds for Docker to fully start
4. Verify: `docker info`

### Port Already in Use

**Problem**: Error message "Port 5432 is already in use"

**Solution**:
```bash
# Find what's using the port
lsof -ti:5432

# Option 1: Kill the process
lsof -ti:5432 | xargs kill

# Option 2: Change the port in docker/docker-compose.yml
# Change "5432:5432" to "5433:5432"
# Then update DATABASE_URL in .env accordingly
```

### Slow Docker Performance (macOS/Windows)

**Problem**: Docker containers are slow

**Solutions**:
1. Increase resources in Docker Desktop:
   - Settings → Resources
   - RAM: 8GB minimum
   - CPUs: 4 minimum
   - Disk: 64GB or more

2. Use gRPC FUSE for file sharing (macOS):
   - Settings → General → Use gRPC FUSE

3. Disable unnecessary services:
   ```bash
   # Start minimal environment
   make dev  # Only postgres and redis
   ```

### Dependencies Installation Failed

**Problem**: `npm run install:all` fails

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# Try again
npm run install:all

# If still fails, install manually
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Migration Failed

**Problem**: `make db-migrate` fails

**Solutions**:
```bash
# Check database is running
make status

# Check database logs
docker logs barberpro-postgres

# Reset database (WARNING: deletes all data)
make db-reset
```

### Services Show as Unhealthy

**Problem**: `make health` shows services as unhealthy

**Solutions**:
```bash
# Wait longer (services may still be starting)
sleep 30 && make health

# Check logs for errors
make logs

# Restart services
make restart

# If nothing works, complete reset
make clean
make up
make db-migrate
make db-seed
```

### Permission Denied (Linux)

**Problem**: Docker commands fail with "permission denied"

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in (or run)
newgrp docker

# Verify
docker ps
```

### WSL2 Can't Connect to Docker

**Problem**: "Cannot connect to Docker daemon" in WSL2

**Solutions**:
1. Ensure Docker Desktop is running in Windows
2. Enable WSL2 integration:
   - Docker Desktop → Settings → Resources → WSL Integration
   - Enable for your Ubuntu distribution
   - Click "Apply & Restart"
3. Restart WSL2:
   ```powershell
   # In Windows PowerShell (Administrator)
   wsl --shutdown
   # Then restart Ubuntu from Start Menu
   ```

## Next Steps

After successful setup, you can:

1. **Start Development**:
   ```bash
   # Daily workflow
   make up                      # Start Docker services
   cd backend && npm run dev    # Terminal 1
   cd frontend && npm run dev   # Terminal 2
   ```

2. **Learn the Tools**:
   - Review [Makefile Commands](./makefile-cheat-sheet.md)
   - Read [Docker Architecture](./docker-architecture.md)
   - Study [Troubleshooting Guide](./docker-troubleshooting.md)

3. **Start Building**:
   - Check `backend/src/routes/` for API endpoints
   - Check `frontend/src/routes/` for pages
   - Review `backend/prisma/schema.prisma` for database schema
   - See `CLAUDE.md` for project architecture overview

4. **Set Up Mock Services** (Optional):
   ```bash
   # Start Argentina mock services
   make mocks

   # Access mock dashboards
   open http://localhost:3001/dashboard  # MercadoPago
   open http://localhost:3002/docs       # AFIP
   open http://localhost:3003/dashboard  # WhatsApp
   open http://localhost:3004/dashboard  # SMS
   open http://localhost:8025            # MailHog
   ```

5. **Set Up Monitoring** (Optional):
   ```bash
   # Start monitoring stack
   make monitoring

   # Access monitoring tools
   open http://localhost:9090  # Prometheus
   open http://localhost:3001  # Grafana (admin/admin)
   ```

## Additional Resources

- **[Docker README](../docker/README.md)** - Complete Makefile command reference
- **[Makefile Cheat Sheet](./makefile-cheat-sheet.md)** - Quick command reference
- **[Docker Architecture](./docker-architecture.md)** - System architecture overview
- **[Troubleshooting Guide](./docker-troubleshooting.md)** - Common issues and solutions
- **[Argentina Mocks](../docker/mocks/README.md)** - Mock service documentation
- **[Monitoring Stack](../docker/monitoring/README.md)** - Observability tools

## Getting Help

If you're still stuck after following this guide:

1. **Check logs**: `make logs`
2. **Run diagnostics**: `make doctor`
3. **Review troubleshooting**: [Troubleshooting Guide](./docker-troubleshooting.md)
4. **Ask the team**: Post in #dev-environment Slack channel
5. **Create an issue**: GitHub Issues with output from `make doctor`

---

**Estimated Setup Time**:
- Experienced developers: 5-10 minutes
- First-time Docker users: 15-20 minutes
- First-time developers: 30 minutes

**Congratulations!** You now have a fully functional BarberPro development environment. Happy coding!

---

**Last Updated**: 2025-10-12
**Guide Version**: 1.0.0
**Tested On**: macOS 14, Ubuntu 22.04, Windows 11 (WSL2)
