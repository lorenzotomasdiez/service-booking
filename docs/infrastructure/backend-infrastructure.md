# BarberPro Infrastructure Documentation
## Production Environment & Monitoring Setup - Argentina Optimized

### 🏗️ Architecture Overview

BarberPro is a premium Argentina-focused service booking platform optimized for sub-200ms response times and full regulatory compliance.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloudflare    │────│   Railway App    │────│   PostgreSQL    │
│      CDN        │    │   (Fastify API)  │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Load Balancer  │    │   Redis Cache    │    │  File Storage   │
│   (nginx)       │    │  (Session Mgmt)  │    │   (Uploads)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Monitoring    │    │    Security      │    │     Backup      │
│ (Prometheus +   │    │   (Rate Limits,  │    │   (Automated    │
│  Grafana)       │    │    DDoS, WAF)    │    │   S3 Storage)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🌎 Argentina-Specific Optimizations

#### Geographic Configuration
- **Primary Region**: Railway South America (São Paulo) - Closest to Argentina
- **CDN**: Cloudflare with Argentina edge locations
- **Timezone**: America/Argentina/Buenos_Aires (UTC-3)
- **Locale**: es-AR (Spanish Argentina)
- **Currency**: ARS (Argentine Peso)

#### Performance SLA
- **Response Time**: <200ms within Argentina
- **Uptime**: 99.9% availability
- **Peak Capacity**: 10,000+ concurrent users
- **Business Hours**: Mon-Fri 9:00-18:00, Sat 9:00-13:00 CLAT

### 🚀 Production Environment Configuration

#### Railway Platform Setup

**Environment Variables:**
```bash
# Core Application
NODE_ENV=production
PORT=3000
API_BASE_URL=${RAILWAY_STATIC_URL}
LOG_LEVEL=warn

# Database & Cache
DATABASE_URL=${DATABASE_URL}  # Provided by Railway
REDIS_URL=${REDIS_URL}        # Provided by Railway

# Security
JWT_SECRET=${JWT_SECRET}                    # 32+ character secret
CORS_ORIGIN=https://barberpro.com.ar,https://www.barberpro.com.ar
BCRYPT_SALT_ROUNDS=12

# Argentina Localization
TIMEZONE=America/Argentina/Buenos_Aires
LOCALE=es-AR
CURRENCY=ARS

# Payment Integration (MercadoPago)
MERCADOPAGO_ACCESS_TOKEN=${MERCADOPAGO_ACCESS_TOKEN}
MERCADOPAGO_PUBLIC_KEY=${MERCADOPAGO_PUBLIC_KEY}
MERCADOPAGO_WEBHOOK_SECRET=${MERCADOPAGO_WEBHOOK_SECRET}

# Rate Limiting (Argentina optimized)
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200    # Higher for Argentina usage patterns

# Monitoring & APM
SENTRY_DSN=${SENTRY_DSN}
NEWRELIC_LICENSE_KEY=${NEWRELIC_LICENSE_KEY}
DATADOG_API_KEY=${DATADOG_API_KEY}

# File Uploads
MAX_FILE_SIZE=5242880          # 5MB
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Email & Notifications
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
FROM_EMAIL=noreply@barberpro.com.ar

# WhatsApp Business API (Argentina primary communication)
WHATSAPP_TOKEN=${WHATSAPP_TOKEN}
WHATSAPP_PHONE_NUMBER_ID=${WHATSAPP_PHONE_NUMBER_ID}
WHATSAPP_WEBHOOK_VERIFY_TOKEN=${WHATSAPP_WEBHOOK_VERIFY_TOKEN}

# Backup Configuration
BACKUP_S3_BUCKET=${BACKUP_S3_BUCKET}
BACKUP_S3_ACCESS_KEY=${BACKUP_S3_ACCESS_KEY}
BACKUP_S3_SECRET_KEY=${BACKUP_S3_SECRET_KEY}
BACKUP_S3_REGION=us-east-1
```

#### Database Configuration (PostgreSQL)

**Production Settings:**
```sql
-- Performance optimizations for Argentina workload
shared_buffers = '1GB'
effective_cache_size = '3GB'
work_mem = '8MB'
maintenance_work_mem = '256MB'
max_connections = 200

-- Argentina timezone
timezone = 'America/Argentina/Buenos_Aires'
lc_time = 'es_AR.UTF-8'
lc_monetary = 'es_AR.UTF-8'

-- Query optimization
random_page_cost = 1.1  -- SSD optimized
effective_io_concurrency = 200
```

