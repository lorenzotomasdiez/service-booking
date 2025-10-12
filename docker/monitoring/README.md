# BarberPro Monitoring Stack

Comprehensive monitoring solution for the BarberPro service booking platform, providing real-time metrics, logs, and performance insights.

## Overview

The monitoring stack is a production-ready observability solution that helps you:

- **Track Application Performance**: Monitor API response times, error rates, and throughput
- **Database Health**: PostgreSQL and Redis metrics, connection pools, query performance
- **Infrastructure Monitoring**: Container resource usage (CPU, memory, network, disk)
- **Log Aggregation**: Centralized log collection and analysis
- **Alerting**: Proactive notifications for issues (when configured)

This stack is designed for both development and production environments, with sensible defaults for local development and scalability for production deployments.

## Services

### 1. Prometheus (Metrics Collection)
**URL**: http://localhost:9090
**Purpose**: Time-series database for metrics collection and storage

Prometheus scrapes metrics from:
- BarberPro Backend API (`/metrics` endpoint)
- PostgreSQL (via postgres-exporter)
- Redis (via redis-exporter)
- Docker containers (via cAdvisor)
- Prometheus itself (self-monitoring)

**Key Features**:
- 15-second scrape interval for real-time data
- 7-day retention period (configurable)
- PromQL query language for metrics analysis
- Alert rule evaluation

**Configuration**: `docker/monitoring/prometheus/prometheus.yml`

### 2. Grafana (Visualization & Dashboards)
**URL**: http://localhost:3001
**Default Login**: admin/admin (change in production!)

Grafana provides rich, interactive dashboards for visualizing your metrics and logs.

**Pre-configured Dashboards**:
1. **BarberPro API Dashboard**: Application-level metrics, request rates, errors
2. **PostgreSQL Dashboard**: Database performance, queries, connections
3. **Redis Dashboard**: Cache hit rates, memory usage, key statistics
4. **Container Monitoring**: Docker resource usage across all services

**Key Features**:
- Real-time metric visualization
- Custom dashboard creation
- Multiple data source support (Prometheus, Loki)
- Alert management and notifications
- User access control

**Configuration**: `docker/monitoring/grafana/grafana.ini`

### 3. Loki (Log Aggregation)
**URL**: http://localhost:3100
**Purpose**: Horizontally scalable log aggregation system

Loki collects and indexes logs from all services, making them searchable and correlatable with metrics.

**Key Features**:
- LogQL query language (similar to PromQL)
- Label-based log indexing (efficient storage)
- Integration with Grafana for log visualization
- 7-day log retention (configurable)

**Access Logs**: Via Grafana's "Explore" feature or direct API queries

**Configuration**: `docker/monitoring/loki/loki-config.yml`

### 4. cAdvisor (Container Metrics)
**URL**: http://localhost:8080
**Purpose**: Real-time container resource usage and performance metrics

cAdvisor provides detailed container-level metrics:
- CPU usage per container
- Memory consumption and limits
- Network I/O statistics
- Disk I/O and usage
- Container lifecycle events

**Note**: Runs in privileged mode to access host metrics

## Quick Start

### Start Monitoring Stack

```bash
# Start monitoring services only
make monitoring

# Or use docker-compose directly
docker-compose -f docker/docker-compose.monitoring.yml up -d
```

The monitoring stack requires the `barberpro-dev-network` Docker network to exist. If running standalone, ensure the network is created:

```bash
docker network create barberpro-dev-network
```

### Stop Monitoring Stack

```bash
# Stop monitoring services
make monitoring-down

# Or use docker-compose directly
docker-compose -f docker/docker-compose.monitoring.yml down
```

### View Logs

```bash
# Tail all monitoring service logs
make monitoring-logs

# Or use docker-compose directly
docker-compose -f docker/docker-compose.monitoring.yml logs -f
```

### Open Grafana

```bash
# Open Grafana in your browser (macOS/Linux)
make grafana

# Or manually navigate to:
# http://localhost:3001
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Prometheus | http://localhost:9090 | Metrics database and query interface |
| Grafana | http://localhost:3001 | Dashboards and visualization (admin/admin) |
| Loki | http://localhost:3100 | Log aggregation API |
| cAdvisor | http://localhost:8080 | Container metrics UI |

## Pre-built Dashboards

### 1. BarberPro API Dashboard
**File**: `grafana/provisioning/dashboards/barberpro-api.json`

**Metrics Displayed**:
- Request rate (requests/second)
- Response time (p50, p95, p99 percentiles)
- Error rate and status code distribution
- Active connections and connection pool usage
- Endpoint-specific performance metrics

**Use Cases**:
- Monitor API health and performance
- Identify slow endpoints
- Track error patterns
- Capacity planning

### 2. PostgreSQL Dashboard
**File**: `grafana/provisioning/dashboards/postgres.json`

**Metrics Displayed**:
- Connection pool usage and wait times
- Query performance and slow queries
- Transaction rate and duration
- Database size and growth
- Table/index statistics
- Lock contention and deadlocks

**Use Cases**:
- Database performance tuning
- Identify connection pool issues
- Monitor query performance
- Capacity planning

### 3. Redis Dashboard
**File**: `grafana/provisioning/dashboards/redis.json`

**Metrics Displayed**:
- Memory usage and eviction stats
- Cache hit/miss ratio
- Key expiration and eviction
- Command statistics
- Connection count
- Persistence metrics (RDB/AOF)

**Use Cases**:
- Cache efficiency analysis
- Memory usage optimization
- Performance monitoring
- Identify cache bottlenecks

### 4. Container Monitoring Dashboard
**File**: `grafana/provisioning/dashboards/containers.json`

**Metrics Displayed**:
- CPU usage per container
- Memory usage and limits
- Network I/O (sent/received)
- Disk I/O and usage
- Container restart count

**Use Cases**:
- Resource usage optimization
- Identify resource-hungry containers
- Capacity planning
- Infrastructure health monitoring

## Configuration

### Environment Variables

Configure the monitoring stack via environment variables in `docker/.env`:

```bash
# Grafana Admin Credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin  # CHANGE IN PRODUCTION!

