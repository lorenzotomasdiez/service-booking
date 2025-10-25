<!--
SYNC IMPACT REPORT
==================
Version Change: INITIAL → 1.0.0
Rationale: Initial constitution creation establishing core project principles

Modified Principles: N/A (initial creation)
Added Sections:
  - All core principles (I-VII)
  - Development Environment section
  - Quality Standards section
  - Governance section

Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Already aligned with TDD and Docker principles
  ✅ .specify/templates/spec-template.md - Already aligned with user story testing approach
  ✅ .specify/templates/tasks-template.md - Already aligned with test-first workflow

Follow-up TODOs: None - all placeholders filled with concrete values
-->

# BarberPro Constitution

## Core Principles

### I. Test-Driven Development (TDD) - NON-NEGOTIABLE

**Rule**: All features MUST be developed using strict Test-Driven Development methodology.

- Tests MUST be written FIRST, before any implementation code
- Tests MUST FAIL initially to verify they are testing the correct behavior
- Implementation proceeds ONLY after tests are written and approved
- Red-Green-Refactor cycle is strictly enforced:
  1. **Red**: Write failing test
  2. **Green**: Write minimal code to pass test
  3. **Refactor**: Improve code while keeping tests green

**Rationale**: TDD ensures code correctness, prevents regressions, serves as living documentation, and forces developers to think about requirements before implementation. This is critical for a production service booking platform where booking errors, payment failures, or scheduling conflicts could severely damage business reputation.

**Verification**: Every pull request MUST demonstrate test-first commits (test commit timestamp before implementation commit). CI/CD pipeline MUST enforce 80%+ code coverage as a gate.

### II. Dockerized Local Development Environment

**Rule**: The entire development environment MUST run in Docker containers with zero local dependencies beyond Docker itself.

- PostgreSQL, Redis, backend, and frontend MUST all run in Docker
- Hot reload/HMR (Hot Module Replacement) MUST work inside Docker containers
- `npm start` or `make up` MUST be the ONLY command needed to start the full stack
- `.env` files MUST be auto-generated with sensible defaults
- Database migrations MUST run automatically on container startup
- Developer onboarding MUST take less than 15 minutes (from git clone to working app)

**Rationale**: Docker ensures "works on my machine" problems are eliminated, enables consistent development/staging/production environments, simplifies onboarding for new developers, and allows easy replication of the template across service verticals. The Argentina market expansion strategy depends on rapid deployment of new verticals.

**Verification**: New developers MUST successfully run the app with only Docker installed. CI/CD MUST use the same Docker images. Environment parity MUST be verified quarterly.

### III. TypeScript Everywhere

**Rule**: 100% TypeScript coverage across frontend and backend with strict type checking enabled.

- JavaScript files (.js) are PROHIBITED except in configuration files where necessary
- `strict: true` MUST be enabled in all tsconfig.json files
- `any` type is PROHIBITED except with explicit `// @ts-expect-error` justification
- All API contracts MUST have shared TypeScript types between frontend and backend
- Prisma schema MUST be the single source of truth for database types

**Rationale**: Type safety prevents entire classes of runtime errors, improves IDE support, serves as self-documenting code, and reduces debugging time. For a multi-tenant platform serving multiple service verticals, type safety is essential to prevent data corruption across tenants.

**Verification**: CI/CD MUST run `tsc --noEmit` with zero errors. ESLint MUST enforce no-explicit-any rule. Pull requests with `any` type require architecture team approval with written justification.

### IV. Argentina-First Localization

**Rule**: All features MUST support Argentina-specific formats, regulations, and cultural expectations as first-class citizens.

- Phone numbers MUST use +54 9 11 XXXX-XXXX format
- DNI MUST use XX.XXX.XXX format with validation
- Currency MUST handle Peso Argentino (ARS) with inflation-aware pricing
- Timezone MUST default to America/Argentina/Buenos_Aires
- All user-facing text MUST be in Spanish (es-AR)
- Payment integration MUST support MercadoPago as primary gateway
- AFIP integration MUST be available for tax compliance
- WhatsApp Business MUST be the primary communication channel

**Rationale**: The platform is purpose-built for the Argentina market, where local expectations differ significantly from international norms. Generic internationalization approaches fail to capture the nuances of Argentine business culture, payment preferences, and regulatory requirements.

**Verification**: All new features MUST pass Argentina localization review. Payment flows MUST be tested with MercadoPago sandbox. AFIP integration MUST be validated quarterly. WhatsApp Business integration MUST be tested in every release.

### V. Multi-Tenant Template Architecture

**Rule**: The codebase MUST maintain 85%+ code reuse across service verticals through template-based architecture.

- Niche-specific customizations MUST be isolated in `/niche-configs/` directory
- Core business logic MUST be vertical-agnostic
- New verticals MUST be replicable in 2-4 weeks (vs 6+ months from scratch)
- Multi-tenant data isolation MUST be enforced at database level
- White-label customization MUST be supported via configuration, not code changes

**Rationale**: The business strategy depends on rapidly deploying the template across multiple service verticals (barbers, psychologists, doctors, etc.). Hard-coding barber-specific logic would require rewriting code for each vertical, destroying the template value proposition.

**Verification**: Quarterly template replication exercise MUST successfully deploy a new vertical in under 4 weeks. Code review MUST reject vertical-specific logic in core services. Architecture review MUST audit code reuse metrics every 6 months.

### VI. Progressive Web App (PWA) Performance

**Rule**: The frontend MUST function as a high-performance Progressive Web App with mobile-first design.