**Connection Pool:**
```javascript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Pool settings for Argentina load
  connectionLimit = 100
  poolTimeout = 30000
  socketTimeout = 60000
}
```

#### Redis Configuration

**Production Settings:**
```redis
# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence for Argentina compliance
save 900 1
save 300 10
save 60 10000

# AOF for durability
appendonly yes
appendfsync everysec

# Security
requirepass ${REDIS_PASSWORD}
rename-command FLUSHALL ""
rename-command CONFIG ""
```

### 📊 Monitoring & Alerting Setup

#### Prometheus Metrics Collection

**Application Metrics:**
- HTTP request duration (95th percentile <200ms SLA)
- Request rate per endpoint
- Error rates (4xx/5xx)
- Database connection pool usage
- Redis cache hit/miss ratios
- Memory and CPU utilization

**Business Metrics:**
- Booking creation rate (Argentina business hours)
- Payment success/failure rates (MercadoPago)
- User registration trends
- Provider utilization rates
- WhatsApp notification delivery rates

**Sample Prometheus Configuration:**
```yaml
# /monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    region: 'argentina'
    environment: 'production'

scrape_configs:
  - job_name: 'barberpro-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s

  - job_name: 'barberpro-business'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/business-metrics'
    scrape_interval: 60s
```

#### Grafana Dashboards

**Overview Dashboard:**
- Application health status
- Response time trends (Argentina SLA compliance)
- Request volume and error rates
- Database and Redis performance
- Business metrics (bookings, payments, users)

**Argentina Business Dashboard:**
- Peak usage hours analysis
- Geographic user distribution
- MercadoPago payment trends
- WhatsApp notification success rates
- Provider availability patterns

#### Alert Rules (Argentina-Focused)

**Critical Alerts:**
```yaml
# Application down
- alert: BarberProApplicationDown
  expr: up{job="barberpro-backend"} == 0
  for: 1m
  labels:
    severity: critical
    team: devops
  annotations:
    summary: "BarberPro application is down"
    description: "Immediate attention required - service unavailable to Argentina customers"

# High response time (Argentina SLA)
- alert: HighResponseTimeArgentina
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
  for: 5m
  labels:
    severity: warning
    sla: argentina
  annotations:
    summary: "Response time exceeding Argentina SLA"
    description: "95th percentile response time is {{ $value }}s, exceeding 200ms SLA"

# MercadoPago payment failures
- alert: MercadoPagoPaymentFailures
  expr: rate(payment_failures_total{provider="mercadopago"}[5m]) > 0.02
  for: 2m
  labels:
    severity: critical
    impact: revenue
  annotations:
    summary: "High MercadoPago payment failure rate"
    description: "Payment failures may impact Argentina revenue"
```

### 🔒 Security Hardening

#### Network Security

**DDoS Protection:**
```nginx
# /config/nginx-prod.conf
# Rate limiting for Argentina traffic
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=booking:10m rate=20r/m;

# Geographic filtering (optional)
geoip2 /usr/share/GeoIP/GeoLite2-Country.mmdb {
    auto_reload 5m;
    $geoip2_data_country_iso_code default=US source=$remote_addr country iso_code;
}

# Security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Application Security:**
```javascript
// Enhanced rate limiting per endpoint
const securityConfig = {
  rateLimits: {
    auth: { max: 10, timeWindow: '15 minutes' },      // Login protection
    booking: { max: 50, timeWindow: '1 hour' },       // Booking spam prevention
    payments: { max: 20, timeWindow: '1 hour' },      // Payment fraud prevention
    api: { max: 200, timeWindow: '15 minutes' }       // General API protection
  }
};

// SQL injection protection (additional to Prisma)
const sqlInjectionPatterns = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /UNION(?:\s+ALL)?\s+SELECT/i,
  // ... additional patterns
];

// Input sanitization
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
};
```

#### Data Protection (Argentina Compliance)

**PDPA Argentina Compliance:**
```javascript
// Data retention policies
const dataRetentionPolicy = {
  userSessions: '30 days',        // Session data
  auditLogs: '5 years',          // Legal requirement
  backups: '30 days',            // Operational backup
  personalData: 'user_requested'  // Delete on request
};

