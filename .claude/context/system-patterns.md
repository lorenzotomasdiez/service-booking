---
created: 2025-10-10T03:05:12Z
last_updated: 2025-10-10T03:05:12Z
version: 1.0
author: Claude Code PM System
---

# System Patterns & Architecture

## Architectural Style

### Monolithic Monorepo
- **Pattern**: Full-stack monorepo with clear domain boundaries
- **Rationale**: Faster initial development, easier deployment, simplified coordination
- **Future Path**: Service-oriented architecture as scale demands

### Layered Architecture

**Frontend Layers:**
1. **Routes** (Presentation) - SvelteKit file-based routing
2. **Components** (UI) - Reusable Svelte components
3. **Stores** (State) - Svelte stores for state management
4. **Services** (Business Logic) - Frontend service layer
5. **API Client** - Communication with backend

**Backend Layers:**
1. **Routes** (API Gateway) - Fastify route handlers
2. **Middleware** - Authentication, validation, rate limiting
3. **Services** (Business Logic) - Core application logic (126+ files)
4. **Repositories** (Data Access) - Prisma ORM abstraction
5. **Database** - PostgreSQL + Redis

## Design Patterns

### Backend Patterns

**Service Layer Pattern**
- Business logic isolated in dedicated service files
- Clear separation between routes (HTTP) and business logic
- Services are stateless and testable
- Example: `services/booking.service.ts`, `services/payment.service.ts`

**Repository Pattern (via Prisma)**
- Database access abstracted through Prisma Client
- Type-safe queries with compile-time validation
- Migration-based schema evolution

**Middleware Chain Pattern**
- Fastify middleware for cross-cutting concerns
- Authentication, rate limiting, CORS, logging
- Composable and reusable middleware functions

**Dependency Injection (Implicit)**
- Services receive dependencies via function parameters
- Prisma client and Redis instances passed to services
- Facilitates testing with mock implementations

**API Gateway Pattern**
- Single entry point through Fastify
- Swagger/OpenAPI documentation
- Centralized error handling and response formatting

### Frontend Patterns

**Component-Driven Development**
- 121+ reusable Svelte components
- Organized by domain (ai, monitoring, booking, core)
- Props-based communication between components

**Store Pattern (State Management)**
- Svelte writable/readable stores for shared state
- Stores: auth, booking, performance, monitoring
- Reactive updates propagate automatically

**Service Layer Pattern**
- Frontend services mirror backend domains
- Socket.io, analytics, performance optimization
- Encapsulate API calls and business logic

**File-Based Routing**
- SvelteKit convention: `+page.svelte`, `+layout.svelte`
- Server-side logic in `+server.ts` files
- Automatic code splitting per route

**Observer Pattern (Svelte Reactivity)**
- Reactive statements (`$:`) for derived state
- Store subscriptions (`$store`) for reactive updates
- Event dispatching for component communication

## Data Flow Patterns

### Request Flow (Backend)
```
HTTP Request → Fastify Route → Middleware Chain → Route Handler →
Service Layer → Prisma/Redis → Database → Service → Route Handler →
HTTP Response
```

### Real-Time Flow
```
Client Event → Socket.io Client → WebSocket → Socket.io Server →
Service Layer → Broadcast → All Connected Clients
```

### State Management Flow (Frontend)
```
User Action → Component Event → Store Update → Reactive Update →
UI Re-render
```

### API Communication Pattern
```
Component → Service Layer → fetch/axios → Backend API →
JSON Response → Service Layer → Store Update → Component Update
```

## Architectural Decisions

### Monorepo Strategy
- **Decision**: npm workspaces with frontend/backend separation
- **Rationale**: Shared tooling, coordinated releases, simplified CI/CD
- **Trade-off**: Larger repository size, shared dependency management

### TypeScript Everywhere
- **Decision**: Full TypeScript adoption (frontend + backend)
- **Rationale**: Type safety, better IDE support, reduced runtime errors
- **Trade-off**: Learning curve, build step required

### Prisma as ORM
- **Decision**: Prisma over TypeORM or raw SQL
- **Rationale**: Type-safe queries, excellent migrations, Argentina timezone support
- **Trade-off**: Vendor lock-in, migration complexity for advanced features

### SvelteKit over React/Next.js
- **Decision**: SvelteKit for frontend framework
- **Rationale**: Smaller bundle sizes, better performance, simpler reactivity
- **Trade-off**: Smaller ecosystem, fewer third-party components

