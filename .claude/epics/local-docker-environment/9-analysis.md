---
issue: 9
title: Integration Testing & Environment Variable Configuration
analyzed: 2025-10-12T04:34:31Z
estimated_hours: 9
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #9

## Overview

Configure environment variables to connect the BarberPro application to all mock services, and perform comprehensive integration testing to ensure the entire Docker environment works end-to-end. This task involves three main areas: environment configuration, backend/frontend integration, and test automation.

## Parallel Streams

### Stream A: Environment Configuration & Documentation
**Scope**: Create environment files, document variable precedence, and write troubleshooting guides
**Files**:
- `.env.development`
- `.env.example` (update)
- `docs/environment-setup.md`
- `docs/troubleshooting-docker.md`
- `docs/environment-variables.md`
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2.5 hours
**Dependencies**: none

**Tasks**:
- Create `.env.development` with all Docker service URLs
- Update `.env.example` with new variables
- Document environment variable precedence (CLI → .env.local → .env.development → defaults)
- Write troubleshooting guide for common Docker networking issues
- Create environment variable reference document

### Stream B: Backend Configuration & Integration
**Scope**: Update backend configuration files to support mock services and Docker networking
**Files**:
- `backend/src/config/mercadopago.config.ts`
- `backend/src/config/afip.config.ts`
- `backend/src/config/whatsapp.config.ts`
- `backend/src/config/sms.config.ts`
- `backend/src/config/email.config.ts`
- `backend/src/config/database.config.ts`
- `backend/src/config/redis.config.ts`
- `backend/src/middleware/cors.ts`
**Agent Type**: backend-specialist
**Can Start**: after Stream A completes (needs .env.development)
**Estimated Hours**: 2.5 hours
**Dependencies**: Stream A

**Tasks**:
- Update each service config to read from environment variables
- Add `isMock` flag based on NODE_ENV
- Update CORS middleware to accept Docker container IPs
- Configure database connection for Docker network (postgres:5432)
- Configure Redis connection for Docker network (redis:6379)
- Add validation for required environment variables

### Stream C: Frontend Configuration & Integration
**Scope**: Update frontend configuration to connect to Dockerized backend
**Files**:
- `frontend/src/lib/config.ts`
- `frontend/.env.development`
- `frontend/vite.config.ts`
**Agent Type**: frontend-specialist
**Can Start**: immediately (independent of other streams)
**Estimated Hours**: 1 hour
**Dependencies**: none

**Tasks**:
- Create frontend `.env.development` with VITE_ prefixed variables
- Update `config.ts` to use environment variables for API URL
- Configure Vite to handle Docker networking
- Set MercadoPago public key from environment

### Stream D: Integration Test Scripts
**Scope**: Create comprehensive integration test scripts and test configuration
**Files**:
- `scripts/test-integration.sh`
- `docker-compose.test.yml`
- `scripts/test-payment-flow.sh`
- `scripts/test-notifications.sh`
- `scripts/test-database.sh`
**Agent Type**: qa-specialist
**Can Start**: after Streams B & C complete (needs configured services)
**Estimated Hours**: 3 hours
**Dependencies**: Streams B, C

**Tasks**:
- Create main integration test script (`test-integration.sh`)
- Write payment flow test (booking → MercadoPago → verification)
- Write AFIP tax reporting test
- Write notification tests (WhatsApp, SMS, Email via MailHog)
- Write database test (migrations, seeds, queries)
- Create full-stack test (frontend → backend → database → response)
- Create `docker-compose.test.yml` for test-specific configuration
- Add test scripts to Makefile for easy execution

## Coordination Points

### Shared Files
These files may need coordination between streams:
- `.env.example` - Stream A creates, Stream B/C may update with additional variables
- `Makefile` - Stream D adds test commands, should coordinate with existing commands

### Sequential Requirements
The work must happen in this order:
1. **Stream A first**: Environment files must exist before backend/frontend can be configured
2. **Stream C parallel to A**: Frontend config is independent and can run alongside
3. **Stream B after A**: Backend needs environment variables defined in Stream A
4. **Stream D last**: Integration tests need both backend and frontend configured

## Conflict Risk Assessment

**Low Risk**: Streams work on different areas with minimal overlap
- Stream A: Documentation and env files
- Stream B: Backend configuration
- Stream C: Frontend configuration
- Stream D: Test scripts

**Potential Conflicts**:
- `.env.example`: Both Stream A and Stream B/C may update this file
  - **Mitigation**: Stream A creates base template, B/C add variables as needed
- `Makefile`: Stream D adds test commands
  - **Mitigation**: Add test commands in a new section, don't modify existing commands

## Parallelization Strategy

**Recommended Approach**: Hybrid (partial parallelization)

**Phase 1 (Parallel)**: Launch Streams A and C simultaneously
- Stream A: Environment config & docs (2.5h)
- Stream C: Frontend config (1h)

**Phase 2 (Sequential)**: Stream B after A completes
- Stream B: Backend config (2.5h)
- Depends on: .env.development from Stream A

**Phase 3 (Sequential)**: Stream D after B & C complete
- Stream D: Integration tests (3h)
- Depends on: Configured backend (B) and frontend (C)

## Expected Timeline

**With parallel execution (hybrid approach)**:
- Phase 1: max(2.5h, 1h) = 2.5 hours (A & C parallel)
- Phase 2: 2.5 hours (B sequential after A)
- Phase 3: 3 hours (D sequential after B & C)
- **Wall time: 8 hours**
- **Total work: 9 hours**
- **Efficiency gain: 11%**

**Without parallel execution (fully sequential)**:
- Wall time: 9 hours (sum of all streams)

**Parallelization Factor**: 2.5x
- Note: Limited parallelization due to dependencies (A → B → D chain)
- Main benefit is running C parallel to A, saving 1 hour

## Notes

### Special Considerations

1. **Environment Variable Naming**:
   - Backend uses standard names: `DATABASE_URL`, `REDIS_URL`
   - Frontend requires `VITE_` prefix: `VITE_BACKEND_URL`, `VITE_MERCADOPAGO_PUBLIC_KEY`
   - Document this convention clearly

2. **Docker Networking**:
   - Services must use Docker service names (e.g., `postgres:5432` not `localhost:5432`)
   - Webhooks must use internal URLs (`http://backend:3000` not `http://localhost:3000`)
   - CORS must allow both localhost and Docker network IPs

3. **Testing Order**:
   - Test individual services first (database, redis, each mock)
   - Then test integration flows (payment, notifications)
   - Finally test full-stack (frontend → backend → database → response)

4. **Dependencies**:
   - This issue depends on tasks #2, #3, #7 being complete
   - Verify docker-compose files and Makefile are ready
   - Verify all mocks (MercadoPago, AFIP, WhatsApp, SMS) are available

### Warnings

- **CORS Configuration**: Be careful with regex patterns for Docker IPs - test thoroughly
- **Environment Precedence**: Make sure .env.local (gitignored) takes precedence over .env.development
- **Secret Management**: Never commit real credentials to .env.development
- **Database Connections**: Ensure proper health checks before backend connects

### Success Validation

After completion, validate:
```bash
# 1. Services start cleanly
make up && make status

# 2. Backend connects to all services
make logs-backend | grep -i "connected"

# 3. Frontend loads
curl -s http://localhost:5173 | grep -q "html"

# 4. Integration tests pass
bash scripts/test-integration.sh

# 5. Manual verification
# - Create booking via frontend
# - Verify payment mock response
# - Check MailHog for email
# - Verify database entry
```
