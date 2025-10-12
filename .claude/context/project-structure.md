---
created: 2025-10-10T03:05:12Z
last_updated: 2025-10-12T07:07:58Z
version: 1.1
author: Claude Code PM System
---

# Project Structure

## Root Directory Layout

```
service-booking/
├── .claude/                    # Claude Code configuration and context
│   ├── agents/                # Custom agent definitions
│   ├── commands/              # Slash commands
│   ├── context/              # Project context files (this directory)
│   ├── epics/                # Epic-level planning
│   ├── hooks/                # Git and development hooks
│   ├── prds/                 # Product requirement documents
│   ├── rules/                # Development rules and guidelines
│   └── scripts/              # Automation scripts
├── .github/                   # GitHub workflows and templates
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── backend/                   # Fastify backend application
│   ├── prisma/               # Database schema and migrations
│   │   └── migrations/
│   └── src/
│       ├── config/           # Configuration files
│       ├── middleware/       # Fastify middleware
│       ├── routes/           # API route handlers
│       ├── schemas/          # TypeBox/Zod schemas
│       ├── services/         # Business logic (126+ files)
│       └── types/            # TypeScript type definitions
├── config/                    # Shared configuration
├── design-system/            # Design tokens and documentation
│   ├── documentation/
│   └── tokens/
├── docker/                    # Docker configuration
│   ├── backup/
│   ├── configs/               # nginx, redis, postgres configs
│   ├── mocks/                 # Argentina service mocks
│   │   ├── afip/             # AFIP tax authority mock
│   │   ├── mercadopago/      # MercadoPago payment mock
│   │   ├── shared/           # Shared mock utilities
│   │   ├── sms/              # SMS gateway mock
│   │   └── whatsapp/         # WhatsApp Business mock
│   ├── PERFORMANCE.md         # Performance benchmarks
│   ├── PLATFORM-NOTES.md      # Platform-specific notes
│   ├── README.md              # Docker setup guide
│   └── TROUBLESHOOTING.md     # Common issues guide
├── docs/                      # Project documentation
│   ├── claude/
│   ├── docker-setup-guide.md       # Complete Docker setup
│   ├── docker-migration-guide.md   # Migration guide
│   └── docker-changelog.md         # Docker changes log
├── frontend/                  # SvelteKit frontend application
│   ├── src/
│   │   ├── app/              # SvelteKit app files
│   │   ├── lib/              # Shared library code
│   │   │   ├── components/   # 121+ Svelte components
│   │   │   ├── services/     # Frontend services
│   │   │   ├── stores/       # Svelte stores
│   │   │   └── utils/        # Utility functions
│   │   └── routes/           # File-based routing
│   └── static/               # Static assets
├── monitoring/               # Monitoring stack
│   └── grafana/
│       └── datasources/
├── playwright-report/        # E2E test reports
└── scripts/                  # Build and deployment scripts
    ├── automation/
    ├── demos/
    ├── monitoring/
    ├── benchmark.sh          # Performance benchmarking
    ├── final-test.sh         # Final validation checklist
    ├── test-linux.sh         # Linux platform testing
    ├── test-macos.sh         # macOS platform testing
    └── test-wsl2.sh          # WSL2 platform testing
```

## Key Directory Purposes

