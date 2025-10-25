# Tasks: Fully Dockerized Development Environment with Hot Reload

**Input**: Design documents from `/specs/001-docker-dev-hotreload/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature does not require test tasks. Testing is manual validation of hot reload and environment functionality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (monorepo)**: `backend/`, `frontend/`, `docker/`, root level files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Basic Docker development infrastructure setup

- [x] T001 Fix pgAdmin email validation error in .env (change `PGADMIN_DEFAULT_EMAIL=admin@barberpro.local` to `admin@barberpro.com`)
- [x] T002 [P] Create backend/.dockerignore excluding node_modules, dist, .git, .env*, *.log, coverage/, .DS_Store
- [x] T003 [P] Create frontend/.dockerignore excluding node_modules, build, .svelte-kit, .git, .env*, *.log, coverage/, .DS_Store

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Docker infrastructure that MUST be complete before ANY user story can start

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create backend/Dockerfile.dev with Node 20 alpine base stage
- [x] T005 Add backend/Dockerfile.dev development stage with tsx watch mode for hot reload
- [x] T006 [P] Create frontend/Dockerfile.dev with Node 20 alpine base stage
- [x] T007 [P] Add frontend/Dockerfile.dev development stage with Vite dev server
- [x] T008 Create backend/docker-entrypoint.sh script for Prisma migration on startup
- [x] T009 Make backend/docker-entrypoint.sh executable and configure Dockerfile.dev to use it
- [x] T010 Verify backend health endpoint exists at src/app.ts or create /api/health route
- [x] T011 Update frontend/vite.config.ts to set server.host to '0.0.0.0' for Docker access
- [x] T012 Update frontend/vite.config.ts to enable HMR with clientPort 5173

**Checkpoint**: Foundation ready - Docker images can now be built and services configured

---

## Phase 3: User Story 1 & 4 Combined - Developer Starts Environment + Onboarding (Priority: P1) 🎯 MVP

**Goal**: Enable developers to start all services with a single command, with hot reload working for both backend and frontend. New developers can onboard in 15 minutes.

**Independent Test**:
1. Run startup command and verify all containers start successfully and show healthy status
2. Modify backend TypeScript file and verify auto-restart within 3 seconds
3. Modify frontend Svelte component and verify browser refresh within 2 seconds
4. Stop and restart environment, verify data persists
5. Follow quickstart.md on fresh VM and reach running app within 15 minutes

### Implementation for User Story 1 & 4

- [x] T013 [US1] Update docker/docker-compose.dev.yml to add backend service with build context, Dockerfile.dev, environment overrides (DATABASE_URL, REDIS_URL)
- [x] T014 [US1] Configure backend service in docker-compose.dev.yml with bind mount (../backend:/app), anonymous volumes (/app/node_modules, /app/dist)
- [x] T015 [US1] Add backend service depends_on postgres and redis with condition: service_healthy
- [x] T016 [US1] Configure backend service healthcheck with wget to http://localhost:3000/api/health, 30s interval, 60s start_period
- [x] T017 [US1] [P] Add frontend service to docker-compose.dev.yml with build context, Dockerfile.dev
- [x] T018 [US1] [P] Configure frontend service with bind mount (../frontend:/app), anonymous volumes (/app/node_modules, /app/.svelte-kit, /app/build)
- [x] T019 [US1] [P] Add frontend service depends_on backend with condition: service_healthy
- [x] T020 [US1] [P] Configure frontend service healthcheck with wget to http://localhost:5173, 30s interval, 30s start_period
- [x] T021 [US1] Update Makefile to enhance existing dev-infra-only command with clear startup messages and service URLs
- [x] T022 [US1] Test backend hot reload: modify backend/src/server.ts, verify restart within 3 seconds
- [x] T023 [US1] Test frontend hot reload: modify frontend/src/routes/+page.svelte, verify browser refresh within 2 seconds
- [x] T024 [US1] Test data persistence: create database record, restart containers with `make down && make dev-infra-only`, verify data exists
- [x] T025 [US4] Create scripts/dev-setup.sh automation script for first-time environment setup
- [x] T026 [US4] Add error handling to scripts/dev-setup.sh with clear guidance for common issues (Docker not running, ports in use)
- [x] T027 [US4] Test first-time setup: run setup script on clean environment, measure time to running app (target <15 minutes)

**Checkpoint**: At this point, User Stories 1 and 4 should be fully functional - developers can start environment and new developers can onboard easily

---

## Phase 4: User Story 2 - Developer Debugs Application (Priority: P2)

**Goal**: Enable developers to view real-time logs, inspect database with pgAdmin, and access API documentation

**Independent Test**:
1. View logs from all services simultaneously with color-coding
2. Access pgAdmin at http://localhost:8080 and inspect database tables
3. Access API documentation at http://localhost:3000/docs and test endpoints
4. Access Redis Commander at http://localhost:8081 and view cache data

### Implementation for User Story 2

- [x] T028 [US2] Verify existing Makefile `logs` command streams docker-compose logs with --follow, --tail=100, --timestamps
- [x] T029 [US2] Test existing pgAdmin service is accessible at http://localhost:8080 after fixing email in .env
- [x] T030 [US2] Test existing Redis Commander service is accessible at http://localhost:8081
- [x] T031 [US2] Verify backend Swagger/OpenAPI documentation exists at http://localhost:3000/docs or add @fastify/swagger configuration
- [x] T032 [US2] Test log viewing: run `make logs`, verify color-coded output from all containers
- [x] T033 [US2] Test database inspection: access pgAdmin, connect to postgres, run queries on barberpro_dev database
- [x] T034 [US2] Test API documentation: access Swagger UI, test sample endpoints interactively
- [x] T035 [US2] Test Redis inspection: access Redis Commander, view cached keys and values

**Checkpoint**: At this point, User Story 2 should be fully functional - developers have comprehensive debugging tools

---

## Phase 5: User Story 3 - Developer Resets Environment (Priority: P3)

**Goal**: Enable developers to reset database to clean state with single command

**Independent Test**:
1. Corrupt database state intentionally
2. Run reset command
3. Verify database is clean with migrations applied and seed data loaded within 30 seconds
4. Verify backend and frontend continue running without restart

### Implementation for User Story 3

- [x] T036 [US3] Create or verify existing Makefile `db-reset` command calls Prisma migrate reset in backend
- [x] T037 [US3] Ensure Makefile `db-reset` command checks if backend container is running, provides error if not
- [x] T038 [US3] Add optional preservation flag to db-reset command to skip uploaded files deletion (document in Makefile help text)
- [x] T039 [US3] Test database reset: create test data, run `make db-reset`, verify clean state with seed data
- [x] T040 [US3] Test reset performance: measure time for database drop + migrations + seed, verify <30 seconds
- [x] T041 [US3] Test containers continue running: verify backend and frontend don't require restart after reset

**Checkpoint**: At this point, User Story 3 should be fully functional - developers can reset database easily

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final refinements

- [x] T042 [P] Update docker/README.md with development environment documentation and common workflows
- [x] T043 [P] Update root README.md with quick start pointing to docker/README.md and Makefile commands
- [x] T044 [P] Add troubleshooting section to docker/README.md covering 6 common issues from quickstart.md
- [x] T045 [P] Validate quickstart.md instructions match actual implementation
- [x] T046 Test cross-platform compatibility: verify environment works on macOS (already tested), document Linux/Windows considerations
- [x] T047 Performance validation: measure environment startup time (<5 min target), memory usage (<4GB target), hot reload times (<3s backend, <2s frontend)
- [x] T048 Run complete acceptance test: fresh clone → make dev-infra-only → backend hot reload test → frontend hot reload test → data persistence test → reset test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - Phase 3 (US1 & US4 - P1): Can start after Foundational - Combined for efficiency
  - Phase 4 (US2 - P2): Can start after Foundational - Independent of Phase 3
  - Phase 5 (US3 - P3): Can start after Foundational - Independent of Phases 3 & 4
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 & 4 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses infrastructure from US1 but is independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses infrastructure from US1 but is independently testable

### Within Each Phase

**Phase 1 (Setup)**:
- T001: Starts immediately
- T002-T003: Can run in parallel after T001 (different files)

**Phase 2 (Foundational)**:
- T004-T005: Backend Dockerfile (sequential)
- T006-T007: Frontend Dockerfile (can run in parallel with T004-T005)
- T008-T009: Backend entrypoint (after T004-T005)
- T010: Backend health endpoint (can run in parallel)
- T011-T012: Frontend Vite config (can run in parallel)

**Phase 3 (US1 & US4)**:
- T013-T016: Backend docker-compose configuration (sequential)
- T017-T020: Frontend docker-compose configuration (can run in parallel with backend)
- T021: Makefile updates (after docker-compose changes)
- T022-T024: Testing (sequential, after all implementation)
- T025-T027: Setup script (can run in parallel with testing)

**Phase 4 (US2)**:
- T028-T031: Verification tasks (can run in parallel)
- T032-T035: Testing tasks (sequential)

**Phase 5 (US3)**:
- T036-T038: Implementation (sequential)
- T039-T041: Testing (sequential, after implementation)

**Phase 6 (Polish)**:
- T042-T045: Documentation (all can run in parallel)
- T046-T047: Validation (sequential, after documentation)
- T048: Final acceptance test (after all other tasks)

### Parallel Opportunities

**Within Foundational Phase (Phase 2)**:
```bash
# Parallel stream 1: Backend
Task: "Create backend/Dockerfile.dev with Node 20 alpine base stage"
Task: "Add backend/Dockerfile.dev development stage with tsx watch mode"
Task: "Create backend/docker-entrypoint.sh script"
Task: "Make backend/docker-entrypoint.sh executable"

