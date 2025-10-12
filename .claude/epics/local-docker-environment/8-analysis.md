---
issue: 8
title: Setup Monitoring Stack (Prometheus, Grafana, Loki, cAdvisor)
analyzed: 2025-10-12T03:27:37Z
estimated_hours: 11
parallelization_factor: 4.0
---

# Parallel Work Analysis: Issue #8

## Overview

Setup a comprehensive monitoring stack with Prometheus (metrics collection), Grafana (visualization with pre-built dashboards), Loki (log aggregation), and cAdvisor (container metrics). This is an optional development feature for performance debugging and load testing. The work can be highly parallelized since each monitoring service has independent configuration needs.

## Parallel Streams

### Stream A: Prometheus Configuration
**Scope**: Setup Prometheus metrics collection service
**Files**:
- `docker/monitoring/prometheus/prometheus.yml` (new)
- `docker/monitoring/prometheus/alerts.yml` (new)
- Section in `docker/docker-compose.monitoring.yml` (prometheus service)
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Tasks**:
- Create docker/monitoring/prometheus/ directory
- Write prometheus.yml with scrape configs for:
  - barberpro-backend (port 3000, /metrics)
  - postgres-exporter (port 9187)
  - redis-exporter (port 9121)
  - cadvisor (port 8080)
  - prometheus self-monitoring
- Create alerts.yml with basic alert rules
- Configure prometheus service in docker-compose.monitoring.yml
- Set scrape interval: 15s, retention: 7 days
- Configure health check and resource limits

### Stream B: Grafana Dashboards & Provisioning
**Scope**: Setup Grafana with pre-built dashboards and datasources
**Files**:
- `docker/monitoring/grafana/grafana.ini` (new)
- `docker/monitoring/grafana/provisioning/datasources/datasources.yml` (new)
- `docker/monitoring/grafana/provisioning/dashboards/dashboards.yml` (new)
- `docker/monitoring/grafana/provisioning/dashboards/barberpro-api.json` (new)
- `docker/monitoring/grafana/provisioning/dashboards/postgres.json` (new)
- `docker/monitoring/grafana/provisioning/dashboards/redis.json` (new)
- `docker/monitoring/grafana/provisioning/dashboards/containers.json` (new)
- Section in `docker/docker-compose.monitoring.yml` (grafana service)
**Agent Type**: monitoring-specialist
**Can Start**: immediately
**Estimated Hours**: 4
**Dependencies**: none

**Tasks**:
- Create docker/monitoring/grafana/ directory structure
- Write grafana.ini configuration
- Configure datasources.yml (Prometheus + Loki)
- Create 4 pre-built dashboard JSONs:
  - BarberPro API Metrics (request rate, latency p95/p99, error rate)
  - PostgreSQL Performance (connections, query time, cache hit ratio)
  - Redis Performance (memory usage, hit rate, operations/sec)
  - Container Resource Usage (CPU, memory, network, disk)
- Configure dashboards.yml provisioning
- Configure grafana service in docker-compose.monitoring.yml
- Set admin credentials via environment variables
- Configure health check

### Stream C: Loki & cAdvisor Configuration
**Scope**: Setup log aggregation (Loki) and container monitoring (cAdvisor)
**Files**:
- `docker/monitoring/loki/loki-config.yml` (new)
- Sections in `docker/docker-compose.monitoring.yml` (loki + cadvisor services)
**Agent Type**: devops-specialist
**Can Start**: immediately
**Estimated Hours**: 2
**Dependencies**: none

**Tasks**:
- Create docker/monitoring/loki/ directory
- Write loki-config.yml:
  - File-based storage for local development
  - 7-day log retention
  - Configure ingestion and query limits
- Configure loki service in docker-compose.monitoring.yml
- Configure cadvisor service (uses official image, minimal config)
- Set up volume mounts for cadvisor (rootfs, /var/run, /sys, etc.)
- Configure health checks for both services
- Set privileged: true for cadvisor (required for container metrics)

