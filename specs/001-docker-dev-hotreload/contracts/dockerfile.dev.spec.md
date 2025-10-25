# Contract: Dockerfile.dev Specification

**Feature**: 001-docker-dev-hotreload
**Contract Type**: Development Docker Image
**Version**: 1.0.0
**Date**: 2025-10-25

## Purpose

This contract defines the requirements and structure for development Dockerfiles (`Dockerfile.dev`) used in the BarberPro project. These files MUST create optimized development containers with hot reload capabilities while maintaining consistency across backend and frontend services.

---

## Mandatory Sections

Every `Dockerfile.dev` MUST contain these sections in order:

### 1. Base Stage

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
```

**Requirements**:
- MUST use Node.js 20 alpine variant for minimal size
- MUST set working directory to `/app`
- MUST copy package files before source code (layer caching optimization)
- MUST be named `base` for multi-stage reference

### 2. Development Stage

```dockerfile
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE <PORT>
CMD [<COMMAND>]
```

**Requirements**:
- MUST inherit from `base` stage
- MUST set `NODE_ENV=development` to install devDependencies
- MUST run `npm install` (not `npm ci`) to respect package-lock.json with updates
- MUST copy all source code (`COPY . .`)
- MUST expose service port (3000 for backend, 5173 for frontend)
- MUST specify appropriate CMD for hot reload

### 3. Production Stage (Optional but Recommended)

```dockerfile
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --only=production
COPY src ./src
RUN npm run build
EXPOSE <PORT>
CMD ["node", "dist/server.js"]
```

**Purpose**: Allows same Dockerfile to build production images

---

## Backend Dockerfile.dev Contract

### Location
`backend/Dockerfile.dev`

### Specific Requirements

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install

# Copy Prisma schema for migrations
COPY prisma ./prisma

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose API port
EXPOSE 3000

# Use tsx for hot reload
CMD ["npx", "tsx", "watch", "--clear-screen=false", "src/server.ts"]
```

### Validation Criteria

- ✅ Prisma schema copied before source code
- ✅ Prisma client generated during build
- ✅ tsx watch mode enabled with `--clear-screen=false` flag
- ✅ Port 3000 exposed
- ✅ Entry point is `src/server.ts`

### Health Check Integration

Backend container MUST provide:
- HTTP endpoint `/api/health` returning 200 OK
- Endpoint MUST respond within 5 seconds
- Endpoint MUST verify database and Redis connectivity

---

## Frontend Dockerfile.dev Contract

### Location
`frontend/Dockerfile.dev`

### Specific Requirements

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Use Vite dev server with network host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### Validation Criteria

- ✅ Vite dev server started with `--host 0.0.0.0` for Docker access
- ✅ Port 5173 exposed
- ✅ HMR (Hot Module Replacement) enabled by default
- ✅ No build step in development (Vite handles compilation)

### Vite Configuration

Frontend MUST have `vite.config.ts` configured:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 5173,
    strictPort: true, // Fail if port is taken
    hmr: {
      clientPort: 5173  // HMR via same port
    }
  }
});
```

---

## .dockerignore Contract

### Location
Both `backend/.dockerignore` and `frontend/.dockerignore`

### Mandatory Exclusions

```
node_modules/
dist/
build/
.git/
.env*
*.log
coverage/
.DS_Store
.vscode/
.idea/
tmp/
temp/
```

### Purpose

- Reduce build context size
- Prevent host node_modules conflicts
- Exclude sensitive files (.env)
- Exclude IDE configurations

### Validation

Run before build:
```bash
docker build --no-cache -t test-context . 2>&1 | grep "Sending build context"
# Should be <10MB for backend, <5MB for frontend
```

---

## Build Arguments Contract

### Supported Arguments

```dockerfile
ARG NODE_VERSION=20
ARG PORT=3000  # or 5173 for frontend
```

### Usage

```bash
docker build \
  --build-arg NODE_VERSION=20 \
  --build-arg PORT=3000 \
  --target development \
  -t barberpro-backend:dev \
  -f Dockerfile.dev \
  .
```

---

## Layer Optimization Requirements

### Layer Order (Least to Most Frequently Changed)

1. Base image (`FROM node:20-alpine`)
2. Working directory (`WORKDIR /app`)
3. Package files (`COPY package*.json`)
4. Dependencies (`RUN npm install`)
5. Prisma schema (`COPY prisma ./prisma`)
6. Prisma generation (`RUN npx prisma generate`)
7. Source code (`COPY . .`)
8. Command (`CMD [...]`)

### Rationale

- Package files change less frequently than source code
- Copying package files separately enables Docker layer caching
- Dependencies only rebuild when package.json changes
- Source code changes don't trigger dependency reinstall

---

## Security Requirements

### User Permissions

```dockerfile
# OPTIONAL but recommended for production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

**For Development**: Run as root (default) for easier debugging
**For Production**: Run as non-root user

### No Secrets in Image

- ✅ Secrets via environment variables (docker-compose env_file)
- ❌ Never `COPY .env` files
- ❌ Never `ARG SECRET_KEY` (build logs expose these)
- ❌ Never hardcoded credentials

---

## Performance Requirements

### Build Time

- Initial build: <3 minutes
- Rebuild (code change only): <30 seconds (layer cache hit)
- Rebuild (dependency change): <2 minutes

### Image Size

- Backend development image: <500MB
- Frontend development image: <400MB
- Production images: <200MB

### Measurement

```bash
docker images | grep barberpro
docker history barberpro-backend:dev
```

---

## Testing Contract

### Build Tests

```bash
# Test backend Dockerfile
cd backend
docker build --target development -t barberpro-backend:dev -f Dockerfile.dev .

# Test frontend Dockerfile
cd frontend
docker build --target development -t barberpro-frontend:dev -f Dockerfile.dev .
```

### Runtime Tests

```bash
# Test backend container starts
docker run --rm -p 3000:3000 barberpro-backend:dev &
sleep 10
curl http://localhost:3000/api/health
# Should return 200 OK

# Test frontend container starts
docker run --rm -p 5173:5173 barberpro-frontend:dev &
sleep 10
curl http://localhost:5173
# Should return 200 OK
```

---

## Error Handling Requirements

### Build Failures

Dockerfile MUST fail gracefully with clear error messages:

```dockerfile
RUN npm install || (echo "npm install failed. Check package.json" && exit 1)
RUN npx prisma generate || (echo "Prisma generation failed. Check schema.prisma" && exit 1)
```

### Runtime Failures

CMD MUST handle signals properly:

```dockerfile
# Backend: tsx handles SIGTERM/SIGINT automatically
CMD ["npx", "tsx", "watch", "src/server.ts"]

# Frontend: npm run dev handles signals
CMD ["npm", "run", "dev"]
```

---

## Compliance Checklist

Before merging a Dockerfile.dev, verify:

- [ ] Uses `node:20-alpine` base image
- [ ] Multi-stage build with `base` and `development` stages
- [ ] Correct NODE_ENV set
- [ ] package*.json copied before source code
- [ ] .dockerignore excludes node_modules and .env
- [ ] Correct port exposed (3000 or 5173)
- [ ] Hot reload command in CMD
- [ ] Prisma generation included (backend only)
- [ ] Vite --host flag included (frontend only)
- [ ] No secrets in image
- [ ] Build time <3 minutes
- [ ] Image size within limits

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial contract specification |

**Status**: ✅ Contract approved for implementation
