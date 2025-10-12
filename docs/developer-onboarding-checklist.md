# Developer Onboarding Checklist

Welcome to the BarberPro team! This comprehensive onboarding checklist will guide you through your first days and weeks with the project. By following this structured path, you'll be productive and confident in no time.

## Table of Contents

- [Overview](#overview)
- [Pre-Setup (Day 0)](#pre-setup-day-0)
- [Initial Setup (Day 1)](#initial-setup-day-1)
- [Learning Phase (Week 1)](#learning-phase-week-1)
- [Validation Checkpoints](#validation-checkpoints)
- [Quick Start Guide (5-Minute Version)](#quick-start-guide-5-minute-version)
- [Detailed Walkthrough (20-Minute Version)](#detailed-walkthrough-20-minute-version)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)
- [Tips and Tricks](#tips-and-tricks)
- [Getting Help](#getting-help)

---

## Overview

### What You'll Learn

By the end of this onboarding, you will:
- Have a fully functional local development environment
- Understand the project architecture and structure
- Know how to use the Makefile commands for daily workflows
- Be able to debug issues independently using logs and documentation
- Have completed your first task and pull request

### Time Commitment

- **Day 0 (Pre-Setup)**: 1-2 hours (can be done before start date)
- **Day 1 (Initial Setup)**: 2-3 hours
- **Week 1 (Learning)**: Ongoing, integrated with first tasks
- **Total focused time**: 5-7 hours over first week

### Onboarding Philosophy

We believe in:
- **Hands-on learning**: You'll set up and use real development tools
- **Documentation-first**: Everything you need is documented
- **Progressive depth**: Start simple, add complexity gradually
- **Continuous validation**: Regular checkpoints ensure success
- **Ask questions**: No question is too basic

---

## Pre-Setup (Day 0)

Complete these tasks before your first day, or on your first morning. Estimated time: 1-2 hours.

### Prerequisites Checklist

#### 1. System Requirements

Check your machine meets these requirements:

- [ ] **Operating System**:
  - macOS 12+ (Monterey or later)
  - Ubuntu/Debian Linux 20.04+
  - Windows 11 with WSL2 enabled

- [ ] **Hardware**:
  - [ ] 4+ CPU cores (8 recommended)
  - [ ] 8GB RAM minimum (16GB recommended)
  - [ ] 20GB free disk space (40GB recommended)
  - [ ] SSD strongly recommended for performance

**Validation**:
```bash
# Check CPU cores
# macOS/Linux:
nproc
# Should show 4 or more

# Check RAM
# macOS:
sysctl hw.memsize
# Linux:
free -h
# Should show 8GB or more

# Check disk space
df -h
# Should show 20GB+ free
```

---

#### 2. Install Docker

Choose your platform and follow instructions:

**macOS**:
- [ ] Download Docker Desktop for Mac
  - Intel Macs: https://desktop.docker.com/mac/main/amd64/Docker.dmg
  - Apple Silicon (M1/M2/M3): https://desktop.docker.com/mac/main/arm64/Docker.dmg
- [ ] Install Docker Desktop (drag to Applications)
- [ ] Launch Docker Desktop and wait for it to start
- [ ] Configure resources:
  - Open Docker Desktop → Settings → Resources
  - CPUs: 4 or more
  - Memory: 8GB or more
  - Disk: 64GB or more
  - Click "Apply & Restart"

**Windows (WSL2)**:
- [ ] Install WSL2: Open PowerShell as Administrator and run:
  ```powershell
  wsl --install
  ```
- [ ] Restart computer when prompted
- [ ] Set up Ubuntu username/password
- [ ] Download Docker Desktop for Windows
- [ ] Install Docker Desktop (ensure "Use WSL 2" is checked)
- [ ] Enable WSL2 integration:
  - Docker Desktop → Settings → Resources → WSL Integration
  - Enable for Ubuntu distribution
  - Apply & Restart

**Linux (Ubuntu/Debian)**:
- [ ] Install Docker Engine:
  ```bash
  # Update package index
  sudo apt-get update

  # Install prerequisites
  sudo apt-get install ca-certificates curl

  # Add Docker's GPG key
  sudo install -m 0755 -d /etc/apt/keyrings
  sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  sudo chmod a+r /etc/apt/keyrings/docker.asc

  # Add Docker repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  # Install Docker
  sudo apt-get update
  sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ```
- [ ] Add user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  ```
- [ ] Log out and back in for changes to take effect

**Verify Docker Installation**:
```bash
# Check Docker version
docker --version
# Expected: Docker version 24.0.6 or higher

# Check Docker Compose version
docker-compose --version  # V1
docker compose version    # V2
# Expected: Docker Compose version v2.23.0 or higher

# Verify Docker is running
docker info
# Should show Docker system information without errors
```

**Troubleshooting**: If Docker commands fail, see [Docker Setup Guide](./docker-setup-guide.md#step-1-install-docker).

---

#### 3. Install Node.js

Install Node.js 20 LTS using nvm (recommended):

**macOS/Linux/WSL2**:
- [ ] Install nvm:
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

  # Restart terminal or run:
  source ~/.bashrc  # or ~/.zshrc on macOS
  ```
- [ ] Install Node.js 20:
  ```bash
  nvm install 20
  nvm use 20
  nvm alias default 20
  ```

**Verify Node.js Installation**:
```bash
# Check Node version
node --version
# Expected: v20.x.x

# Check npm version
npm --version
# Expected: 10.x.x
```

**Alternative Installation**:
- macOS: `brew install node@20`
- Linux: Use NodeSource repository (see [Setup Guide](./docker-setup-guide.md#step-2-install-nodejs))
- Windows: Download from nodejs.org (use Node 20 LTS)

---

#### 4. Install Git

Most systems have Git pre-installed. Verify or install:

- [ ] Check Git version:
  ```bash
  git --version
  # Expected: git version 2.x or higher
  ```

**If Git is not installed**:
- macOS: `xcode-select --install`
- Linux: `sudo apt-get install git`
- Windows: Included in WSL2 Ubuntu

- [ ] Configure Git (if first time):
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

---

#### 5. IDE/Editor Setup

Choose and install your preferred editor:

**Recommended: Visual Studio Code**:
- [ ] Download from https://code.visualstudio.com/
- [ ] Install recommended extensions:
  - [ ] ESLint
  - [ ] Prettier
  - [ ] Svelte for VS Code
  - [ ] Prisma
  - [ ] Docker
  - [ ] GitLens

**Alternatives**: WebStorm, Sublime Text, Vim (if you're comfortable)

---

#### 6. Team Access

Ensure you have access to all necessary accounts and channels:

- [ ] **GitHub**:
  - [ ] GitHub account created
  - [ ] Added to `lorenzotomasdiez/service-booking` repository
  - [ ] Can clone repositories
  - [ ] SSH keys set up (recommended): https://docs.github.com/en/authentication/connecting-to-github-with-ssh

- [ ] **Communication Channels**:
  - [ ] Slack workspace invitation accepted
  - [ ] Joined #dev-environment channel
  - [ ] Joined #barberpro-dev channel
  - [ ] Introduced yourself to the team

- [ ] **Project Management**:
  - [ ] Access to project board/issues
  - [ ] Assigned first task (if applicable)

---

### Pre-Setup Validation

Before moving to Day 1, verify all prerequisites:

```bash
# Create a quick validation script
cat > ~/validate-prereqs.sh << 'EOF'
#!/bin/bash

echo "=== BarberPro Prerequisites Validation ==="
echo

# Check Docker
echo -n "Docker: "
if command -v docker &> /dev/null; then
    echo "✓ $(docker --version)"
else
    echo "✗ Not installed"
fi

# Check Docker Compose
echo -n "Docker Compose: "
if docker compose version &> /dev/null; then
    echo "✓ $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    echo "✓ $(docker-compose --version)"
else
    echo "✗ Not installed"
fi

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo "✓ $(node --version)"
else
    echo "✗ Not installed"
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    echo "✓ $(npm --version)"
else
    echo "✗ Not installed"
fi

# Check Git
echo -n "Git: "
if command -v git &> /dev/null; then
    echo "✓ $(git --version)"
else
    echo "✗ Not installed"
fi

# Check disk space
echo -n "Disk Space: "
AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo "✓ $AVAILABLE available"

echo
echo "=== Validation Complete ==="
echo "If all items show ✓, you're ready for Day 1!"
EOF

chmod +x ~/validate-prereqs.sh
~/validate-prereqs.sh
```

**All checks passing?** You're ready for Day 1!

**Some checks failing?** Review the relevant section above and try again.

---

## Initial Setup (Day 1)

Your first day! Let's get your development environment running. Estimated time: 2-3 hours.

### Morning Session (1-1.5 hours)

#### 1. Clone Repository

- [ ] Open terminal (macOS/Linux) or WSL2 Ubuntu (Windows)
- [ ] Navigate to your projects directory:
  ```bash
  # Create projects directory if it doesn't exist
  mkdir -p ~/projects
  cd ~/projects
  ```
- [ ] Clone the repository:
  ```bash
  git clone https://github.com/lorenzotomasdiez/service-booking.git
  cd service-booking
  ```
- [ ] Verify you're in the right place:
  ```bash
  ls -la
  # You should see: backend/, frontend/, docker/, Makefile, package.json, etc.
  ```

**Troubleshooting**: If clone fails with permission denied:
- Check GitHub access (ask DevOps team)
- Verify SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection

---

#### 2. Create Environment File

- [ ] Copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- [ ] Review the `.env` file (optional):
  ```bash
  cat .env
  ```

**Note**: Default values work for local development. No changes needed for now.

**What's in .env?**:
- Database credentials (postgres, redis)
- JWT secrets
- Argentina-specific settings (timezone, currency)
- Mock service configuration

---

#### 3. Install Dependencies

- [ ] Install dependencies for all workspaces:
  ```bash
  npm run install:all
  ```

**Expected output**:
```
[→] Installing dependencies...
✓ Root dependencies installed
✓ Backend dependencies installed
✓ Frontend dependencies installed
Dependencies installed successfully!
```

**Time**: 2-5 minutes (depending on internet speed)

**Troubleshooting**:
- If npm fails, try: `npm cache clean --force && npm run install:all`
- If still fails, install manually: `npm install && cd backend && npm install && cd ../frontend && npm install`

---

#### 4. Run System Diagnostics

Before starting Docker, validate your system is ready:

- [ ] Run diagnostics:
  ```bash
  make doctor
  ```

**Expected output**:
```
[→] Running system diagnostics...

Prerequisites:
  Docker:           ✓ Running (version 24.0.6)
  Docker Compose:   ✓ Installed (version 2.23.0)
  Node.js:          ✓ v20.11.0
  npm:              ✓ 10.2.4

Configuration:
  .env file:        ✓ Found
  Makefile:         ✓ Found
  Docker files:     ✓ All present

Port Availability:
  5432 (PostgreSQL):  ✓ Available
  6379 (Redis):       ✓ Available
  3000 (Backend):     ✓ Available
  5173 (Frontend):    ✓ Available

[✓] System ready for development!
```

**Issues Found?**
- Port conflicts: See [Troubleshooting Guide](./docker-troubleshooting.md#issue-port-already-in-use)
- Docker not running: Start Docker Desktop
- Missing files: Re-clone repository

---

#### 5. Start Docker Environment

Now for the exciting part - starting your development environment!

- [ ] Start all Docker services:
  ```bash
  make up
  ```

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

Mock Services:
  MercadoPago:       http://localhost:3001/dashboard
  AFIP:              http://localhost:3002/docs
  WhatsApp:          http://localhost:3003/dashboard
  SMS:               http://localhost:3004/dashboard
  Email (MailHog):   http://localhost:8025

Next steps:
  - Start backend:  cd backend && npm run dev
  - Start frontend: cd frontend && npm run dev
  - View logs:      make logs
  - Check status:   make status
```

**First-time note**: The first `make up` takes 2-5 minutes to download Docker images. Subsequent starts take 10-30 seconds.

**Time**: 2-5 minutes (first time), 30 seconds (subsequent starts)

---

#### 6. Verify Services Are Healthy

- [ ] Check service status:
  ```bash
  make status
  ```

**Expected output**: All services showing "Up" status.

- [ ] Run health checks:
  ```bash
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

**Issues?** See [Troubleshooting Guide](./docker-troubleshooting.md#services-wont-start).

---

### Lunch Break

Great progress! Take a break before continuing. You've completed:
- Repository cloning
- Dependency installation
- Docker environment setup
- Service health verification

---

### Afternoon Session (1-1.5 hours)

#### 7. Set Up Database

Now let's create the database schema and add test data:

- [ ] Run database migrations:
  ```bash
  make db-migrate
  ```

**Expected output**:
```
[→] Running Prisma migrations...
✓ Migrations applied successfully
```

**What this does**: Creates all database tables based on the Prisma schema.

**Time**: 5-10 seconds

---

- [ ] Seed the database with test data:
  ```bash
  make db-seed
  ```

**Expected output**:
```
[→] Seeding database with test data...
✓ Database seeded successfully
```

**What this creates**:
- Sample users (customers, providers, admins)
- Sample services (haircut, beard trim, etc.)
- Sample bookings
- Test data for Argentina-specific features

**Time**: 10-15 seconds

---

#### 8. Access Admin Tools

Let's verify database access and explore the admin tools:

**pgAdmin (Database UI)**:
- [ ] Open http://localhost:8080 in browser
- [ ] Login with:
  - Email: `admin@barberpro.local`
  - Password: `admin`
- [ ] Add server connection:
  - Right-click "Servers" → "Register" → "Server"
  - General tab:
    - Name: `BarberPro Development`
  - Connection tab:
    - Host: `postgres`
    - Port: `5432`
    - Username: `barberpro`
    - Password: `barberpro_dev_password`
    - Save password: ✓
  - Click "Save"
- [ ] Explore database:
  - Expand: Servers → BarberPro Development → Databases → barberpro_dev → Schemas → public → Tables
  - Right-click any table → "View/Edit Data" → "All Rows"

**Redis Commander (Cache UI)**:
- [ ] Open http://localhost:8081 in browser
- [ ] Login with:
  - Username: `admin`
  - Password: `admin`
- [ ] Explore Redis data:
  - Browse keys and values
  - Check TTL (time to live) for cached data

---

#### 9. Start Development Servers

Time to start the actual application!

**Backend (Terminal 1)**:
- [ ] Open a new terminal window/tab
- [ ] Navigate to project:
  ```bash
  cd ~/projects/service-booking
  ```
- [ ] Start backend:
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

**Keep this terminal open** - backend runs here.

---

**Frontend (Terminal 2)**:
- [ ] Open another new terminal window/tab
- [ ] Navigate to project:
  ```bash
  cd ~/projects/service-booking
  ```
- [ ] Start frontend:
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

**Keep this terminal open** - frontend runs here.

---

#### 10. Test Complete Workflow

Let's verify everything works end-to-end:

- [ ] **Access Frontend**:
  - Open http://localhost:5173 in browser
  - You should see the BarberPro homepage

- [ ] **Access Backend API Docs**:
  - Open http://localhost:3000/docs in browser
  - You should see Swagger/OpenAPI documentation
  - Try the "health" endpoint: Click "GET /api/health" → "Try it out" → "Execute"
  - Should return: `{"status":"ok","timestamp":"..."}`

- [ ] **Test Email Capture** (optional):
  - Open http://localhost:8025 (MailHog)
  - You should see an email inbox (may be empty for now)
  - This captures all emails sent by the application

- [ ] **Check Logs**:
  - In a new terminal:
    ```bash
    cd ~/projects/service-booking
    make logs
    ```
  - You should see logs from all services
  - Press Ctrl+C to exit

---

### Day 1 Complete!

Congratulations! You've successfully set up your development environment. Take a moment to celebrate this milestone.

**What you've accomplished**:
- ✓ Installed all prerequisites
- ✓ Cloned repository and installed dependencies
- ✓ Started Docker services (database, cache, mocks)
- ✓ Ran database migrations and seeded test data
- ✓ Started backend and frontend development servers
- ✓ Verified complete workflow from frontend to backend to database

**Your environment is now ready for development!**

---

## Learning Phase (Week 1)

Over your first week, you'll gradually learn the project while working on tasks. These learning items can be completed in parallel with your first assignments.

### Day 1-2: Core Documentation

- [ ] **Read Project Overview**:
  - [ ] Read [CLAUDE.md](../CLAUDE.md) - Project architecture overview
  - [ ] Review `backend/README.md` - Backend-specific docs (if exists)
  - [ ] Review `frontend/README.md` - Frontend-specific docs (if exists)

- [ ] **Understand Docker Environment**:
  - [ ] Read [Docker Architecture](./docker-architecture.md) - System design
  - [ ] Skim [Docker Setup Guide](./docker-setup-guide.md) - You've done this, but review for details
  - [ ] Bookmark [Docker Troubleshooting](./docker-troubleshooting.md) - For when things go wrong

- [ ] **Learn Makefile Commands**:
  - [ ] Read [Makefile Cheat Sheet](./makefile-cheat-sheet.md)
  - [ ] Try essential commands:
    ```bash
    make help           # See all commands
    make status         # Check service status
    make logs-backend   # View backend logs
    make db-shell       # Open database shell (type \q to exit)
    ```

---

### Day 2-3: Explore the Codebase

- [ ] **Backend Exploration**:
  - [ ] Navigate `backend/src/routes/` - API endpoints
  - [ ] Review `backend/prisma/schema.prisma` - Database schema
  - [ ] Find service definitions in `backend/src/services/`
  - [ ] Look at authentication in `backend/src/middleware/`

- [ ] **Frontend Exploration**:
  - [ ] Navigate `frontend/src/routes/` - SvelteKit pages
  - [ ] Review `frontend/src/lib/components/` - Reusable components
  - [ ] Check `frontend/src/lib/stores/` - State management (if exists)

- [ ] **Database Schema**:
  - [ ] Open pgAdmin (http://localhost:8080)
  - [ ] Explore tables and relationships
  - [ ] Run sample queries:
    ```sql
    SELECT COUNT(*) FROM users;
    SELECT * FROM services LIMIT 5;
    SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;
    ```

---

### Day 3-4: Practice Common Workflows

- [ ] **Daily Development Workflow**:
  ```bash
  # Morning routine
  make up              # Start services
  make status          # Verify health
  cd backend && npm run dev    # Terminal 1
  cd frontend && npm run dev   # Terminal 2

  # ... work work work ...

  # End of day
  make down            # Stop services
  ```

- [ ] **Database Operations**:
  ```bash
  # Create backup (safe)
  make db-backup

  # View backup
  ls -lh docker/backup/

  # Reset database (destructive - creates fresh database)
  make db-reset

  # Restore from backup
  make db-restore FILE=docker/backup/barberpro_YYYYMMDD_HHMMSS.sql
  ```

- [ ] **Debugging Workflow**:
  ```bash
  # Check service health
  make health

  # View all logs
  make logs

  # View specific service logs
  make logs-backend
  make logs-frontend

  # Check resource usage
  make stats

  # Run diagnostics
  make doctor
  ```

- [ ] **Switching Git Branches**:
  ```bash
  # Stop services
  make down

  # Switch branch
  git checkout feature/new-feature

  # Fresh database (if schema changed)
  make reset
  make db-migrate
  make db-seed
  ```

---

### Day 4-5: Testing and Mock Services

- [ ] **Run Integration Tests**:
  ```bash
  # Start test environment
  make test

  # In another terminal, run tests
  cd backend
  npm run test:integration

  # Stop test environment
  make down
  ```

- [ ] **Explore Mock Services**:
  - [ ] Open mock dashboards:
    - MercadoPago: http://localhost:3001/dashboard
    - WhatsApp: http://localhost:3003/dashboard
    - SMS: http://localhost:3004/dashboard
    - Email: http://localhost:8025

  - [ ] Test payment flow:
    ```bash
    # View mock service logs
    make mocks-logs

    # Create test booking in frontend
    # Watch payment appear in MercadoPago dashboard
    # Check email in MailHog
    ```

- [ ] **Review Mock Documentation**:
  - [ ] Read `docker/mocks/README.md` (if exists)
  - [ ] Understand how mocks simulate Argentina services

---

### Day 5-7: First Task

- [ ] **Receive First Assignment**:
  - [ ] Review GitHub issue or task board
  - [ ] Understand requirements
  - [ ] Ask clarifying questions in Slack

- [ ] **Create Feature Branch**:
  ```bash
  git checkout -b feature/your-task-name
  ```

- [ ] **Implement Feature**:
  - [ ] Make code changes
  - [ ] Test locally (manual testing)
  - [ ] Run linting: `cd backend && npm run lint` (or frontend)
  - [ ] Run tests: `npm test`

- [ ] **Commit Changes**:
  ```bash
  git add .
  git commit -m "feat: descriptive commit message"
  ```

- [ ] **Push and Create Pull Request**:
  ```bash
  git push -u origin feature/your-task-name
  ```
  - [ ] Open GitHub and create pull request
  - [ ] Fill in PR description
  - [ ] Request review from team member

- [ ] **Pair Programming Session** (if available):
  - [ ] Schedule time with senior team member
  - [ ] Walk through your code
  - [ ] Discuss architecture decisions
  - [ ] Learn code review process

---

## Validation Checkpoints

Use these checkpoints to verify your onboarding progress.

### Checkpoint 1: Environment Setup (End of Day 1)

Verify you can complete all of these:

- [ ] Run `make up` and all services start successfully
- [ ] Access frontend at http://localhost:5173
- [ ] Access backend API docs at http://localhost:3000/docs
- [ ] Access pgAdmin at http://localhost:8080 and view database tables
- [ ] Run `make logs` and see logs from all services
- [ ] Run `make status` and see all services "Up"
- [ ] Run `make db-shell` and execute: `SELECT COUNT(*) FROM users;`

**All passing?** Your environment is correctly set up!

**Some failing?** Review [Troubleshooting Guide](./docker-troubleshooting.md) or ask in #dev-environment Slack.

---

### Checkpoint 2: Basic Operations (Day 2-3)

Verify you can complete these operations independently:

- [ ] Stop and restart services:
  ```bash
  make down
  make up
  make status  # All services "Up"
  ```

- [ ] View logs for specific service:
  ```bash
  make logs-backend  # Shows only backend logs
  ```

- [ ] Reset database:
  ```bash
  make db-backup  # Create backup first
  make db-reset   # Reset database
  # Verify tables exist in pgAdmin
  ```

- [ ] Switch branches:
  ```bash
  git checkout main
  git pull
  make restart
  # Services restart successfully
  ```

**All passing?** You're comfortable with daily operations!

---

### Checkpoint 3: Troubleshooting (Day 3-5)

Verify you can troubleshoot common issues:

**Scenario 1**: Backend won't start
- [ ] Run `make health` to check service health
- [ ] Run `make logs-backend` to view backend logs
- [ ] Identify issue from logs (e.g., database not ready)
- [ ] Apply fix (e.g., `make restart`)

**Scenario 2**: Database connection fails
- [ ] Verify DATABASE_URL uses `postgres:5432` not `localhost:5432`
- [ ] Check database is running: `make status`
- [ ] Restart backend: `docker restart barberpro-backend-dev`

**Scenario 3**: Port conflict
- [ ] Run `make doctor` to identify conflict
- [ ] Find process using port: `lsof -ti:5432`
- [ ] Stop conflicting process or change port

**Can handle 2/3 scenarios?** You're developing troubleshooting skills!

---

### Checkpoint 4: Documentation Navigation (Day 5)

Verify you know where to find information:

- [ ] Where to find Makefile commands? → [Makefile Cheat Sheet](./makefile-cheat-sheet.md)
- [ ] Where to find Docker troubleshooting? → [Docker Troubleshooting](./docker-troubleshooting.md)
- [ ] Where to find system architecture? → [Docker Architecture](./docker-architecture.md)
- [ ] Where to find setup instructions? → [Docker Setup Guide](./docker-setup-guide.md)
- [ ] Where to find common questions? → [Docker FAQ](./docker-faq.md)
- [ ] Where to ask for help? → #dev-environment Slack channel

**Know all answers?** You can self-serve most questions!

---

### Checkpoint 5: First Contribution (End of Week 1)

Verify you've completed your first contribution:

- [ ] Created feature branch
- [ ] Implemented feature/fix
- [ ] Tested locally
- [ ] Created pull request
- [ ] Code review completed
- [ ] PR merged (or feedback addressed)

**PR merged?** Congratulations, you're officially productive!

---

## Quick Start Guide (5-Minute Version)

For experienced developers who want to get started fast:

```bash
# 1. Clone and setup
cd ~/projects
git clone https://github.com/lorenzotomasdiez/service-booking.git
cd service-booking
cp .env.example .env

# 2. Install dependencies
npm run install:all

# 3. Start Docker environment
make up

# 4. Setup database
make db-migrate
make db-seed

# 5. Verify
make health

# 6. Start dev servers (in separate terminals)
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# 7. Access
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000/docs
# pgAdmin:  http://localhost:8080
```

**Done!** You're ready to develop.

---

## Detailed Walkthrough (20-Minute Version)

For developers new to Docker or the project:

### Part 1: Prerequisites (5 minutes)

1. **Install Docker Desktop** (macOS/Windows) or Docker Engine (Linux)
2. **Install Node.js 20** using nvm
3. **Verify installations**:
   ```bash
   docker --version
   docker compose version
   node --version
   npm --version
   ```

### Part 2: Environment Setup (10 minutes)

1. **Clone repository**:
   ```bash
   mkdir -p ~/projects && cd ~/projects
   git clone https://github.com/lorenzotomasdiez/service-booking.git
   cd service-booking
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   cat .env  # Review contents (optional)
   ```

3. **Install dependencies**:
   ```bash
   npm run install:all
   # Wait 2-3 minutes for installation
   ```

4. **Run system diagnostics**:
   ```bash
   make doctor
   # Ensure all checks pass
   ```

5. **Start Docker environment**:
   ```bash
   make up
   # First time: wait 2-5 minutes for image downloads
   # Subsequent: 30 seconds
   ```

6. **Verify services**:
   ```bash
   make status
   make health
   # All services should show as healthy
   ```

### Part 3: Database Setup (3 minutes)

1. **Run migrations**:
   ```bash
   make db-migrate
   # Creates database tables
   ```

2. **Seed test data**:
   ```bash
   make db-seed
   # Populates database with sample data
   ```

3. **Verify database**:
   - Open http://localhost:8080 (pgAdmin)
   - Login: admin@barberpro.local / admin
   - Add server: Host=postgres, Port=5432, User=barberpro, Password=barberpro_dev_password
   - Explore tables

### Part 4: Start Development (2 minutes)

1. **Start backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   # Wait for "Server listening on http://localhost:3000"
   ```

2. **Start frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   # Wait for "Local: http://localhost:5173/"
   ```

3. **Test everything**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000/docs
   - pgAdmin: http://localhost:8080

### Part 5: Daily Workflow (Summary)

**Morning routine**:
```bash
make up                      # Start Docker
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

**End of day**:
```bash
make down  # Stop Docker
```

**Debugging**:
```bash
make logs         # View all logs
make logs-backend # View backend logs only
make health       # Check service health
make restart      # Restart services
```

---

## Common Pitfalls

Learn from others' mistakes! Here are the most common issues new developers face:

### Pitfall 1: Using `localhost` Instead of Service Names

**Mistake**: In backend `.env`, using:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**Why it fails**: Inside Docker network, `localhost` refers to the container itself, not the host machine.

**Fix**: Use service name:
```bash
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

**Rule of thumb**:
- Host machine → Docker: Use `localhost`
- Docker → Docker: Use service names (`postgres`, `redis`, `backend`)

---

### Pitfall 2: Forgetting to Run Migrations

**Symptom**: Backend throws database errors like "Table 'users' doesn't exist"

**Cause**: Forgot to run migrations after:
- First setup
- Pulling new code with schema changes
- Running `make reset`

**Fix**:
```bash
make db-migrate
```

**Prevention**: Always run migrations after `make up` or `make reset`.

---

### Pitfall 3: Not Stopping Services Before Switching Branches

**Symptom**: After switching branches, services behave strangely or fail

**Cause**: Running services still use old code and database schema

**Fix**:
```bash
# Stop services first
make down

# Switch branch
git checkout feature-branch

# Fresh start
make up
make db-migrate
make db-seed
```

**Rule**: Always `make down` before `git checkout`.

---

### Pitfall 4: Deleting Data by Accident

**Mistake**: Running `make reset` or `make clean` without backing up

**Impact**: Lose all local development data

**Fix**: Always backup first:
```bash
make db-backup  # Creates timestamped backup
make reset      # Now safe to reset
```

**Recovery**: If you forgot to backup:
```bash
# Restore from backup
make db-restore FILE=docker/backup/barberpro_YYYYMMDD_HHMMSS.sql
```

**Prevention**: Backup before destructive operations.

---

### Pitfall 5: Running Out of Disk Space

**Symptom**: Docker commands fail with "no space left on device"

**Cause**: Docker images and volumes accumulate over time

**Fix**:
```bash
# Check disk usage
docker system df

# Clean up (safe - only unused resources)
make prune

# Aggressive cleanup (removes everything not running)
docker system prune -a --volumes
```

**Prevention**: Run `make prune` monthly.

---

### Pitfall 6: Port Conflicts

**Symptom**: `make up` fails with "Port already allocated"

**Cause**: Another service (local PostgreSQL, another Docker project) using same port

**Fix**:
```bash
# Find what's using the port
lsof -ti:5432

# Kill the process
lsof -ti:5432 | xargs kill

# Or change port in docker-compose.yml
```

**Prevention**: Use test environment (different ports): `make test`

---

### Pitfall 7: Docker Desktop Not Running

**Symptom**: All Docker commands fail with "Cannot connect to Docker daemon"

**Cause**: Docker Desktop not started (macOS/Windows)

**Fix**:
- macOS/Windows: Launch Docker Desktop application
- Linux: `sudo systemctl start docker`

**Prevention**: Set Docker Desktop to start on login.

---

### Pitfall 8: Expecting Instant Startup

**Mistake**: Thinking services start instantly and trying to use them immediately

**Reality**: Services need time to become healthy:
- PostgreSQL: 10-30 seconds
- Redis: 5-10 seconds
- Backend (depends on PostgreSQL): 30-60 seconds

**Fix**: Wait for health checks:
```bash
make up
# Wait for "Services started successfully"
make health  # Verify all healthy
```

**Rule**: Always check `make status` before using services.

---

### Pitfall 9: Not Reading Error Messages

**Mistake**: Seeing an error and immediately asking for help without reading the message

**Reality**: Error messages are helpful and often include solutions

**Example**:
```
Error: Port 5432 already in use
Suggestion: Run 'lsof -ti:5432 | xargs kill' to free the port
```

**Best practice**: Read error messages carefully, try suggested solutions, then ask for help if stuck.

---

### Pitfall 10: Editing Wrong .env File

**Mistake**: Editing `.env.example` instead of `.env`

**Why it fails**: `.env.example` is committed to git and not used by the application

**Fix**:
```bash
# Ensure .env exists
ls -la | grep "\.env"
# Should show: .env (not just .env.example)

# If .env missing, create it
cp .env.example .env
```

**Rule**: Edit `.env` (gitignored), not `.env.example` (committed).

---

## Best Practices

Follow these practices for smooth development:

### Daily Workflow

**Morning routine** (2 minutes):
```bash
cd ~/projects/service-booking
make up                      # Start Docker services
make status                  # Verify all healthy
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

**During development**:
- Keep terminals visible to see logs
- Run `make logs` if something breaks
- Commit frequently (small, focused commits)
- Test before committing

**End of day**:
```bash
make down  # Stop services (optional - saves battery/resources)
```

---

### Code Quality

**Before committing**:
```bash
# Lint your code
cd backend && npm run lint
cd frontend && npm run lint

# Run tests
cd backend && npm test
cd frontend && npm test

# Type check (if applicable)
cd backend && npm run typecheck
```

**Commit message format**:
```bash
# Good
git commit -m "feat: add user profile page"
git commit -m "fix: resolve booking date validation"
git commit -m "docs: update setup guide"

# Bad
git commit -m "stuff"
git commit -m "changes"
git commit -m "wip"
```

---

### Database Management

**Safe practices**:
1. **Always backup before resets**:
   ```bash
   make db-backup
   make db-reset
   ```

2. **Use test environment for experiments**:
   ```bash
   make test  # Separate test database
   ```

3. **Keep development data realistic**:
   - Use seed data for common scenarios
   - Create realistic test bookings
   - Don't rely on specific data (use seed to recreate)

---

### Troubleshooting Approach

**Systematic debugging**:
1. **Check service health**: `make health`
2. **View logs**: `make logs` or `make logs-backend`
3. **Check documentation**: Search relevant guide
4. **Try restart**: `make restart`
5. **Search issues**: GitHub issues or Slack history
6. **Ask for help**: #dev-environment with details

**When asking for help**, include:
```bash
# System info
make version

# Diagnostics
make doctor

# Service status
make status

# Recent logs
make logs --tail=50 > logs.txt
# Attach logs.txt
```

---

### Resource Management

**Monitor resources**:
```bash
# Check Docker resource usage
make stats

# Check disk space
docker system df
df -h
```

**Optimize for performance**:
- Use `make dev` (minimal) instead of `make full` (all services)
- Stop unused services: `make mocks-down`, `make monitoring-down`
- Regular cleanup: `make prune` monthly
- Close resource-heavy applications while developing

---

### Learning Strategy

**Progressive learning**:
1. **Week 1**: Master basic workflows (up, down, logs, restart)
2. **Week 2**: Learn database operations (migrate, seed, backup)
3. **Week 3**: Explore mock services and testing
4. **Week 4**: Dive deep into architecture and advanced topics

**Documentation habits**:
- Bookmark frequently used docs
- Take notes on non-obvious things
- Contribute to docs when you find gaps
- Share learnings with team

---

## Tips and Tricks

### Shell Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# BarberPro aliases
alias bp='cd ~/projects/service-booking'
alias bp-up='cd ~/projects/service-booking && make up'
alias bp-down='cd ~/projects/service-booking && make down'
alias bp-logs='cd ~/projects/service-booking && make logs'
alias bp-restart='cd ~/projects/service-booking && make restart'
alias bp-reset='cd ~/projects/service-booking && make reset'
```

**Usage**:
```bash
bp           # Jump to project
bp-up        # Start from anywhere
bp-logs      # View logs from anywhere
```

---

### VS Code Snippets

Create `.vscode/snippets.code-snippets`:

```json
{
  "Docker Up": {
    "prefix": "docker-up",
    "body": "make up",
    "description": "Start Docker environment"
  },
  "Docker Down": {
    "prefix": "docker-down",
    "body": "make down",
    "description": "Stop Docker environment"
  },
  "Docker Logs": {
    "prefix": "docker-logs",
    "body": "make logs",
    "description": "View Docker logs"
  }
}
```

---

### Keyboard Shortcuts

**Terminal shortcuts**:
- `Ctrl+C`: Stop running command (logs, dev servers)
- `Ctrl+D`: Exit shell/terminal
- `Ctrl+L`: Clear terminal screen
- `Ctrl+R`: Search command history

**Docker shortcuts**:
```bash
# Quick status check
alias ds='docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Quick logs
alias dl='docker logs -f --tail=100'

# Quick restart
alias dr='docker restart'
```

---

### Browser Bookmarks

Create a "BarberPro Dev" bookmark folder with:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/docs
- pgAdmin: http://localhost:8080
- Redis Commander: http://localhost:8081
- MercadoPago Mock: http://localhost:3001/dashboard
- MailHog: http://localhost:8025

**Open all at once**: Right-click folder → "Open All"

---

### Git Workflow Tips

**Branch naming conventions**:
```bash
feature/user-profile-page
fix/booking-date-validation
docs/update-readme
refactor/payment-service
```

**Quick branch switching**:
```bash
# Save current work
git stash

# Switch branch
git checkout other-branch

# Return and restore work
git checkout original-branch
git stash pop
```

**Reset to clean state**:
```bash
# Discard all changes (careful!)
git reset --hard HEAD
git clean -fd

# Or stash changes
git stash
```

---

### Performance Optimization

**Faster Docker builds**:
```bash
# Use BuildKit (faster, better caching)
export DOCKER_BUILDKIT=1
```

**Faster npm installs**:
```bash
# Use npm cache
npm config set cache ~/.npm-cache

# Use parallel installs
npm config set prefer-offline true
```

**WSL2 optimization** (Windows):
```bash
# Edit ~/.wslconfig (Windows user directory)
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

---

### Debugging Tips

**Backend debugging with VS Code**:
1. Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Backend",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

2. Start backend with debug flag:
```bash
node --inspect=0.0.0.0:9229 src/index.js
```

3. F5 in VS Code to attach debugger

**Database query debugging**:
```bash
# Enable query logging in backend
# Add to backend/.env:
DEBUG=prisma:query

# Restart backend to see all SQL queries
```

---

## Getting Help

### Self-Service Resources

**Documentation** (check in this order):
1. [Makefile Cheat Sheet](./makefile-cheat-sheet.md) - Quick command reference
2. [Docker FAQ](./docker-faq.md) - Common questions
3. [Troubleshooting Guide](./docker-troubleshooting.md) - Common issues
4. [Docker Architecture](./docker-architecture.md) - System deep-dive
5. [Docker Setup Guide](./docker-setup-guide.md) - Detailed setup

**Quick answers**:
```bash
# Command help
make help

# System diagnostics
make doctor

# Service status
make status
make health
```

---

### Team Support

**Slack channels**:
- **#dev-environment**: Docker, setup, and environment questions
- **#barberpro-dev**: General development questions
- **#random**: Non-work chat, get to know the team

**When to ask**:
- After trying documentation and troubleshooting
- When stuck for more than 30 minutes
- When encountering unusual errors
- When unsure about architectural decisions

**How to ask**:
1. Describe what you're trying to do
2. Show what you've tried
3. Include relevant logs/screenshots
4. Mention where you looked for answers

**Example good question**:
```
I'm trying to start the Docker environment but getting "Port 5432 already in use".

What I've tried:
- Ran `make doctor` - confirms port conflict
- Ran `lsof -ti:5432` - shows PID 12345
- Checked if it's local PostgreSQL - it is

Question: Is it safe to stop local PostgreSQL? Will it affect other projects?

Screenshot attached.
```

---

### Pair Programming

**Request pair programming for**:
- First task implementation
- Unfamiliar parts of codebase
- Complex features
- Code review walkthrough

**How to request**:
- Ask in Slack: "Anyone available for 30-min pair session on [topic]?"
- Schedule in advance for complex topics
- Come prepared with specific questions

---

### Office Hours

**Team office hours** (if available):
- Check team calendar for office hours
- Drop in with questions
- No appointment needed

---

### Emergency Support

**For critical production issues**:
- Ping @oncall in Slack
- Include: severity, impact, what's broken
- Follow incident response process

**For local development issues**:
- Not emergencies - use normal channels
- Document issue for future FAQ update

---

## Congratulations!

You've completed the BarberPro developer onboarding! Here's what you've accomplished:

### Technical Skills Acquired
- ✓ Set up complete Docker development environment
- ✓ Learned Makefile commands for daily workflows
- ✓ Mastered database operations (migrate, seed, backup)
- ✓ Understand how to debug using logs and status checks
- ✓ Know where to find documentation and help

### Knowledge Gained
- ✓ Project architecture and structure
- ✓ Docker Compose service organization
- ✓ Argentina-specific features and mock services
- ✓ Testing strategies and workflows
- ✓ Code quality practices and conventions

### Confidence Built
- ✓ Can start environment independently
- ✓ Can troubleshoot common issues
- ✓ Know where to ask for help
- ✓ Ready to contribute code

---

## Next Steps

### Continue Learning
- [ ] Read advanced documentation as needed
- [ ] Explore monitoring stack (optional): `make monitoring`
- [ ] Learn deployment process (when ready)
- [ ] Contribute to documentation improvements

### Contribute to Onboarding
- [ ] Note any confusing parts of this guide
- [ ] Suggest improvements based on your experience
- [ ] Update FAQ with questions you had
- [ ] Help onboard the next developer

---

## Feedback

**Help us improve this onboarding!**

After completing onboarding, please share:
- What worked well?
- What was confusing?
- What took longer than expected?
- What should be added?

**Submit feedback**:
- Open GitHub issue with "onboarding feedback" label
- Post in #dev-environment Slack channel
- Speak with team lead

---

**Welcome to the team!** We're excited to have you here and look forward to your contributions.

Remember: Everyone was new once. Don't hesitate to ask questions, and soon you'll be helping onboard the next developer.

Happy coding!

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Maintained by**: DevOps Team

For questions or improvements, contact the DevOps team or open a GitHub issue.