### Stream D: Docker Compose & Infrastructure
**Scope**: Create docker-compose.monitoring.yml with all services and shared resources
**Files**:
- `docker/docker-compose.monitoring.yml` (new)
**Agent Type**: devops-specialist
**Can Start**: immediately (parallel with A, B, C)
**Estimated Hours**: 1.5
**Dependencies**: none (defines structure, others fill in details)

**Tasks**:
- Create docker-compose.monitoring.yml file
- Define barberpro-dev-network (external)
- Define all 4 services with proper structure
- Configure volume definitions:
  - prometheus-data
  - grafana-data
  - loki-data
- Set service dependencies (grafana depends on prometheus, loki)
- Configure restart policies (unless-stopped)
- Set resource limits for all services
- Configure port mappings (9090, 3001, 3100, 8080)

### Stream E: Backend Metrics Endpoint
**Scope**: Add /metrics endpoint to Fastify backend if not exists
**Files**:
- `backend/package.json` (add prom-client dependency)
- `backend/src/plugins/metrics.ts` (new - Fastify plugin)
- `backend/src/server.ts` (register metrics plugin)
**Agent Type**: backend-specialist
**Can Start**: immediately
**Estimated Hours**: 1
**Dependencies**: none

**Tasks**:
- Check if /metrics endpoint exists
- If not, install prom-client package
- Create Fastify metrics plugin:
  - Initialize prom-client registry
  - Collect default Node.js metrics
  - Create custom HTTP metrics (request duration, status codes)
  - Add request/response hooks for automatic tracking
- Register /metrics endpoint (GET)
- Return Prometheus format metrics
- Test endpoint returns valid metrics

### Stream F: Makefile & Documentation
**Scope**: Add Makefile commands and create comprehensive documentation
**Files**:
- `Makefile` (add monitoring commands section)
- `docker/monitoring/README.md` (new)
- `docker/.env.example` (add monitoring variables)
**Agent Type**: technical-writer / devops
**Can Start**: after Stream D completes (needs service info)
**Estimated Hours**: 1.5
**Dependencies**: Stream D (needs to know services and ports)

**Tasks**:
- Add Makefile commands:
  - `make monitoring` - start stack with service URLs
  - `make monitoring-down` - stop stack
  - `make monitoring-logs` - view logs
  - `make grafana` - open Grafana in browser
- Create docker/monitoring/README.md:
  - Overview of all 4 services
  - Quick start guide
  - Service URLs and access info
  - Configuration options
  - Troubleshooting guide
  - Resource usage notes (~1.5GB memory)
- Add environment variables to docker/.env.example:
  - GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD
  - PROMETHEUS_RETENTION_DAYS, LOKI_RETENTION_DAYS

## Coordination Points

### Shared Files
- `docker/docker-compose.monitoring.yml`:
  - Stream A adds prometheus service config
  - Stream B adds grafana service config
  - Stream C adds loki + cadvisor service configs
  - Stream D creates base file structure
  - **Resolution**: Stream D creates structure first, others add service definitions

### File Dependencies
- Streams A, B, C all reference paths in docker-compose (Stream D)
- Stream F documentation references ports/URLs from Stream D

### Integration Points
- Grafana datasources (Stream B) must reference Prometheus/Loki URLs from Streams A/C
- Prometheus scrape configs (Stream A) must match backend metrics endpoint (Stream E)
- Dashboard metrics queries (Stream B) must align with Prometheus config (Stream A)

## Conflict Risk Assessment

**Medium Risk - docker-compose.monitoring.yml**:
- Multiple streams (A, B, C, D) contribute to same file
- **Mitigation Strategy**:
  - Stream D creates skeleton with all service names
  - Streams A, B, C fill in their respective service sections
  - Clear service boundaries (prometheus, grafana, loki, cadvisor)
  - Use merge strategy or sequential composition