- Mobile load time MUST be under 3 seconds on 4G networks
- Desktop load time MUST be under 1.5 seconds on broadband
- Core booking flow MUST work offline with service worker
- Lighthouse PWA score MUST be 90+ on all pages
- Touch targets MUST meet 44x44px minimum for mobile usability
- Images MUST be lazy-loaded and optimized for mobile bandwidth

**Rationale**: Argentine users primarily access services via mobile devices, often on limited bandwidth. A slow or desktop-focused app would fail in the market. PWA capabilities enable installation on home screens without app store friction, critical for user retention.

**Verification**: CI/CD MUST run Lighthouse tests with 90+ PWA score gate. Performance budgets MUST be enforced via webpack-bundle-analyzer. Mobile usability MUST be tested on real Argentine devices (Motorola, Samsung Galaxy mid-range).

### VII. Enterprise-Grade Observability

**Rule**: All production issues MUST be diagnosable through structured logging, monitoring, and error tracking.

- Structured logging MUST be implemented via Winston or Pino with JSON output
- All API requests MUST be traced with correlation IDs
- Error tracking MUST use Sentry or equivalent with full stack traces
- Performance monitoring MUST track p50, p95, p99 latencies
- Business metrics MUST be tracked (bookings created, payments processed, user registrations)
- Database queries MUST be logged with execution time in development
- Redis cache hit rates MUST be monitored in production

**Rationale**: A multi-tenant service booking platform requires rapid diagnosis of production issues to maintain SLA commitments. Without observability, debugging tenant-specific issues, payment failures, or performance degradations becomes guesswork, risking business reputation and revenue.

**Verification**: Production incidents MUST be resolved using logs/traces (no "works on my machine" debugging). Monitoring dashboards MUST be reviewed in weekly engineering meetings. Error rates and latencies MUST trigger automated alerts.

## Development Environment

### Docker Compose Infrastructure

**Required Services**:
- PostgreSQL 15 (alpine) - primary database
- Redis 7 (alpine) - caching and session storage
- pgAdmin - database administration UI (port 8080)
- Redis Commander - Redis inspection UI (port 8081)
- Backend (Fastify) - API server with hot reload (port 3000)
- Frontend (SvelteKit) - web application with HMR (port 5173)

**Required Workflow Commands**:
- `npm start` or `make up` - Start all services
- `npm stop` or `make down` - Stop all services
- `npm run logs` or `make logs` - Stream logs from all services
- `npm run status` or `make status` - Check service health
- `npm run setup` - First-time setup (install + migrate + seed)
- `npm run db:reset` - Reset database to clean state
- `make doctor` - Verify system prerequisites

**Hot Reload Requirements**:
- Backend MUST use `tsx watch` for TypeScript hot reload
- Frontend MUST use Vite HMR for instant updates
- Prisma client MUST regenerate on schema changes
- Docker volumes MUST be configured for source code sync

## Quality Standards

### Testing Requirements

**Test Pyramid**:
1. **Unit Tests**: 60% of test coverage
   - Pure functions, business logic, validators
   - Framework: Jest (backend), Vitest (frontend)

2. **Integration Tests**: 30% of test coverage
   - API endpoints, database operations, service interactions
   - Framework: Supertest (backend), Vitest (frontend)

3. **Contract Tests**: 5% of test coverage
   - API contracts between frontend and backend
   - Framework: Pact or manual contract validation

4. **E2E Tests**: 5% of test coverage
   - Critical user journeys (booking flow, payment flow)
   - Framework: Playwright

**Coverage Gates**:
- Overall code coverage MUST be 80%+ (enforced by CI/CD)
- Critical paths (booking, payment, authentication) MUST be 95%+
- New code MUST not decrease coverage percentage

**Test Execution**:
- `npm test` - Run all tests (backend + frontend)
- `npm run test:watch` - Run tests in watch mode for TDD workflow
- `npm run test:backend` - Run backend tests only
- `npm run test:frontend` - Run frontend tests only
- `npm run test:coverage` - Generate coverage reports

### Code Quality

**Linting & Formatting**:
- ESLint MUST enforce TypeScript best practices
- Prettier MUST enforce consistent formatting
- Pre-commit hooks MUST run lint + format
- CI/CD MUST reject commits with lint errors

**Code Review Requirements**:
- All code MUST be reviewed by at least one other developer
- Approval MUST verify TDD compliance (tests before implementation)
- Approval MUST verify Argentina localization compliance
- Approval MUST verify no vertical-specific logic in core services

## Governance

### Amendment Procedure

This constitution supersedes all other development practices and guidelines.

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Architecture team MUST review and approve
3. Migration plan MUST be provided for existing code
4. Documentation MUST be updated before merge
5. All team members MUST be notified of changes

**Versioning Policy**:
- **MAJOR** (X.0.0): Backward incompatible governance changes (principle removals/redefinitions)
- **MINOR** (0.X.0): New principles added or materially expanded guidance
- **PATCH** (0.0.X): Clarifications, wording, typo fixes, non-semantic refinements

**Compliance Review**:
- All pull requests MUST verify compliance with this constitution
- Quarterly audits MUST review adherence to principles
- Violations MUST be documented with justification and remediation plan
- Complexity that violates principles MUST be approved by architecture team with written rationale

**Runtime Development Guidance**:
- See `CLAUDE.md` for AI assistant guidance during development
- See `README.md` for onboarding and quick start instructions
- See `docs/` directory for feature-specific documentation

**Version**: 1.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