# Parallel stream 2: Frontend (simultaneously with backend)
Task: "Create frontend/Dockerfile.dev with Node 20 alpine base stage"
Task: "Add frontend/Dockerfile.dev development stage with Vite dev server"
Task: "Update frontend/vite.config.ts server.host to '0.0.0.0'"
Task: "Update frontend/vite.config.ts to enable HMR"

# Parallel stream 3: Backend health check (simultaneously)
Task: "Verify backend health endpoint exists"
```

**Within User Story 1 & 4 (Phase 3)**:
```bash
# Parallel stream 1: Backend service
Task: "Update docker-compose.dev.yml to add backend service"
Task: "Configure backend service with bind mounts and volumes"
Task: "Add backend service depends_on with health conditions"
Task: "Configure backend service healthcheck"

# Parallel stream 2: Frontend service (simultaneously)
Task: "Add frontend service to docker-compose.dev.yml"
Task: "Configure frontend service with bind mounts and volumes"
Task: "Add frontend service depends_on backend"
Task: "Configure frontend service healthcheck"

# Parallel stream 3: Automation (simultaneously)
Task: "Create scripts/dev-setup.sh automation script"
Task: "Add error handling to setup script"
```

**Within Polish Phase (Phase 6)**:
```bash
# All documentation tasks can run in parallel:
Task: "Update docker/README.md"
Task: "Update root README.md"
Task: "Add troubleshooting section to docker/README.md"
Task: "Validate quickstart.md instructions"
```

---

## Parallel Example: Foundational Phase

```bash
# Backend stream (Developer A):
T004: Create backend/Dockerfile.dev with Node 20 alpine base stage
T005: Add backend/Dockerfile.dev development stage with tsx watch mode
T008: Create backend/docker-entrypoint.sh script for Prisma migration
T009: Make backend/docker-entrypoint.sh executable and configure Dockerfile.dev

