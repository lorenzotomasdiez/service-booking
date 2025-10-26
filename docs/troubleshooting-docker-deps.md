# Troubleshooting: Docker Dependency Issues

## Problem: esbuild Version Mismatch Error

### Symptoms
Backend container fails to start with error:
```
✘ [ERROR] Cannot start service: Host version "0.25.9" does not match binary version "0.25.11"
Error: The service was stopped
```

Frontend shows:
```
POST http://localhost:3000/api/auth/oauth/google/initiate net::ERR_EMPTY_RESPONSE
```

### Root Cause

This recurring issue has **three underlying causes**:

#### 1. Volume Mount Conflict (Primary Issue)
```yaml
volumes:
  - ../backend:/app          # ← Mounts HOST directory over container
  - /app/node_modules        # ← Anonymous volume (doesn't persist correctly!)
```

**Problem**: Anonymous volumes (`/app/node_modules`) create new empty volumes on each container recreation. Docker may use the host's `node_modules` instead due to mount priority. When you run `npm install` locally (macOS/ARM), it installs ARM-compatible binaries. The container (Linux x64/ARM) tries to use these, causing version mismatches.

#### 2. Missing package-lock.json
Without lock files, every `npm install` can install slightly different versions of nested dependencies (like esbuild, which tsx depends on).

#### 3. Dockerfile Copies Host node_modules
```dockerfile
COPY . .  # ← Copies EVERYTHING including node_modules if it exists
```

This bakes host binaries into the container image.

## Solution

### Quick Fix (1 command)
```bash
npm run fix:docker
```

This automated script:
1. Stops all containers
2. Removes old node_modules volumes
3. Generates package-lock.json files
4. Rebuilds containers with `--no-cache`
5. Restarts all services

### Manual Fix (if needed)
```bash
# 1. Stop containers
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down

# 2. Remove node_modules volumes
docker volume rm barberpro-backend-node-modules-dev
docker volume rm barberpro-frontend-node-modules-dev

# 3. Rebuild containers
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml build --no-cache

# 4. Start services
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

## Permanent Prevention

The following fixes have been implemented to prevent this issue:

### 1. Named Volumes for node_modules
**Changed**: `docker/docker-compose.dev.yml`
```yaml
volumes:
  - ../backend:/app
  - backend-node-modules:/app/node_modules  # ← Named volume (persists)
```

**Benefit**: Named volumes persist across container recreations and are isolated from the host.

### 2. .dockerignore Files
**Added**: `backend/.dockerignore` and `frontend/.dockerignore`
```
node_modules/
dist/
.tsx-cache/
```

**Benefit**: Prevents `COPY . .` from copying host node_modules into the image.

### 3. Automated Fix Script
**Added**: `scripts/fix-docker-deps.sh` and `npm run fix:docker`

**Benefit**: One-command fix for when issues occur.

## Best Practices

### ✅ DO
- Always use `npm run fix:docker` if you see esbuild errors
- Run `npm start` (which uses Docker) for development
- Let Docker manage all dependencies inside containers
- Use the fix script after pulling changes that update dependencies

### ❌ DON'T
- Never run `npm install` in `backend/` or `frontend/` directories on the host when using Docker
- Don't delete `package-lock.json` files (they ensure reproducible builds)
- Don't mix local and Docker development workflows

## Understanding the Fix

### Before (Anonymous Volume)
```yaml
volumes:
  - /app/node_modules  # Anonymous - new volume each recreation
```

**Result**: Docker creates `f8a3b2c1d4e5` (random ID), which may or may not persist. Host mounts can override it.

### After (Named Volume)
```yaml
volumes:
  - backend-node-modules:/app/node_modules  # Named - persistent
```

**Result**: Docker uses `barberpro-backend-node-modules-dev`, which persists across recreations and is isolated from the host.

## Verification

After running the fix, verify:

```bash
# 1. Check containers are healthy
docker ps

# 2. Check backend logs (no esbuild errors)
docker logs barberpro-backend-dev --tail 50

# 3. Test backend endpoint
curl http://localhost:3000/api/health

# 4. Check named volumes exist
docker volume ls | grep barberpro
```

Expected output:
```
barberpro-backend-node-modules-dev
barberpro-frontend-node-modules-dev
```

## Related Issues

This fix also resolves:
- "Module not found" errors after dependency updates
- "ENOENT: no such file or directory" errors in tsx
- Platform-specific binary incompatibilities (ARM vs x64)
- Stale dependency caches causing build failures

## Performance Note

Named volumes are slightly slower than bind mounts for large node_modules directories, but the trade-off for stability is worth it. The performance difference is negligible with modern SSDs.

## Additional Resources

- Docker Volumes Documentation: https://docs.docker.com/storage/volumes/
- tsx GitHub Issues: https://github.com/privatenumber/tsx/issues
- esbuild Platform Issues: https://esbuild.github.io/api/#platform
