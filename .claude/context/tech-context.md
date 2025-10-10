---
created: 2025-10-10T03:05:12Z
last_updated: 2025-10-10T03:05:12Z
version: 1.0
author: Claude Code PM System
---

# Technology Context

## Language & Runtime

- **Primary Language**: TypeScript 5.9.2
- **Runtime**: Node.js (ES Modules for frontend, CommonJS for backend)
- **Package Manager**: npm with workspaces

## Frontend Stack

### Core Framework
- **SvelteKit**: 2.37.1 - Meta-framework with SSR/SSG
- **Svelte**: 5.38.8 - Reactive UI framework
- **Vite**: 7.1.5 - Build tool and dev server

### Styling & UI
- **TailwindCSS**: 3.4.4 - Utility-first CSS framework
- **Tailwind Plugins**:
  - @tailwindcss/aspect-ratio: 0.4.2
  - @tailwindcss/forms: 0.5.7
  - @tailwindcss/typography: 0.5.13
- **Fonts**:
  - @fontsource/inter: 5.0.18
  - @fontsource/poppins: 5.0.14
  - @fontsource/fira-mono: 5.2.6

### Frontend Libraries
- **Chart.js**: 4.4.0 - Data visualization
- **chartjs-adapter-date-fns**: 3.0.0 - Time series charts
- **date-fns**: 3.6.0 - Date manipulation
- **Fuse.js**: 7.0.0 - Fuzzy search
- **Socket.io-client**: 4.8.1 - Real-time communication
- **MercadoPago**: 2.9.0 - Payment integration
- **Zod**: 4.1.5 - Schema validation
- **js-cookie**: 3.0.5 - Cookie management
- **uuid**: 8.3.2 - Unique ID generation
- **crypto-js**: 4.2.0 - Encryption utilities
- **dompurify**: 3.0.8 - XSS sanitization
- **sortablejs**: 1.15.2 - Drag-and-drop

### Frontend Testing
- **Vitest**: 2.0.5 - Unit testing framework
- **@vitest/coverage-v8**: 2.0.5 - Coverage reporting
- **svelte-check**: 4.3.1 - Type checking for Svelte

### Frontend Dev Tools
- **ESLint**: 9.9.1 - Code linting
- **eslint-plugin-svelte**: 2.43.0 - Svelte-specific rules
- **PostCSS**: 8.4.38 - CSS processing
- **Autoprefixer**: 10.4.19 - CSS vendor prefixing
- **Terser**: 5.44.0 - JavaScript minification

## Backend Stack

### Core Framework
- **Fastify**: 5.6.0 - High-performance web framework
- **Fastify Plugins**:
  - @fastify/cors: 11.1.0 - CORS support
  - @fastify/jwt: 10.0.0 - JWT authentication
  - @fastify/multipart: 9.2.1 - File uploads
  - @fastify/rate-limit: 10.3.0 - Rate limiting
  - @fastify/swagger: 9.5.1 - API documentation
  - @fastify/swagger-ui: 5.2.3 - Swagger UI
  - @fastify/type-provider-typebox: 5.2.0 - Type-safe routing

### Database & ORM
- **Prisma**: 6.15.0 - Type-safe ORM
- **@prisma/client**: 6.15.0 - Prisma client
- **PostgreSQL**: Primary database (via Docker)
- **Redis**: 5.8.2 - Caching and sessions (via Docker)

### Authentication & Security
- **bcrypt**: 5.1.1 - Password hashing
- **bcryptjs**: 3.0.2 - Password hashing (JS implementation)
- **jsonwebtoken**: 9.0.2 - JWT tokens
- **@fastify/jwt**: 10.0.0 - JWT integration

### Validation & Type Safety
- **Zod**: 4.1.5 - Runtime validation
- **@sinclair/typebox**: 0.34.41 - JSON Schema type builder
- **express-validator**: 7.0.1 - Request validation

### Payment Integration
- **MercadoPago**: 2.9.0 - Argentina payment gateway
- **axios**: 1.6.0 - HTTP client for API calls

### File Processing
- **sharp**: 0.34.3 - Image processing
- **pdfkit**: 0.15.0 - PDF generation
- **exceljs**: 4.4.0 - Excel file generation
- **csv-writer**: 1.6.0 - CSV export

### Real-time & Communication
- **Socket.io**: 4.8.1 - WebSocket server
- **express**: 5.1.0 - HTTP server (for Socket.io compatibility)

### Backend Dev Tools
- **tsx**: 4.20.5 - TypeScript execution
- **nodemon**: 3.1.10 - Auto-restart on changes
- **ESLint**: 9.12.0 - Code linting
- **@typescript-eslint/eslint-plugin**: 8.7.0
- **@typescript-eslint/parser**: 8.7.0

### Monitoring & Logging
- **pino-pretty**: 13.1.1 - Pretty-print logs

## Testing Infrastructure

### E2E Testing
- **@playwright/test**: 1.47.2 (root), 1.55.0 (backend) - Browser automation

### Performance Testing
- **Artillery**: 2.0.20 (root), 2.0.24 (backend) - Load testing

## Infrastructure & DevOps

### Containerization
- **Docker**: Multi-stage builds for frontend, backend, and databases
- **docker-compose**: Development, production, and dev-only configurations
  - Services: PostgreSQL, Redis, Nginx, monitoring stack

### Monitoring Stack (Docker-based)
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation

### Deployment Targets
- **Railway**: Primary deployment platform
- **AWS**: Alternative/production deployment
- **Docker Registry**: Container storage

## Build Tools

### Root Level
- **concurrently**: 9.2.1 - Run multiple commands

### Frontend Build
- **Vite**: Fast development and optimized production builds
- **SvelteKit adapter-auto**: Automatic deployment adapter selection

### Backend Build
- **TypeScript Compiler**: Compiles to `dist/` directory
- **CommonJS output**: Node.js compatibility

## Development Workflow

### Package Scripts Organization
- **dev**: Concurrent frontend + backend development
- **build**: Full production build
- **test**: Comprehensive test suite (unit, integration, e2e)
- **lint**: Code quality checks
- **docker**: Container management
- **db**: Database operations via Prisma

### Code Quality Tools
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting (backend)
- **TypeScript**: Static type checking
- **svelte-check**: Svelte component type checking

## External Services Integration

### Payment Processing
- **MercadoPago SDK**: Argentina-specific payment gateway
- **AFIP**: Tax compliance integration (via custom services)

### Communication
- **WhatsApp Business API**: Customer communication
- **Socket.io**: Real-time in-app communication

### Analytics & Monitoring
- Custom analytics services
- Performance monitoring
- UX analytics
- Customer success tracking

## Version Constraints

### Node.js
- Recommended: Node.js 18+ (based on TypeScript and package versions)

### Browser Support
- Modern browsers (ES6+)
- PWA-capable browsers
- Mobile-first design (iOS Safari, Android Chrome)

## Argentina-Specific Tech Requirements

### Localization Libraries
- **date-fns**: Timezone handling (America/Argentina/Buenos_Aires)
- Custom formatters for:
  - Phone numbers: +54 9 11 1234-5678
  - DNI: 12.345.678
  - Currency: ARS with inflation adjustments

### Payment Compliance
- **MercadoPago**: PCI DSS compliant payment processing
- **AFIP Integration**: Tax reporting and compliance
