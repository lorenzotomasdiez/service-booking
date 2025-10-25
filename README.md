# BarberPro - Premium Service Booking Platform

A premium service booking platform designed for Argentina, starting with barber services and architected for easy replication across service verticals (psychologists, doctors, etc.). Built with superior UX, enterprise features, and Argentina-specific optimizations.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended for First-Time Setup)

```bash
# Run automated setup script
./scripts/dev-setup.sh

# This will:
# - Check prerequisites (Docker, Docker Compose)
# - Start all infrastructure (PostgreSQL, Redis, pgAdmin, Redis Commander)
# - Run database migrations
# - Seed initial data
```

### Option 2: Manual Setup with Make Commands

```bash
# 1. Check your system is ready
make doctor

# 2. Start the development environment
make dev-infra-only    # Infrastructure only (postgres, redis, pgadmin, redis-commander)

# 3. In separate terminals, start backend and frontend
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### Option 3: Full Docker-Based Development (Backend + Frontend in Docker)

```bash
# Start everything in Docker with hot reload enabled
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# Or using make:
make full
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/docs
- pgAdmin: http://localhost:8080 (admin@barberpro.com / admin123)
- Redis Commander: http://localhost:8081 (admin / admin123)
- Database Studio: `npm run db:studio` or `make db:studio`

## 🏗️ Architecture

### Full-Stack Monorepo
- **Frontend**: SvelteKit + TypeScript + TailwindCSS (mobile-first PWA)
- **Backend**: Node.js + Fastify + TypeScript + Prisma ORM
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **Infrastructure**: Docker + Railway/AWS deployment

### Key Directories
```
/frontend/          - SvelteKit frontend application
  /src/lib/components/  - 121+ Svelte components
  /src/routes/      - SvelteKit file-based routing
/backend/           - Fastify backend API
  /src/services/    - Business logic services (126+ files)
  /src/routes/      - API route handlers
  /prisma/          - Database schema and migrations
/docs/              - Project documentation
```

## 📋 Development Commands

### Root Level (Workspace Management)
```bash
npm run dev           # Development (runs both frontend and backend)
npm run build         # Build entire project
npm test              # Run tests across all projects

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run database migrations
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with test data

# Docker operations
npm run docker:up     # Start postgres and redis containers
npm run docker:dev    # Start dev dependencies only
```

### Frontend (SvelteKit)
```bash
cd frontend

npm run dev           # Start development server (port 5173)
npm run build         # Build for production
npm run preview       # Preview production build
npm run check         # Svelte type checking
npm run lint          # ESLint
npm test              # Run Vitest tests
```

### Backend (Fastify)
```bash
cd backend

npm run dev           # Start with tsx watch (port 3000)
npm run build         # Compile TypeScript
npm start             # Run compiled JavaScript
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking
npm test              # Run Jest tests
npm run seed          # Seed database
```

## 🔄 Common Development Workflows

### Workflow 1: Fresh Start with Automated Setup
```bash
# Best for: First-time setup on a new machine
./scripts/dev-setup.sh          # Automated setup (~15 minutes)
cd backend && npm run dev       # Terminal 1: Start backend
cd frontend && npm run dev      # Terminal 2: Start frontend
```

### Workflow 2: Daily Development
```bash
# Best for: Normal development work
make dev-infra-only             # Start infrastructure services
cd backend && npm run dev       # Terminal 1: Start backend with hot reload
cd frontend && npm run dev      # Terminal 2: Start frontend with HMR
make logs                       # Terminal 3: Stream logs from all services
```

### Workflow 3: Full Docker-Based (Everything in Containers)
```bash
# Best for: Testing deployment-like environment or CI/CD simulation
make full                       # Start everything in Docker
# Or manually:
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3000
# - API Docs: http://localhost:3000/docs
```

### Workflow 4: Database Management
```bash
# Reset database to clean state with seed data
make db-reset                   # Drops and recreates database

# View database with pgAdmin
http://localhost:8080          # pgAdmin interface
# Credentials: admin@barberpro.com / admin123

# Inspect cache with Redis Commander
http://localhost:8081          # Redis Commander interface
```

### Workflow 5: Debugging & Troubleshooting
```bash
# View all service logs with color coding
make logs                       # Follow logs from all containers

# Check system health
make doctor                     # Run comprehensive diagnostics

# Stop all services
make down                       # Stop all containers

# View specific service logs
docker-compose -f docker/docker-compose.yml logs -f backend
docker-compose -f docker/docker-compose.yml logs -f frontend
```