# Frontend stream (Developer B - parallel):
T006: Create frontend/Dockerfile.dev with Node 20 alpine base stage
T007: Add frontend/Dockerfile.dev development stage with Vite dev server
T011: Update frontend/vite.config.ts to set server.host to '0.0.0.0'
T012: Update frontend/vite.config.ts to enable HMR with clientPort 5173

# Health check stream (Developer C - parallel):
T010: Verify backend health endpoint exists at src/app.ts or create /api/health route
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 4 Only)

1. Complete Phase 1: Setup (3 tasks, ~15 minutes)
2. Complete Phase 2: Foundational (9 tasks, ~2-3 hours with parallel execution)
3. Complete Phase 3: User Story 1 & 4 (15 tasks, ~3-4 hours)
4. **STOP and VALIDATE**: Test complete developer workflow
   - Start environment with single command
   - Test backend hot reload (<3s)
   - Test frontend hot reload (<2s)
   - Test data persistence
   - Test first-time setup flow
5. **MVP COMPLETE**: Fully functional development environment with hot reload

**Total MVP Time**: 6-8 hours for experienced developer

### Incremental Delivery

1. **Milestone 1: MVP** (Phases 1-3)
   - Foundation: Setup + Foundational phases
   - Value: Core development environment with hot reload and onboarding
   - Deploy: Update team documentation, announce to developers

2. **Milestone 2: Debugging Tools** (Phase 4)
   - Add: User Story 2 (debugging and inspection tools)
   - Value: Enhanced developer experience with logs, pgAdmin, Redis Commander, API docs
   - Deploy: Update debugging guide, training session for team

3. **Milestone 3: Complete** (Phase 5)
   - Add: User Story 3 (database reset capability)
   - Value: Full environment management capabilities
   - Deploy: Complete documentation, final training

4. **Milestone 4: Polished** (Phase 6)
   - Polish: Documentation, cross-platform validation, performance tuning
   - Value: Production-ready development environment
   - Deploy: Official release to all developers

### Parallel Team Strategy

With 3 developers after Foundational phase complete:

1. **Developer A**: User Story 1 & 4 (Backend integration, setup script)
2. **Developer B**: User Story 2 (Debugging tools verification and testing)
3. **Developer C**: User Story 3 (Database reset capability)

All three can work simultaneously as stories are independent.

---

## Task Summary

**Total Tasks**: 48 tasks
**Setup Phase**: 3 tasks
**Foundational Phase**: 9 tasks (BLOCKS all user stories)
**User Story 1 & 4 (P1)**: 15 tasks
**User Story 2 (P2)**: 8 tasks
**User Story 3 (P3)**: 6 tasks
**Polish Phase**: 7 tasks

**Parallel Opportunities**:
- Phase 1: 2 tasks can run in parallel (T002, T003)
- Phase 2: 3 parallel streams (backend, frontend, health check)
- Phase 3: 3 parallel streams (backend service, frontend service, automation)
- Phase 6: 4 documentation tasks can run in parallel

**Critical Path**: Phase 1 → Phase 2 → Phase 3 (MVP)

**Estimated MVP Time**: 6-8 hours (with parallel execution)
**Estimated Complete Time**: 10-14 hours (all user stories + polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4)
- User Stories 1 and 4 are combined (US1) as they share infrastructure
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are manual validation - no automated test tasks needed
- Focus on MVP first (Phases 1-3) for fastest value delivery
