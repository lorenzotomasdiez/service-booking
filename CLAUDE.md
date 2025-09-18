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

### Root Level (Workspace Management)
```bash
# Development (runs both frontend and backend)
npm run dev

# Build entire project
npm run build

# Run tests across all projects
npm test

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database with test data

# Docker operations
npm run docker:up      # Start postgres and redis containers
npm run docker:dev     # Start dev dependencies only

# Setup commands
npm run setup:dev      # Full dev environment setup
npm run install:all    # Install all dependencies
```

### Frontend (SvelteKit)
```bash
cd frontend

# Development
npm run dev            # Start development server (port 5173)
npm run build          # Build for production
npm run preview        # Preview production build

# Quality checks
npm run check          # Svelte type checking
npm run check:watch    # Watch mode type checking
npm run lint           # ESLint
npm run lint:fix       # Auto-fix linting issues

# Testing
npm test               # Run Vitest tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage report
```

### Backend (Fastify)
```bash
cd backend

# Development
npm run dev            # Start with tsx watch (port 3000)
npm run build          # Compile TypeScript
npm start              # Run compiled JavaScript

# Quality checks
npm run lint           # ESLint
npm run lint:fix       # Auto-fix linting issues
npm run typecheck      # TypeScript type checking
npm run format:check   # Prettier format check
npm run format:fix     # Auto-fix formatting

# Testing
npm test               # Run Jest tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage report
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e       # End-to-end tests

# Database
npm run seed           # Seed database
npm run db:reset       # Reset and reseed database
npm run db:migrate     # Run Prisma migrations
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio

# Performance & Monitoring
npm run performance:test    # Run Artillery load tests
npm run security:audit      # Security audit
npm run monitoring:start    # Start monitoring stack
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
- **Socket.io**: Real-time communications
- **Redis**: Caching and session management

### Database Schema
- **Users**: Authentication and profiles
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

### Authentication
- **JWT-based authentication** with @fastify/jwt
- **Rate limiting** via @fastify/rate-limit
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

1. **Setup development environment**:
   ```bash
   npm run setup:dev
   ```

2. **Start development servers**:
   ```bash
   npm run dev
   ```

3. **Access applications**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/docs
   - Database Studio: `npm run db:studio`

4. **Run quality checks before committing**:
   ```bash
   npm run lint
   npm run typecheck  # Backend only
   npm test
   ```

This architecture supports rapid development while maintaining enterprise-grade quality and Argentina market optimization.