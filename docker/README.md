# BarberPro Docker Configuration

This directory contains all Docker-related configurations for the BarberPro service booking platform, optimized for Argentina deployment.

## 📁 Directory Structure

```
docker/
├── backup/                          # Original configurations (backed up)
│   ├── docker-compose.yml.original
│   ├── Dockerfile.dev.original
│   ├── backend-Dockerfile.dev.original
│   ├── frontend-Dockerfile.dev.original
│   ├── nginx-frontend.conf.original
│   ├── nginx-prod.conf.original
│   └── nginx-argentina-optimized.conf.original
├── configs/                         # Active configurations
│   ├── nginx.conf                   # Main nginx configuration
│   ├── proxy_params.conf           # Proxy parameters
│   ├── redis.conf                  # Redis configuration
│   └── postgres-prod.conf          # PostgreSQL production config
└── README.md                       # This file
```

## 🚀 Quick Start

### Development Environment
```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

### Production Environment
```bash
# Start production environment
docker-compose up

# Or run in background
docker-compose up -d
```

### Full Production Stack
```bash
# Start complete production stack with monitoring
docker-compose -f docker-compose.production.yml up -d
```

## 📋 Available Services

### Development (`docker-compose.dev.yml`)
- **Backend**: Node.js with hot reloading (port 3000)
- **Frontend**: SvelteKit with hot reloading (port 5173)
- **PostgreSQL**: Database (port 5432)
- **Redis**: Cache (port 6379)
- **pgAdmin**: Database admin (port 8080)
- **Redis Commander**: Redis admin (port 8081)

### Production (`docker-compose.yml`)
- **Backend**: Optimized Node.js production build (port 3000)
- **Frontend**: Nginx-served SvelteKit build (port 5173)
- **PostgreSQL**: Production database (port 5432)
- **Redis**: Production cache (port 6379)
- **pgAdmin**: Database admin (port 8080)
- **Redis Commander**: Redis admin (port 8081)

### Full Production (`docker-compose.production.yml`)
- All production services plus:
- **Nginx**: Load balancer and reverse proxy (ports 80, 443)
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Monitoring dashboards (port 3001)
- **Loki**: Log aggregation (port 3100)
- **Backup**: Automated database backups

## 🐳 Docker Files Explained

### Root Level
- **`Dockerfile`**: Multi-stage production build for full-stack deployment
- **`Dockerfile.dev`**: Simple development container (backed up)

### Backend
- **`backend/Dockerfile`**: Production backend with security hardening
- **`backend/Dockerfile.dev`**: Development backend with hot reloading

### Frontend
- **`frontend/Dockerfile`**: Production frontend with Nginx
- **`frontend/Dockerfile.dev`**: Development frontend with Vite dev server

## ⚙️ Configuration Files

### Nginx
- **`docker/configs/nginx.conf`**: Main nginx configuration (Argentina-optimized)
- **`docker/configs/proxy_params.conf`**: Proxy parameters for backend routing

### Database
- **`docker/configs/redis.conf`**: Redis configuration
- **`docker/configs/postgres-prod.conf`**: PostgreSQL production settings

## 🔧 Environment Variables

### .env File Structure
The project uses multiple .env files for different environments:

```
.env                    # Main environment file (development defaults)
.env.example           # Template with all required variables
.env.production        # Production overrides
.env.staging           # Staging overrides
.env.payment.example   # Payment configuration template
backend/.env           # Backend-specific variables
backend/.env.production # Backend production overrides
frontend/.env          # Frontend-specific variables
docker/docker.env      # Docker-specific overrides
```

### Environment File Loading Order
Docker Compose loads environment files in this order (later files override earlier ones):

1. `.env` (main development file)
2. `.env.production` (production overrides)
3. `docker/docker.env` (Docker-specific overrides)

### Key Environment Variables

#### Database Configuration
```bash
DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev
POSTGRES_USER=barberpro
POSTGRES_PASSWORD=barberpro_dev_password
POSTGRES_DB=barberpro_dev
REDIS_URL=redis://redis:6379
```

#### API Configuration
```bash
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

#### Authentication
```bash
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

#### Argentina-Specific
```bash
TIMEZONE=America/Argentina/Buenos_Aires
LOCALE=es-AR
CURRENCY=ARS
```

#### Payment Configuration (MercadoPago)
```bash
# Development (sandbox)
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_ACCESS_TOKEN_TEST=TEST-your_test_token
MERCADOPAGO_PUBLIC_KEY_TEST=TEST-your_test_key
MERCADOPAGO_WEBHOOK_SECRET_TEST=your_test_webhook_secret

# Production
MERCADOPAGO_ENVIRONMENT=production
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your_production_token
MERCADOPAGO_PUBLIC_KEY=APP_PUB-your_production_key
MERCADOPAGO_WEBHOOK_SECRET=your_production_webhook_secret
```

#### Frontend Configuration
```bash
VITE_API_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=BarberPro
VITE_APP_VERSION=1.0.0
```

### Docker-Specific Overrides
The `docker/docker.env` file contains Docker-specific overrides that:
- Replace `localhost` URLs with Docker service names
- Set appropriate CORS origins for Docker networking
- Configure development-friendly settings
- Disable production-only features

### Environment Validation
Use the validation script to check your environment configuration:

```bash
# Validate development environment
./scripts/validate-env.sh development

# Validate production environment
./scripts/validate-env.sh production

# Validate staging environment
./scripts/validate-env.sh staging
```

## 🛠️ Common Commands

### Build Images
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build with no cache
docker-compose build --no-cache
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Access database
docker-compose exec postgres psql -U barberpro -d barberpro_dev

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Cleanup
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🔍 Troubleshooting

### Port Conflicts
If you get port conflicts, check what's running:
```bash
# Check port usage
lsof -i :3000
lsof -i :5173
lsof -i :5432
```

### Database Connection Issues
```bash
# Check if database is ready
docker-compose exec postgres pg_isready -U barberpro

# Check database logs
docker-compose logs postgres
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Access backend container
docker-compose exec backend sh

# Check if backend is responding
curl http://localhost:3000/api/health
```

## 📊 Monitoring

### Health Checks
- Backend: `http://localhost:3000/api/health`
- Frontend: `http://localhost:5173/health`
- Database: `docker-compose exec postgres pg_isready -U barberpro`

### Admin Interfaces
- pgAdmin: `http://localhost:8080` (admin@barberpro.local / admin123)
- Redis Commander: `http://localhost:8081` (admin / admin123)

## 🚨 Security Notes

1. **Never use default passwords in production**
2. **Change JWT secrets for production**
3. **Use environment variables for sensitive data**
4. **Regularly update base images**
5. **Scan images for vulnerabilities**

## 📝 Backup Files

All original configurations are backed up in `docker/backup/`:
- Original docker-compose.yml
- Original Dockerfile.dev files
- Original nginx configurations

These can be restored if needed, but the new structure is recommended.

## 🤝 Contributing

When modifying Docker configurations:
1. Test changes in development first
2. Update this documentation
3. Backup original files if making major changes
4. Test in staging before production

## 📞 Support

For Docker-related issues:
1. Check logs: `docker-compose logs [service]`
2. Check health: `docker-compose ps`
3. Check this documentation
4. Check backup files for reference
