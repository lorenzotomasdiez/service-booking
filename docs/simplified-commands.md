# Simplified Command Structure

## Summary of Changes

We've simplified the development workflow to use **fully Dockerized environment** with cleaner, more intuitive commands.

### Key Changes

1. **Single Entry Point**: `npm start` (or `make up`) starts **everything in Docker**
   - PostgreSQL
   - Redis
   - Backend (with hot reload)
   - Frontend (with hot reload)
   - pgAdmin (database admin UI)
   - Redis Commander (cache admin UI)

2. **Auto-Generated .env Files**: Running `npm start` automatically generates .env files with dummy data if they don't exist

3. **Simplified Commands**: Reduced from 85+ npm scripts to ~25 essential commands

4. **TDD-Focused**: Added dedicated test commands for Test-Driven Development workflow

---

## Quick Reference

### Daily Workflow
```bash
npm start          # Start all services (one command does it all!)
npm run logs       # View logs
npm test           # Run tests
npm stop           # Stop all services
```

### First Time Setup
```bash
npm run setup      # Complete setup (install + start + migrate)
```

### Testing (TDD)
```bash
npm test               # Run all tests
npm run test:watch     # Watch mode for TDD
npm run test:backend   # Backend tests only
npm run test:frontend  # Frontend tests only
npm run test:coverage  # Coverage reports
```

### Database
```bash
npm run db:migrate     # Run migrations
npm run db:seed        # Seed with test data
npm run db:reset       # Full reset (drop + migrate + seed)
npm run db:studio      # Open Prisma Studio
```

### Troubleshooting
```bash
make doctor            # Check system requirements
make status            # Check service health
make clean             # Remove all containers/volumes
```

---

## What Was Removed

### Deprecated Commands
- `npm run dev` → Use `npm start` instead
- `npm run backend` → Backend runs in Docker
- `npm run frontend` → Frontend runs in Docker
- `npm run docker:*` → Use `make` commands directly
- `make dev` → Use `make up` instead
- `make dev-infra-only` → Use `make up` instead
- `make full` → Use `make up` instead

### Moved to "Advanced" Section
- Production deployment commands (`railway:*`)
- Monitoring stack commands (`monitoring-*`)
- Integration test variants (`test-integration-*`)
- Rarely-used maintenance commands (`prune`, `validate`, `update`)

These are still available in the Makefile but hidden from daily workflow.

---

## Access Points

Once `npm start` completes:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | - |
| **Backend API** | http://localhost:3000 | - |
| **API Docs** | http://localhost:3000/docs | - |
| **pgAdmin** | http://localhost:8080 | admin@barberpro.com / admin |
| **Redis Commander** | http://localhost:8081 | admin / admin |
| **PostgreSQL** | localhost:5432 | barberpro / barberpro_dev_password |
| **Redis** | localhost:6379 | (no password) |

---

## File Structure

### Auto-Generated .env Files
When you run `npm start` for the first time, these files are created automatically:

- `.env` - Root environment variables
- `backend/.env` - Backend-specific variables
- `frontend/.env` - Frontend-specific variables
- `docker/.env` - Docker-specific variables

All files contain **dummy data** safe for local development.

---

## Migration Guide

### Old Workflow → New Workflow

| Old Command | New Command | Notes |
|-------------|-------------|-------|
| `npm run docker:up` | `npm start` | Simpler alias |
| `npm run dev` | `npm start` | Everything in Docker now |
| `cd backend && npm run dev` | `npm start` | Backend in Docker |
| `cd frontend && npm run dev` | `npm start` | Frontend in Docker |
| `make dev-infra-only` | `npm start` | No separate infra mode |
| `npm run docker:logs` | `npm run logs` | Shorter command |
| `make db-migrate` | `npm run db:migrate` | npm alias available |

---

## Benefits

1. **Faster Onboarding**: New developers run `npm run setup` and they're done
2. **Consistent Environment**: Everyone runs the exact same Docker setup
3. **Less Confusion**: One way to start services, not five different commands
4. **Auto-Configuration**: .env files generated automatically with safe defaults
5. **TDD-Ready**: Dedicated test commands for test-driven development
6. **Hot Reload**: Both backend and frontend auto-reload on code changes

---

## Advanced Usage

For power users who need more control, the Makefile still has 50+ commands available:

```bash
make help              # See all available commands
make mocks             # Start Argentina mock services
make shell-backend     # Open shell in backend container
make shell-frontend    # Open shell in frontend container
```

---

## Notes

- All services run in Docker for consistency
- Hot reload is enabled by default (code changes auto-restart containers)
- Test commands work inside the Docker environment
- Database persists between restarts (use `make clean` to wipe)
- .env files are gitignored - never commit them!

---

Generated: 2025-10-25