## 🇦🇷 Argentina-Specific Features

### Localization
- **Phone formatting**: +54 9 11 1234-5678 pattern
- **DNI formatting**: 12.345.678 pattern
- **Currency**: Peso argentino (ARS) with inflation handling
- **Timezone**: America/Argentina/Buenos_Aires
- **Language**: Spanish (es-AR) locale

### Payment Integration
- **MercadoPago**: Primary payment gateway
- **AFIP Integration**: Tax compliance system
- **Multiple payment methods**: Cards, digital wallets, BNPL

### Cultural Adaptations
- **WhatsApp Business**: Primary communication channel
- **Regional expansion**: Buenos Aires, Córdoba, Rosario, La Plata
- **Local holidays**: Argentina calendar integration

## 🧩 Component Architecture

The frontend features **121+ components** organized into:
- **Core**: Button, Input, Modal, Card, Loading (8 components)
- **Booking**: Calendar, Forms, Service selection (8 components)
- **Provider**: Analytics, Service management (9 components)
- **Argentina-specific**: Payment, WhatsApp, Location services
- **Enterprise**: Multi-tenant, White-label customization
- **AI/Intelligence**: Smart recommendations, Predictive analytics

## 🔧 Service Architecture

The backend contains **126+ service files** organized by domain:
- **Core Services**: Database, Authentication, Socket.io
- **Booking Logic**: Advanced scheduling, Availability management
- **Payment Processing**: Argentina payment gateways, AFIP integration
- **Analytics**: Business intelligence, Performance monitoring
- **Enterprise**: Multi-tenant, AI-powered features

## 🔄 Template Replication Strategy

Architected for easy vertical replication:
- **85% code reuse target** across service verticals
- **Template-based configuration** for niche customization
- **2-4 week replication timeline** for new verticals
- **Multi-tenant architecture** for vertical isolation

### Replication Process
1. Copy base repository
2. Update niche-specific configs in `/niche-configs/`
3. Customize branding and themes
4. Adjust service types and scheduling rules
5. Deploy with minimal code changes

## 🧪 Testing

### Frontend Testing
- **Vitest**: Unit and integration tests
- **Component testing**: Svelte component isolation
- **E2E testing**: Playwright for user workflows

### Backend Testing
- **Jest**: Unit testing framework
- **Supertest**: API endpoint testing
- **Integration tests**: Database and service integration
- **Performance tests**: Artillery load testing

## 🔒 Security & Compliance

### Authentication
- **JWT-based authentication** with @fastify/jwt
- **Rate limiting** via @fastify/rate-limit
- **CORS configuration** for frontend integration

### Argentina Compliance
- **AFIP integration** for tax reporting
- **Data protection** compliance
- **PCI DSS** payment security standards

## ⚡ Performance Optimization

### Frontend
- **Code splitting**: Route-based and component-based
- **Lazy loading**: Images and components
- **PWA optimization**: Service worker, offline capabilities
- **Mobile-first**: Touch-optimized interfaces

### Backend
- **Redis caching**: Session and data caching
- **Database optimization**: Prisma query optimization
- **Auto-scaling**: Infrastructure scaling patterns
- **CDN integration**: Argentina-optimized content delivery

## 📁 Key File Locations

- **Database schema**: `backend/prisma/schema.prisma`
- **Component library**: `frontend/src/lib/components/`
- **Service definitions**: `backend/src/services/`
- **Configuration**: `frontend/vite.config.ts`, `backend/src/config/`

## 🚀 Deployment

### Development Environment
- **Docker Compose**: Local postgres and redis containers
- **Hot reloading**: Frontend and backend auto-restart
- **Type checking**: Real-time TypeScript validation

### Production Deployment
- **Railway/AWS**: Cloud deployment platforms
- **Docker containers**: Consistent deployment environments
- **Environment variables**: Configuration management
- **Monitoring**: Performance and error tracking

## 🤝 Contributing

1. **Setup development environment**:
   ```bash
   npm run setup:dev
   ```

2. **Run quality checks before committing**:
   ```bash
   npm run lint
   npm run typecheck  # Backend only
   npm test
   ```

3. **Follow development guidelines**:
   - TypeScript everywhere for full type safety
   - Component-driven development
   - API-first design with OpenAPI docs
   - Argentina-specific optimizations

## 📄 License

[License information to be added]

---

Built with ❤️ for the Argentina market, designed for global expansion across service verticals.