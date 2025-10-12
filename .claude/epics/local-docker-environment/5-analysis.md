---
issue: 5
analyzed_at: 2025-10-12T01:36:59Z
parallel_streams: 3
dependencies: []
---

# Issue #5 Analysis: Build AFIP Mock Server

## Work Streams

### Stream A: Core Infrastructure & Database
**Agent**: general-purpose
**Can Start**: Immediately (no dependencies)
**Scope**:
- Project setup (package.json, dependencies)
- SQLite database setup (schema, connection)
- Directory structure creation
- Configuration system (rules.json, env vars)
- Express.js server bootstrap

**Files**:
- `docker/mocks/afip/package.json`
- `docker/mocks/afip/index.js`
- `docker/mocks/afip/database/db.js`
- `docker/mocks/afip/database/schema.sql`
- `docker/mocks/afip/config/rules.json`
- `docker/mocks/afip/.env.example`

**Deliverables**:
- Running Express server on port 3002
- SQLite database initialized with schema
- Configuration loading system
- Health check endpoint at `/health`

---

### Stream B: AFIP Business Logic
**Agent**: general-purpose
**Can Start**: After Stream A completes database setup
**Scope**:
- CUIT/CUIL validation service
- CAE generation service
- Invoice service with sequencing
- IVA calculation logic
- Tax category validation

**Files**:
- `docker/mocks/afip/services/cuit.service.js`
- `docker/mocks/afip/services/cae.service.js`
- `docker/mocks/afip/services/invoice.service.js`

**Deliverables**:
- CUIT checksum validation working
- CAE generation with realistic format
- Invoice number sequencing per POS
- IVA calculation accuracy

---

### Stream C: API Routes & Documentation
**Agent**: general-purpose
**Can Start**: After Stream A & B (needs services and DB)
**Scope**:
- AFIP WebService endpoints
- Swagger/OpenAPI documentation
- Route handlers
- Request validation
- Response formatting

**Files**:
- `docker/mocks/afip/routes/auth.js`
- `docker/mocks/afip/routes/invoice.js`
- `docker/mocks/afip/routes/validation.js`

**Endpoints**:
- POST `/wsaa/auth` - Authentication mock
- POST `/wsfev1/FECAESolicitar` - Request CAE
- GET `/wsfev1/FECompUltimoAutorizado` - Last invoice number
- POST `/wsfev1/FEParamGetPtosVenta` - Get POS list
- POST `/ws_sr_padron_a5/getPersona` - Validate CUIT/CUIL
- GET `/docs` - Swagger documentation

---

### Stream D: Docker & Testing
**Agent**: general-purpose
**Can Start**: After Stream A, B, C complete (needs full implementation)
**Scope**:
- Dockerfile creation
- Docker Compose integration
- Unit tests (CUIT validation, invoice logic)
- Integration tests
- README documentation

**Files**:
- `docker/mocks/afip/Dockerfile`
- `docker/mocks/afip/tests/cuit.test.js`
- `docker/mocks/afip/tests/invoice.test.js`
- `docker/mocks/afip/README.md`
- `docker-compose.mocks.yml` (update)

**Deliverables**:
- Docker container builds and runs
- Health check passes
- Unit tests >70% coverage
- Integration with main docker-compose
- Complete documentation

---

## Execution Strategy

### Phase 1: Foundation (Stream A only)
Launch Stream A to set up infrastructure. Wait for completion before starting other streams.

**Critical Path**: Stream A → Stream B → Stream C → Stream D

### Phase 2: Business Logic (Stream B only)
After Stream A completes, Stream B can implement services.

### Phase 3: API Layer (Stream C only)
After Stream B completes, Stream C can build routes.

### Phase 4: Deployment (Stream D only)
After all implementation complete, Stream D handles Docker and testing.

---

## Coordination Notes

- **Stream A is blocking**: Must complete before others can proceed
- **Stream B depends on Stream A**: Needs database and config
- **Stream C depends on Stream B**: Needs services
- **Stream D depends on all**: Needs complete implementation
- **Sequential execution required**: Cannot parallelize this task effectively

## Recommendation

Due to strong dependencies between streams, consider launching streams sequentially:
1. Start Stream A first
2. After A completes, start Stream B
3. After B completes, start Stream C
4. After C completes, start Stream D

Alternative: Launch all streams but with explicit wait conditions in their prompts.
