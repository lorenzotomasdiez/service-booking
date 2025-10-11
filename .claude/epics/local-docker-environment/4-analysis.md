---
issue: 4
title: Build MercadoPago Mock Server
analyzed: 2025-10-10T20:50:08Z
estimated_hours: 10-12
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #4

## Overview
Build a lightweight Express.js mock server that simulates the MercadoPago payment gateway API for local development and testing. The mock server needs to support payment endpoints, webhook simulation, configurable scenarios, a web dashboard, Docker containerization, and comprehensive testing.

## Parallel Streams

### Stream A: Core Server & Payment API
**Scope**: Set up Express.js server structure, payment endpoints, and core payment logic
**Files**:
- `docker/mocks/mercadopago/package.json`
- `docker/mocks/mercadopago/index.js`
- `docker/mocks/mercadopago/routes/payments.js`
- `docker/mocks/mercadopago/services/payment.service.js`
- `docker/mocks/mercadopago/config/scenarios.json`
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 4-5
**Dependencies**: none

**Details**:
- Initialize Node.js project with Express.js
- Implement POST `/v1/payments` endpoint
- Implement GET `/v1/payments/:id` endpoint
- Implement scenario configuration system
- Add payment validation logic
- Add in-memory transaction storage
- Add structured logging with Winston

### Stream B: Refunds & Payment Methods API
**Scope**: Implement refund endpoints and payment methods listing
**Files**:
- `docker/mocks/mercadopago/routes/refunds.js`
- `docker/mocks/mercadopago/routes/payment-methods.js`
- `docker/mocks/mercadopago/services/payment.service.js` (extend)
**Agent Type**: general-purpose
**Can Start**: immediately
**Estimated Hours**: 2-3
**Dependencies**: none (can work independently, merge with Stream A later)

**Details**:
- Implement POST `/v1/payments/:id/refunds` endpoint
- Implement GET `/v1/payment_methods` endpoint
- Add refund validation logic
- Add payment method data for Argentina (cards, wallets, BNPL, Rapipago, PagoFacil)
- Handle installment calculations

### Stream C: Webhook Simulation
**Scope**: Build webhook delivery system with configurable delays
**Files**:
- `docker/mocks/mercadopago/routes/webhooks.js`
- `docker/mocks/mercadopago/services/webhook.service.js`
**Agent Type**: general-purpose
**Can Start**: after Stream A provides payment storage interface
**Estimated Hours**: 2
**Dependencies**: Stream A (needs payment storage and event system)

**Details**:
- Implement webhook trigger mechanism
- Add configurable delay support
- Build webhook payload generation
- Add retry logic for failed webhooks
- Implement webhook endpoint for manual triggers via dashboard

### Stream D: Web Dashboard & Documentation
**Scope**: Create web UI for scenario management and API documentation
**Files**:
- `docker/mocks/mercadopago/public/dashboard.html`
- `docker/mocks/mercadopago/public/styles.css`
- `docker/mocks/mercadopago/public/dashboard.js`
- `docker/mocks/mercadopago/routes/dashboard.js` (API for dashboard)
**Agent Type**: general-purpose
**Can Start**: immediately (can develop UI mockups in parallel)
**Estimated Hours**: 2
**Dependencies**: none initially, integrates with Stream A later

**Details**:
- Build HTML/CSS/JS dashboard interface
- Add scenario switcher UI
- Add transaction history viewer
- Add manual webhook trigger button
- Add transaction history clear function
- Implement Swagger/OpenAPI documentation at `/docs`

### Stream E: Docker & Testing
**Scope**: Dockerfile, health checks, unit tests, and integration
**Files**:
- `docker/mocks/mercadopago/Dockerfile`
- `docker/mocks/mercadopago/.dockerignore`
- `docker/mocks/mercadopago/tests/payment.test.js`
- `docker/mocks/mercadopago/tests/webhook.test.js`
- `docker/mocks/mercadopago/README.md`
- `docker-compose.mocks.yml` (update)
**Agent Type**: general-purpose
**Can Start**: immediately for Dockerfile, tests after Stream A completes core logic
**Estimated Hours**: 2-3
**Dependencies**: Dockerfile can start immediately, tests depend on Streams A, B, C

