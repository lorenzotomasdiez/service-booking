# Feature Specification: Fully Dockerized Development Environment with Hot Reload

**Feature Branch**: `001-docker-dev-hotreload`
**Created**: 2025-10-25
**Status**: Draft
**Input**: User description: "setup fully dockerized environment for local development, with hotreload included"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Starts Development Environment (Priority: P1)

A developer needs to start working on the BarberPro project. They clone the repository, run a single command, and have a fully functional development environment with all services running in Docker containers. Code changes in both frontend and backend are instantly reflected without manual restarts.

**Why this priority**: This is the foundation for all development work. Without a working development environment, no other feature can be developed or tested. This directly impacts developer productivity and onboarding time.

**Independent Test**: Can be fully tested by running a single startup command and verifying all containers start successfully, then making a code change and confirming it reflects immediately without manual intervention.

**Acceptance Scenarios**:

1. **Given** a developer has Docker installed, **When** they run the startup command, **Then** all services (PostgreSQL, Redis, backend, frontend, pgAdmin, Redis Commander) start successfully and show healthy status
2. **Given** the development environment is running, **When** a developer modifies a backend TypeScript file, **Then** the backend service automatically restarts and applies the changes within 3 seconds
3. **Given** the development environment is running, **When** a developer modifies a frontend Svelte component, **Then** the browser automatically refreshes and shows the updated UI within 2 seconds
4. **Given** a developer stops the environment, **When** they restart it later, **Then** all previous data (database records, Redis cache) persists from the previous session

---

### User Story 2 - Developer Debugs Application Issues (Priority: P2)

A developer encounters a bug in either the frontend or backend. They need to view real-time logs from all services, inspect database state, and test API endpoints without leaving their development environment.

**Why this priority**: Debugging is a critical daily activity. Efficient debugging tools reduce time spent troubleshooting and improve code quality. This is P2 because developers can work around this with manual logging, but it significantly hampers productivity.

**Independent Test**: Can be tested by intentionally introducing a bug, then using the environment's built-in tools (log viewing, database inspection, API testing) to identify and fix the issue.

**Acceptance Scenarios**:

1. **Given** the development environment is running, **When** a developer requests service logs, **Then** they see real-time, color-coded logs from all running containers
2. **Given** a database-related issue occurs, **When** a developer accesses the database admin tool, **Then** they can inspect tables, run queries, and modify data through a web interface
3. **Given** the backend API is running, **When** a developer accesses the API documentation interface, **Then** they can test endpoints interactively with sample requests
4. **Given** Redis cache issues occur, **When** a developer accesses the Redis admin tool, **Then** they can view and manipulate cached data through a web interface

---

### User Story 3 - Developer Resets Development Environment (Priority: P3)

A developer's local database gets into an inconsistent state or they want to start fresh with clean data. They run a reset command that wipes all data, reapplies database migrations, and seeds the database with test data, all without affecting their Docker setup.

**Why this priority**: This is a common maintenance task but not critical for day-to-day development. Developers can manually delete containers and volumes, making this a convenience feature rather than a blocker.

**Independent Test**: Can be tested by corrupting the database state, running the reset command, and verifying the environment returns to a clean, working state with seed data.

**Acceptance Scenarios**:

1. **Given** the development environment has inconsistent data, **When** a developer runs the reset command, **Then** all database tables are dropped, migrations reapplied, and seed data loaded within 30 seconds
2. **Given** a developer runs the reset command, **When** the process completes, **Then** the backend and frontend continue running without requiring a restart
3. **Given** a developer has custom uploaded files, **When** they run the reset command with a preservation flag, **Then** database resets but uploaded files remain intact

---

### User Story 4 - New Developer Onboards to Project (Priority: P1)

A new developer joins the team and needs to set up their development environment for the first time. They follow simple documentation, install Docker, run an initialization script, and have a fully working environment within 15 minutes.

**Why this priority**: Fast onboarding directly impacts team velocity and new hire satisfaction. This is P1 because poor onboarding experiences create lasting negative impressions and slow down team growth.

**Independent Test**: Can be tested with a fresh machine (or VM) by following the setup instructions from scratch and measuring time to first successful page load.

**Acceptance Scenarios**:

1. **Given** a new developer with only Docker installed, **When** they run the setup command, **Then** all dependencies install, containers build, database migrations run, and seed data loads automatically
2. **Given** the setup process completes, **When** the developer navigates to the frontend URL, **Then** they see the application running with sample data
3. **Given** the setup encounters an error, **When** the developer views the error message, **Then** they receive clear guidance on how to resolve the issue with specific commands to run
4. **Given** multiple developers are setting up simultaneously, **When** they use different database ports, **Then** each environment runs independently without conflicts

---

### Edge Cases

