# Docker Troubleshooting Guide

Comprehensive troubleshooting guide for the BarberPro Docker development environment.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Connection Issues](#connection-issues)
3. [CORS Errors](#cors-errors)
4. [Database Problems](#database-problems)
5. [Redis Issues](#redis-issues)
6. [Mock Service Problems](#mock-service-problems)
7. [Webhook Delivery Issues](#webhook-delivery-issues)
8. [Network Problems](#network-problems)
9. [Performance Issues](#performance-issues)
10. [Container Health Issues](#container-health-issues)
11. [Port Conflicts](#port-conflicts)
12. [Volume and Data Issues](#volume-and-data-issues)
13. [Environment Variable Problems](#environment-variable-problems)
14. [Build Failures](#build-failures)
15. [Advanced Debugging](#advanced-debugging)

---

## Quick Diagnostics

Run these commands first to get an overview of the system state:

```bash
# Check all services status
make status
# OR: docker-compose ps

# View recent logs (all services)
make logs

# Check Docker daemon
docker info

# Check available resources
docker system df

# Check network configuration
docker network ls
docker network inspect barberpro-network
```

### Health Check Script

```bash
#!/bin/bash
# Quick health check for BarberPro development environment

echo "🔍 BarberPro Health Check"
echo "========================="

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Check services
echo ""
echo "📦 Service Status:"
docker-compose ps

# Check network
echo ""
echo "🌐 Network Status:"
docker network inspect barberpro-network > /dev/null 2>&1 && echo "✅ Network exists" || echo "❌ Network missing"

# Check endpoints
echo ""
echo "🔗 Endpoint Health:"
curl -s http://localhost:3000/health > /dev/null && echo "✅ Backend: http://localhost:3000" || echo "❌ Backend unreachable"
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend: http://localhost:5173" || echo "❌ Frontend unreachable"
curl -s http://localhost:8080 > /dev/null && echo "✅ pgAdmin: http://localhost:8080" || echo "❌ pgAdmin unreachable"
curl -s http://localhost:8081 > /dev/null && echo "✅ Redis Commander: http://localhost:8081" || echo "❌ Redis Commander unreachable"
curl -s http://localhost:8025 > /dev/null && echo "✅ MailHog: http://localhost:8025" || echo "❌ MailHog unreachable"

echo ""
echo "✅ Health check complete"
```

Save as `scripts/health-check.sh` and run:

```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

---

## Connection Issues

### Problem: "Connection Refused" Errors

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: getaddrinfo ENOTFOUND localhost
```

**Cause:** Using `localhost` instead of Docker service names in container-to-container communication.

**Solution:**

1. **Check your DATABASE_URL:**
   ```bash
   # ✅ CORRECT (inside Docker)
   DATABASE_URL=postgresql://barberpro:password@postgres:5432/barberpro_dev

   # ❌ WRONG (inside Docker)
   DATABASE_URL=postgresql://barberpro:password@localhost:5432/barberpro_dev
   ```

2. **Verify service names in .env:**
   ```bash
   grep -E "(postgres|redis|backend|frontend)" .env

   # Should see service names, not localhost
   ```

3. **Test connectivity between containers:**
   ```bash
   # From backend to postgres
   docker-compose exec backend ping postgres

   # From backend to redis
   docker-compose exec backend ping redis

   # From mock to backend
   docker-compose exec mercadopago-mock ping backend
   ```

4. **Check if services are in same network:**
   ```bash
   docker network inspect barberpro-network

   # All containers should appear in "Containers" section
   ```

**Prevention:**
- Always use Docker service names in `.env.development`
- Use `localhost` only for browser/host access (VITE_ variables)
- Review [environment-setup.md](./environment-setup.md#docker-network-configuration)

---

### Problem: "Cannot connect to backend from frontend"

**Symptoms:**
- Browser shows network errors
- API calls timeout
- Console shows `net::ERR_CONNECTION_REFUSED`

**Cause:** Frontend (browser) trying to use Docker service names instead of localhost.

**Solution:**

1. **Check frontend environment variables:**
   ```bash
   # ✅ CORRECT (browser accesses via localhost)
   VITE_API_URL=http://localhost:3000
   PUBLIC_API_URL=http://localhost:3000/api

   # ❌ WRONG (browser can't resolve Docker service names)
   VITE_API_URL=http://backend:3000
   ```

2. **Verify backend is accessible from host:**
   ```bash
   curl http://localhost:3000/health

   # Should return: {"status":"ok",...}
   ```

3. **Check backend logs for errors:**
   ```bash
   make logs-backend
   # OR: docker-compose logs -f backend
   ```

4. **Restart frontend with clean cache:**
   ```bash
   docker-compose down frontend
   docker-compose up -d frontend
   ```

---

## CORS Errors

### Problem: CORS Policy Blocking Requests

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**Cause:** Backend CORS configuration doesn't allow frontend origin.

**Solution:**

1. **Check CORS configuration in .env:**
   ```bash
   # Must include both localhost AND Docker service names
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://frontend:5173,http://backend:3000
   ```

2. **Add container IP ranges (if needed):**
   ```bash
   # Find frontend container IP
   docker inspect barberpro-frontend | grep '"IPAddress"'
   # Example output: "IPAddress": "172.18.0.5"

   # Add to CORS_ORIGIN
   CORS_ORIGIN=http://localhost:5173,http://172.18.0.0/16
   ```

3. **Verify CORS credentials:**
   ```bash
   CORS_CREDENTIALS=true
   ```

4. **Check backend CORS middleware (if custom):**
   ```typescript
   // backend/src/middleware/cors.ts
   const corsOptions = {
     origin: process.env.CORS_ORIGIN?.split(',') || '*',
     credentials: true,
     methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
   };
   ```

5. **Restart backend to apply changes:**
   ```bash
   docker-compose restart backend
   ```

**Advanced CORS Debugging:**

```bash
# Test CORS headers with curl
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/bookings \
     -v

# Should see these headers in response:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, ...
```

---

## Database Problems

### Problem: Database Connection Pool Exhausted

**Symptoms:**
```
Error: Connection pool exhausted
Error: Too many clients already
```

**Solution:**

1. **Check connection pool settings:**
   ```bash
   # In .env
   DATABASE_URL=postgresql://barberpro:password@postgres:5432/barberpro_dev?connection_limit=20
   ```

2. **Check current connections:**
   ```bash
   docker-compose exec postgres psql -U barberpro -d barberpro_dev -c \
     "SELECT count(*) FROM pg_stat_activity WHERE datname = 'barberpro_dev';"
   ```

3. **Restart backend to release connections:**
   ```bash
   docker-compose restart backend
   ```

4. **Increase connection limit (if needed):**
   ```bash
   # In docker-compose.yml or .env
   POSTGRES_MAX_CONNECTIONS=100
   ```

---

### Problem: Database Migrations Fail

**Symptoms:**
```
Error: Migration failed
Error: relation "users" already exists
```

**Solution:**

1. **Check migration status:**
   ```bash
   docker-compose exec backend npm run db:migrate:status
   # OR: make db-status
   ```

2. **Reset database (development only):**
   ```bash
   make db-reset

   # OR manually:
   docker-compose exec backend npm run db:reset
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run db:seed
   ```

3. **Check migration logs:**
   ```bash
   docker-compose logs backend | grep -i migration
   ```

4. **Manually rollback and re-run:**
   ```bash
   docker-compose exec backend npm run db:migrate:rollback
   docker-compose exec backend npm run db:migrate
   ```

---

### Problem: Cannot Connect to Database

**Symptoms:**
```
Error: password authentication failed for user "barberpro"
Error: database "barberpro_dev" does not exist
```

**Solution:**

1. **Verify database credentials:**
   ```bash
   grep -E "(POSTGRES_|DATABASE_URL)" .env

   # Ensure credentials match in DATABASE_URL and POSTGRES_ variables
   ```

2. **Check if database exists:**
   ```bash
   docker-compose exec postgres psql -U barberpro -d postgres -c "\l"

   # Should list barberpro_dev database
   ```

3. **Create database manually if missing:**
   ```bash
   docker-compose exec postgres psql -U barberpro -d postgres -c \
     "CREATE DATABASE barberpro_dev;"
   ```

4. **Check postgres is healthy:**
   ```bash
   docker-compose ps postgres

   # Status should show "Up (healthy)"
   ```

5. **Check postgres logs:**
   ```bash
   docker-compose logs postgres | tail -50
   ```

6. **Recreate database container (if corrupted):**
   ```bash
   docker-compose down postgres
   docker volume rm barberpro-postgres-data
   docker-compose up -d postgres

   # Wait for healthy status, then run migrations
   make db-migrate
   make db-seed
   ```

---

## Redis Issues

### Problem: Redis Connection Failed

**Symptoms:**
```
Error: Redis connection to redis:6379 failed
Error: ECONNREFUSED redis:6379
```

**Solution:**

1. **Check Redis is running:**
   ```bash
   docker-compose ps redis

   # Should show "Up (healthy)"
   ```

2. **Test Redis connection:**
   ```bash
   docker-compose exec redis redis-cli ping

   # Should return: PONG
   ```

3. **Check Redis URL:**
   ```bash
   grep REDIS_URL .env

   # Should be: redis://redis:6379
   ```

4. **Check backend can reach Redis:**
   ```bash
   docker-compose exec backend ping redis
   ```

5. **Restart Redis:**
   ```bash
   docker-compose restart redis
   ```

6. **Check Redis logs:**
   ```bash
   docker-compose logs redis
   ```

---

### Problem: Redis Memory Issues

**Symptoms:**
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**

1. **Check Redis memory usage:**
   ```bash
   docker-compose exec redis redis-cli INFO memory
   ```

2. **Clear Redis cache:**
   ```bash
   docker-compose exec redis redis-cli FLUSHDB
   ```

3. **Increase memory limit:**
   ```bash
   # Edit docker/configs/redis.conf
   maxmemory 512mb  # Increase from 256mb

   # Restart Redis
   docker-compose restart redis
   ```

---

## Mock Service Problems

### Problem: Mock Service Not Responding

**Symptoms:**
- Mock service health check fails
- Requests to mock services timeout
- Payment/AFIP/SMS flows don't work

**Solution:**

1. **Check mock services are running:**
   ```bash
   docker-compose ps | grep mock

   # Should show:
   # mercadopago-mock
   # afip-mock
   # whatsapp-mock
   # sms-mock
   ```

2. **Test mock service health:**
   ```bash
   curl http://localhost:3001/health  # MercadoPago
   curl http://localhost:3002/health  # AFIP
   curl http://localhost:3003/health  # WhatsApp
   curl http://localhost:3004/health  # SMS
   ```

3. **Check mock service logs:**
   ```bash
   docker-compose logs mercadopago-mock
   docker-compose logs afip-mock
   docker-compose logs whatsapp-mock
   docker-compose logs sms-mock
   ```

4. **Restart mock services:**
   ```bash
   make mocks-restart

   # OR manually:
   docker-compose -f docker/docker-compose.mocks.yml restart
   ```

5. **Verify mock service URLs in .env:**
   ```bash
   grep -E "MOCK_URL|_BASE_URL" .env

   # Should use service names:
   # MERCADOPAGO_BASE_URL=http://mercadopago-mock:3001
   # AFIP_BASE_URL=http://afip-mock:3002
   # ...
   ```

---

## Webhook Delivery Issues

### Problem: Webhooks Not Received

**Symptoms:**
- Payment confirmations don't arrive
- Webhook callback timeouts
- Mock services can't reach backend

**Cause:** Webhook URLs using `localhost` instead of `backend` service name.

**Solution:**

1. **Verify webhook URLs use service names:**
   ```bash
   grep WEBHOOK_URL .env

   # ✅ CORRECT
   MERCADOPAGO_WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago
   WHATSAPP_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp
   SMS_WEBHOOK_URL=http://backend:3000/api/webhooks/sms

   # ❌ WRONG
   MERCADOPAGO_WEBHOOK_URL=http://localhost:3000/api/webhooks/mercadopago
   ```

2. **Test webhook connectivity from mock:**
   ```bash
   # From MercadoPago mock to backend
   docker-compose exec mercadopago-mock curl http://backend:3000/health

   # Should return backend health response
   ```

3. **Check backend webhook endpoints:**
   ```bash
   docker-compose logs backend | grep webhook
   ```

4. **Manually trigger webhook (testing):**
   ```bash
   # From inside mock container
   docker-compose exec mercadopago-mock curl -X POST \
     http://backend:3000/api/webhooks/mercadopago \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"123"}}'
   ```

5. **Check webhook route registration:**
   ```bash
   # Backend should log webhook routes on startup
   docker-compose logs backend | grep -i "webhook.*registered"
   ```

---

## Network Problems

### Problem: Containers Can't Communicate

**Symptoms:**
- Services timeout when calling each other
- DNS resolution fails for service names
- `ping: bad address 'postgres'`

**Solution:**

1. **Verify all containers are on same network:**
   ```bash
   docker network inspect barberpro-network

   # All containers should be listed under "Containers"
   ```

2. **Check network configuration:**
   ```bash
   # In docker-compose.yml, all services should have:
   networks:
     - barberpro-network
   ```

3. **Recreate network:**
   ```bash
   docker-compose down
   docker network rm barberpro-network
   docker network create barberpro-network
   docker-compose up -d
   ```

4. **Test DNS resolution:**
   ```bash
   docker-compose exec backend nslookup postgres
   docker-compose exec backend nslookup redis
   docker-compose exec backend nslookup mercadopago-mock
   ```

5. **Check firewall/security software:**
   ```bash
   # Ensure Docker network isn't blocked by firewall
   # Linux: check iptables
   sudo iptables -L | grep -i docker

   # macOS: check Security & Privacy settings
   ```

---

### Problem: Port Conflicts

**Symptoms:**
```
Error: bind: address already in use
Error: port is already allocated
```

**Solution:**

1. **Find what's using the port:**
   ```bash
   # Linux/macOS
   lsof -i :3000
   lsof -i :5173
   lsof -i :5432
   lsof -i :6379

   # Windows
   netstat -ano | findstr :3000
   ```

2. **Kill conflicting process:**
   ```bash
   # Kill by PID
   kill -9 <PID>

   # OR stop the service
   sudo systemctl stop postgresql  # If local postgres is running
   sudo systemctl stop redis-server  # If local redis is running
   ```

3. **Change ports in .env.local:**
   ```bash
   # Use different ports
   BACKEND_PORT=3001
   FRONTEND_PORT=5174
   POSTGRES_PORT=5433
   REDIS_PORT=6380
   ```

4. **Verify ports are free:**
   ```bash
   # Check if port is available
   nc -zv localhost 3000

   # If connection refused = port is free
   ```

---

## Performance Issues

### Problem: Slow Container Startup

**Symptoms:**
- Containers take 2-5+ minutes to start
- Health checks timeout
- Services never become healthy

**Solution:**

1. **Check resource allocation:**
   ```bash
   # Ensure Docker has enough resources
   docker info | grep -E "CPUs|Memory"

   # Recommended minimums:
   # CPUs: 4
   # Memory: 8GB
   ```

2. **Increase Docker resources (Docker Desktop):**
   - Settings → Resources
   - Increase CPU limit to 4+
   - Increase Memory to 8GB+
   - Increase Swap to 2GB+

3. **Adjust health check intervals:**
   ```yaml
   # In docker-compose.dev.yml
   healthcheck:
     interval: 30s  # Increase from 10s
     retries: 10    # Increase from 5
     start_period: 120s  # Increase from 60s
   ```

4. **Check disk I/O:**
   ```bash
   # macOS/Linux
   iostat -x 1

   # If disk usage is high, optimize volumes
   ```

5. **Use BuildKit for faster builds:**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

---

### Problem: High CPU/Memory Usage

**Symptoms:**
- Computer slows down
- Docker consumes 100% CPU
- Containers use excessive memory

**Solution:**

1. **Check container resource usage:**
   ```bash
   docker stats

   # Shows CPU%, MEM USAGE, NET I/O for each container
   ```

2. **Set resource limits:**
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

3. **Optimize backend:**
   ```bash
   # Reduce log verbosity
   LOG_LEVEL=warn  # Instead of debug

   # Disable source maps in development
   GENERATE_SOURCEMAP=false
   ```

4. **Clean up unused resources:**
   ```bash
   # Remove unused images
   docker image prune -a

   # Remove unused volumes
   docker volume prune

   # Clean up system
   docker system prune -a --volumes
   ```

---

## Container Health Issues

### Problem: Container Stuck in "Unhealthy" State

**Symptoms:**
```
docker-compose ps
# Shows: (unhealthy) for some services
```

**Solution:**

1. **Check health check logs:**
   ```bash
   docker inspect --format='{{json .State.Health}}' barberpro-postgres | jq
   ```

2. **Manually run health check command:**
   ```bash
   # For postgres
   docker-compose exec postgres pg_isready -U barberpro -d barberpro_dev

   # For redis
   docker-compose exec redis redis-cli ping

   # For backend
   docker-compose exec backend curl -f http://localhost:3000/health
   ```

3. **Increase health check timeout:**
   ```yaml
   healthcheck:
     timeout: 10s  # Increase from 5s
     retries: 10   # Increase from 5
   ```

4. **Check container logs:**
   ```bash
   docker-compose logs <service-name>
   ```

5. **Restart unhealthy container:**
   ```bash
   docker-compose restart <service-name>
   ```

---

### Problem: Container Exits Immediately

**Symptoms:**
- Container starts then immediately exits
- `docker-compose ps` shows "Exit 1" or "Exit 137"

**Solution:**

1. **Check exit code meaning:**
   - Exit 0: Normal exit
   - Exit 1: Application error
   - Exit 137: Out of memory (killed by system)
   - Exit 139: Segmentation fault

2. **Check container logs:**
   ```bash
   docker-compose logs <service-name>
   ```

3. **Run container in foreground:**
   ```bash
   docker-compose run --rm <service-name>
   ```

4. **Check for missing dependencies:**
   ```bash
   # Backend
   docker-compose exec backend npm list

   # Frontend
   docker-compose exec frontend npm list
   ```

5. **Increase memory limit (if Exit 137):**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G  # Increase from 1G
   ```

---

## Volume and Data Issues

### Problem: Database Data Lost After Restart

**Symptoms:**
- Need to run migrations again after restart
- All data is gone after `docker-compose down`

**Cause:** Volumes not persisted or were removed.

**Solution:**

1. **Check volumes exist:**
   ```bash
   docker volume ls | grep barberpro

   # Should show:
   # barberpro-postgres-data
   # barberpro-redis-data
   ```

2. **Never use `-v` flag unless intentional:**
   ```bash
   # ❌ WRONG - Deletes volumes!
   docker-compose down -v

   # ✅ CORRECT - Keeps volumes
   docker-compose down
   ```

3. **Backup data before cleanup:**
   ```bash
   # Backup database
   make db-backup

   # OR manually:
   docker-compose exec postgres pg_dump -U barberpro barberpro_dev > backup.sql
   ```

4. **Restore from backup:**
   ```bash
   # Restore database
   docker-compose exec -T postgres psql -U barberpro barberpro_dev < backup.sql
   ```

---

### Problem: "No space left on device"

**Symptoms:**
```
Error: no space left on device
Error: failed to copy files
```

**Solution:**

1. **Check Docker disk usage:**
   ```bash
   docker system df
   ```

2. **Clean up unused resources:**
   ```bash
   # Remove stopped containers
   docker container prune

   # Remove unused images
   docker image prune -a

   # Remove unused volumes (CAREFUL!)
   docker volume prune

   # Clean everything (CAREFUL!)
   docker system prune -a --volumes
   ```

3. **Increase Docker disk space:**
   - Docker Desktop → Settings → Resources → Disk image size
   - Increase from 64GB to 128GB+

---

## Environment Variable Problems

### Problem: Environment Variables Not Loaded

**Symptoms:**
- Application uses default values
- Variables defined in .env are ignored

**Solution:**

1. **Verify .env file exists:**
   ```bash
   ls -la .env

   # Should exist and not be .env.example
   ```

2. **Check .env is in correct location:**
   ```bash
   # Should be in project root, not in docker/
   /home/lorenzo/projects/service-booking/.env  ✅
   /home/lorenzo/projects/service-booking/docker/.env  ❌
   ```

3. **Verify env_file in docker-compose:**
   ```yaml
   # docker-compose.dev.yml
   services:
     backend:
       env_file:
         - ../.env  # Correct path to .env
   ```

4. **Check environment variable syntax:**
   ```bash
   # ✅ CORRECT
   DATABASE_URL=postgresql://...

   # ❌ WRONG (spaces around =)
   DATABASE_URL = postgresql://...

   # ❌ WRONG (quotes on multi-line)
   DATABASE_URL="postgresql://...
   ```

5. **Verify variables inside container:**
   ```bash
   docker-compose exec backend env | grep DATABASE_URL
   ```

6. **Restart services to reload .env:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Build Failures

### Problem: Docker Build Fails

**Symptoms:**
```
Error: failed to solve with frontend dockerfile.v0
Error: unable to prepare context
```

**Solution:**

1. **Check Dockerfile syntax:**
   ```bash
   docker build -f backend/Dockerfile backend/ --check
   ```

2. **Clear build cache:**
   ```bash
   docker builder prune -a
   ```

3. **Build with no cache:**
   ```bash
   docker-compose build --no-cache
   ```

4. **Check Docker version:**
   ```bash
   docker --version
   # Should be 20.10+
   ```

5. **Enable BuildKit:**
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

---

## Advanced Debugging

### Debug Container Network

```bash
# Install network tools in container
docker-compose exec backend sh -c "apt-get update && apt-get install -y dnsutils iputils-ping curl"

# Test DNS resolution
docker-compose exec backend nslookup postgres
docker-compose exec backend nslookup redis

# Test connectivity
docker-compose exec backend ping -c 3 postgres
docker-compose exec backend ping -c 3 redis

# Test ports
docker-compose exec backend nc -zv postgres 5432
docker-compose exec backend nc -zv redis 6379

# Check routing
docker-compose exec backend route -n
docker-compose exec backend ip addr
```

### Debug with Shell Access

```bash
# Access container shell
docker-compose exec backend sh
docker-compose exec postgres sh

# Check environment variables
env | sort

# Check running processes
ps aux

# Check listening ports
netstat -tlnp

# Check logs
tail -f /var/log/app.log
```

### Capture Network Traffic

```bash
# Install tcpdump
docker-compose exec backend sh -c "apt-get update && apt-get install -y tcpdump"

# Capture traffic to postgres
docker-compose exec backend tcpdump -i eth0 -w /tmp/capture.pcap host postgres

# Download and analyze with Wireshark
docker cp barberpro-backend:/tmp/capture.pcap ./capture.pcap
```

### Enable Debug Logging

```bash
# In .env.local
LOG_LEVEL=debug
DEBUG=*

# For specific modules (if using debug package)
DEBUG=express:*,fastify:*,prisma:*

# Restart services
docker-compose restart backend frontend
```

---

## Getting Help

If you've tried everything and still have issues:

1. **Gather diagnostic information:**
   ```bash
   # System info
   docker info > docker-info.txt
   docker version >> docker-info.txt

   # Service status
   docker-compose ps > service-status.txt

   # Logs
   docker-compose logs > all-logs.txt
   docker-compose logs backend > backend-logs.txt
   docker-compose logs postgres > postgres-logs.txt

   # Network
   docker network inspect barberpro-network > network-info.txt

   # Environment
   cat .env > env-config.txt  # Remove secrets before sharing!
   ```

2. **Check existing issues:**
   - GitHub Issues: [service-booking/issues](https://github.com/lorenzotomasdiez/service-booking/issues)
   - Search for similar problems

3. **Create detailed bug report:**
   - Describe the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Include diagnostic files (remove secrets!)
   - Docker version, OS version

4. **Ask for help:**
   - Create GitHub issue with template
   - Include error messages
   - Attach diagnostic files

---

## Additional Resources

- [Environment Setup Guide](./environment-setup.md) - Initial setup instructions
- [Environment Variables Reference](./environment-variables.md) - Complete variable documentation
- [Docker README](../docker/README.md) - Docker architecture overview
- [Docker Documentation](https://docs.docker.com/) - Official Docker docs
- [Docker Compose Documentation](https://docs.docker.com/compose/) - Compose reference

---

## Summary

### Most Common Issues and Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Connection refused | Use service names (postgres, redis) not localhost |
| CORS errors | Add container IPs to CORS_ORIGIN |
| Webhooks fail | Use `http://backend:3000/...` for webhook URLs |
| Frontend can't connect | Use `http://localhost:3000` in VITE_ variables |
| Port conflicts | Change ports in .env.local or stop conflicting services |
| Out of memory | Increase Docker memory limit |
| Build fails | Clear cache: `docker builder prune -a` |
| Env vars ignored | Restart services: `docker-compose down && docker-compose up -d` |

### Quick Commands Reference

```bash
# View all logs
make logs

# View specific service logs
make logs-backend
make logs-frontend

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Clean restart
docker-compose down
docker-compose up -d

# Full reset (CAREFUL - deletes data!)
docker-compose down -v
docker-compose up -d
make db-migrate
make db-seed

# Health check
./scripts/health-check.sh
```

---

**Pro Tip:** Keep a `docker-compose.override.yml` file (gitignored) for personal debugging configurations:

```yaml
# docker-compose.override.yml
services:
  backend:
    environment:
      LOG_LEVEL: debug
      DEBUG: '*'
    ports:
      - "9229:9229"  # Node.js debugger
```

This file is automatically loaded by docker-compose and won't affect other developers.
