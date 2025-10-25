# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BarberPro** is a premium service booking platform designed for Argentina, starting with barber services and architected for easy replication across service verticals (psychologists, doctors, etc.). The platform emphasizes superior UX, enterprise features, and Argentina-specific optimizations.

## Architecture

### Full-Stack Monorepo Structure
- **Frontend**: SvelteKit + TypeScript + TailwindCSS (mobile-first PWA)
- **Backend**: Node.js + Fastify + TypeScript + Prisma ORM
- **Database**: PostgreSQL (primary) + Redis (caching/sessions)
- **Infrastructure**: Docker + Railway/AWS deployment

### Key Directories
```
/frontend/          - SvelteKit frontend application
  /src/lib/components/  - 121+ Svelte components (see docs/frontend-components.md)
  /src/routes/      - SvelteKit file-based routing
/backend/           - Fastify backend API
  /src/services/    - Business logic services (126+ files)
  /src/routes/      - API route handlers
  /prisma/          - Database schema and migrations
/docs/              - Project documentation
```

## Development Commands

### Quick Start (Everything in Docker)
```bash
# Start all services (postgres, redis, backend, frontend, admin tools)
npm start              # or: make up

# Stop all services
npm stop               # or: make down

# View logs
npm run logs           # or: make logs

# Check service status
npm run status         # or: make status
```

### Setup (First Time)
```bash
# Complete setup (installs dependencies, starts Docker, runs migrations)
npm run setup

# Or manual setup:
npm run install:all    # Install all dependencies
npm start              # Start all Docker services (auto-generates .env files)
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with test data
```

### Database Operations
```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with test data
npm run db:reset       # Reset database (drop + migrate + seed)
```

### Testing (TDD Workflow)
```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode (for TDD)
npm run test:backend   # Run backend tests only
npm run test:frontend  # Run frontend tests only
npm run test:coverage  # Generate coverage reports
```

### Advanced Commands (Makefile)
For more advanced operations, use `make` commands directly:
```bash
make help              # Show all available commands
make doctor            # Check system requirements
make clean             # Remove all containers and volumes
make mocks             # Start Argentina mock services (MercadoPago, AFIP, etc.)
```

### Code Quality
```bash
npm run lint           # Lint backend and frontend
npm run lint:backend   # Lint backend only
npm run lint:frontend  # Lint frontend only
```

### Build (Production)
```bash
npm run build          # Build backend and frontend
npm run build:backend  # Build backend only
npm run build:frontend # Build frontend only
```

## Technology Stack Details

### Frontend Technologies
- **SvelteKit**: Meta-framework with SSR/SSG support
- **TypeScript**: Full type safety
- **TailwindCSS**: Utility-first styling with custom design system
- **Vite**: Build tool and dev server
- **Components**: 121+ Svelte components organized by domain
- **PWA**: Progressive Web App capabilities

### Backend Technologies
- **Fastify**: High-performance Node.js framework
- **Prisma**: Type-safe ORM with PostgreSQL
- **TypeScript**: Server-side type safety
- **JWT**: Authentication via @fastify/jwt
- **OAuth 2.0**: Google OAuth integration via @fastify/oauth2
- **Nodemailer**: Email service for verification emails
- **Socket.io**: Real-time communications
- **Redis**: Caching, session management, and OAuth state storage
- **Rate Limiting**: @fastify/rate-limit for endpoint protection

### Database Schema
- **Users**: Authentication and profiles with email verification
- **EmailVerificationToken**: Email verification tokens (24-hour expiry)
- **OAuthProvider**: OAuth provider linking (Google, Facebook)
- **RefreshToken**: JWT refresh tokens with revocation
- **Services**: Service catalog management
- **Bookings**: Appointment scheduling system
- **Payments**: Argentina payment processing (MercadoPago integration)
- **Multi-tenant**: Architecture for vertical replication

## Argentina-Specific Features

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

## Component Architecture

The frontend features 121+ components organized into:
- **Core**: Button, Input, Modal, Card, Loading (8 components)
- **Booking**: Calendar, Forms, Service selection (8 components)
- **Provider**: Analytics, Service management (9 components)
- **Argentina-specific**: Payment, WhatsApp, Location services
- **Enterprise**: Multi-tenant, White-label customization
- **AI/Intelligence**: Smart recommendations, Predictive analytics

See `docs/frontend-components.md` for complete component documentation.

## Service Architecture

The backend contains 126+ service files organized by domain:
- **Core Services**: Database, Authentication, Socket.io
- **Booking Logic**: Advanced scheduling, Availability management
- **Payment Processing**: Argentina payment gateways, AFIP integration
- **Analytics**: Business intelligence, Performance monitoring
- **Enterprise**: Multi-tenant, AI-powered features

## Template Replication Strategy

The codebase is architected for easy vertical replication:
- **85% code reuse target** across service verticals
- **Template-based configuration** for niche customization
- **2-4 week replication timeline** for new verticals (vs 6+ months from scratch)
- **Multi-tenant architecture** for vertical isolation

### Replication Process
1. Copy base repository
2. Update niche-specific configs in `/niche-configs/`
3. Customize branding and themes
4. Adjust service types and scheduling rules
5. Deploy with minimal code changes

## Testing Strategy

