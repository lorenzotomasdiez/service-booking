# BarberPro Troubleshooting Guide

## Table of Contents
- [Critical Issues](#critical-issues)
- [Development Environment](#development-environment)
- [Docker Issues](#docker-issues)
- [Database Problems](#database-problems)
- [CI/CD Pipeline Issues](#ci-cd-pipeline-issues)
- [Deployment Problems](#deployment-problems)
- [Performance Issues](#performance-issues)
- [Argentina-Specific Issues](#argentina-specific-issues)

## Critical Issues

### 🔴 BUG-001: Registration API Response Schema Validation Error

**Status**: HIGH PRIORITY  
**Component**: Backend API - Auth Registration  
**First Reported**: September 10, 2025  

#### Problem Description
The `/api/auth/register` endpoint fails with a 500 Internal Server Error when validation errors occur. The error response schema expects a "validation" field but the code is not providing it correctly.

#### Error Details
```
Error: "validation" is required!
Error [ERR_HTTP_HEADERS_SENT]: Cannot write headers after they are sent to the client
```

#### Steps to Reproduce
1. Send POST request to `/api/auth/register`
2. Include any request body (even valid data)
3. Observe server error and crash

#### Impact
- Prevents user registration functionality
- Causes service instability
- Breaks authentication flow

#### Root Cause Analysis
- Issue appears to be in ValidationErrorResponse schema implementation
- Response serialization conflict between auth.ts:47 and fast-json-stringify
- Missing "validation" field in error response object

#### Solution Steps

**Immediate Fix:**
```bash
# 1. Locate auth registration handler
cd backend/src/routes/auth.ts

# 2. Fix validation error response format
# Ensure ValidationErrorResponse includes "validation" field
# Example fix:
```

```typescript
// Before (broken):
return reply.status(400).send({
  error: 'Validation failed',
  message: 'Invalid input data'
});

// After (fixed):
return reply.status(400).send({
  error: 'Validation failed',
  message: 'Invalid input data',
  validation: validationErrors // Add this field
});
```

**Testing the Fix:**
```bash
# 1. Start backend in development
npm run backend

# 2. Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'

# 3. Verify proper 400 response (not 500)
# Should return validation errors without crashing
```

**Deployment via CI/CD:**
```bash
# 1. Create fix branch
git checkout -b fix/registration-validation-schema

# 2. Implement fix and test locally
npm run test:unit
npm run test:integration

# 3. Commit with clear message
git commit -m "fix: registration validation response schema (BUG-001)"

# 4. Push and create PR
git push origin fix/registration-validation-schema

# 5. For emergency deployment, use hotfix
git checkout main
git merge fix/registration-validation-schema
git commit -m "HOTFIX: registration validation response schema (BUG-001)"
git push origin main  # Triggers hotfix deployment
```

**Verification Steps:**
```bash
# 1. Check staging deployment
curl -X POST https://staging-api.barberpro.com.ar/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "123"}'

# 2. Verify proper error response
# Should return 400 with validation details

# 3. Test valid registration
curl -X POST https://staging-api.barberpro.com.ar/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!", "role": "CLIENT"}'

# 4. Verify successful registration
# Should return 201 with user data
```

## Development Environment

### Node.js Issues

#### Problem: "Module not found" errors
```bash
# Solution 1: Clear and reinstall dependencies
npm run clean
npm run install:all

# Solution 2: Check Node.js version
node --version  # Should be 18.x or higher
nvm use 18      # If using nvm

# Solution 3: Clear npm cache
npm cache clean --force
```

#### Problem: TypeScript compilation errors
```bash
# Solution 1: Regenerate types
cd backend && npm run typecheck
cd frontend && npm run check

# Solution 2: Restart TypeScript server (VSCode)
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# Solution 3: Check tsconfig.json paths
# Ensure all paths are correct
```

### Database Connection Issues

#### Problem: "Database connection refused"
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Start database if not running
docker-compose up -d postgres

# Test connection manually
psql "postgresql://barberpro:barberpro_dev_password@localhost:5432/barberpro_dev"

# Reset connection
docker-compose restart postgres
```

#### Problem: Prisma migration issues
```bash
# Check migration status
cd backend && npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset --force

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Environment Configuration

#### Problem: Environment variables not loading
```bash
# Validate environment configuration
./scripts/validate-env.sh development

# Check .env file exists
ls -la .env*

# Copy from template if missing
cp .env.example .env

# Check for syntax errors in .env
cat .env | grep -v "^#" | grep -v "^$"
```

## Docker Issues

### Build Problems

#### Problem: Docker build fails
```bash
# Check Docker is running
docker info

# Build with verbose output
docker build --no-cache -f backend/Dockerfile -t barberpro-backend ./backend

# Check for file permissions
ls -la backend/Dockerfile

# Clean Docker cache
docker system prune -a
```

#### Problem: "No space left on device"
```bash
# Clean Docker resources
docker system prune -a -f

# Remove unused volumes
docker volume prune -f

# Check disk space
df -h
```

### Container Runtime Issues

#### Problem: Container exits immediately
```bash
# Check container logs
docker logs container_name

# Run container interactively
docker run -it barberpro-backend /bin/sh

# Check health status
docker inspect container_name | grep Health
```

#### Problem: Port already in use
```bash
# Find process using port
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 docker run -p 3001:3000 barberpro-backend
```

### Docker Compose Issues

#### Problem: Services not starting
```bash
# Check service status
docker-compose ps

# View all logs
docker-compose logs

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build
```

## Database Problems

### Connection Issues

#### Problem: "Connection pool exhausted"
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill long-running connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'barberpro_dev' AND state = 'idle' 
AND query_start < now() - interval '5 minutes';

# Increase pool size in .env
DATABASE_POOL_MAX=20
```

#### Problem: "Database does not exist"
```bash
# Create database manually
docker-compose exec postgres createdb -U barberpro barberpro_dev

# Or recreate with Docker
docker-compose down -v
docker-compose up -d postgres
sleep 10
npm run db:migrate
npm run db:seed
```

### Migration Problems

#### Problem: "Migration file conflicts"
```bash
# Check migration status
npx prisma migrate status

# Resolve conflicts
npx prisma migrate resolve --rolled-back "migration_name"

# Reset migrations (development only)
npx prisma migrate reset --force

# Create new migration
npx prisma migrate dev --name fix_conflict
```

#### Problem: "Database out of sync"
```bash
# Push schema changes
npx prisma db push --skip-generate

# Generate client
npx prisma generate

# Seed data
npm run db:seed
```

## CI/CD Pipeline Issues

### GitHub Actions Failures

#### Problem: Tests failing in CI
```bash
# Check test output in GitHub Actions
# Navigate to Actions tab -> Failed workflow -> View logs

# Run tests locally with same environment
NODE_ENV=test npm run test

# Check for environment differences
./scripts/validate-env.sh development

# Fix common issues:
# 1. Update test environment variables
# 2. Ensure test database is clean
# 3. Check for port conflicts
```

#### Problem: Docker build fails in CI
```bash
# Check Dockerfile syntax
docker build --no-cache -f backend/Dockerfile ./backend

# Verify all files exist
ls -la backend/

# Check for case sensitivity issues (Linux vs macOS)
find . -name "*.ts" -o -name "*.js" | xargs grep -l "import.*[A-Z]"

# Test multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -f backend/Dockerfile ./backend
```

### Deployment Failures

#### Problem: Railway deployment fails
```bash
# Check Railway status
railway status --environment staging

# View deployment logs
railway logs --environment staging

# Redeploy manually
railway up --service backend --environment staging

# Check environment variables
railway variables --environment staging
```

#### Problem: Health checks failing
```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Check if all services are ready
curl http://localhost:3000/api/health/database
curl http://localhost:3000/api/health/redis

# Increase health check timeout in deployment
# GitHub Actions: increase sleep time
# Railway: adjust health check settings
```

## Deployment Problems

### Environment Issues

#### Problem: Environment variables not set
```bash
# Check Railway environment variables
railway variables --environment production

# Validate against template
./scripts/validate-env.sh production

# Set missing variables
railway variables set JWT_SECRET=your_secret_here --environment production
```

#### Problem: Database migration fails
```bash
# Check migration status
railway run --environment production "npx prisma migrate status"

# View database logs
railway logs --service postgresql --environment production

# Run migration manually
railway run --environment production "npx prisma migrate deploy"
```

### Performance Issues

#### Problem: Slow response times
```bash
# Check server metrics
# New Relic dashboard
# Railway metrics

# Analyze database queries
# Enable query logging
LOG_LEVEL=debug railway logs --service backend

# Check Redis connection
railway run --environment production "redis-cli ping"

# Scale services if needed
railway scale --service backend --replicas 2 --environment production
```

#### Problem: Memory issues
```bash
# Check memory usage
railway metrics --service backend --environment production

# Analyze memory leaks
# Check Node.js heap usage in logs

# Restart service
railway restart --service backend --environment production

# Upgrade service plan if needed
```

## Performance Issues

### High Response Times

#### Problem: API responses > 500ms
```bash
# Check database query performance
# Enable slow query logging in PostgreSQL

# Analyze Redis cache hit rate
redis-cli info stats | grep keyspace

# Profile Node.js application
# Use clinic.js or 0x for profiling

# Check network latency to Argentina
ping api.barberpro.com.ar
```

#### Problem: Database bottlenecks
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Analyze slow queries
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# Optimize connection pooling
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Add database indexes
# Check Prisma schema for missing indexes
```

### Memory Leaks

#### Problem: Increasing memory usage
```bash
# Monitor memory with clinic.js
npm install -g clinic
clinic doctor -- node backend/dist/server.js

# Check for unclosed connections
# Database connections
# Redis connections
# HTTP connections

# Profile with heapdump
npm install heapdump
# Add to code: heapdump.writeSnapshot()
```

## Argentina-Specific Issues

### Timezone Problems

#### Problem: Incorrect timestamps
```bash
# Check server timezone
date
timedatectl status  # Linux

# Set correct timezone in environment
TZ=America/Argentina/Buenos_Aires node backend/dist/server.js

# Verify in database
SELECT now(), timezone('America/Argentina/Buenos_Aires', now());
```

### Payment Integration

#### Problem: MercadoPago API failures
```bash
# Check API credentials
curl -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
  https://api.mercadopago.com/users/me

# Verify sandbox mode
echo $MERCADOPAGO_SANDBOX  # Should be 'true' for staging

# Test webhook endpoint
curl -X POST https://staging-api.barberpro.com.ar/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type": "payment", "data": {"id": "test"}}'
```

### Localization Issues

#### Problem: Spanish text not displaying
```bash
# Check locale setting
echo $LOCALE  # Should be 'es-AR'

# Verify font support
# Check browser console for font loading errors

# Test character encoding
curl -H "Accept-Language: es-AR" http://localhost:5173/

# Check translation files
ls -la frontend/src/lib/i18n/
```

## Emergency Procedures

### Service Down

#### Immediate Response
```bash
# 1. Check service status
railway status --environment production

# 2. Quick restart
railway restart --service backend --environment production

# 3. Scale up if needed
railway scale --service backend --replicas 2 --environment production

# 4. Check health
curl https://api.barberpro.com.ar/api/health

# 5. Notify team via Slack
# Automatic notification should be sent
```

### Database Emergency

#### Critical Data Loss Prevention
```bash
# 1. Stop write operations
railway variables set READ_ONLY_MODE=true --environment production

# 2. Create immediate backup
./scripts/backup-database.sh production emergency

# 3. Assess damage
railway run --environment production "psql $DATABASE_URL -c 'SELECT count(*) FROM users;'"

# 4. Restore from backup if needed
./scripts/restore-database.sh production latest

# 5. Resume operations
railway variables unset READ_ONLY_MODE --environment production
```

### Security Incident

#### Immediate Response
```bash
# 1. Rotate JWT secrets
railway variables set JWT_SECRET=new_secret_here --environment production

# 2. Check access logs
railway logs --service backend --environment production | grep ERROR

# 3. Block suspicious IPs (if needed)
# Update rate limiting or firewall rules

# 4. Force user logouts
# Clear Redis sessions
railway run --environment production "redis-cli FLUSHALL"

# 5. Notify security team
# Follow security incident response plan
```

## Getting Help

### Internal Resources
- **Slack**: #barberpro-dev for general issues
- **Slack**: #barberpro-critical for emergency issues
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: `/docs` folder for detailed guides

### External Resources
- **Railway Support**: https://railway.app/help
- **Docker Documentation**: https://docs.docker.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Node.js Debugging**: https://nodejs.org/en/docs/guides/debugging-getting-started/

### Emergency Contacts
- **DevOps Lead**: Available via Slack DM
- **Tech Lead**: Available via Slack DM
- **On-Call Engineer**: Check #barberpro-oncall channel

---

**Last Updated**: September 10, 2025  
**Maintained by**: BarberPro DevOps Team  
**Emergency Contact**: #barberpro-critical