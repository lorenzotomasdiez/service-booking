---
issue: 7
title: Integrate MailHog and Create docker-compose.mocks.yml
analyzed: 2025-10-12T03:14:02Z
estimated_hours: 5
parallelization_factor: 2.5
---

# Parallel Work Analysis: Issue #7

## Overview

Integrate MailHog email testing solution and consolidate all Argentina mock servers (MercadoPago, AFIP, WhatsApp, SMS, Email) into a single production-ready `docker-compose.mocks.yml` file. The mock directories already exist, but the docker-compose file is currently a placeholder. This task involves updating the compose file, adding Makefile commands, configuring environment variables, and creating documentation.

## Parallel Streams

### Stream A: Docker Compose Configuration
**Scope**: Update docker-compose.mocks.yml with all 5 mock services
**Files**:
- `docker/docker-compose.mocks.yml` (replace placeholder)
- Network configuration (barberpro-dev-network)
- Volume definitions for AFIP data
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Tasks**:
- Replace placeholder docker-compose.mocks.yml with actual service definitions
- Configure all 5 services: MercadoPago, AFIP, WhatsApp, SMS, MailHog
- Set up health checks for all services
- Configure resource limits (CPU, memory)
- Set up shared network: barberpro-dev-network
- Configure AFIP volume for persistent data
- Ensure consistent container naming: barberpro-<service>-mock

### Stream B: Makefile Integration
**Scope**: Add mock service management commands to Makefile
**Files**:
- `Makefile` (add mocks commands section)
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 1
**Dependencies**: none

**Tasks**:
- Add `make mocks` command with service URLs display
- Add `make mocks-down` command
- Add `make mocks-logs` command
- Add `make mocks-reset` command (with volume cleanup)
- Include color-coded output and user-friendly messages
- Add help text for each command

### Stream C: Environment Configuration
**Scope**: Document environment variables for all mock services
**Files**:
- `docker/.env.example` (add mock service variables)
- Individual mock `.env.example` files (verify completeness)
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 1
**Dependencies**: none

**Tasks**:
- Add Argentina Mock Services section to docker/.env.example
- Document MercadoPago mock variables (URL, webhook, scenario)
- Document AFIP mock variables (URL, DB path)
- Document WhatsApp mock variables (URL, webhook)
- Document SMS mock variables (URL, webhook, cost)
- Document MailHog/Email mock variables (SMTP, UI)
- Ensure consistency with docker-compose environment mappings

### Stream D: Documentation & Testing
**Scope**: Create comprehensive documentation and verify integration
**Files**:
- `docker/mocks/README.md` (create new)
- Test scripts for integration verification
**Agent Type**: technical-writer / qa-specialist
**Can Start**: after Stream A completes
**Estimated Hours**: 1.5
**Dependencies**: Stream A (needs working docker-compose file)

**Tasks**:
- Create docker/mocks/README.md with service overview
- Document quick start commands (make mocks, make mocks-down, etc.)
- Document web interface URLs for all 5 services
- Add configuration instructions
- Create integration test examples (curl commands)
- Document resource usage expectations
- Add troubleshooting section

## Coordination Points

### Shared Files
- `Makefile` - Stream B modifies (low conflict risk, isolated section)
- `docker/.env.example` - Stream C modifies (append-only, low conflict)
- `docker/docker-compose.mocks.yml` - Stream A owns exclusively

### Sequential Requirements
1. Stream A (docker-compose) must complete before Stream D (testing/docs) can verify integration
2. Streams A, B, C can run in parallel - they modify different files
3. Stream D should start after A is complete to test actual services

### Integration Points
- Stream B Makefile commands must reference Stream A's docker-compose.mocks.yml path
- Stream C environment variables must match Stream A's service definitions
- Stream D documentation must reflect URLs/ports from Stream A

## Conflict Risk Assessment

**Low Risk**:
- Streams A, B, C work on completely different files
- Stream D creates new file (no conflicts)
- All modifications are additive (no deletions or major refactoring)

**Coordination Required**:
- Ensure port numbers consistent across all streams (A: 3001-3004, 8025, 1025)
- Ensure environment variable names match across Streams A and C
- Ensure Makefile commands (Stream B) reference correct compose file from Stream A

## Parallelization Strategy

**Recommended Approach**: hybrid

**Parallel Phase** (2 hours):
- Launch Streams A, B, C simultaneously
- Each works on isolated files with clear ownership
- Minimal coordination needed (port numbers, env var names)

**Sequential Phase** (1.5 hours):
- Stream D starts after A completes
- Verifies docker-compose works correctly
- Creates documentation based on actual implementation
- Runs integration tests

## Expected Timeline

**With parallel execution**:
- Wall time: **2 hours** (parallel) + **1.5 hours** (sequential) = **3.5 hours**
- Total work: 5.5 hours
- Efficiency gain: **36%** faster

**Without parallel execution**:
- Wall time: 5.5 hours (all streams sequential)

## Notes

**Implementation Considerations**:
- MailHog uses official Docker image (mailhog/mailhog:v1.0.1) - no build needed
- MercadoPago, AFIP, WhatsApp, SMS mocks already have Dockerfiles in their directories
- The docker-compose.mocks.yml placeholder has good structure - use as template
- Network 'barberpro-dev-network' should be external (created by base compose)
- AFIP mock needs persistent volume for database (SQLite)

**Testing Strategy**:
- Verify all 5 services start successfully
- Check health endpoints return 200 OK
- Verify network connectivity between mocks and backend
- Test MercadoPago payment flow with curl
- Verify MailHog captures emails on SMTP port 1025
- Confirm web UIs accessible (MercadoPago dashboard, MailHog UI, etc.)

**Success Criteria**:
- Single `make mocks` command starts all 5 services
- All health checks pass within 30 seconds
- All web interfaces accessible at documented URLs
- Environment variables properly documented
- Integration with main app verified (payment, email, messaging flows)