### Frontend Testing
- **Vitest**: Unit and integration tests
- **Component testing**: Svelte component isolation
- **E2E testing**: Playwright for user workflows

### Backend Testing
- **Jest**: Unit testing framework
- **Supertest**: API endpoint testing
- **Integration tests**: Database and service integration
- **Performance tests**: Artillery load testing

## Security & Compliance

### Authentication & Authorization
- **JWT-based authentication** with @fastify/jwt
- **OAuth 2.0 integration**: Google OAuth with PKCE flow
- **Email verification system**: Nodemailer + MailHog (dev) / production SMTP
- **Password security**: Bcrypt hashing (12 salt rounds)
- **Token management**: Refresh tokens with database storage and revocation
- **Rate limiting**: @fastify/rate-limit (5 registrations/IP/hour, 3 verification emails/hour)
- **Multi-auth support**: Email/password, OAuth, or both
- **CORS configuration** for frontend integration

### Argentina Compliance
- **AFIP integration** for tax reporting
- **Data protection** compliance
- **PCI DSS** payment security standards

## Performance Optimization

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

## Development Guidelines

### Code Style
- **TypeScript everywhere**: Full type safety
- **ESLint + Prettier**: Consistent formatting
- **Component-driven**: Modular, reusable components
- **API-first design**: RESTful endpoints with OpenAPI docs

### Architecture Patterns
- **Monolithic initially**: Faster development, easier deployment
- **Service-oriented**: Clear separation of concerns
- **Event-driven**: Socket.io for real-time features
- **Template-based**: Easy vertical replication

### Database Best Practices
- **Prisma migrations**: Version-controlled schema changes
- **Seeding**: Consistent test data across environments
- **Connection pooling**: Efficient database connections
- **Backup/restore**: Production data management scripts

## Deployment

### Development Environment
- **Docker Compose**: Local postgres and redis containers
- **Hot reloading**: Frontend and backend auto-restart
- **Type checking**: Real-time TypeScript validation

### Production Deployment
- **Railway/AWS**: Cloud deployment platforms
- **Docker containers**: Consistent deployment environments
- **Environment variables**: Configuration management
- **Monitoring**: Performance and error tracking

## Key File Locations

- **Database schema**: `backend/prisma/schema.prisma`
- **API documentation**: Available at `http://localhost:3000/docs` when running
- **Component library**: `frontend/src/lib/components/`
- **Service definitions**: `backend/src/services/`
- **Configuration**: `frontend/vite.config.ts`, `backend/src/config/`

## Quick Start for New Contributors

1. **Setup development environment** (first time only):
   ```bash
   npm run setup
   ```
   This will:
   - Install all dependencies
   - Start all Docker services (auto-generates .env files with dummy data)
   - Run database migrations

2. **Daily workflow**:
   ```bash
   npm start          # Start all services in Docker
   npm run logs       # View logs (Ctrl+C to exit)
   npm test           # Run tests
   npm stop           # Stop all services when done
   ```

3. **Access applications**:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **API Documentation**: http://localhost:3000/docs
   - **MailHog (Email Testing)**: http://localhost:8025
   - **pgAdmin**: http://localhost:8080 (admin@barberpro.com / admin)
   - **Redis Commander**: http://localhost:8081 (admin / admin)

4. **TDD Workflow**:
   ```bash
   npm run test:watch  # Run tests in watch mode
   npm run lint        # Lint code
   npm test            # Run all tests before committing
   ```

5. **Troubleshooting**:
   ```bash
   make doctor         # Check system requirements
   make status         # Check service health
   npm run db:reset    # Reset database if needed
   make clean          # Nuclear option: remove everything and start fresh
   ```

This architecture supports rapid development while maintaining enterprise-grade quality and Argentina market optimization.

## Active Technologies
- TypeScript 5.9.2, Node.js 24.6.0 + Docker Compose 2.0+, Fastify 5.6.0, SvelteKit (Vite-based), Prisma 6.15.0, tsx 4.20.5 (hot reload) (001-docker-dev-hotreload)
- PostgreSQL 15 (docker postgres:15-alpine), Redis 7 (docker redis:7-alpine) (001-docker-dev-hotreload)
- TypeScript 5.9.2 with Node.js 24.6.0 (backend), TypeScript with SvelteKit/Vite (frontend) (002-registration-completion)
- PostgreSQL 15 (primary database - existing), Redis 7 (session/token caching - existing, Docker environment) (002-registration-completion)
- Google OAuth 2.0 (@fastify/oauth2 8.1.2), Nodemailer 6.9.9, MailHog (dev email testing) (002-registration-completion)
- Email verification system with bcrypt token hashing, @fastify/rate-limit 10.3.0 (002-registration-completion)
- JWT authentication with refresh tokens, @fastify/jwt 10.0.0, @fastify/cookie 10.0.0 (002-registration-completion)

## Recent Changes
- 001-docker-dev-hotreload: Added TypeScript 5.9.2, Node.js 24.6.0 + Docker Compose 2.0+, Fastify 5.6.0, SvelteKit (Vite-based), Prisma 6.15.0, tsx 4.20.5 (hot reload)
- 002-registration-completion: Added Google OAuth 2.0, email verification system, rate limiting, multi-auth support (email/password + OAuth), token cleanup cron job