**Low Risk - Other Files**:
- Each stream owns dedicated directories (prometheus/, grafana/, loki/)
- Makefile changes are isolated section additions
- Backend metrics endpoint is new code

## Parallelization Strategy

**Recommended Approach**: hybrid

**Phase 1 - Parallel Foundation** (2 hours):
- Stream D: Create docker-compose.monitoring.yml skeleton
- Stream A: Prometheus configuration (parallel)
- Stream C: Loki & cAdvisor configuration (parallel)
- Stream E: Backend metrics endpoint (parallel)

**Phase 2 - Parallel Dashboard Creation** (4 hours):
- Stream B: Grafana dashboards (can start after D creates grafana service skeleton)
  - Most time-intensive stream (4 dashboards)
  - Can work independently once service structure exists

**Phase 3 - Sequential Finalization** (1.5 hours):
- Stream F: Makefile & Documentation (after D completes)
  - Needs service URLs and configuration details
  - Can reference completed work from A, B, C

**Alternative - Full Parallel** (if coordination overhead acceptable):
- All streams A-E start simultaneously
- Use git worktrees or clear service sections to avoid conflicts
- Merge docker-compose.monitoring.yml at end

## Expected Timeline

**With hybrid parallel execution**:
- Phase 1: 2 hours (streams A, C, D, E parallel - max is 2h)
- Phase 2: 4 hours (stream B)
- Phase 3: 1.5 hours (stream F)
- **Wall time: 7.5 hours** (with careful coordination)
- Total work: 12 hours
- **Efficiency gain: 37.5%** faster

**With full parallel execution** (aggressive):
- All streams run simultaneously
- **Wall time: 4 hours** (longest stream is B at 4h)
- Requires merge coordination for docker-compose file
- **Efficiency gain: 66.7%** faster (4x speedup)

**Without parallel execution**:
- Wall time: 12 hours (sequential)

## Notes

**Recommended Parallelization Approach**:
Given the shared docker-compose.monitoring.yml file, recommend **hybrid approach**:
1. Start D first (30 min) to create skeleton
2. Launch A, C, E in parallel (1.5h)
3. Launch B once service structure exists (4h)
4. Finalize with F (1.5h)
5. **Total: ~7.5 hours wall time**

**Docker Compose Conflict Resolution**:
- Option 1: Stream D creates full skeleton, others fill sections
- Option 2: Use git worktrees for true parallel work
- Option 3: Sequential composition - D → A → B → C (safer but slower)

**Testing Strategy**:
- After all streams complete, test full stack startup
- Verify Prometheus scraping all targets
- Verify all 4 Grafana dashboards load with data
- Run Artillery load test to generate metrics
- Verify Loki log aggregation working
- Confirm cAdvisor container metrics visible

**Backend Metrics Endpoint** (Stream E):
- Check if backend already has /metrics endpoint
- If using Fastify, prom-client integration is straightforward
- Hook into request lifecycle for automatic HTTP metrics
- Include custom metrics: booking_created, payment_processed, etc.

**Grafana Dashboards** (Stream B - Most Complex):
This is the most time-intensive stream. Dashboard JSONs need:
- BarberPro API: Request rate, latency percentiles, error rate, active connections
- PostgreSQL: Connection pool, query duration, transactions/sec, cache hit ratio
- Redis: Memory usage, commands/sec, hit rate, evictions
- Containers: CPU per container, memory per container, network I/O, disk I/O

**Resource Considerations**:
- Full monitoring stack uses ~1.5GB RAM
- Prometheus alone: ~512MB, Grafana: ~400MB, Loki: ~300MB, cAdvisor: ~200MB
- Only start when doing performance debugging or load testing
- Document resource requirements in README

**Optional Enhancements** (Not in scope):
- Alert manager for Prometheus alerts
- Tempo for distributed tracing
- Node exporter for host metrics
- Custom exporters for MercadoPago, AFIP mock metrics
