# Quickstart Guide: Docker Development Environment

**Feature**: 001-docker-dev-hotreload
**Audience**: Developers setting up BarberPro for the first time
**Time to complete**: 15 minutes
**Last updated**: 2025-10-25

---

## Overview

This guide will help you set up a fully functional BarberPro development environment using Docker. By the end, you'll have:

- ✅ PostgreSQL database with migrations applied
- ✅ Redis cache
- ✅ Backend API with hot reload
- ✅ Frontend UI with hot reload
- ✅ Database admin tool (pgAdmin)
- ✅ Cache admin tool (Redis Commander)

**All running in Docker containers with a single command.**

---

## Prerequisites

Before you begin, ensure you have:

1. **Docker Desktop** (macOS/Windows) or **Docker Engine + Docker Compose** (Linux)
   - macOS: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop) + WSL2
   - Linux: Install via package manager (`apt install docker.io docker-compose`)

2. **Minimum System Requirements**:
   - 8GB RAM
   - 20GB free disk space
   - Modern processor (last 5 years)

3. **Command-line Tools**:
   - `make` (pre-installed on macOS/Linux, install on Windows)
   - `git` (for cloning the repository)

---

## Step 1: Clone the Repository

```bash
git clone <repository-url> barberpro
cd barberpro
```

---

## Step 2: Verify Prerequisites

Run the diagnostic command to check your system:

```bash
make doctor
```

**Expected Output**:
```
✓ Docker Engine: Running
✓ Docker Compose: Installed
✓ Node.js: v20.x.x (optional)
✓ npm: 10.x.x (optional)
✓ GNU Make: Installed

Checking Configuration Files:
✓ .env file: Found
✓ Base compose: Found
✓ Dev compose: Found

Checking Port Availability:
✓ Port 3000 (Backend): Available
✓ Port 5173 (Frontend): Available
✓ Port 5432 (Postgres): Available
✓ Port 6379 (Redis): Available

✓ System diagnostics complete
```

**If any checks fail**, follow the platform-specific instructions provided in the error message.

---

## Step 3: Start the Development Environment

### Option A: Infrastructure Only (Recommended for First-Time Setup)

This starts only the database and cache, allowing you to run backend/frontend locally for easier debugging:

```bash
make dev-infra-only
```

**What happens**:
1. PostgreSQL container starts on port 5432
2. Redis container starts on port 6379
3. pgAdmin UI starts on port 8080
4. Redis Commander UI starts on port 8081
5. Database migrations are applied automatically

**Expected Output**:
```
→ Starting Infrastructure ONLY...
  - PostgreSQL (database)
  - Redis (cache)
  - pgAdmin (database management)
  - Redis Commander (cache management)

→ Waiting for services to be healthy...

✓ Infrastructure ready!

Services available at:
  PostgreSQL:     localhost:5432
  pgAdmin:        http://localhost:8080
  Redis:          localhost:6379
  Redis Commander: http://localhost:8081

Next steps:
  1. Start backend:  cd backend && npm run dev
  2. Start frontend: cd frontend && npm run dev
  3. Visit app:      http://localhost:5173
```

**Then start backend and frontend in separate terminals**:

```bash
# Terminal 2: Backend
cd backend
npm install  # First time only
npm run dev

# Terminal 3: Frontend
cd frontend
npm install  # First time only
npm run dev
```

### Option B: Full Docker Environment (All Containers)

This runs everything in Docker including backend and frontend:

```bash
make dev
```

**What happens**:
1. Builds backend and frontend Docker images (3-5 minutes first time)
2. Starts all 6 containers
3. Applies database migrations
4. Waits for all services to report healthy

**Expected Output**:
```
→ Starting BarberPro Development Environment...
  - Base infrastructure
  - Backend API
  - Frontend UI

→ Waiting for services to be healthy...

✓ Services started successfully! (completed in 120s)

Services available at:
  Backend API:    http://localhost:3000
  Frontend UI:    http://localhost:5173
  PostgreSQL:     localhost:5432
  Redis:          localhost:6379
  pgAdmin:        http://localhost:8080
  Redis Commander: http://localhost:8081
```

---

## Step 4: Verify Everything Works

### 1. Check Service Health