### Fastify over Express
- **Decision**: Fastify for backend framework
- **Rationale**: Better performance, built-in validation, schema-based routing
- **Trade-off**: Smaller ecosystem, different middleware patterns

## Event-Driven Architecture

### Real-Time Events (Socket.io)
- **Booking Updates**: Notify users of appointment changes
- **Payment Status**: Real-time payment confirmation
- **Notifications**: In-app alerts and messages
- **Live Analytics**: Real-time dashboard updates

### Event Naming Convention
```typescript
// Pattern: {domain}.{action}.{status}
'booking.created'
'booking.updated'
'booking.cancelled'
'payment.pending'
'payment.completed'
'payment.failed'
```

## Caching Strategy

### Redis Caching Layers
1. **Session Cache**: User sessions and JWT tokens
2. **Data Cache**: Frequently accessed data (services, providers)
3. **Rate Limiting**: API request throttling
4. **Real-Time State**: Socket.io room management

### Cache Invalidation
- Time-based expiration (TTL)
- Event-driven invalidation (on data mutation)
- Cache-aside pattern (lazy loading)

## Error Handling Patterns

### Backend Error Handling
```typescript
// Centralized error handling in Fastify
app.setErrorHandler((error, request, reply) => {
  // Log error, format response, set status code
})
```

**Error Categories:**
- **Validation Errors**: 400 Bad Request
- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden
- **Not Found**: 404 Not Found
- **Server Errors**: 500 Internal Server Error

### Frontend Error Handling
- **ErrorBoundary Component**: Catch component errors
- **Service Layer**: Try-catch blocks for API calls
- **User Feedback**: Toast notifications, error messages
- **Monitoring**: Track errors for debugging

## Security Patterns

### Authentication Flow
```
1. User login → Credentials sent to /auth/login
2. Backend validates → bcrypt password comparison
3. JWT token generated → Signed with secret
4. Token returned → Stored in httpOnly cookie
5. Subsequent requests → JWT in Authorization header
6. Middleware validates → Decodes and verifies token
```

### Authorization Pattern
- **Role-Based Access Control (RBAC)**: User roles (customer, provider, admin)
- **Middleware Guards**: Check permissions before route access
- **Resource Ownership**: Verify user owns the resource being accessed

### Input Validation
- **Backend**: Zod/TypeBox schemas validate all inputs
- **Frontend**: Client-side validation for UX, backend for security
- **Sanitization**: DOMPurify for XSS prevention

## Template Replication Pattern

### Multi-Tenant Architecture
- **Database**: Shared schema with tenant_id isolation
- **Branding**: White-label themes per tenant
- **Configuration**: `/niche-configs/` for vertical-specific settings

### Vertical Replication Process
1. **Clone Repository**: Copy entire codebase
2. **Update Configuration**: Modify `/niche-configs/{vertical}.json`
3. **Customize Services**: Adjust service types and scheduling rules
4. **Theme Customization**: Update design tokens and branding
5. **Deploy**: Use same infrastructure pipeline

**Target Reuse**: 85% code reuse, 15% vertical-specific customization

## Performance Patterns

### Frontend Optimization
- **Code Splitting**: Vite dynamic imports per route
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Sharp for server-side resizing
- **PWA**: Service worker for offline capability

### Backend Optimization
- **Connection Pooling**: Prisma connection pooling
- **Query Optimization**: Prisma query batching and indexing
- **Redis Caching**: Reduce database load
- **Rate Limiting**: Protect against abuse

## Testing Patterns

### Frontend Testing
- **Unit Tests**: Vitest for components and utilities
- **Component Tests**: Isolated Svelte component testing
- **E2E Tests**: Playwright for user workflows

### Backend Testing
- **Unit Tests**: Jest for service layer testing
- **Integration Tests**: Supertest for API endpoint testing
- **Performance Tests**: Artillery for load testing

### Test Organization
```
{filename}.test.ts - Unit tests
{filename}.spec.ts - Alternative test naming
__tests__/ - Test directory convention
```

## Observability Patterns

### Logging
- **Pino**: Structured JSON logging (backend)
- **Log Levels**: error, warn, info, debug, trace
- **Request ID**: Track requests across services

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Loki**: Log aggregation and search

### Analytics
- **Custom Analytics**: Business intelligence tracking
- **UX Monitoring**: User experience metrics
- **Performance Tracking**: Frontend and backend performance