# Retention Periods
PROMETHEUS_RETENTION_DAYS=7   # Metrics retention
LOKI_RETENTION_DAYS=7         # Logs retention
```

### Customizing Prometheus Scrape Targets

Edit `docker/monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'barberpro-backend'
    static_configs:
      - targets: ['backend:3000']
    scrape_interval: 15s  # Customize interval
```

### Adding Custom Dashboards

1. Create your dashboard in Grafana UI
2. Export as JSON
3. Place in `docker/monitoring/grafana/provisioning/dashboards/`
4. Restart Grafana: `docker-compose -f docker/docker-compose.monitoring.yml restart grafana`

### Configuring Alerts

Edit `docker/monitoring/prometheus/alerts.yml` to add alert rules:

```yaml
groups:
  - name: barberpro_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
```

## Resource Usage

### Development Environment

Approximate resource consumption with default settings:

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| Prometheus | 0.5 cores | 512 MB | ~100 MB (7 days) |
| Grafana | 0.3 cores | 256 MB | ~50 MB |
| Loki | 0.3 cores | 512 MB | ~200 MB (7 days) |
| cAdvisor | 0.2 cores | 128 MB | Minimal |
| **Total** | **~1.3 cores** | **~1.4 GB** | **~350 MB** |

**Recommendations**:
- Minimum 2 CPU cores and 4 GB RAM for development
- SSD recommended for better I/O performance
- Adjust retention periods to balance storage vs. history

### Production Environment

For production deployments:

- **Increase retention periods**: 30+ days for metrics and logs
- **Add redundancy**: Deploy Prometheus in HA mode
- **External storage**: Use remote storage for long-term metrics (Thanos, Cortex)
- **Resource limits**: Adjust based on actual workload
- **Security**: Change default passwords, enable authentication, use TLS

## Integration with BarberPro Services

### Backend API Metrics

The BarberPro backend exposes metrics at `/metrics` endpoint. Prometheus automatically scrapes these metrics.

**Required**: Backend must implement Prometheus metrics exporter (e.g., `prom-client` for Node.js)

**Example Metrics**:
```
http_request_duration_seconds
http_requests_total
nodejs_heap_size_used_bytes
db_query_duration_seconds
```

### Frontend Monitoring (Future)

For frontend monitoring, consider:
- Adding browser-based metrics collection
- Using Grafana Faro for RUM (Real User Monitoring)
- Correlating frontend metrics with backend performance

### Log Collection (Future)

To enable log shipping to Loki:

1. **Docker Logs**: Use Loki Docker driver
2. **Application Logs**: Use Loki client libraries
3. **File-based**: Use Promtail to tail log files

## Troubleshooting

### Services Not Starting

**Issue**: Monitoring services fail to start

**Solutions**:
```bash
# Check if Docker network exists
docker network ls | grep barberpro-dev-network

# Create network if missing
docker network create barberpro-dev-network

# Check port conflicts
lsof -i :9090  # Prometheus
lsof -i :3001  # Grafana
lsof -i :3100  # Loki
lsof -i :8080  # cAdvisor

# View detailed logs
docker-compose -f docker/docker-compose.monitoring.yml logs
```

### Grafana Login Issues

**Issue**: Cannot log in to Grafana

**Solutions**:
```bash
# Reset admin password
docker exec -it barberpro-grafana grafana-cli admin reset-admin-password newpassword

# Check environment variables
docker exec barberpro-grafana env | grep GF_
```

### No Metrics in Prometheus

**Issue**: Prometheus shows no data or targets are down

**Solutions**:
```bash
# Check Prometheus targets
# Visit: http://localhost:9090/targets

# Verify backend metrics endpoint
curl http://localhost:3000/metrics

# Check Prometheus configuration
docker exec barberpro-prometheus cat /etc/prometheus/prometheus.yml

