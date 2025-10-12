# BarberPro Docker Architecture

Comprehensive documentation of the Docker-based local development environment architecture, service dependencies, networking design, and deployment strategies for the BarberPro service booking platform.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Services Breakdown](#services-breakdown)
- [Network Topology](#network-topology)
- [Storage Architecture](#storage-architecture)
- [Environment Variants](#environment-variants)
- [Service Dependencies](#service-dependencies)
- [Configuration Management](#configuration-management)
- [Design Decisions](#design-decisions)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting Architecture](#troubleshooting-architecture)

---

## Overview

The BarberPro Docker environment is a **multi-tier, microservices-oriented architecture** designed to provide a complete local development experience that mirrors production infrastructure. The environment supports multiple operational modes (development, testing, monitoring, mocks) through a layered Docker Compose configuration system.

### Key Design Principles

1. **Modularity**: Services are independent and can be started/stopped individually
2. **Layered Configuration**: Base configurations with environment-specific overlays
3. **Development-First**: Optimized for developer productivity with hot-reload and debugging
4. **Production Parity**: Local environment closely matches production architecture
5. **Resource Efficiency**: Balanced resource allocation for laptop development
6. **Network Isolation**: Clear network boundaries between service tiers
7. **Argentina-Specific**: Mock services for Argentina payment and tax infrastructure

---

## System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Developer Machine (Host)"
        Browser[Web Browser<br/>localhost:5173]
        Tools[Dev Tools<br/>Postman, curl]
        IDE[IDE/Editor<br/>VSCode]
    end

    subgraph "Docker Network: barberpro-network"
        subgraph "Application Tier"
            Frontend[Frontend<br/>SvelteKit + Vite<br/>:5173]
            Backend[Backend<br/>Fastify + Node.js<br/>:3000]
        end

        subgraph "Data Tier"
            Postgres[(PostgreSQL 16<br/>:5432)]
            Redis[(Redis 7.2<br/>:6379)]
        end

        subgraph "Admin Tools"
            pgAdmin[pgAdmin 4<br/>:8080]
            RedisCmd[Redis Commander<br/>:8081]
        end

        subgraph "Mock Services (Argentina)"
            MP[MercadoPago Mock<br/>:3001]
            AFIP[AFIP Mock<br/>:3002]
            WA[WhatsApp Mock<br/>:3003]
            SMS[SMS Mock<br/>:3004]
            Mail[MailHog<br/>:1025, :8025]
        end

        subgraph "Monitoring Stack"
            Prom[Prometheus<br/>:9090]
            Graf[Grafana<br/>:3001]
            Loki[Loki<br/>:3100]
            cAdv[cAdvisor<br/>:8080]
        end
    end

    subgraph "Persistent Storage"
        PGVol[postgres_data<br/>Volume]
        RedisVol[redis_data<br/>Volume]
        AdminVol[pgadmin_data<br/>Volume]
    end

    Browser --> Frontend
    Tools --> Backend
    IDE --> Frontend
    IDE --> Backend

    Frontend --> Backend
    Backend --> Postgres
    Backend --> Redis
    Backend --> MP
    Backend --> AFIP
    Backend --> WA
    Backend --> SMS
    Backend --> Mail

    pgAdmin --> Postgres
    RedisCmd --> Redis

    Prom --> Backend
    Prom --> Postgres
    Prom --> Redis
    Prom --> cAdv
    Graf --> Prom
    Graf --> Loki

    Postgres --> PGVol
    Redis --> RedisVol
    pgAdmin --> AdminVol

    style Frontend fill:#4CAF50
    style Backend fill:#2196F3
    style Postgres fill:#336791
    style Redis fill:#DC382D
```

### Service Count by Tier

| Tier | Services | Purpose |
|------|----------|---------|
| **Application** | 2 | Frontend (SvelteKit) + Backend (Fastify) |
| **Data** | 2 | PostgreSQL + Redis |
| **Admin Tools** | 2 | pgAdmin + Redis Commander |
| **Mocks** | 5 | MercadoPago, AFIP, WhatsApp, SMS, MailHog |
| **Monitoring** | 4 | Prometheus, Grafana, Loki, cAdvisor |
| **Total** | 15 | Complete development stack |

---

## Services Breakdown

### Application Tier

#### 1. Frontend (SvelteKit)

**Container**: `barberpro-frontend-dev`
**Port**: 5173 (host) → 5173 (container)
**Image**: Custom (`frontend/Dockerfile.dev`)

**Purpose**: SvelteKit-based web application with Vite dev server providing hot module replacement (HMR) for rapid development.

**Key Features**:
- Hot reload for instant code changes
- Source maps enabled for debugging
- Volume mounts for live code updates
- Environment variable injection for API URLs

**Configuration**:
```yaml
environment:
  NODE_ENV: development
  VITE_API_URL: http://localhost:3000
  VITE_WS_URL: ws://localhost:3000
  VITE_TIMEZONE: America/Argentina/Buenos_Aires
  VITE_LOCALE: es-AR
  VITE_CURRENCY: ARS

volumes:
  - ../frontend:/app              # Source code (live updates)
  - /app/node_modules             # Exclude from host
  - /app/.svelte-kit              # Exclude build artifacts
```

**Resource Limits**:
- CPU: 0.5-1.0 cores
- Memory: 512MB-1GB

**Health Check**: HTTP GET `http://localhost:5173`

#### 2. Backend (Fastify)

**Container**: `barberpro-backend-dev`
**Port**: 3000 (host) → 3000 (container)
**Image**: Custom (`backend/Dockerfile.dev`)

**Purpose**: Fastify-based API server with TypeScript, Prisma ORM, and JWT authentication.

**Key Features**:
- Hot reload with `tsx watch` for instant restarts
- Swagger/OpenAPI documentation at `/docs`
- Prometheus metrics endpoint at `/metrics`
- WebSocket support for real-time features
- Argentina-specific timezone and locale handling

**Configuration**:
```yaml
environment:
  NODE_ENV: development
  PORT: 3000
  DATABASE_URL: postgresql://barberpro:password@postgres:5432/barberpro_dev
  REDIS_URL: redis://redis:6379
  JWT_SECRET: dev_jwt_secret_change_in_production
  TIMEZONE: America/Argentina/Buenos_Aires
  LOCALE: es-AR
  CURRENCY: ARS
  APP_DEBUG: true
  ENABLE_SWAGGER: true
  CORS_ORIGIN: "*"

volumes:
  - ../backend:/app               # Source code (live updates)
  - /app/node_modules             # Exclude from host
  - /app/dist                     # Exclude compiled JS
```

**Resource Limits**:
- CPU: 0.5-1.0 cores
- Memory: 512MB-1GB

**Health Check**: HTTP GET `http://localhost:3000/api/health`

**Dependencies**: Waits for PostgreSQL and Redis to be healthy before starting.

---

### Data Tier

#### 3. PostgreSQL 16

**Container**: `barberpro-postgres` (base) / `barberpro-postgres-dev` (dev)
**Port**: 5432 (host) → 5432 (container)
**Image**: `postgres:16-alpine`

**Purpose**: Primary relational database for structured data (users, bookings, services, payments).

**Key Features**:
- Alpine-based for minimal image size (~80MB)
- Health checks for dependency management
- Named volumes for data persistence
- Initialization script support
- Connection pooling optimized

**Configuration**:
```yaml
environment:
  POSTGRES_DB: barberpro_dev
  POSTGRES_USER: barberpro
  POSTGRES_PASSWORD: barberpro_dev_password
  PGDATA: /var/lib/postgresql/data/pgdata

volumes:
  - postgres_data:/var/lib/postgresql/data
  - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

**Resource Limits**:
- CPU: 0.25-0.5 cores (dev), 0.5-1.0 cores (base)
- Memory: 256MB-512MB (dev), 512MB-1GB (base)

**Health Check**: `pg_isready -U barberpro -d barberpro_dev`
- Interval: 5s (dev), 10s (base)
- Retries: 3
- Start period: 30s (dev), 60s (base)

**Optimization Notes**:
- Development mode has faster health checks (5s vs 10s)
- Lower resource limits in dev for lighter laptop usage
- Connection pool tuned for development workload

#### 4. Redis 7.2

**Container**: `barberpro-redis` (base) / `barberpro-redis-dev` (dev)
**Port**: 6379 (host) → 6379 (container)
**Image**: `redis:7.2-alpine`

**Purpose**: In-memory data store for caching, session management, and real-time features.

**Key Features**:
- Alpine-based for minimal size (~30MB)
- Custom configuration file support
- RDB persistence enabled
- Memory eviction policies configured
- AOF (Append-Only File) for durability

**Configuration**:
```yaml
volumes:
  - redis_data:/data
  - ./configs/redis.conf:/usr/local/etc/redis/redis.conf:ro

command: redis-server /usr/local/etc/redis/redis.conf
```

**Resource Limits**:
- CPU: 0.1-0.25 cores (dev), 0.25-0.5 cores (base)
- Memory: 128MB-256MB (dev), 256MB-512MB (base)

**Health Check**: `redis-cli ping` (expects "PONG")
- Interval: 5s (dev), 10s (base)
- Retries: 3-5
- Start period: 5s (dev), 30s (base)

---

### Admin Tools Tier

#### 5. pgAdmin 4

**Container**: `barberpro-pgadmin` / `barberpro-pgadmin-dev`
**Port**: 8080 (host) → 80 (container)
**Image**: `dpage/pgadmin4:8.11`

**Purpose**: Web-based PostgreSQL administration and query interface.

**Key Features**:
- Single-user mode for development (no master password)
- Auto-connection to PostgreSQL container
- Query editor with syntax highlighting
- Schema visualization
- Backup/restore capabilities

**Configuration**:
```yaml
environment:
  PGADMIN_DEFAULT_EMAIL: admin@barberpro.local
  PGADMIN_DEFAULT_PASSWORD: admin
  PGADMIN_CONFIG_SERVER_MODE: 'False'
  PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'

volumes:
  - pgadmin_data:/var/lib/pgadmin
```

**Resource Limits**:
- CPU: 0.25-0.5 cores
- Memory: 256MB-512MB

**Dependencies**: Waits for PostgreSQL to be healthy.

#### 6. Redis Commander

**Container**: `barberpro-redis-commander` / `barberpro-redis-commander-dev`
**Port**: 8081 (host) → 8081 (container)
**Image**: `rediscommander/redis-commander:latest`

**Purpose**: Web-based Redis administration and key-value browser.

**Key Features**:
- Real-time key browser with search
- Value viewer for different data types
- TTL management
- Database statistics
- Basic HTTP authentication

**Configuration**:
```yaml
environment:
  REDIS_HOSTS: local:redis:6379
  HTTP_USER: admin
  HTTP_PASSWORD: admin
```

**Resource Limits**:
- CPU: 0.1-0.25 cores
- Memory: 128MB-256MB

**Dependencies**: Waits for Redis to be healthy.

---

### Mock Services Tier (Argentina-Specific)

These services simulate external Argentina infrastructure for development and testing without requiring real API credentials or external connections.

#### 7. MercadoPago Mock

**Container**: `barberpro-mercadopago-mock`
**Port**: 3001 (host) → 3001 (container)
**Image**: Custom (`docker/mocks/mercadopago/Dockerfile`)

**Purpose**: Simulates Argentina's primary payment gateway (credit cards, debit cards, cash payment methods).

**Key Features**:
- Complete payment flow simulation
- Multiple payment methods (Visa, Mastercard, Rapipago)
- Configurable response scenarios (success, pending, rejected)
- Webhook simulation with automatic callbacks
- Refund processing
- Real-time dashboard at `/dashboard`
- Swagger docs at `/docs`

**Scenarios**:
- `success` - Approved payment (default)
- `pending` - Pending payment (cash methods)
- `rejected_insufficient_amount` - Insufficient funds
- `rejected_bad_filled` - Invalid card
- `rejected_call_for_authorize` - Needs authorization

**Resource Limits**:
- CPU: 0.25 cores
- Memory: 256MB

**Documentation**: [docker/mocks/README.md](../docker/mocks/README.md)

#### 8. AFIP Mock

**Container**: `barberpro-afip-mock`
**Port**: 3002 (host) → 3002 (container)
**Image**: Custom (`docker/mocks/afip/Dockerfile`)

**Purpose**: Simulates AFIP (tax authority) WebServices for electronic invoice authorization (CAE).

**Key Features**:
- CUIT/CUIL validation with checksum
- CAE (Electronic Authorization Code) generation
- Electronic invoicing (WSFEv1) endpoints
- Invoice number sequencing per POS
- IVA (VAT) calculation
- Taxpayer registry simulation
- SQLite persistence for invoice history
- API docs at `/docs`

**Persistent Storage**:
- Volume: `afip-data` → `/app/data`
- Database: SQLite (`afip.db`)

**Resource Limits**:
- CPU: 0.25 cores
- Memory: 256MB

#### 9. WhatsApp Mock

**Container**: `barberpro-whatsapp-mock`
**Port**: 3003 (host) → 3003 (container)
**Image**: Custom (`docker/mocks/whatsapp/Dockerfile`)

**Purpose**: Simulates WhatsApp Business API for customer messaging and notifications.

**Key Features**:
- Send text, template, and media messages
- Automatic status transitions (sent → delivered → read)
- Webhook simulation for status updates
- Pre-configured Argentina booking templates
- Argentina phone number validation (+54 format)
- Media handling (images, documents, audio, video)
- Real-time dashboard at `/dashboard`

**Templates**:
- `booking_confirmation` - Confirms appointment
- `booking_reminder` - Reminds about upcoming appointment
- `booking_cancelled` - Notifies cancellation

**Resource Limits**:
- CPU: 0.25 cores
- Memory: 256MB

#### 10. SMS Mock

**Container**: `barberpro-sms-mock`
**Port**: 3004 (host) → 3004 (container)
**Image**: Custom (`docker/mocks/sms/Dockerfile`)

**Purpose**: Simulates SMS gateway for Argentina phone numbers (Twilio-style API).

**Key Features**:
- Send single or bulk SMS messages
- Argentina phone number validation (+54)
- Delivery simulation with 95% success rate
- Automatic cost calculation (0.05 ARS per 160-char segment)
- Message segmentation (up to 10 segments)
- Webhook callbacks for status updates
- Real-time dashboard at `/dashboard`

**Status Flow**:
1. `queued` - Initial state (0s)
2. `sent` - After 1 second
3. `delivered` - After 2 seconds (95% success)
4. `failed` - Delivery failure (5% rate)

**Resource Limits**:
- CPU: 0.25 cores
- Memory: 256MB

#### 11. MailHog

**Container**: `barberpro-mailhog`
**Ports**:
- 1025 (SMTP server)
- 8025 (Web UI)
**Image**: `mailhog/mailhog:v1.0.1`

**Purpose**: Email capture and testing tool for development (no actual email sending).

**Key Features**:
- SMTP server for email capture
- Web UI for viewing captured emails
- Email search and filtering
- JSON API for automation
- Email attachment support
- No external email delivery

**Configuration**:
```yaml
# Backend SMTP configuration
SMTP_HOST: localhost
SMTP_PORT: 1025
SMTP_SECURE: false
```

**Resource Limits**:
- CPU: 0.25 cores
- Memory: 128MB

**Web UI**: http://localhost:8025

---

### Monitoring Stack Tier

#### 12. Prometheus

**Container**: `barberpro-prometheus`
**Port**: 9090 (host) → 9090 (container)
**Image**: `prom/prometheus:v2.48.0`

**Purpose**: Time-series database for metrics collection and storage.

**Scrape Targets**:
- Backend API (`/metrics` endpoint)
- PostgreSQL (via postgres-exporter)
- Redis (via redis-exporter)
- Docker containers (via cAdvisor)
- Prometheus itself (self-monitoring)

**Configuration**:
```yaml
volumes:
  - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  - ./monitoring/prometheus/alerts.yml:/etc/prometheus/alerts.yml
  - prometheus-data:/prometheus

command:
  - '--config.file=/etc/prometheus/prometheus.yml'
  - '--storage.tsdb.path=/prometheus'
  - '--storage.tsdb.retention.time=7d'
```

**Key Settings**:
- Scrape interval: 15 seconds
- Retention period: 7 days (configurable)
- Alert rule evaluation enabled

**Resource Limits**:
- CPU: 0.5 cores
- Memory: 512MB

**Documentation**: [docker/monitoring/README.md](../docker/monitoring/README.md)

#### 13. Grafana

**Container**: `barberpro-grafana`
**Port**: 3001 (host) → 3000 (container)
**Image**: `grafana/grafana:10.2.2`

**Purpose**: Visualization and dashboards for metrics and logs.

**Pre-configured Dashboards**:
1. BarberPro API Dashboard - Application metrics
2. PostgreSQL Dashboard - Database performance
3. Redis Dashboard - Cache statistics
4. Container Monitoring - Docker resource usage

**Configuration**:
```yaml
environment:
  GF_SECURITY_ADMIN_USER: admin
  GF_SECURITY_ADMIN_PASSWORD: admin
  GF_USERS_ALLOW_SIGN_UP: "false"

volumes:
  - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
  - ./monitoring/grafana/grafana.ini:/etc/grafana/grafana.ini
  - grafana-data:/var/lib/grafana
```

**Default Login**: admin/admin (change in production!)

**Data Sources**:
- Prometheus (metrics)
- Loki (logs)

**Dependencies**: Waits for Prometheus and Loki.

#### 14. Loki

**Container**: `barberpro-loki`
**Port**: 3100 (host) → 3100 (container)
**Image**: `grafana/loki:2.9.3`

**Purpose**: Horizontally scalable log aggregation system.

**Key Features**:
- LogQL query language (similar to PromQL)
- Label-based log indexing (efficient storage)
- Integration with Grafana for visualization
- 7-day log retention (configurable)

**Configuration**:
```yaml
volumes:
  - ./monitoring/loki/loki-config.yml:/etc/loki/loki-config.yml
  - loki-data:/loki

command: -config.file=/etc/loki/loki-config.yml
```

**Access**: Via Grafana's "Explore" feature or direct API.

#### 15. cAdvisor

**Container**: `barberpro-cadvisor`
**Port**: 8080 (host) → 8080 (container)
**Image**: `gcr.io/cadvisor/cadvisor:v0.47.2`

**Purpose**: Real-time container resource usage and performance metrics.

**Metrics Collected**:
- CPU usage per container
- Memory consumption and limits
- Network I/O statistics
- Disk I/O and usage
- Container lifecycle events

**Configuration**:
```yaml
volumes:
  - /:/rootfs:ro
  - /var/run:/var/run:ro
  - /sys:/sys:ro
  - /var/lib/docker/:/var/lib/docker:ro
  - /dev/disk/:/dev/disk:ro

privileged: true
```

**Note**: Runs in privileged mode to access host metrics.

**Web UI**: http://localhost:8080

---

## Network Topology

### Network Architecture

```mermaid
graph TB
    subgraph "Host Machine"
        Host[Host Network Interface<br/>localhost]
    end

    subgraph "Docker Bridge: barberpro-network"
        subgraph "App Layer"
            FE[Frontend<br/>frontend:5173]
            BE[Backend<br/>backend:3000]
        end

        subgraph "Data Layer"
            PG[(postgres:5432)]
            RD[(redis:6379)]
        end

        subgraph "Admin Layer"
            PGA[pgadmin:80]
            RDC[redis-commander:8081]
        end

        subgraph "Mock Layer"
            MP[mercadopago-mock:3001]
            AF[afip-mock:3002]
            WA[whatsapp-mock:3003]
            SM[sms-mock:3004]
            MH[mailhog:1025,8025]
        end

        subgraph "Monitor Layer"
            PR[prometheus:9090]
            GR[grafana:3000]
            LK[loki:3100]
            CA[cadvisor:8080]
        end
    end

    subgraph "Test Network: barberpro-test-network"
        PGT[(postgres-test:5432)]
        RDT[(redis-test:6379)]
    end

    Host -->|Port 5173| FE
    Host -->|Port 3000| BE
    Host -->|Port 8080| PGA
    Host -->|Port 8081| RDC
    Host -->|Port 3001-3004| Mock Layer
    Host -->|Port 9090,3001,3100,8080| Monitor Layer

    FE --> BE
    BE --> PG
    BE --> RD
    BE --> Mock Layer

    PGA --> PG
    RDC --> RD

    Monitor Layer --> App Layer
    Monitor Layer --> Data Layer

    style FE fill:#4CAF50
    style BE fill:#2196F3
    style PG fill:#336791
    style RD fill:#DC382D
```

### Network Details

#### 1. Main Development Network

**Name**: `barberpro-network` (base) / `barberpro-network-dev` (dev)
**Driver**: bridge
**Subnet**: Auto-assigned by Docker
**Purpose**: Primary network for all development services

**Service Discovery**:
- Services communicate using container names as hostnames
- Example: Backend connects to `postgres:5432`, not `localhost:5432`
- DNS resolution handled automatically by Docker

**Isolation**:
- Network is isolated from host except for published ports
- Services cannot access host network directly
- Security through network boundaries

#### 2. Test Network

**Name**: `barberpro-test-network`
**Driver**: bridge
**Purpose**: Isolated network for testing environment

**Isolation Strategy**:
- Completely separate from development network
- Test services cannot access development data
- Allows parallel test execution without conflicts
- Easy cleanup between test runs

#### 3. Monitoring Network

**Name**: `barberpro-dev-network` (monitoring stack)
**Type**: External (requires `barberpro-network` to exist)
**Purpose**: Connect monitoring services to main network

**Note**: Monitoring stack connects to existing development network to scrape metrics from all services.

### Port Mapping Strategy

| Port Range | Purpose | Services |
|------------|---------|----------|
| **1025-1999** | Email | MailHog SMTP (1025) |
| **3000-3004** | Application & Mocks | Backend (3000), MP (3001), AFIP (3002), WA (3003), SMS (3004) |
| **5173** | Frontend | SvelteKit dev server |
| **5432-5433** | PostgreSQL | Dev (5432), Test (5433) |
| **6379-6380** | Redis | Dev (6379), Test (6380) |
| **8025** | Email UI | MailHog Web UI |
| **8080-8081** | Admin Tools | pgAdmin (8080), Redis Commander (8081), cAdvisor (8080) |
| **9090** | Metrics | Prometheus |
| **3001, 3100** | Monitoring | Grafana (3001), Loki (3100) |

**Port Conflict Resolution**:
- Test environment uses different ports (5433, 6380) to avoid conflicts
- Monitoring Grafana uses port 3001 (different from backend 3000)
- Environment variables allow port customization via `.env` file

### Service Communication Patterns

```mermaid
sequenceDiagram
    participant User as User Browser
    participant FE as Frontend
    participant BE as Backend
    participant PG as PostgreSQL
    participant RD as Redis
    participant MP as MercadoPago Mock
    participant WA as WhatsApp Mock

    User->>FE: HTTP Request (localhost:5173)
    FE->>BE: API Call (http://localhost:3000)
    BE->>PG: Query (postgres:5432)
    PG-->>BE: Result
    BE->>RD: Cache Check (redis:6379)
    RD-->>BE: Cached Data
    BE->>MP: Create Payment (mercadopago-mock:3001)
    MP-->>BE: Payment Response
    MP->>BE: Webhook Callback (backend:3000/webhooks)
    BE->>WA: Send Notification (whatsapp-mock:3003)
    WA-->>BE: Message Status
    BE-->>FE: JSON Response
    FE-->>User: Rendered UI
```

**Key Patterns**:
1. **External Access**: User → Frontend/Backend via `localhost`
2. **Internal Communication**: Services use container names (`postgres:5432`)
3. **Webhook Flow**: Mocks callback to `backend:3000/webhooks` (not `localhost`)
4. **Cache Layer**: Backend checks Redis before PostgreSQL
5. **Async Notifications**: Backend triggers mocks, receives async webhooks

---

## Storage Architecture

### Volume Strategy

```mermaid
graph LR
    subgraph "Host Filesystem"
        HostDir[/var/lib/docker/volumes/]
    end

    subgraph "Named Volumes"
        PGData[barberpro-postgres-data<br/>PostgreSQL Database]
        RedisData[barberpro-redis-data<br/>Redis Persistence]
        PGAData[barberpro-pgadmin-data<br/>pgAdmin Config]
        AFIPData[barberpro-afip-data<br/>AFIP Invoices]
        PromData[prometheus-data<br/>Metrics History]
        GrafData[grafana-data<br/>Dashboards]
        LokiData[loki-data<br/>Logs]
    end

    subgraph "Bind Mounts (Dev)"
        FeCode[../frontend:/app<br/>Frontend Source]
        BeCode[../backend:/app<br/>Backend Source]
        Config[./configs:/configs<br/>Config Files]
    end

    HostDir --> PGData
    HostDir --> RedisData
    HostDir --> PGAData
    HostDir --> AFIPData
    HostDir --> PromData
    HostDir --> GrafData
    HostDir --> LokiData

    style PGData fill:#336791
    style RedisData fill:#DC382D
    style FeCode fill:#4CAF50
    style BeCode fill:#2196F3
```

### Volume Types

#### 1. Named Volumes (Persistent Data)

**Advantages**:
- Managed by Docker (automatic lifecycle)
- Persists across container restarts
- Survives `docker-compose down`
- Platform-agnostic (works on all OS)
- Better performance than bind mounts

**Usage**:

| Volume Name | Container Path | Size | Purpose |
|-------------|---------------|------|---------|
| `barberpro-postgres-data` | `/var/lib/postgresql/data` | ~500MB-2GB | Database storage |
| `barberpro-redis-data` | `/data` | ~100MB-500MB | Redis persistence (RDB/AOF) |
| `barberpro-pgadmin-data` | `/var/lib/pgadmin` | ~50MB | pgAdmin settings/connections |
| `barberpro-afip-data` | `/app/data` | ~10MB-50MB | AFIP SQLite database |
| `prometheus-data` | `/prometheus` | ~100MB-500MB | Metrics time-series (7 days) |
| `grafana-data` | `/var/lib/grafana` | ~50MB | Grafana dashboards/plugins |
| `loki-data` | `/loki` | ~200MB-1GB | Log storage (7 days) |

**Backup Strategy**:
```bash
# Backup PostgreSQL volume
make db-backup

# Manual volume backup
docker run --rm -v barberpro-postgres-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v barberpro-postgres-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

**Cleanup**:
```bash
# Remove all volumes (destructive!)
make clean

# Remove specific volume
docker volume rm barberpro-postgres-data

# Prune unused volumes
docker volume prune
```

#### 2. Bind Mounts (Development)

**Advantages**:
- Live code updates (hot reload)
- Easy file editing from host
- No build required for code changes
- Direct IDE integration

**Usage**:

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `../frontend` | `/app` | Frontend source code |
| `../backend` | `/app` | Backend source code |
| `../scripts/init-db.sql` | `/docker-entrypoint-initdb.d/init.sql` | DB initialization |
| `./configs/redis.conf` | `/usr/local/etc/redis/redis.conf` | Redis configuration |
| `./monitoring/prometheus/` | `/etc/prometheus/` | Prometheus config |
| `./monitoring/grafana/` | `/etc/grafana/` | Grafana config |

**Exclusions** (Anonymous Volumes):
- `/app/node_modules` - Prevent host node_modules from overriding container
- `/app/dist` - Exclude compiled JavaScript
- `/app/.svelte-kit` - Exclude build artifacts

**Reasoning**: Host node_modules may be incompatible (different OS, architecture). Container builds its own dependencies.

#### 3. Read-Only Mounts

**Purpose**: Configuration files that should not be modified by containers

**Examples**:
```yaml
volumes:
  - ./configs/redis.conf:/usr/local/etc/redis/redis.conf:ro
  - ../scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

**Security**: Prevents container from modifying host configuration files.

### Environment-Specific Volumes

#### Development Volumes

**Naming**: `barberpro-*-dev`
**Lifecycle**: Long-lived, persists across sessions
**Size**: Moderate (development data)

#### Test Volumes

**Naming**: `barberpro-*-test`
**Lifecycle**: Ephemeral, reset between test runs
**Size**: Minimal (sample test data)
**Cleanup**: `docker-compose -f docker/docker-compose.test.yml down -v`

#### Production Volumes

**Naming**: `barberpro-*-prod`
**Lifecycle**: Permanent, backed up regularly
**Size**: Large (production data)
**Backup**: Automated daily backups to S3/GCS

---

## Environment Variants

### Layered Configuration System

```mermaid
graph TD
    Base[docker-compose.yml<br/>Base Infrastructure]
    Dev[docker-compose.dev.yml<br/>Development Overrides]
    Test[docker-compose.test.yml<br/>Test Environment]
    Prod[docker-compose.prod.yml<br/>Production Config]
    Mocks[docker-compose.mocks.yml<br/>Argentina Mocks]
    Mon[docker-compose.monitoring.yml<br/>Monitoring Stack]

    Base --> Dev
    Base --> Test
    Base --> Prod
    Dev --> Mocks
    Dev --> Mon

    style Base fill:#336791
    style Dev fill:#4CAF50
    style Test fill:#FFA726
    style Prod fill:#F44336
```

### 1. Base Environment (`docker-compose.yml`)

**Location**: `/docker/docker-compose.yml`

**Contents**:
- PostgreSQL 16 (base configuration)
- Redis 7.2 (base configuration)
- pgAdmin 4
- Redis Commander

**Purpose**: Core infrastructure shared across all environments

**Usage**: Always combined with environment-specific overlays
```bash
# Never used alone
docker-compose -f docker/docker-compose.yml up  # ❌ Incomplete

# Always with overlays
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up  # ✅
```

**Key Settings**:
- Production-ready defaults
- Health checks with reasonable intervals
- Resource limits for production sizing
- Named volumes for persistence

### 2. Development Environment (`docker-compose.dev.yml`)

**Location**: `/docker/docker-compose.dev.yml`

**Additions**:
- Backend service (hot reload enabled)
- Frontend service (Vite dev server)
- Development database (`barberpro_dev`)
- Faster health checks (5s vs 10s)
- Lower resource limits (laptop-friendly)
- Debug logging enabled
- CORS allow-all for development

**Command**:
```bash
make up
# or
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
```

**Optimizations**:
- PostgreSQL: `fsync=on`, `synchronous_commit=on` (safe defaults)
- Redis: RDB + AOF persistence
- Hot reload for frontend and backend
- Source maps enabled
- Swagger docs enabled at `/docs`

**Resource Targets**:
- Total CPU: ~3-4 cores
- Total Memory: ~4-6 GB
- Disk: ~20 GB

### 3. Development + Mocks (`docker-compose.mocks.yml`)

**Location**: `/docker/docker-compose.mocks.yml`

**Additions**:
- MercadoPago mock (port 3001)
- AFIP mock (port 3002)
- WhatsApp mock (port 3003)
- SMS mock (port 3004)
- MailHog (ports 1025, 8025)

**Command**:
```bash
make up  # Includes mocks by default
# or
make mocks  # Start mocks only
```

**Network**: Connects to existing `barberpro-network`

**Resource Impact**:
- Additional CPU: ~1.25 cores
- Additional Memory: ~1.2 GB
- Total (dev + mocks): ~5-7 GB memory

### 4. Development + Monitoring (`docker-compose.monitoring.yml`)

**Location**: `/docker/docker-compose.monitoring.yml`

**Additions**:
- Prometheus (port 9090)
- Grafana (port 3001)
- Loki (port 3100)
- cAdvisor (port 8080)

**Command**:
```bash
make monitoring
# or
docker-compose -f docker/docker-compose.monitoring.yml up -d
```

**Network**: Connects to `barberpro-dev-network` (external)

**Resource Impact**:
- Additional CPU: ~1.3 cores
- Additional Memory: ~1.4 GB
- Storage: ~350 MB (7 days retention)

### 5. Full Stack

**Command**:
```bash
make full
```

**Includes**:
- Base infrastructure (postgres, redis, admin tools)
- Development services (frontend, backend)
- All Argentina mocks (5 services)
- Full monitoring stack (4 services)

**Total Services**: 15 containers

**Resource Requirements**:
- CPU: 5-6 cores
- Memory: 8-12 GB
- Disk: 25-30 GB
- Recommended: 16 GB RAM, SSD

**Use Cases**:
- Full-stack development with all features
- Integration testing across all services
- Performance testing with monitoring
- Demo environments

### 6. Test Environment (`docker-compose.test.yml`)

**Location**: `/docker/docker-compose.test.yml`

**Services**:
- PostgreSQL Test (port 5433, database `barberpro_test`)
- Redis Test (port 6380)

**Optimizations** (Speed over Durability):
- `fsync=off` - No disk sync (unsafe, but fast)
- `synchronous_commit=off` - Async commits
- `full_page_writes=off` - Reduced WAL size
- `wal_level=minimal` - Minimal WAL logging
- Redis: No RDB/AOF persistence
- Reduced memory limits (256MB postgres, 128MB redis)

**Command**:
```bash
make test
# or
docker-compose -f docker/docker-compose.test.yml up -d
```

**Network**: Isolated `barberpro-test-network`

**Cleanup**:
```bash
docker-compose -f docker/docker-compose.test.yml down -v  # Remove volumes
```

**Use Cases**:
- Unit and integration tests
- CI/CD pipelines
- Fast iteration (quick start/stop)
- Parallel test execution

### Environment Comparison

| Feature | Development | Test | Production |
|---------|------------|------|------------|
| **Database Durability** | Safe (fsync=on) | Unsafe (fsync=off) | Safe (fsync=on) |
| **Resource Limits** | Moderate (laptop) | Minimal (fast CI) | High (server) |
| **Health Check Interval** | 5-10s | 5s | 30s |
| **Data Persistence** | Long-lived volumes | Ephemeral volumes | Permanent volumes + backups |
| **Monitoring** | Optional | None | Required |
| **Mocks** | All services | None (use real APIs) | None |
| **Hot Reload** | Enabled | Disabled | Disabled |
| **Debug Logging** | Enabled | Minimal | Structured logging |
| **CORS** | Allow-all | Restricted | Strict whitelist |

---

## Service Dependencies

### Dependency Graph

```mermaid
graph TD
    PG[PostgreSQL] --> |healthy| BE[Backend]
    RD[Redis] --> |healthy| BE
    BE --> |healthy| FE[Frontend]
    PG --> |healthy| PGA[pgAdmin]
    RD --> |healthy| RDC[Redis Commander]
    BE --> |running| MP[MercadoPago Mock]
    BE --> |running| AF[AFIP Mock]
    BE --> |running| WA[WhatsApp Mock]
    BE --> |running| SM[SMS Mock]
    PR[Prometheus] --> |running| GR[Grafana]
    LK[Loki] --> |running| GR

    style PG fill:#336791
    style RD fill:#DC382D
    style BE fill:#2196F3
    style FE fill:#4CAF50
```

### Startup Order

Docker Compose orchestrates startup order using `depends_on` with health checks:

1. **Tier 1 - Data Layer** (No dependencies)
   - PostgreSQL
   - Redis

2. **Tier 2 - Admin Tools** (Waits for data layer)
   - pgAdmin (waits for PostgreSQL healthy)
   - Redis Commander (waits for Redis healthy)

3. **Tier 3 - Application** (Waits for data layer)
   - Backend (waits for PostgreSQL + Redis healthy)

4. **Tier 4 - Frontend** (Waits for backend)
   - Frontend (waits for Backend running)

5. **Tier 5 - Support Services** (No hard dependencies)
   - Mock services (can start independently, backend will connect when ready)
   - Monitoring services (scrape targets can be down temporarily)

### Health Check System

**Purpose**: Ensure dependent services don't start before dependencies are ready

**Mechanism**:
```yaml
depends_on:
  postgres:
    condition: service_healthy  # Wait for health check to pass
  redis:
    condition: service_healthy
```

**Health Check Examples**:

```yaml
# PostgreSQL Health Check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U barberpro -d barberpro_dev"]
  interval: 10s       # Check every 10 seconds
  timeout: 5s         # Timeout after 5 seconds
  retries: 5          # Try 5 times before marking unhealthy
  start_period: 60s   # Grace period (don't mark unhealthy during this time)

# Redis Health Check
healthcheck:
  test: ["CMD", "redis-cli", "ping"]  # Expects "PONG"
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# Backend Health Check
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Failure Scenarios

#### Scenario 1: PostgreSQL Fails to Start

**Impact**:
- Backend will not start (waits for `service_healthy`)
- Frontend will not start (waits for backend)
- pgAdmin will not start (waits for postgres)

**Resolution**:
```bash
# Check logs
docker logs barberpro-postgres

# Common causes:
# - Port 5432 already in use
# - Volume permission issues
# - Out of memory

# Restart
docker-compose restart postgres
```

#### Scenario 2: Backend Health Check Fails

**Impact**:
- Frontend may start but can't communicate
- Mock services can't receive webhooks
- Monitoring can't scrape metrics

**Resolution**:
```bash
# Check backend logs
docker logs barberpro-backend-dev

# Common causes:
# - Database migration failed
# - Environment variable misconfiguration
# - Port 3000 already in use

# Manual health check
curl http://localhost:3000/api/health

# Restart
docker-compose restart backend
```

#### Scenario 3: Mock Service Down

**Impact**:
- Not critical (backend will handle gracefully)
- Payment/notification features won't work
- No hard startup dependency

**Resolution**:
```bash
# Restart individual mock
docker restart barberpro-mercadopago-mock

# Or restart all mocks
make mocks-down && make mocks
```

### Graceful Degradation

**Design Principle**: Services should handle dependency failures gracefully

**Backend Example**:
```javascript
// Redis connection with retry
const redis = new Redis({
  host: 'redis',
  port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  logger.error('Redis connection error', err);
  // Continue without cache (degrade to database only)
});
```

**Mock Service Handling**:
```javascript
// Backend handles mock failures gracefully
async function sendPaymentNotification(paymentId) {
  try {
    await whatsappMock.sendMessage(...);
  } catch (err) {
    logger.warn('WhatsApp mock unavailable, notification skipped', err);
    // Don't fail the payment flow
  }
}
```

---

## Configuration Management

### Environment Variable Hierarchy

```mermaid
graph TD
    Defaults[Hard-coded Defaults<br/>in docker-compose.yml]
    EnvFile[.env File<br/>in docker/ directory]
    ShellEnv[Shell Environment Variables<br/>exported in terminal]
    InlineEnv[Inline Environment<br/>docker-compose up -e VAR=value]

    Defaults --> EnvFile
    EnvFile --> ShellEnv
    ShellEnv --> InlineEnv

    style InlineEnv fill:#F44336
```

**Priority** (highest to lowest):
1. Inline environment variables
2. Shell-exported variables
3. `.env` file
4. `docker-compose.yml` defaults (e.g., `${PORT:-3000}`)

### Configuration Files

#### 1. `.env` File

**Location**: `/docker/.env` (not committed to git)

**Purpose**: Override default configuration for local development

**Example**:
```bash
# === Database Configuration ===
POSTGRES_DB=barberpro_dev
POSTGRES_USER=barberpro
POSTGRES_PASSWORD=my_secure_password
POSTGRES_PORT=5432

# === Redis Configuration ===
REDIS_PORT=6379

# === Backend Configuration ===
BACKEND_PORT=3000
JWT_SECRET=my_jwt_secret_change_in_prod
JWT_EXPIRES_IN=7d
LOG_LEVEL=debug

# === Frontend Configuration ===
VITE_API_URL=http://localhost:3000

# === Argentina Configuration ===
TIMEZONE=America/Argentina/Buenos_Aires
LOCALE=es-AR
CURRENCY=ARS

# === Mock Services ===
MERCADOPAGO_DEFAULT_SCENARIO=success
SMS_COST_PER_SEGMENT=0.05

# === Monitoring ===
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

**Security**:
- `.env` is in `.gitignore` (never committed)
- `.env.example` is committed (template with safe defaults)
- CI/CD uses environment variables or secrets management

#### 2. Service-Specific Config Files

**Redis**: `docker/configs/redis.conf`
```conf
# Memory management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes

# Networking
bind 0.0.0.0
protected-mode no
```

**PostgreSQL**: `scripts/init-db.sql`
```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create initial schema
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE barberpro_dev TO barberpro;
```

**Prometheus**: `docker/monitoring/prometheus/prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'barberpro-backend'
    static_configs:
      - targets: ['backend:3000']

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres:5432']
```

**Grafana**: `docker/monitoring/grafana/grafana.ini`
```ini
[server]
http_port = 3000
domain = localhost

[security]
admin_user = ${GRAFANA_ADMIN_USER}
admin_password = ${GRAFANA_ADMIN_PASSWORD}

[users]
allow_sign_up = false
```

#### 3. Service-Level Environment Variables

**Backend** (`docker-compose.dev.yml`):
```yaml
environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://barberpro:password@postgres:5432/barberpro_dev
  REDIS_URL: redis://redis:6379
  JWT_SECRET: ${JWT_SECRET:-dev_jwt_secret}
  CORS_ORIGIN: ${CORS_ORIGIN:-*}
  LOG_LEVEL: ${LOG_LEVEL:-debug}
```

**Frontend** (`docker-compose.dev.yml`):
```yaml
environment:
  NODE_ENV: development
  VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
  VITE_WS_URL: ${VITE_WS_URL:-ws://localhost:3000}
  VITE_TIMEZONE: ${TIMEZONE:-America/Argentina/Buenos_Aires}
```

### Configuration Best Practices

1. **Use Environment Variables for Secrets**
   - Never hardcode passwords in docker-compose files
   - Use `${VAR:-default}` syntax for defaults
   - Store production secrets in secrets manager (AWS Secrets Manager, Vault)

2. **Separate Configuration by Environment**
   - Development: `.env` file with developer-friendly defaults
   - Test: `.env.test` with test-specific values
   - Production: Environment variables from deployment platform

3. **Document All Variables**
   - Maintain `.env.example` with all available variables
   - Include comments explaining each variable
   - Keep documentation synchronized with code

4. **Validate Configuration on Startup**
   - Backend should validate required environment variables
   - Fail fast with clear error messages
   - Example: `if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required')`

5. **Use Config Files for Complex Settings**
   - Environment variables for simple key-value pairs
   - Config files (YAML, JSON) for structured configuration
   - Mount config files as read-only volumes

---

## Design Decisions

### 1. Why Docker Compose (Not Kubernetes)?

**Decision**: Use Docker Compose for local development

**Rationale**:
- **Simplicity**: Single YAML file vs. multiple K8s manifests
- **Local Development**: Optimized for laptop/desktop usage
- **Resource Efficiency**: Lower overhead than K8s control plane
- **Learning Curve**: Easier for developers new to containers
- **Fast Iteration**: Quick up/down cycles for development

**Trade-offs**:
- Limited to single-host deployment
- No built-in orchestration for production
- Lacks auto-scaling capabilities

**Production Path**: Deploy to managed services (Railway, Render) or use K8s for production while keeping Compose for local dev.

### 2. Why Alpine-Based Images?

**Decision**: Use Alpine Linux for PostgreSQL and Redis images

**Rationale**:
- **Size**: 5-10x smaller than Debian/Ubuntu-based images
  - `postgres:16` (Debian) = 376 MB
  - `postgres:16-alpine` = 78 MB
- **Security**: Minimal attack surface (fewer packages)
- **Speed**: Faster image pulls and container startup
- **Efficiency**: Lower disk usage for multiple environments

**Trade-offs**:
- Uses musl libc instead of glibc (minor compatibility differences)
- Smaller ecosystem of pre-built packages
- Debugging tools not included by default

**Mitigation**: For services needing full GNU tooling (backend, frontend), we use full Node.js images.

### 3. Why Separate Networks for Test?

**Decision**: Test environment uses isolated network (`barberpro-test-network`)

**Rationale**:
- **Data Safety**: Prevent test runs from affecting development database
- **Port Conflicts**: Allow dev and test to run simultaneously (5432 vs 5433)
- **Clean State**: Easy to tear down test environment without affecting dev
- **CI/CD**: Parallel test execution across multiple agents

**Implementation**:
```yaml
# Test environment
networks:
  barberpro-test-network:
    name: barberpro-test-network
    driver: bridge

# Development environment
networks:
  barberpro-network:
    name: barberpro-network
    driver: bridge
```

### 4. Why Mock Services Instead of Test Doubles?

**Decision**: Build full mock HTTP servers for external services

**Rationale**:
- **Realistic**: Simulate actual HTTP/REST API interactions
- **Webhooks**: Support async webhook callbacks
- **Web UI**: Provide dashboards for debugging (e.g., view sent messages)
- **Stateful**: Maintain state across requests (payment history, invoices)
- **Team-wide**: All developers use same mocks (consistent behavior)
- **Integration Testing**: Test full request/response cycles

**Alternative Considered**: Mocking libraries (nock, MSW) in tests

**Why Not**:
- Limited to single service (not shared across frontend/backend)
- No webhook simulation
- No visual debugging
- Requires code changes for different scenarios

### 5. Why Hot Reload vs. Restart?

**Decision**: Use volume mounts for hot reload in development

**Rationale**:
- **Speed**: Instant feedback (<1s) vs. rebuild (10-30s)
- **Developer Experience**: Edit code, see changes immediately
- **Debugging**: Source maps point to actual source code
- **State Preservation**: Keep application state during development

**Implementation**:
```yaml
volumes:
  - ../backend:/app           # Mount source code
  - /app/node_modules         # Exclude node_modules (use container version)
  - /app/dist                 # Exclude compiled code
```

**Trade-offs**:
- Larger container file system (source + node_modules)
- Potential file sync issues on Windows (use WSL2)
- Not production-like (production uses compiled code)

### 6. Why Multiple Docker Compose Files?

**Decision**: Split into base + environment-specific overlays

**Rationale**:
- **DRY**: Share common configuration (base)
- **Flexibility**: Mix and match environments (`make dev`, `make full`)
- **Clarity**: Each file has single responsibility
- **Maintenance**: Update base configuration once, affects all environments

**Structure**:
```
docker/
├── docker-compose.yml              # Base (postgres, redis, admin)
├── docker-compose.dev.yml          # Development (backend, frontend)
├── docker-compose.test.yml         # Test (isolated test DB)
├── docker-compose.mocks.yml        # Argentina mocks
├── docker-compose.monitoring.yml   # Monitoring stack
└── docker-compose.prod.yml         # Production overrides
```

**Alternative Considered**: Single monolithic compose file with profiles

**Why Not**:
- Harder to read (too many services)
- Less flexible composition
- Profiles still require multiple command combinations

### 7. Why Health Checks?

**Decision**: Implement health checks for all services

**Rationale**:
- **Dependency Management**: Ensure database is ready before backend starts
- **Reliability**: Detect failed services early
- **Debugging**: `docker ps` shows health status at a glance
- **Orchestration**: Future K8s migration (readiness/liveness probes)

**Implementation**:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U barberpro"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 60s
```

**Tuning**:
- Development: Faster checks (5s interval) for quick feedback
- Production: Slower checks (30s interval) to reduce overhead

### 8. Why Resource Limits?

**Decision**: Set CPU and memory limits for all services

**Rationale**:
- **Fairness**: Prevent one service from starving others
- **Predictability**: Know resource requirements upfront
- **Debugging**: Identify resource-hungry services
- **Production Parity**: Match production resource allocation

**Example**:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

**Tuning Strategy**:
- Start with generous limits
- Monitor actual usage (`docker stats`)
- Adjust based on observed patterns
- Different limits for dev vs. prod

---

## Scaling Considerations

### Vertical Scaling (Single Host)

#### Current Limits

**Development Environment** (Base + Dev):
- Services: 7 containers
- CPU: ~3-4 cores
- Memory: ~4-6 GB
- Storage: ~20 GB

**Full Environment** (Base + Dev + Mocks + Monitoring):
- Services: 15 containers
- CPU: ~5-6 cores
- Memory: ~8-12 GB
- Storage: ~30 GB

#### Scaling Up on Single Machine

**Recommended Hardware**:
- **Minimum**: 4-core CPU, 8 GB RAM, 50 GB SSD
- **Recommended**: 8-core CPU, 16 GB RAM, 100 GB SSD
- **Ideal**: 16-core CPU, 32 GB RAM, 500 GB NVMe SSD

**Adjustments for Lower-End Machines**:

```bash
# Use minimal development mode (no mocks, no monitoring)
make dev

# Or customize resource limits
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '0.25'    # Reduce from 0.5
      memory: 256M    # Reduce from 512M
```

**Optimizations**:
- Stop unused services: `make mocks-down`, `make monitoring-down`
- Use test environment for tests (lower resource usage)
- Close resource-heavy applications while developing
- Increase Docker Desktop resource allocation

### Horizontal Scaling (Multiple Hosts)

#### When to Scale Horizontally

**Indicators**:
- Development team grows (>10 developers)
- Shared development environment needed
- CI/CD pipelines need dedicated infrastructure
- Performance testing requires production-like load

#### Multi-Host Architecture

```mermaid
graph TB
    subgraph "Host 1: Application Tier"
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
        FE1[Frontend Instance 1]
    end

    subgraph "Host 2: Data Tier"
        PG[(PostgreSQL Primary)]
        PGR[(PostgreSQL Replica)]
        RD[(Redis Cluster)]
    end

    subgraph "Host 3: Support Services"
        Mocks[Mock Services]
        Mon[Monitoring Stack]
    end

    LB[Load Balancer] --> BE1
    LB --> BE2
    BE1 --> PG
    BE2 --> PG
    PG --> PGR
    BE1 --> RD
    BE2 --> RD
    BE1 --> Mocks
    BE2 --> Mocks
    Mon --> BE1
    Mon --> BE2
    Mon --> PG

    style LB fill:#FF9800
    style PG fill:#336791
    style RD fill:#DC382D
```

#### Migration Path to Production

**Step 1: Docker Swarm** (Orchestration, still Docker)
```yaml
# docker-stack.yml
version: '3.8'
services:
  backend:
    image: barberpro/backend:latest
    deploy:
      replicas: 3                    # Multiple instances
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.role == worker
```

**Deploy**:
```bash
docker stack deploy -c docker-stack.yml barberpro
```

**Step 2: Kubernetes** (Full Orchestration)
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3                         # Horizontal scaling
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: barberpro/backend:latest
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
```

**Step 3: Managed Services** (Platform as a Service)
- **Railway**: `railway up` (automatic deployment)
- **Render**: Connect GitHub repo, auto-deploy
- **AWS ECS/Fargate**: Container orchestration
- **Google Cloud Run**: Serverless containers

### Database Scaling

#### Vertical Scaling (Single Instance)

**Current**: PostgreSQL 16 in container (suitable for <1000 concurrent users)

**Scaling Up**:
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'           # Increase from 1.0
      memory: 8G            # Increase from 1G
```

**Tuning** (`postgresql.conf`):
```conf
shared_buffers = 2GB              # 25% of RAM
effective_cache_size = 6GB        # 75% of RAM
maintenance_work_mem = 512MB
work_mem = 50MB
max_connections = 200
```

#### Horizontal Scaling (Replication)

**Read Replicas**:
```yaml
services:
  postgres-primary:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
    volumes:
      - postgres_primary:/var/lib/postgresql/data

  postgres-replica-1:
    image: postgres:16-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
    volumes:
      - postgres_replica_1:/var/lib/postgresql/data
```

**Connection Pooling** (PgBouncer):
```yaml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES: barberpro=host=postgres dbname=barberpro_dev
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
```

#### Managed Database Services

**Production Recommendation**: Use managed PostgreSQL
- **AWS RDS**: Automatic backups, multi-AZ replication
- **Google Cloud SQL**: Point-in-time recovery, read replicas
- **Azure Database**: Built-in high availability
- **Railway**: Managed PostgreSQL with automatic backups

**Benefits**:
- Automated backups and point-in-time recovery
- Automatic OS and PostgreSQL version updates
- High availability with multi-AZ deployment
- Read replicas for scaling reads
- Performance Insights and monitoring
- No manual replication setup

### Stateless Service Scaling

**Backend API** (Fastify):
```yaml
services:
  backend:
    deploy:
      replicas: 3                    # Run 3 instances
      update_config:
        parallelism: 1               # Update 1 at a time
        delay: 10s                   # Wait 10s between updates
      restart_policy:
        condition: on-failure
```

**Load Balancing** (Nginx):
```nginx
upstream backend {
    least_conn;                      # Route to least busy server
    server backend-1:3000;
    server backend-2:3000;
    server backend-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cache Scaling

**Redis Cluster** (High Availability):
```yaml
services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-sentinel-1:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

**Redis Sentinel** (Automatic Failover):
- Monitors master and replicas
- Promotes replica to master if primary fails
- Notifies clients of topology changes

---

## Troubleshooting Architecture

### Health Check Status

```bash
# View health status of all services
make status

# Check individual service health
docker inspect --format='{{.State.Health.Status}}' barberpro-postgres
docker inspect --format='{{.State.Health.Status}}' barberpro-backend-dev
```

**Health States**:
- `healthy` - Service is ready
- `unhealthy` - Service failed health checks
- `starting` - In grace period (before first check)
- `none` - No health check defined

### Network Debugging

```bash
# List all Docker networks
docker network ls

# Inspect network details
docker network inspect barberpro-network

# Test connectivity between containers
docker exec barberpro-backend-dev ping postgres
docker exec barberpro-backend-dev curl http://postgres:5432

# Test DNS resolution
docker exec barberpro-backend-dev nslookup postgres
```

### Volume Debugging

```bash
# List all volumes
docker volume ls

# Inspect volume
docker volume inspect barberpro-postgres-data

# View volume contents
docker run --rm -v barberpro-postgres-data:/data alpine ls -la /data

# Check volume size
docker system df -v | grep barberpro
```

### Resource Usage Monitoring

```bash
# Real-time resource stats
make stats
# or
docker stats

# View resource limits
docker inspect barberpro-backend-dev | grep -A 20 Resources

# Check Docker daemon resource usage
docker system df
```

### Service Communication Testing

```bash
# Test backend → postgres
docker exec barberpro-backend-dev nc -zv postgres 5432

# Test backend → redis
docker exec barberpro-backend-dev nc -zv redis 6379

# Test backend → mercadopago mock
docker exec barberpro-backend-dev curl http://mercadopago-mock:3001/health

# Test backend API from host
curl http://localhost:3000/api/health
```

### Port Conflict Resolution

```bash
# Check what's using a port (macOS/Linux)
lsof -i :5432
lsof -i :3000
lsof -i :5173

# Kill process using port
kill -9 $(lsof -ti:5432)

# Change port in .env
echo "POSTGRES_PORT=5433" >> docker/.env
```

### Common Architecture Issues

#### Issue: Services Start in Wrong Order

**Symptom**: Backend fails because PostgreSQL not ready

**Cause**: Health check not configured or failing

**Solution**:
```yaml
depends_on:
  postgres:
    condition: service_healthy  # Add health condition
  redis:
    condition: service_healthy
```

#### Issue: Network Isolation Problems

**Symptom**: Services can't communicate (connection refused)

**Cause**: Services on different networks or using `localhost`

**Solution**:
```yaml
# ❌ Wrong: Backend tries to connect to localhost
DATABASE_URL: postgresql://user:pass@localhost:5432/db

# ✅ Correct: Use container name
DATABASE_URL: postgresql://user:pass@postgres:5432/db
```

#### Issue: Volume Data Not Persisting

**Symptom**: Data lost after `docker-compose down`

**Cause**: Anonymous volumes or `down -v` flag used

**Solution**:
```yaml
# Use named volumes
volumes:
  postgres_data:
    name: barberpro-postgres-data  # Named volume persists

# Don't use -v flag for normal shutdown
docker-compose down        # ✅ Keeps volumes
docker-compose down -v     # ❌ Removes volumes
```

#### Issue: Resource Exhaustion

**Symptom**: Services killed by OOM or CPU throttling

**Cause**: Resource limits too low or too many services

**Solution**:
```bash
# Check resource usage
docker stats

# Increase Docker Desktop resources
# macOS: Docker Desktop > Preferences > Resources
# Linux: Edit /etc/docker/daemon.json

# Or stop unnecessary services
make mocks-down
make monitoring-down
```

---

## References

### Related Documentation

- [Setup Guide](./docker-setup-guide.md) - Step-by-step environment setup
- [Troubleshooting Guide](./docker-troubleshooting.md) - Common issues and solutions
- [Makefile Cheat Sheet](./makefile-cheat-sheet.md) - Quick command reference
- [Mock Services](../docker/mocks/README.md) - Argentina mock service documentation
- [Monitoring Stack](../docker/monitoring/README.md) - Observability and monitoring

### External Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Networking](https://docs.docker.com/network/)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [Resource Constraints](https://docs.docker.com/config/containers/resource_constraints/)

### Configuration Files

- **Compose Files**: `/docker/docker-compose*.yml`
- **Environment Example**: `/docker/.env.example`
- **Makefile**: `/Makefile`
- **Dockerfiles**:
  - Backend: `/backend/Dockerfile.dev`
  - Frontend: `/frontend/Dockerfile.dev`
  - Mocks: `/docker/mocks/*/Dockerfile`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-12 | Initial architecture documentation |

---

**Maintained by**: BarberPro DevOps Team
**Last Updated**: 2025-10-12
**Status**: Living Document (updated as architecture evolves)