### Backend Structure
- **prisma/**: Database schema definition, migrations, and seed data
- **src/config/**: Environment configuration, database connections
- **src/middleware/**: Authentication, rate limiting, CORS
- **src/routes/**: RESTful API endpoints organized by domain
- **src/schemas/**: Request/response validation schemas
- **src/services/**: Core business logic (126+ service files)
- **src/types/**: TypeScript interfaces and types

### Frontend Structure
- **src/lib/components/**: Organized by feature domain (ai, monitoring, psychology, core, booking, etc.)
- **src/lib/services/**: Frontend service layer (socket, analytics, performance, etc.)
- **src/lib/stores/**: State management (auth, booking, performance, monitoring)
- **src/lib/utils/**: Shared utilities (debounce, analytics helpers)
- **src/routes/**: SvelteKit file-based routing with +page.svelte files

### Claude Code Structure
- **.claude/agents/**: Specialized agents (code-analyzer, file-analyzer, test-runner, parallel-worker)
- **.claude/commands/**: Custom slash commands organized by domain (context, pm, testing)
- **.claude/context/**: Project context files for AI assistance
- **.claude/epics/**: High-level feature planning
- **.claude/hooks/**: Development workflow automation
- **.claude/scripts/**: Build and PM automation

## File Naming Patterns

### Backend
- **Services**: `{domain}.service.ts` or descriptive names in `/services/`
- **Routes**: `{domain}.routes.ts` in `/routes/`
- **Schemas**: `{domain}.schema.ts` using TypeBox or Zod
- **Tests**: `{filename}.test.ts` or `{filename}.spec.ts`

### Frontend
- **Components**: PascalCase `.svelte` files (e.g., `SmartSchedulingAssistant.svelte`)
- **Routes**: `+page.svelte`, `+layout.svelte`, `+server.ts` (SvelteKit convention)
- **Stores**: Lowercase with dashes (e.g., `auth.ts`, `booking.ts`)
- **Services**: Lowercase with dashes (e.g., `socket.ts`, `performance-optimization.ts`)

### Docker Structure (Epic: local-docker-environment)
- **docker/configs/**: nginx.conf, redis.conf, postgres.conf
- **docker/mocks/**: Argentina service mocks (MercadoPago, AFIP, WhatsApp, SMS)
- **docker-compose.yml**: Base infrastructure (PostgreSQL, Redis, pgAdmin, Redis Commander)
- **docker-compose.dev.yml**: Development overrides with hot reload
- **docker-compose.prod.yml**: Production configuration
- **docker-compose.mocks.yml**: Argentina mock services
- **docker-compose.monitoring.yml**: Prometheus, Grafana, Loki stack
- **docker-compose.test.yml**: Test environment configuration
- **Makefile**: 30+ Docker orchestration commands with colored output

### Configuration Files
- **Docker**: `Dockerfile`, `docker-compose.yml`, `docker-compose.{env}.yml`
- **Build**: `vite.config.ts`, `svelte.config.js`, `tsconfig.json`
- **Linting**: `.eslintrc`, `prettier.config.js`
- **CI/CD**: `.github/workflows/*.yml`
- **Environment**: `.env`, `docker/.env`, `backend/.env`, `frontend/.env`

## Module Organization

### Monorepo Workspaces
The project uses npm workspaces with two main packages:
- `backend/` - Fastify API server
- `frontend/` - SvelteKit web application

### Shared Dependencies
Root-level dependencies for development tools:
- **@playwright/test**: E2E testing
- **artillery**: Performance testing
- **concurrently**: Running multiple dev servers

### Domain-Driven Design
Both frontend and backend organize code by business domain:
- **Booking**: Scheduling, availability, appointments
- **Payments**: MercadoPago integration, AFIP compliance
- **Users**: Authentication, profiles, preferences
- **Analytics**: Business intelligence, monitoring
- **AI**: Smart recommendations, predictive features
- **Enterprise**: Multi-tenant, white-label features

## Component Library Organization

The frontend contains 121+ components organized into categories:
- **Core UI**: Buttons, inputs, modals, cards (8 components)
- **Booking**: Calendars, forms, service selection (8 components)
- **AI Features**: Smart scheduling, predictive analytics, enhanced search
- **Monitoring**: Dashboards, UX monitoring, error boundaries
- **Psychology**: Specialized components for therapist vertical
- **Provider**: Analytics and management tools

## Build Output Locations

- **Backend**: `backend/dist/` (TypeScript compilation output)
- **Frontend**: `frontend/.svelte-kit/` and `frontend/build/` (Vite/SvelteKit build)
- **Test Reports**: `playwright-report/` (E2E test results)
- **Coverage**: Generated in respective `coverage/` directories