# Restart Prometheus
docker-compose -f docker/docker-compose.monitoring.yml restart prometheus
```

### cAdvisor Permission Issues (Linux)

**Issue**: cAdvisor cannot access host metrics

**Solutions**:
```bash
# Ensure cAdvisor runs in privileged mode (already configured)
# Check SELinux settings (if applicable)
sudo setenforce 0  # Temporarily disable for testing

# Verify volume mounts
docker inspect barberpro-cadvisor | grep Mounts -A 20
```

### High Memory Usage

**Issue**: Monitoring stack consuming too much memory

**Solutions**:
```bash
# Reduce retention periods in docker/.env
PROMETHEUS_RETENTION_DAYS=3
LOKI_RETENTION_DAYS=3

# Adjust resource limits in docker-compose.monitoring.yml
# Reduce scrape intervals in prometheus.yml
```

### Dashboards Not Loading

**Issue**: Grafana dashboards are missing or not loading

**Solutions**:
```bash
# Check dashboard provisioning
docker exec barberpro-grafana ls /etc/grafana/provisioning/dashboards/

# Restart Grafana to reload dashboards
docker-compose -f docker/docker-compose.monitoring.yml restart grafana

# Check Grafana logs for errors
docker logs barberpro-grafana
```

## Advanced Configuration

### Email Alerts (Grafana)

Configure SMTP for alert notifications in `grafana.ini`:

```ini
[smtp]
enabled = true
host = smtp.gmail.com:587
user = your-email@gmail.com
password = your-app-password
from_address = alerts@barberpro.com
from_name = BarberPro Monitoring
```

### Long-term Metrics Storage

For production, use remote storage:

1. **Thanos**: Unlimited metrics retention using object storage (S3, GCS)
2. **Cortex**: Horizontally scalable Prometheus-as-a-Service
3. **VictoriaMetrics**: High-performance long-term storage

### High Availability

For production HA setup:

1. Run multiple Prometheus instances with the same configuration
2. Use Thanos or Cortex for global view and deduplication
3. Load balance Grafana with multiple replicas
4. Use distributed Loki deployment

### Custom Metrics

Add custom application metrics:

**Backend (Node.js example)**:
```javascript
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Use in middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path, res.statusCode).observe(duration);
  });
  next();
});
```

## Security Considerations

### Development Environment
- Default credentials (admin/admin) are acceptable
- No TLS required for local development
- Network isolation via Docker networks

### Production Environment
**Required Security Measures**:

1. **Change Default Credentials**:
   ```bash
   GRAFANA_ADMIN_PASSWORD=strong_random_password_here
   ```

2. **Enable TLS**: Use reverse proxy (nginx) with Let's Encrypt
   ```nginx
   server {
     listen 443 ssl;
     server_name grafana.barberpro.com.ar;

     ssl_certificate /etc/letsencrypt/live/grafana.barberpro.com.ar/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/grafana.barberpro.com.ar/privkey.pem;

     location / {
       proxy_pass http://localhost:3001;
     }
   }
   ```

3. **Restrict Network Access**:
   - Don't expose monitoring ports publicly
   - Use VPN or IP whitelisting
   - Configure firewall rules

4. **Authentication**:
   - Enable OAuth/SSO in Grafana
   - Use API tokens for programmatic access
   - Implement role-based access control

5. **Audit Logging**: Enable audit logs for all monitoring access

## Integration Examples

### Querying Metrics (PromQL)

```promql
# API request rate (last 5 minutes)
rate(http_requests_total[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Database connection pool usage
pg_stat_database_connections / pg_settings_max_connections * 100
```

### Querying Logs (LogQL)

```logql
# All error logs from backend
{container="barberpro-backend"} |= "error"

# Failed database queries
{container="barberpro-backend"} |= "database" |= "error"

# Rate of error logs (last 5 minutes)
rate({container="barberpro-backend"} |= "error" [5m])
```

### Grafana API Usage

```bash
# Create API key
curl -X POST http://admin:admin@localhost:3001/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name":"automation", "role":"Admin"}'

# Query Prometheus via Grafana
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3001/api/datasources/proxy/1/api/v1/query?query=up"
```

## Best Practices

1. **Start Simple**: Use pre-built dashboards first, customize later
2. **Monitor What Matters**: Focus on SLIs (Service Level Indicators)
3. **Set Meaningful Alerts**: Avoid alert fatigue with proper thresholds
4. **Regular Reviews**: Review dashboards and metrics regularly
5. **Document Custom Metrics**: Keep inventory of custom metrics and their purpose
6. **Retention Policy**: Balance history needs with storage costs
7. **Backup Dashboards**: Export important dashboards regularly
8. **Test Alerts**: Verify alert notifications work before production

## Further Reading

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [cAdvisor GitHub](https://github.com/google/cadvisor)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards Community](https://grafana.com/grafana/dashboards/)

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review service logs: `make monitoring-logs`
- Consult the official documentation linked above
- Raise an issue in the BarberPro repository

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Maintained by**: BarberPro DevOps Team
