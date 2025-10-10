---
issue: 2
stream: Base Infrastructure Setup & Configuration Organization
agent: parallel-worker
started: 2025-10-10T14:33:15Z
status: in_progress
---

# Stream A: Base Infrastructure Setup & Configuration Organization

## Scope
Create directory structure, analyze existing files, move/organize config files, and create base docker-compose.yml with version-pinned images, PostgreSQL 16 upgrade, health checks, and resource limits.

## Files
- `docker/` (new directory)
- `docker/configs/` (new directory)
- `docker/docker-compose.yml` (new base file)
- `docker/configs/*.conf` (moved config files)

## Tasks
1. Create `docker/` directory structure
2. Analyze all 3 existing docker-compose files to identify common base services
3. Extract base configuration (postgres, redis, nginx) into `docker/docker-compose.yml`
4. Pin all image versions (postgres:16-alpine, redis:7-alpine)
5. Move existing config files to `docker/configs/`
6. Update config file paths in base compose file
7. Upgrade PostgreSQL from 15 to 16 in base config
8. Add comprehensive health checks to base services
9. Configure resource limits for base services
10. Implement standardized naming: `barberpro-<service>-<env>`

## Progress
- Starting implementation
