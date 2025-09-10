# BarberPro Development Setup Guide

## Overview

BarberPro is a premium service booking platform for Argentina, starting with barber services. This guide will help you set up the complete development environment.

## Tech Stack

- **Frontend:** SvelteKit with TypeScript
- **Backend:** Fastify with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Development:** Docker Compose
- **Deployment:** Docker containers

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd service-booking

# Install all dependencies (root, backend, frontend)
npm run install:all

# Generate Prisma client
npm run db:generate
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables as needed
# The default values should work for local development
```

### 3. Start Development Environment

```bash
# Option A: Using Docker (Recommended)
npm run docker:up

# Option B: Local development (requires local PostgreSQL and Redis)
npm run dev
```

### 4. Database Setup

```bash
# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

## Verification

After setup, verify everything is working:

### Frontend
- Navigate to [http://localhost:5173](http://localhost:5173)
- You should see the BarberPro homepage with a success message

### Backend API
- Navigate to [http://localhost:3000/api/health](http://localhost:3000/api/health)
- You should see a JSON response with status "OK"

### API Documentation
- Navigate to [http://localhost:3000/docs](http://localhost:3000/docs)
- You should see the Swagger API documentation

### Database
- Run `npm run db:studio`
- Prisma Studio should open at [http://localhost:5555](http://localhost:5555)

## Project Structure

```
service-booking/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic and external services
│   │   ├── types/          # TypeScript type definitions
│   │   ├── plugins/        # Fastify plugins
│   │   ├── app.ts          # Fastify app configuration
│   │   └── server.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── Dockerfile          # Production container
│   ├── Dockerfile.dev      # Development container
│   └── package.json
├── frontend/               # SvelteKit application
│   ├── src/
│   │   ├── routes/         # SvelteKit routes
│   │   ├── lib/            # Utility functions and stores
│   │   ├── components/     # Reusable Svelte components
│   │   └── app/            # App configuration and global styles
│   ├── Dockerfile.dev      # Development container
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml      # Development environment
├── .env.example           # Environment template
└── package.json           # Root package.json with scripts
```

## Development Workflow

### Daily Development

```bash
# Start all services
npm run dev

# Backend only
npm run backend

# Frontend only
npm run frontend

# View logs
npm run docker:logs
```

### Database Operations

```bash
# Create and apply migration
npm run db:migrate

# Reset database (warning: deletes all data)
npm run db:reset

# View database in browser
npm run db:studio
```

### Docker Commands

```bash
# Start all containers
npm run docker:up

# Stop all containers
npm run docker:down

# Rebuild containers
npm run docker:build

# View container logs
npm run docker:logs
```

## Environment Variables

Key environment variables for development:

```bash
# Database
DATABASE_URL="postgresql://barberpro:barberpro_dev_password@localhost:5432/barberpro_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# API
PORT=3000
JWT_SECRET=supersecret-change-in-production

# Frontend
VITE_API_URL=http://localhost:3000/api
```

## Template Architecture

BarberPro is designed as a template-based platform to enable rapid expansion to other service verticals (psychologists, doctors, etc.) with 80%+ code reuse.

### Core Shared Components (80%)
- Authentication system
- Payment processing
- Booking engine
- User management
- Notification hub

### Niche-Specific Components (20%)
- Service type definitions
- Business rules
- UI customizations
- Compliance requirements

## Argentina-Specific Features

- **Language:** Spanish (Argentina) localization
- **Timezone:** America/Argentina/Buenos_Aires
- **Currency:** Argentine Peso (ARS)
- **Payments:** MercadoPago integration
- **Compliance:** AFIP tax integration (planned)

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Ensure ports 3000, 5173, 5432, 6379 are available
   - Stop other services using these ports

2. **Database connection errors**
   - Ensure PostgreSQL container is running: `docker ps`
   - Check DATABASE_URL in .env file

3. **Prisma client errors**
   - Regenerate client: `npm run db:generate`
   - Run migrations: `npm run db:migrate`

4. **Node modules issues**
   - Clean and reinstall: `npm run clean && npm run install:all`

### Getting Help

- Check the console logs for error messages
- Verify all containers are running: `docker ps`
- Check container logs: `npm run docker:logs`

## Next Steps

After successful setup:

1. **Frontend Developer:** Start with component library implementation
2. **Backend Developer:** Implement authentication and user management APIs
3. **Product Owner:** Review user stories and acceptance criteria
4. **QA Engineer:** Set up testing framework integration

## Development Standards

- **TypeScript:** All code must be TypeScript with strict mode
- **Testing:** Write tests for all new features
- **Documentation:** Update docs for any API changes
- **Git:** Use conventional commit messages
- **Security:** Never commit secrets or .env files

---

**Status:** ✅ Foundation architecture complete and ready for development

**Last Updated:** Day 1 - Architecture Setup Phase