```bash
docker ps --filter "name=barberpro"
```

**Expected Output**:
```
NAMES                       STATUS
barberpro-postgres-dev      Up 2 minutes (healthy)
barberpro-redis-dev         Up 2 minutes (healthy)
barberpro-backend-dev       Up 1 minute (healthy)
barberpro-frontend-dev      Up 1 minute (healthy)
barberpro-pgadmin-dev       Up 2 minutes
barberpro-redis-commander-dev Up 2 minutes
```

All services should show `(healthy)` status.

### 2. Test Backend API

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### 3. Test Frontend

Open browser to: http://localhost:5173

You should see the BarberPro homepage.

### 4. Test Database Admin

Open browser to: http://localhost:8080

Login with:
- Email: `admin@barberpro.com`
- Password: `admin123`

You should see pgAdmin dashboard.

---

## Step 5: Test Hot Reload

### Backend Hot Reload Test

1. Open `backend/src/server.ts` in your editor
2. Add a comment:
   ```typescript
   // Test hot reload
   ```
3. Save the file
4. Watch the backend terminal

**Expected Output** (within 3 seconds):
```
[tsx] File changed: src/server.ts
[tsx] Restarting server...
[Info] Server started on port 3000
```

### Frontend Hot Reload Test

1. Open `frontend/src/routes/+page.svelte` in your editor
2. Add a comment:
   ```html
   <!-- Test hot reload -->
   ```
3. Save the file
4. Watch your browser

**Expected Behavior** (within 2 seconds):
- Browser automatically refreshes
- Changes appear instantly
- No manual refresh needed

---

## Common Commands

### Start Environment

```bash
make dev-infra-only   # Infrastructure only (recommended)
make dev              # Full Docker environment
```

### Stop Environment

```bash
make down
```

**Note**: This stops all containers but **preserves data** (database, uploads, etc.)

### View Logs

```bash
# All services
make logs

# Specific service
docker logs -f barberpro-backend-dev
docker logs -f barberpro-frontend-dev
```

### Check Status

```bash
docker ps --filter "name=barberpro"
```

### Reset Database

**Warning**: This deletes all data!

```bash
# Reset database only (keeps containers running)
cd backend
npx prisma migrate reset

# Or use make command (future)
make db-reset
```

### Complete Environment Reset

**Warning**: This destroys all data and containers!

```bash
make clean
```

Then start fresh:
```bash
make dev-infra-only
```

---

## Accessing Services

### Web Interfaces

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | N/A |
| Backend API | http://localhost:3000 | N/A |
| API Docs (Swagger) | http://localhost:3000/docs | N/A |
| pgAdmin | http://localhost:8080 | admin@barberpro.com / admin123 |
| Redis Commander | http://localhost:8081 | admin / admin123 |

### Direct Database Access

```bash
# Using psql in container
docker exec -it barberpro-postgres-dev psql -U barberpro -d barberpro_dev

# Using psql on host (if installed)
psql -h localhost -p 5432 -U barberpro -d barberpro_dev
```

### Direct Redis Access

```bash
# Using redis-cli in container
docker exec -it barberpro-redis-dev redis-cli

# Using redis-cli on host (if installed)
redis-cli -h localhost -p 6379
```

---

## Troubleshooting

### Problem: "Port already in use"

**Symptom**:
```
Error: Port 5432 is already in use
```

**Solution**:
```bash
# Find process using port
lsof -ti:5432

# Kill the process
lsof -ti:5432 | xargs kill -9

# Or change port in .env
POSTGRES_PORT=5433
```

### Problem: "Docker daemon not running"

**Symptom**:
```
Cannot connect to Docker daemon
```

**Solution**:
- **macOS**: Open Docker Desktop from Applications
- **Linux**: `sudo systemctl start docker`
- **Windows**: Start Docker Desktop

### Problem: pgAdmin won't start

**Symptom**:
```
pgadmin: 'admin@barberpro.local' does not appear to be a valid email
```

**Solution**:
```bash
# Edit .env file
nano .env

# Change:
PGADMIN_DEFAULT_EMAIL=admin@barberpro.com  # Remove .local

# Restart
make down
make dev-infra-only
```

### Problem: Backend shows "Connection refused" errors

