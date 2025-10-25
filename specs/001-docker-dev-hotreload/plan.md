# Implementation Plan: Fully Dockerized Development Environment with Hot Reload

**Branch**: `001-docker-dev-hotreload` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-docker-dev-hotreload/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a fully functional Docker-based development environment that enables developers to start all services (PostgreSQL, Redis, backend, frontend, admin tools) with a single command. The environment must support hot reload for both TypeScript backend and Svelte frontend code changes, persist data across restarts, and provide comprehensive debugging tools. Primary approach: Enhance existing Docker Compose configurations with development-optimized Dockerfiles, volume mounting for source code, and file-watching mechanisms for automatic service restarts.

## Technical Context

**Language/Version**: TypeScript 5.9.2, Node.js 24.6.0
**Primary Dependencies**: Docker Compose 2.0+, Fastify 5.6.0, SvelteKit (Vite-based), Prisma 6.15.0, tsx 4.20.5 (hot reload)
**Storage**: PostgreSQL 15 (docker postgres:15-alpine), Redis 7 (docker redis:7-alpine)
**Testing**: Jest (backend), Vitest (frontend), Playwright (E2E) - *not part of this feature*
**Target Platform**: Docker containers running on macOS (Darwin 25.0.0), Linux, Windows (WSL2)
**Project Type**: Web application (separate frontend/backend monorepo)
**Performance Goals**: Hot reload <3s backend, <2s frontend; Environment startup <5min; Memory <4GB
**Constraints**: Must work on all 3 platforms; Must preserve database connections during backend restart; Must support offline development after initial setup
**Scale/Scope**: 6 services (postgres, redis, backend, frontend, pgadmin, redis-commander); 2 custom Dockerfiles; 1 docker-compose.dev.yml configuration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: No constitution file exists yet (template only). Proceeding with industry-standard Docker development best practices:

- ✅ **Simplicity First**: Use standard Docker Compose patterns, avoid custom orchestration
- ✅ **Testability**: Each component (Dockerfile, compose file, Makefile command) can be tested independently
- ✅ **Documentation**: All commands will have inline help text and clear error messages
- ✅ **Existing Infrastructure**: Build upon existing Makefile structure and docker-compose files
- ✅ **No Premature Optimization**: Use standard Node.js file watchers (tsx, Vite HMR) instead of custom solutions

**Status**: ✅ PASS - No violations. This feature enhances existing development infrastructure using standard tools.

## Project Structure

### Documentation (this feature)

```text
specs/001-docker-dev-hotreload/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology choices and patterns
├── data-model.md        # Phase 1 output - Configuration structure
├── quickstart.md        # Phase 1 output - Developer onboarding guide
├── contracts/           # Phase 1 output - Docker Compose contracts
│   ├── docker-compose.dev.yml.spec.md   # Service definitions contract
│   └── dockerfile.dev.spec.md           # Dockerfile requirements contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (existing)
backend/
├── src/
│   ├── app.ts           # [MODIFY] Fastify app initialization
│   ├── server.ts        # [MODIFY] Server startup with health checks
│   ├── routes/          # [NO CHANGES] API routes
│   └── services/        # [NO CHANGES] Business logic
├── prisma/
│   ├── schema.prisma    # [NO CHANGES] Database schema
│   └── migrations/      # [NO CHANGES] Migration files
├── Dockerfile.dev       # [CREATE] Development Docker image
├── .dockerignore        # [CREATE] Docker build exclusions
└── package.json         # [MODIFY] Add dev dependencies if needed

frontend/
├── src/
│   ├── routes/          # [NO CHANGES] SvelteKit pages
│   └── lib/             # [NO CHANGES] Components and utilities
├── Dockerfile.dev       # [CREATE] Development Docker image
├── .dockerignore        # [CREATE] Docker build exclusions
├── vite.config.ts       # [MODIFY] HMR and network settings
└── package.json         # [NO CHANGES] Dependencies already correct

docker/
├── docker-compose.dev.yml    # [MODIFY] Enhanced dev environment
├── docker-compose.yml        # [KEEP] Base infrastructure
├── configs/
│   ├── redis.conf           # [NO CHANGES] Redis config
│   └── banner.txt           # [NO CHANGES] Startup banner
└── README.md                # [UPDATE] Documentation

scripts/
├── init-db.sql              # [NO CHANGES] Database initialization
└── dev-setup.sh             # [CREATE] First-time setup automation

Makefile                     # [MODIFY] Add/update dev commands
.env                          # [MODIFY] Fix pgAdmin email, add dev settings
```

**Structure Decision**: This feature enhances the existing web application monorepo structure. The backend and frontend directories already exist with proper separation. We'll add development-specific Dockerfiles to each, modify the existing docker-compose configurations, and enhance Makefile commands. This preserves the existing architecture while adding hot reload capabilities.

## Complexity Tracking

> **No violations - this section intentionally left empty**

All technical choices align with standard Docker development practices. No justification needed.