**Details**:
- Create Node.js 20 Alpine Dockerfile
- Add health check endpoint at `/health`
- Write unit tests for payment validation
- Write unit tests for status transitions
- Write integration tests for full payment flow
- Create README with API documentation
- Add Postman collection for testing
- Update docker-compose.mocks.yml

## Coordination Points

### Shared Files
- `docker/mocks/mercadopago/services/payment.service.js` - Streams A & B extend this (coordinate method additions)
- `docker/mocks/mercadopago/package.json` - All streams may add dependencies (coordinate package additions)
- `docker/mocks/mercadopago/index.js` - Streams A, B, C, D add route handlers (coordinate route registration)

### Sequential Requirements
1. **Stream A (Core Server)** must establish:
   - Express app structure
   - Payment storage interface
   - Logging setup
   - Basic route structure
2. **Stream C (Webhooks)** depends on Stream A's payment storage
3. **Stream D (Dashboard)** can develop UI independently but needs Stream A's API endpoints for integration
4. **Stream E (Tests)** requires Streams A, B, C to complete core logic before testing

## Conflict Risk Assessment
- **Low Risk**: Most streams work on separate files
- **Medium Risk**:
  - `index.js` - Multiple streams register routes (easily resolved with clear sections)
  - `payment.service.js` - Streams A & B extend (coordinate method placement)
  - `package.json` - Multiple dependencies added (merge carefully)
- **High Risk**: None identified

## Parallelization Strategy

**Recommended Approach**: Hybrid (parallel start with sequential dependencies)

**Phase 1 - Parallel Launch** (Streams A, B, D, E-Dockerfile):
- Stream A: Core server & payment endpoints
- Stream B: Refunds & payment methods
- Stream D: Web dashboard UI development
- Stream E: Dockerfile and project setup

**Phase 2 - Integration** (After Stream A completes core):
- Stream C: Webhook simulation (depends on Stream A)
- Stream D: Dashboard integration with APIs
- Stream E: Unit and integration tests

**Phase 3 - Final Integration**:
- Merge all streams
- Complete docker-compose integration
- Final testing with BarberPro app

## Expected Timeline

**With parallel execution**:
- Phase 1 (parallel): 4-5 hours (Stream A is longest)
- Phase 2 (parallel): 2 hours (Streams C, D integration, Stream E tests)
- Phase 3 (integration): 1 hour
- **Total wall time**: ~7-8 hours

**Without parallel execution** (sequential):
- Total work: 12-14 hours
- **Efficiency gain**: ~40-50% time reduction

## Notes

**Start Order Priority**:
1. **Stream A** (highest priority) - Establishes foundation
2. **Stream B** - Can work independently
3. **Stream D** - UI can be developed with mock data
4. **Stream E** - Dockerfile immediately, tests later
5. **Stream C** - Starts after Stream A provides interfaces

**Coordination Strategy**:
- Stream A should commit early with basic structure so others can integrate
- Use clear code sections in `index.js` for route registration (comments like `// Payment routes`, `// Refund routes`, etc.)
- Coordinate `package.json` updates in merge requests
- Stream D can build dashboard with mock data first, swap to real API later

**Risk Mitigation**:
- Have Stream A create and commit basic structure (index.js, package.json skeleton) within first hour
- Streams B, D, E can pull that structure and build on it
- Use feature branches if needed: `stream-a-payments`, `stream-b-refunds`, etc.

**Testing Approach**:
- Stream E should write test skeletons early that other streams can run
- Each stream runs their tests before marking complete
- Final integration test ensures all pieces work together