// Audit logging
const auditLog = {
  personalDataAccess: true,       // Track PII access
  dataModification: true,         // Track data changes
  userConsent: true,             // Track consent changes
  dataExport: true,              // Track data exports
  dataDeletion: true             // Track deletion requests
};
```

### 💾 Backup & Recovery

#### Automated Backup Strategy

**Daily Backups:**
```bash
# /scripts/backup.sh
# Automated daily backups at 2:00 AM CLAT
0 2 * * * /app/scripts/backup.sh

# Backup includes:
# - PostgreSQL database dump (compressed)
# - Application files (uploads, config)
# - System logs
# - Upload to S3 for offsite storage
```

**Backup Retention:**
- **Local**: 7 days (for quick recovery)
- **S3**: 30 days (for compliance)
- **Archive**: 1 year (for legal requirements)

**Recovery Procedures:**
```bash
# Database recovery
./scripts/restore.sh -d latest           # Latest database
./scripts/restore.sh -s 20241210_020000  # Specific backup from S3

# Full system recovery
./scripts/restore.sh -y latest           # Complete restore

# Disaster recovery
./scripts/restore.sh -s -y latest        # Full S3 restore
```

#### Disaster Recovery Plan

**RTO/RPO Targets:**
- **Database Corruption**: RTO 30min, RPO 15min
- **Application Failure**: RTO 15min, RPO 0min
- **Complete Outage**: RTO 4hrs, RPO 1hr

**Business Continuity:**
- Manual booking via WhatsApp during outage
- Phone-based MercadoPago payments
- SMS notifications as backup
- Customer communication in Spanish

### 🚀 Deployment Procedures

#### Production Deployment

**Automated Deployment:**
```bash
# Deploy to production
./scripts/deploy-production.sh production

# Deploy to staging
./scripts/deploy-production.sh staging

# Rollback if needed
./scripts/deploy-production.sh rollback
```

**Deployment Checklist:**
- [ ] Tests passing (unit, integration, e2e)
- [ ] Security audit clean
- [ ] Database migrations tested
- [ ] Performance benchmarks met
- [ ] Argentina timezone verified
- [ ] MercadoPago integration tested
- [ ] WhatsApp notifications working
- [ ] Monitoring alerts configured
- [ ] Backup verification complete

#### Zero-Downtime Deployments

**Blue-Green Strategy:**
1. Deploy to green environment
2. Run health checks and smoke tests
3. Switch traffic via load balancer
4. Monitor for 30 minutes
5. Decommission blue environment

**Database Migrations:**
```bash
# Safe migration strategy
1. Deploy backward-compatible schema changes
2. Deploy application code
3. Run data migrations
4. Clean up deprecated columns (next release)
```

### 📈 Performance Optimization

#### Argentina-Specific Optimizations

**CDN Configuration:**
```yaml
# Cloudflare settings for Argentina
cache_rules:
  - pattern: "/api/static/*"
    ttl: "1 day"
    edge_locations: ["buenos_aires", "sao_paulo"]
  
  - pattern: "/uploads/*"
    ttl: "7 days"
    compression: true
    
browser_cache:
  static_assets: "1 year"
  api_responses: "5 minutes"
```

**Database Query Optimization:**
```sql
-- Indexes optimized for Argentina usage patterns
CREATE INDEX CONCURRENTLY idx_bookings_argentina_tz 
ON bookings (created_at) 
WHERE timezone = 'America/Argentina/Buenos_Aires';

CREATE INDEX CONCURRENTLY idx_users_argentina_locale 
ON users (created_at, locale) 
WHERE locale = 'es-AR';

-- Provider availability optimization
CREATE INDEX CONCURRENTLY idx_provider_availability_argentina 
ON provider_schedules (provider_id, date, timezone) 
WHERE timezone = 'America/Argentina/Buenos_Aires';
```

**Caching Strategy:**
```javascript
// Redis caching for Argentina data
const cacheKeys = {
  services: 'services:es-AR',           // 1 hour TTL
  providers: 'providers:argentina',     // 30 minutes TTL
  schedules: 'schedules:{date}:argentina', // 15 minutes TTL
  rates: 'exchange:USD:ARS',           // 1 hour TTL (for pricing)
};

// Session caching
const sessionConfig = {
  store: 'redis',
  ttl: 24 * 60 * 60,  // 24 hours
  prefix: 'barberpro:session:',
  rolling: true        // Extend on activity
};
```

### 🔍 Troubleshooting Guide

#### Common Issues

**High Response Times:**
```bash
# Check database performance
psql $DATABASE_URL -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;"

# Check Redis performance
redis-cli --latency-history -i 1

