---
issue: 2
stream: Specialized Compose Files (Monitoring, Mocks, Testing)
agent: parallel-worker
started: 2025-10-10T14:33:15Z
status: in_progress
---

# Stream C: Specialized Compose Files (Monitoring, Mocks, Testing)

## Scope
Create placeholder compose files for monitoring stack, Argentina mocks, and testing environment.

## Files
- `docker/docker-compose.monitoring.yml` (new placeholder)
- `docker/docker-compose.mocks.yml` (new placeholder)
- `docker/docker-compose.test.yml` (new file)

## Tasks
1. Create `docker-compose.monitoring.yml` placeholder with Prometheus, Grafana, Loki definitions
2. Create `docker-compose.mocks.yml` placeholder for Argentina services (MercadoPago, AFIP, WhatsApp)
3. Create `docker-compose.test.yml` for testing environment with isolated test database and Redis
4. Configure test-specific environment variables and fast health checks
5. Document future implementation phases

## Progress
- Starting implementation
