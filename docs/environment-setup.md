# Environment Setup Guide

Complete guide for configuring the BarberPro development environment with Docker.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Files Overview](#environment-files-overview)
3. [Environment Variable Precedence](#environment-variable-precedence)
4. [Docker Development Setup](#docker-development-setup)
5. [Local Development Setup (Non-Docker)](#local-development-setup-non-docker)
6. [Production Setup](#production-setup)
7. [Testing Environment Setup](#testing-environment-setup)
8. [Environment File Templates](#environment-file-templates)
9. [Docker Network Configuration](#docker-network-configuration)
10. [Verification Steps](#verification-steps)
11. [Common Issues](#common-issues)

---

## Quick Start

### Docker Development (Recommended)

```bash
# 1. Copy the development environment file
cp .env.development .env

# 2. Start the development environment
make dev

# OR manually:
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# 3. Access the application
# Frontend:        http://localhost:5173
# Backend API:     http://localhost:3000
# API Docs:        http://localhost:3000/docs
# pgAdmin:         http://localhost:8080
# Redis Commander: http://localhost:8081
# MailHog:         http://localhost:8025
```

### With Mock Services

```bash
# Start development environment with all Argentina mock services
make dev-with-mocks

# OR manually:
docker-compose -f docker/docker-compose.yml \
               -f docker/docker-compose.dev.yml \
               -f docker/docker-compose.mocks.yml up
```

---

## Environment Files Overview

The project uses multiple environment files for different purposes:

### File Structure

```
project-root/
├── .env.example          # Template with ALL possible variables (commit to git)
├── .env.development      # Docker development defaults (commit to git)
├── .env.production       # Production configuration (DO NOT commit)
├── .env.local            # Personal overrides (DO NOT commit - gitignored)
├── .env.test             # Testing configuration (commit to git)
│
├── backend/
│   ├── .env              # Backend-specific variables (optional)
│   └── .env.example      # Backend template
│
├── frontend/
│   ├── .env              # Frontend-specific variables (optional)
│   └── .env.example      # Frontend template
│
└── docker/
    ├── .env.example      # Docker-specific template
    └── docker.env        # Docker infrastructure variables
```

### File Purposes

| File | Purpose | Commit to Git? | When to Use |
|------|---------|----------------|-------------|
| `.env.example` | Template showing all variables | ✅ Yes | Reference only, never loaded |
| `.env.development` | Docker development defaults | ✅ Yes | Copy to `.env` for Docker development |
| `.env.production` | Production configuration | ❌ No | Production deployments only |
| `.env.local` | Personal developer overrides | ❌ No | Local customization (gitignored) |
| `.env.test` | Testing environment | ✅ Yes | Automated tests and CI/CD |

---

## Environment Variable Precedence

Variables are loaded in the following order (later values override earlier):

```
1. CLI environment variables (highest priority)
   └─> export DATABASE_URL=postgresql://...
   └─> NODE_ENV=production npm start

2. .env.local (gitignored, developer-specific)
   └─> Personal overrides for local development
   └─> Never committed to version control

3. .env.development or .env.production (environment-specific)
   └─> Default values for the environment
   └─> .env.development is committed to git
   └─> .env.production is NOT committed

4. .env.example (template)
   └─> Documentation only, NOT loaded by the application

5. Default values in code (lowest priority)
   └─> Fallback values defined in application code
```

### Example Precedence Scenario

```bash
# Code default:
const port = process.env.PORT || 3000;  // 3000

# .env.development:
PORT=3000

# .env.local (overrides .env.development):
PORT=4000

# CLI (overrides everything):
PORT=5000 npm start  # Application runs on port 5000
```

---

## Docker Development Setup

### Step-by-Step Setup

#### 1. Choose Your Environment File

**Option A: Use the provided `.env.development` (Recommended)**
```bash
# Copy the pre-configured development environment
cp .env.development .env
```

**Option B: Create from template**
```bash
# Copy template and customize
cp .env.example .env.development
# Edit .env.development with your preferred editor
# Then copy to .env
cp .env.development .env
```

#### 2. Verify Docker Network Configuration

The `.env.development` file is pre-configured with Docker service names. Verify these key settings:

```bash
# Database connection (uses Docker service name 'postgres')
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev

# Redis connection (uses Docker service name 'redis')
REDIS_URL=redis://redis:6379

# Mock service URLs (use Docker service names)
MERCADOPAGO_BASE_URL=http://mercadopago-mock:3001
AFIP_BASE_URL=http://afip-mock:3002
WHATSAPP_API_URL=http://whatsapp-mock:3003
SMS_API_URL=http://sms-mock:3004

# Email (MailHog)
SMTP_HOST=mailhog
```

**IMPORTANT**: Use Docker service names (postgres, redis, mailhog) for container-to-container communication, NOT localhost.

#### 3. Configure Webhook URLs

Webhooks must use the `backend` service name so external mocks can reach the backend container:

```bash
# ✅ CORRECT - Uses Docker service name
MERCADOPAGO_WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago
WHATSAPP_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp
SMS_WEBHOOK_URL=http://backend:3000/api/webhooks/sms

# ❌ WRONG - localhost won't work inside Docker network
MERCADOPAGO_WEBHOOK_URL=http://localhost:3000/api/webhooks/mercadopago
```

#### 4. Configure CORS

CORS must allow both localhost (for browser) and Docker service names (for internal requests):

```bash
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://frontend:5173,http://backend:3000
```

If you encounter CORS issues, you may need to add container IP ranges:

```bash
# Find container IP range
docker network inspect barberpro-network | grep Subnet

# Add to CORS_ORIGIN (example):
CORS_ORIGIN=http://localhost:5173,http://172.18.0.0/16
```

#### 5. Configure Frontend Environment

Frontend variables must use localhost (browsers connect from host, not Docker network):

```bash
# ✅ CORRECT - Browser connects to localhost
VITE_API_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:3000/api

# ❌ WRONG - Browser can't resolve Docker service names
VITE_API_URL=http://backend:3000
```

#### 6. Start the Environment

```bash
# Development without mocks
make dev

# Development with mock services
make dev-with-mocks

# View logs
make logs

# Check service health
make status
```

#### 7. Verify Services are Running

```bash
# Check all containers are healthy
docker-compose ps

# Expected output:
# NAME                    STATUS
# barberpro-postgres      Up (healthy)
# barberpro-redis         Up (healthy)
# barberpro-backend       Up (healthy)
# barberpro-frontend      Up
# barberpro-pgadmin       Up (healthy)
# barberpro-redis-comm    Up (healthy)
```

---

## Local Development Setup (Non-Docker)

If you prefer to run services locally without Docker:

### 1. Install Dependencies

```bash
# PostgreSQL 16
sudo apt install postgresql-16  # Ubuntu/Debian
brew install postgresql@16      # macOS

# Redis 7
sudo apt install redis-server   # Ubuntu/Debian
brew install redis              # macOS

# Node.js 20 LTS
nvm install 20
nvm use 20
```

### 2. Create Environment File

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local and change service names to localhost
```

### 3. Update Connection Strings

Edit `.env.local`:

```bash
# Use localhost instead of Docker service names
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@localhost:5432/barberpro_dev
REDIS_URL=redis://localhost:6379

# Mock services also on localhost
MERCADOPAGO_BASE_URL=http://localhost:3001
AFIP_BASE_URL=http://localhost:3002
WHATSAPP_API_URL=http://localhost:3003
SMS_API_URL=http://localhost:3004
```

### 4. Initialize Database

```bash
# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@16  # macOS

# Create database and user
sudo -u postgres psql

CREATE DATABASE barberpro_dev;
CREATE USER barberpro WITH PASSWORD 'barberpro_dev_password';
GRANT ALL PRIVILEGES ON DATABASE barberpro_dev TO barberpro;
\q
```

### 5. Start Services

```bash
# Terminal 1: Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Mock Services (optional)
cd docker/mocks
npm install
npm start
```

---

## Production Setup

### 1. Create Production Environment File

```bash
# Create from template
cp .env.example .env.production

# IMPORTANT: Never commit .env.production to git!
echo ".env.production" >> .gitignore
```

### 2. Generate Secure Secrets

```bash
# JWT secret (minimum 32 characters)
openssl rand -base64 64

# Session secret
openssl rand -base64 64

# Webhook secrets
openssl rand -hex 32
```

### 3. Configure Production Variables

Edit `.env.production`:

```bash
# Environment
NODE_ENV=production

# Application URLs (use your actual domains)
FRONTEND_URL=https://barberpro.com.ar
BACKEND_URL=https://api.barberpro.com.ar
APP_URL=https://barberpro.com.ar

# Database (use managed database service)
DATABASE_URL=postgresql://user:password@db.barberpro.com.ar:5432/barberpro_prod

# Redis (use managed Redis service)
REDIS_URL=redis://redis.barberpro.com.ar:6379

# Real MercadoPago credentials
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
MERCADOPAGO_ENVIRONMENT=production
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-real-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-real-public-key
MERCADOPAGO_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/mercadopago

# Real AFIP credentials
AFIP_BASE_URL=https://servicios1.afip.gov.ar
AFIP_ENVIRONMENT=production
AFIP_CUIT=your-company-cuit
AFIP_CERT_PATH=/app/certs/afip-production.crt
AFIP_KEY_PATH=/app/certs/afip-production.key

# Real WhatsApp Business API
WHATSAPP_BASE_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your-real-whatsapp-token
WHATSAPP_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/whatsapp

# Real SMS Gateway
SMS_BASE_URL=https://api.your-sms-provider.com
SMS_API_KEY=your-real-sms-api-key
SMS_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/sms

# Real SMTP Server
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@barberpro.com.ar

# Security (strong values!)
JWT_SECRET=<64-character-random-string>
SESSION_SECRET=<64-character-random-string>
BCRYPT_SALT_ROUNDS=12

# CORS (restrict to your domains)
CORS_ORIGIN=https://barberpro.com.ar,https://api.barberpro.com.ar

# Disable debug features
APP_DEBUG=false
ENABLE_SWAGGER=false

# Monitoring
SENTRY_DSN=your-sentry-dsn
ENABLE_METRICS=true
```

### 4. Deploy Production Environment

```bash
# Build production images
docker-compose -f docker/docker-compose.yml \
               -f docker/docker-compose.prod.yml \
               build

# Start production stack
docker-compose -f docker/docker-compose.yml \
               -f docker/docker-compose.prod.yml \
               up -d

# Verify deployment
docker-compose ps
docker-compose logs -f backend
```

---

## Testing Environment Setup

### 1. Create Test Environment File

```bash
cp .env.example .env.test
```

### 2. Configure Test Environment

Edit `.env.test`:

```bash
NODE_ENV=test

# Separate test database
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_test
TEST_DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_test

# Separate Redis database
REDIS_URL=redis://redis:6379/1
TEST_REDIS_URL=redis://redis:6379/1

# Mock all external services
MOCK_EXTERNAL_SERVICES=true
MERCADOPAGO_BASE_URL=http://mercadopago-mock:3001
AFIP_BASE_URL=http://afip-mock:3002
WHATSAPP_API_URL=http://whatsapp-mock:3003
SMS_API_URL=http://sms-mock:3004

# Fast startup for CI/CD
HEALTHCHECK_INTERVAL=5s
HEALTHCHECK_RETRIES=3
```

### 3. Run Tests

```bash
# Run test suite
make test

# OR manually:
docker-compose -f docker/docker-compose.yml \
               -f docker/docker-compose.test.yml \
               up --abort-on-container-exit
```

---

## Environment File Templates

### Minimal Development Template

Create `.env.local` with minimal overrides:

```bash
# Override only what you need
LOG_LEVEL=debug
BACKEND_PORT=4000
```

### Docker Development Template

`.env.development` (already provided):

```bash
NODE_ENV=development
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev
REDIS_URL=redis://redis:6379
MERCADOPAGO_BASE_URL=http://mercadopago-mock:3001
# ... (see .env.development file)
```

### Production Template

`.env.production`:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@production-db:5432/barberpro_prod
REDIS_URL=redis://production-redis:6379
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
MERCADOPAGO_ACCESS_TOKEN=APP_USR-production-token
# ... (use real credentials)
```

---

## Docker Network Configuration

### Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Host Machine                          │
│  Browser (http://localhost:5173)                        │
│         │                                                │
│         ├─> Frontend Container (:5173)                  │
│         │                                                │
│         └─> Backend Container (:3000)                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│           Docker Network: barberpro-network             │
│  (Bridge Network: 172.18.0.0/16)                        │
│                                                          │
│  frontend:5173          ─┬─> backend:3000               │
│  backend:3000           ─┼─> postgres:5432              │
│  postgres:5432          ─┼─> redis:6379                 │
│  redis:6379             ─┼─> mercadopago-mock:3001      │
│  mercadopago-mock:3001  ─┼─> afip-mock:3002             │
│  afip-mock:3002         ─┼─> whatsapp-mock:3003         │
│  whatsapp-mock:3003     ─┼─> sms-mock:3004              │
│  sms-mock:3004          ─┼─> mailhog:1025               │
│  mailhog:1025           ─┘                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Service Name Resolution

Inside Docker network, use service names:
- `postgres` resolves to PostgreSQL container IP
- `redis` resolves to Redis container IP
- `backend` resolves to Backend container IP
- etc.

From host browser, use localhost:
- `localhost:5173` → Frontend
- `localhost:3000` → Backend API
- `localhost:8080` → pgAdmin
- `localhost:8081` → Redis Commander

### Network Troubleshooting

```bash
# List Docker networks
docker network ls

# Inspect barberpro network
docker network inspect barberpro-network

# Check service connectivity from backend container
docker-compose exec backend ping postgres
docker-compose exec backend ping redis

# Check service name resolution
docker-compose exec backend nslookup postgres
docker-compose exec backend nslookup redis
```

---

## Verification Steps

After setting up your environment, verify everything works:

### 1. Check Environment Variables are Loaded

```bash
# Backend
docker-compose exec backend env | grep DATABASE_URL
docker-compose exec backend env | grep REDIS_URL

# Frontend
docker-compose exec frontend env | grep VITE_API_URL
```

### 2. Test Database Connection

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U barberpro -d barberpro_dev

# Run a test query
SELECT NOW();
\q
```

### 3. Test Redis Connection

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Test command
PING
# Expected: PONG

exit
```

### 4. Test Backend Health

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 5. Test Frontend

```bash
# Open in browser
open http://localhost:5173

# Should load the BarberPro frontend
```

### 6. Test Mock Services

```bash
# MercadoPago mock
curl http://localhost:3001/health

# AFIP mock
curl http://localhost:3002/health

# WhatsApp mock
curl http://localhost:3003/health

# SMS mock
curl http://localhost:3004/health

# MailHog UI
open http://localhost:8025
```

### 7. Test Admin Tools

```bash
# pgAdmin
open http://localhost:8080
# Login: admin@barberpro.local / admin

# Redis Commander
open http://localhost:8081
# Login: admin / admin
```

### 8. Test End-to-End Flow

```bash
# Run integration tests
make test-integration

# OR manually:
docker-compose -f docker/docker-compose.yml \
               -f docker/docker-compose.dev.yml \
               -f docker/docker-compose.mocks.yml \
               exec backend npm run test:integration
```

---

## Common Issues

### Issue: Cannot connect to database

**Symptom**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL uses service name
echo $DATABASE_URL
# Should be: postgresql://...@postgres:5432/...

# NOT localhost:
# postgresql://...@localhost:5432/... ❌
```

### Issue: CORS errors in browser

**Symptom**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```bash
# Add your container IP to CORS_ORIGIN
docker inspect barberpro-frontend | grep IPAddress
# Example: 172.18.0.5

# Update .env.local:
CORS_ORIGIN=http://localhost:5173,http://172.18.0.5:5173
```

### Issue: Webhooks not received

**Symptom**: Webhook callbacks time out

**Solution**:
```bash
# Verify webhook URLs use 'backend' service name
grep WEBHOOK_URL .env
# Should show: http://backend:3000/...

# NOT http://localhost:3000/... ❌

# Test connectivity from mock to backend
docker-compose exec mercadopago-mock ping backend
```

### Issue: Frontend can't connect to backend

**Symptom**: API calls fail with network error

**Solution**:
```bash
# Verify frontend env uses localhost
grep VITE_API_URL .env
# Should be: http://localhost:3000

# NOT http://backend:3000 ❌ (service names don't work in browser)
```

### Issue: Environment variables not loaded

**Symptom**: Application uses default values instead of .env values

**Solution**:
```bash
# Ensure you're using .env (not .env.example)
ls -la .env

# Restart services to reload environment
docker-compose down
docker-compose up -d

# Check environment variables inside container
docker-compose exec backend env
```

### Issue: Port already in use

**Symptom**: `Error: bind: address already in use`

**Solution**:
```bash
# Find what's using the port (example: 3000)
lsof -i :3000

# Kill the process
kill -9 <PID>

# OR change port in .env.local:
BACKEND_PORT=3001
```

---

## Additional Resources

- [Environment Variables Reference](./environment-variables.md) - Complete variable documentation
- [Docker Troubleshooting Guide](./troubleshooting-docker.md) - Common Docker issues
- [Docker README](../docker/README.md) - Docker infrastructure guide
- [Contributing Guide](../CONTRIBUTING.md) - Development workflow

---

## Summary

### Quick Reference

| Scenario | Environment File | Docker Compose Command |
|----------|------------------|------------------------|
| Development with Docker | `.env.development` | `make dev` |
| Development with mocks | `.env.development` | `make dev-with-mocks` |
| Local without Docker | `.env.local` | N/A (run npm scripts) |
| Testing | `.env.test` | `make test` |
| Production | `.env.production` | `make prod` |

### Key Principles

1. **Use service names in Docker** (postgres, redis, backend)
2. **Use localhost for browser access** (http://localhost:3000)
3. **Never commit secrets** (.env.production, .env.local)
4. **Use .env.local for overrides** (gitignored)
5. **Keep .env.example updated** (documentation)

### Next Steps

1. ✅ Choose your environment setup (Docker recommended)
2. ✅ Copy appropriate .env file
3. ✅ Start services with `make dev`
4. ✅ Verify everything works (run verification steps)
5. ✅ Start developing!

For troubleshooting, see [troubleshooting-docker.md](./troubleshooting-docker.md).