# Check application logs
tail -f /var/log/barberpro/app.log | grep "SLOW_QUERY"
```

**Payment Issues (MercadoPago):**
```bash
# Test MercadoPago connectivity
curl -H "Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN" \
     https://api.mercadopago.com/v1/account/settings

# Check webhook delivery
grep "mercadopago_webhook" /var/log/nginx/access.log | tail -50
```

**Argentina Timezone Issues:**
```bash
# Verify server timezone
timedatectl status

# Check database timezone
psql $DATABASE_URL -c "SHOW timezone;"

# Verify application timezone
node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"
```

### 📋 Maintenance Procedures

#### Regular Maintenance

**Weekly Tasks:**
- Review performance metrics
- Check security alerts
- Verify backup integrity
- Update dependencies (security patches)
- Monitor Argentina usage patterns

**Monthly Tasks:**
- Database maintenance (VACUUM, ANALYZE)
- SSL certificate renewal check
- Capacity planning review
- Disaster recovery drill
- Business metrics analysis

**Quarterly Tasks:**
- Security audit
- Performance benchmarking
- Compliance review (Argentina regulations)
- Infrastructure cost optimization
- Team training updates

#### Scheduled Maintenance Windows

**Preferred Window:**
- **Day**: Sunday
- **Time**: 2:00 AM - 6:00 AM CLAT (minimal user impact)
- **Duration**: Maximum 4 hours
- **Notification**: 48 hours advance notice in Spanish

**Emergency Maintenance:**
- Any time with immediate notification
- Customer communication via WhatsApp and email
- Status page updates in Spanish
- Maximum 2 hours duration

### 📞 Support & Escalation

#### On-Call Procedures

**Escalation Matrix:**
1. **Level 1**: DevOps Engineer (15 minutes response)
2. **Level 2**: Senior Developer (30 minutes response)
3. **Level 3**: Technical Lead (1 hour response)
4. **Level 4**: CTO (2 hours response)

**Communication Channels:**
- **Critical**: Phone + WhatsApp + Slack
- **High**: Slack + Email
- **Medium**: Email + Ticket
- **Low**: Ticket system

#### Customer Communication

**Channels (Argentina-specific):**
1. **WhatsApp Business**: Primary channel (+54 11 xxxx-xxxx)
2. **Email**: soporte@barberpro.com.ar
3. **Website**: Status page at status.barberpro.com.ar
4. **Social Media**: @BarberProAR (Twitter/Instagram)

**Communication Templates:**
- All messages in Spanish
- Include estimated resolution time in CLAT
- Provide alternative booking methods during outage
- Follow up every 30 minutes for critical issues

### 🔗 External Dependencies

#### Third-Party Services

**Payment Provider:**
- **MercadoPago**: Primary payment processor for Argentina
- **Fallback**: Manual payment processing via phone
- **Monitoring**: Payment success rate >95%

**Communication:**
- **WhatsApp Business API**: Primary notification channel
- **SendGrid**: Email delivery service
- **Twilio**: SMS backup for notifications

**Infrastructure:**
- **Railway**: Application hosting platform
- **Cloudflare**: CDN and DDoS protection
- **AWS S3**: Backup storage
- **GitHub**: Source code and CI/CD

#### Service Level Agreements

**Railway Platform:**
- **Uptime**: 99.9% guaranteed
- **Support**: 24/7 technical support
- **Performance**: <100ms internal network latency

**Cloudflare:**
- **Uptime**: 99.9% guaranteed
- **Performance**: <50ms edge response time
- **DDoS Protection**: Unlimited mitigation

### 📊 Cost Optimization

#### Resource Planning

**Current Costs (Monthly):**
- Railway App: $20-50 (variable based on usage)
- PostgreSQL: $15-30 (based on storage/connections)
- Redis: $10-20 (based on memory usage)
- S3 Backup: $5-10 (based on storage)
- Monitoring: $30-50 (Grafana Cloud/DataDog)

**Scaling Triggers:**
- **CPU**: Scale up at >70% sustained
- **Memory**: Scale up at >80% sustained  
- **Database**: Add read replicas at >500 concurrent users
- **Redis**: Increase memory at >90% usage

**Cost Controls:**
- Automatic scaling down during low usage
- Archive old backups to cheaper storage
- Optimize database queries for efficiency
- Use CDN caching to reduce origin requests

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-10  
**Next Review:** 2025-03-10  
**Maintained By:** DevOps Team  
**Environment:** Production  
**Region:** Argentina (South America)