**Symptom**:
```
Error: connect ECONNREFUSED localhost:5432
```

**Solution**:
Wait for PostgreSQL to be healthy:
```bash
docker ps --filter "name=barberpro-postgres"
# Wait until STATUS shows (healthy)
```

If still failing after 30 seconds:
```bash
docker logs barberpro-postgres-dev
# Check for errors
```

### Problem: Hot reload not working

**Backend Hot Reload**:
1. Verify tsx is running: `docker logs barberpro-backend-dev | grep tsx`
2. Check file is mounted: `docker exec barberpro-backend-dev ls -la /app/src`
3. Restart container: `docker restart barberpro-backend-dev`

**Frontend Hot Reload**:
1. Check Vite dev server: `docker logs barberpro-frontend-dev | grep vite`
2. Verify browser console shows HMR connection
3. Clear browser cache and refresh

### Problem: Out of disk space

**Symptom**:
```
Error: no space left on device
```

**Solution**:
```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -af --volumes

# WARNING: This deletes ALL Docker data (not just BarberPro)
```

### Problem: Slow performance on macOS

**Symptom**:
File changes take 10+ seconds to reflect

**Solution**:
This is a known Docker Desktop issue. The project already uses `:delegated` mounts. If still slow:

1. Increase Docker Desktop resources (RAM and CPU)
2. Use `make dev-infra-only` and run backend/frontend outside Docker
3. Consider Docker alternatives (Colima, Rancher Desktop)

---

## Development Workflow

### Typical Day

```bash
# Morning: Start environment
make dev-infra-only

# In separate terminals:
cd backend && npm run dev
cd frontend && npm run dev

# Make code changes (auto-reloads)

# End of day: Stop environment
make down
```

### Making Database Schema Changes

```bash
# 1. Edit schema
nano backend/prisma/schema.prisma

# 2. Create migration
cd backend
npx prisma migrate dev --name describe_your_change

# 3. Migration applies automatically
# 4. Prisma Client regenerates automatically
```

### Adding New Dependencies

```bash
# Backend
cd backend
npm install <package-name>
docker restart barberpro-backend-dev  # If using full Docker

# Frontend
cd frontend
npm install <package-name>
docker restart barberpro-frontend-dev  # If using full Docker
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npx playwright test
```

---

## Next Steps

Now that your environment is running:

1. **Explore the codebase**:
   - Backend: `backend/src/`
   - Frontend: `frontend/src/`
   - Database schema: `backend/prisma/schema.prisma`

2. **Read the documentation**:
   - Architecture: `docs/ARCHITECTURE.md`
   - API docs: http://localhost:3000/docs
   - Component library: `docs/frontend-components.md`

3. **Start developing**:
   - Pick a task from the project board
   - Create a feature branch
   - Make changes (hot reload works!)
   - Test locally
   - Submit a pull request

4. **Join the team**:
   - Slack: #barberpro-dev
   - Stand-ups: Daily at 10 AM
   - Code reviews: Required before merge

---

## Getting Help

### Documentation

- Docker compose files: `docker/`
- Makefile commands: Run `make help`
- Environment variables: `backend/.env`, `frontend/.env`, `.env`
- Troubleshooting: `docker/TROUBLESHOOTING.md`

### Support Channels

- **Slack**: #barberpro-dev
- **Issues**: GitHub issues (tag with `environment`)
- **Wiki**: Confluence team wiki

### Useful Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Fastify Documentation](https://www.fastify.io/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

## Appendix: File Locations

### Configuration Files
- Root environment: `.env`
- Backend environment: `backend/.env`
- Frontend environment: `frontend/.env`
- Docker Compose: `docker/docker-compose.dev.yml`
- Makefile: `Makefile`

### Source Code
- Backend: `backend/src/`
- Frontend: `frontend/src/`
- Database schema: `backend/prisma/schema.prisma`
- Database migrations: `backend/prisma/migrations/`

### Docker Files
- Backend Dockerfile: `backend/Dockerfile.dev`
- Frontend Dockerfile: `frontend/Dockerfile.dev`
- Backend .dockerignore: `backend/.dockerignore`
- Frontend .dockerignore: `frontend/.dockerignore`

---

**Status**: ✅ Quickstart guide complete. Ready for developer onboarding.