- What happens when Docker daemon is not running and a developer tries to start the environment?
- How does the system handle port conflicts when another service is already using ports 3000, 5173, 5432, or 6379?
- What occurs when a developer's machine runs out of disk space during container builds?
- How does hot reload behave when a syntax error is introduced in the code?
- What happens when database migrations fail during startup?
- How does the environment handle network issues preventing Docker image downloads?
- What occurs when node_modules dependencies are out of sync between host and container?
- How does the system behave when a developer forcefully stops containers (kill -9) instead of graceful shutdown?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single command that starts all required services (PostgreSQL, Redis, backend, frontend, admin tools) in Docker containers
- **FR-002**: System MUST enable hot reload for backend TypeScript code changes without manual container restarts
- **FR-003**: System MUST enable hot reload for frontend Svelte component changes with automatic browser refresh
- **FR-004**: System MUST persist database data across container restarts using Docker volumes
- **FR-005**: System MUST persist Redis cache data across container restarts using Docker volumes
- **FR-006**: System MUST provide real-time log streaming from all containers with clear service identification
- **FR-007**: System MUST expose pgAdmin web interface for PostgreSQL database administration
- **FR-008**: System MUST expose Redis Commander web interface for Redis cache administration
- **FR-009**: System MUST expose Swagger/OpenAPI documentation interface for backend API testing
- **FR-010**: System MUST apply all Prisma database migrations automatically on first startup
- **FR-011**: System MUST provide a command to seed the database with test data
- **FR-012**: System MUST provide a command to completely reset the environment (drop data, reapply migrations, reseed)
- **FR-013**: System MUST detect and report port conflicts before starting containers
- **FR-014**: System MUST validate Docker daemon is running before attempting to start services
- **FR-015**: System MUST build custom Docker images for backend and frontend with development optimizations
- **FR-016**: System MUST mount source code directories as volumes to enable hot reload
- **FR-017**: System MUST handle graceful shutdown of all containers when the developer stops the environment
- **FR-018**: System MUST provide health checks for all critical services (PostgreSQL, Redis, backend, frontend)
- **FR-019**: System MUST display clear status messages during startup, showing which services are starting and when they're ready
- **FR-020**: System MUST provide a doctor/diagnostic command that checks prerequisites (Docker installed, ports available, disk space)
- **FR-021**: Backend hot reload MUST preserve database connections and Redis connections without requiring full restart
- **FR-022**: Frontend hot reload MUST preserve application state in the browser when possible
- **FR-023**: System MUST synchronize node_modules between host and container to prevent version mismatches
- **FR-024**: System MUST provide environment variable isolation between development and production configurations
- **FR-025**: System MUST support running on macOS, Linux, and Windows (WSL2) platforms

### Key Entities *(include if feature involves data)*

- **Docker Compose Configuration**: Orchestrates all services, defines networks, volumes, environment variables, and service dependencies
- **Development Dockerfile**: Optimized container image definitions for backend and frontend with hot reload capabilities
- **Volume Mappings**: Persistent storage for PostgreSQL data, Redis data, uploaded files, and source code
- **Environment Files**: Configuration files containing database credentials, API keys, service URLs, and feature flags
- **Makefile Commands**: Developer-friendly commands that wrap complex Docker Compose operations
- **Health Check Definitions**: Monitoring scripts that verify service readiness and connection health

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can start the entire development environment from scratch using a single command, with all services running and healthy within 5 minutes (excluding initial Docker image downloads)
- **SC-002**: Backend code changes trigger automatic recompilation and service restart within 3 seconds of file save
- **SC-003**: Frontend code changes trigger browser refresh within 2 seconds of file save without losing application state
- **SC-004**: New developers can complete full environment setup (install Docker, clone repo, start environment, see running app) within 15 minutes following documentation
- **SC-005**: Environment reset (database drop, migrations, seed) completes within 30 seconds
- **SC-006**: Database data persists across 100% of environment restarts without manual intervention
- **SC-007**: Developers can access logs from all services simultaneously with clear filtering and color-coding
- **SC-008**: Port conflict detection catches 100% of conflicts before attempting to start containers
- **SC-009**: Health check system reports service status with 100% accuracy (no false positives for healthy/unhealthy services)
- **SC-010**: Hot reload works correctly for 95% of code changes without requiring manual container restart
- **SC-011**: Development environment uses less than 4GB of RAM when all services are running
- **SC-012**: Developer satisfaction score for environment setup and daily usage exceeds 8/10

## Assumptions

- Developers have Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose (Linux) installed before starting
- Developers are using Node.js 18+ compatible with the project's dependencies
- Host machines have at least 8GB RAM and 20GB available disk space
- Developers have basic command-line familiarity and can run make/npm commands
- Network connectivity is available for initial Docker image downloads (offline development supported after initial setup)
- Developers are working on modern machines (last 5 years) with adequate performance for running containers
- The project will use standard Node.js file watching mechanisms (chokidar, Vite HMR, tsx watch mode) for hot reload
- Database schema changes will continue to use Prisma migrations workflow (developers run migrations manually when schema changes)
- The development environment will mirror production architecture but with debug-friendly settings (verbose logging, auto-restart on errors)
- Developers will use localhost networking (not production-like networking) for service communication

## Out of Scope

- Production deployment configuration (separate docker-compose.prod.yml already exists)
- Automated testing environment (separate docker-compose.test.yml already exists)
- Mock service integration (separate docker-compose.mocks.yml for Argentina services already exists)
- CI/CD pipeline configuration
- Multi-developer environment isolation on the same machine
- Remote debugging capabilities (debugger attachment to containers)
- Performance profiling tools integration
- Automatic dependency installation when package.json changes (developers run npm install manually)
- Integration with specific IDEs (VS Code, WebStorm, etc.)
- Backup and restore functionality for development databases

## Dependencies

- Docker Desktop 20.10+ (macOS/Windows) or Docker Engine 20.10+ (Linux)
- Docker Compose 2.0+ (included in Docker Desktop, separate install on Linux)
- Node.js 18+ (for running commands outside containers, optional)
- Make utility (pre-installed on macOS/Linux, requires installation on Windows)
- Sufficient host system resources (8GB RAM, 20GB disk space minimum)

## Open Questions

None - all requirements are well-defined based on industry-standard Docker development practices.
