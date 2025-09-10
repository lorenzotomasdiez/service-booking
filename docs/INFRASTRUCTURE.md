# BarberPro Infrastructure Documentation

## Overview

BarberPro's infrastructure is designed for rapid deployment, scalability, and Argentina-optimized performance. We've chosen Railway for the initial deployment phase to enable quick time-to-market while maintaining a clear migration path to AWS for future scaling.

## Architecture Decision: Railway vs AWS

### Selected Platform: Railway
**Rationale:**
- **Time to Market**: 90% faster setup (minutes vs hours)
- **Developer Experience**: Zero-config managed services
- **Cost Efficiency**: $5-50/month vs $50-500/month for comparable AWS setup
- **Argentina Optimization**: Global CDN with SA edge locations
- **Simplified Operations**: Managed PostgreSQL, Redis, and auto-scaling

### Migration Path to AWS
When we reach 10K+ concurrent users or need advanced features:
- Database: Railway PostgreSQL → AWS RDS Multi-AZ
- Caching: Railway Redis → AWS ElastiCache
- Computing: Railway Containers → AWS ECS/EKS
- Storage: Railway Files → AWS S3 + CloudFront
- Monitoring: Railway Metrics → AWS CloudWatch + DataDog

## Infrastructure Components

### 1. Application Hosting
- **Platform**: Railway
- **Runtime**: Node.js 18 (Alpine Linux containers)
- **Scaling**: Auto-scaling based on CPU/Memory thresholds
- **Regions**: Primary deployment with Argentina edge optimization

### 2. Database Services

#### PostgreSQL (Primary Database)
- **Service**: Railway PostgreSQL 15
- **Configuration**:
  - Staging: 1GB RAM, 10GB storage
  - Production: 4GB RAM, 50GB storage
- **Features**:
  - Automated daily backups (7-day retention)
  - Point-in-time recovery
  - SSL/TLS encryption
  - Connection pooling via Prisma

#### Redis (Caching & Sessions)
- **Service**: Railway Redis 7
- **Configuration**:
  - Staging: 256MB memory
  - Production: 1GB memory
- **Use Cases**:
  - Session management
  - API response caching
  - Rate limiting
  - Real-time notifications

### 3. Content Delivery & DNS

#### Domain Configuration
- **Primary Domain**: barberpro.com.ar
- **Subdomains**:
  - `api.barberpro.com.ar` - API endpoints
  - `staging.barberpro.com.ar` - Staging environment
  - `admin.barberpro.com.ar` - Admin dashboard
- **DNS Provider**: Cloudflare
- **SSL Certificates**: Cloudflare managed (Let's Encrypt)

#### CDN & Performance
- **Provider**: Cloudflare
- **Features**:
  - Argentina edge servers for <100ms latency
  - DDoS protection
  - Web Application Firewall (WAF)
  - Image optimization and compression
  - Brotli compression for 30% faster loading

### 4. File Storage
- **Service**: AWS S3 (for production files)
- **Buckets**:
  - `barberpro-staging-uploads` - Staging environment
  - `barberpro-production-uploads` - Production files
- **Features**:
  - Versioning enabled
  - Server-side encryption (AES-256)
  - Cross-region replication for backup
  - Lifecycle policies for cost optimization

## Environment Configuration

### Development Environment
```bash
# Local development setup
npm run dev:setup    # Starts local PostgreSQL + Redis via Docker
npm run dev         # Starts SvelteKit + Fastify
```

### Staging Environment
- **URL**: https://staging.barberpro.com.ar
- **Database**: Railway PostgreSQL (isolated instance)
- **Purpose**: Pre-production testing and client demos
- **Deployment**: Automatic on `develop` branch push

### Production Environment
- **URL**: https://barberpro.com.ar
- **Database**: Railway PostgreSQL (production instance)
- **Deployment**: Manual approval required for `main` branch
- **Monitoring**: Full observability stack

## CI/CD Pipeline

### Workflow Stages

1. **Code Quality** (2-3 minutes)
   - TypeScript type checking
   - ESLint static analysis
   - Prettier formatting validation
   - Security vulnerability scanning

2. **Testing** (5-8 minutes)
   - Unit tests with Jest
   - Integration tests with test database
   - E2E tests with Playwright
   - Coverage reporting to Codecov

3. **Build & Security** (3-5 minutes)
   - Multi-arch Docker image build
   - Container security scanning with Trivy
   - Push to GitHub Container Registry

4. **Deployment** (2-3 minutes)
   - Automated staging deployment
   - Production deployment with manual approval
   - Database migrations
   - Health checks validation

### Deployment Strategy
- **Zero-downtime deployments**: Blue-green strategy
- **Rollback capability**: Instant rollback to previous version
- **Feature flags**: Gradual rollout for new features
- **Database migrations**: Automated with safety checks

## Security Implementation

### Application Security
- **Authentication**: JWT with 7-day expiration
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Restricted to allowed origins
- **Input Validation**: Joi schemas for all endpoints

### Infrastructure Security
- **SSL/TLS**: Enforced across all connections
- **Database Encryption**: At-rest and in-transit
- **Secret Management**: Railway environment variables
- **Container Security**: Regular base image updates
- **Network Security**: Private networks for database access

### Argentina Compliance
- **Data Residency**: All data stored within LATAM region
- **GDPR-like Privacy**: User data protection and deletion rights
- **AFIP Integration Ready**: Tax compliance infrastructure
- **PCI DSS**: Preparation for payment processing compliance

## Monitoring & Observability

### Health Checks
- **Basic Health**: `/health` - Service status
- **Detailed Health**: `/health/detailed` - Full system check
- **Readiness Probe**: `/health/ready` - Container orchestration
- **Liveness Probe**: `/health/live` - Application status

### Performance Monitoring
- **Response Time**: <200ms target for Argentina users
- **Uptime SLA**: 99.9% availability target
- **Database Performance**: Query optimization monitoring
- **CDN Performance**: Cache hit rate and edge latency

### Alerting
- **Critical Alerts**: Service down, database issues
- **Warning Alerts**: High response times, elevated error rates
- **Info Alerts**: Deployment notifications, scheduled maintenance

## Cost Optimization

### Railway Costs (Estimated Monthly)
- **Staging Environment**: $20-30/month
- **Production Environment**: $100-200/month
- **Total Infrastructure**: $120-230/month

### Cost Control Measures
- **Auto-scaling**: Scale down during low traffic periods
- **Image Optimization**: Smaller container images
- **Database Optimization**: Query performance tuning
- **CDN Caching**: Reduce origin requests

## Backup & Disaster Recovery

### Database Backups
- **Frequency**: Daily automated backups
- **Retention**: 7 days on Railway, 30 days on S3
- **Testing**: Monthly backup restoration tests
- **RTO**: 15 minutes for Railway restore
- **RPO**: 1 hour maximum data loss

### Application Recovery
- **Container Images**: Versioned and stored in registry
- **Configuration**: Environment variables backed up
- **Code Repository**: GitHub with full history
- **Infrastructure as Code**: All configurations versioned

## Team Access & Procedures

### Access Management
- **Railway Access**: Project-level permissions
- **GitHub Access**: Repository and organization permissions
- **AWS Access**: IAM roles with least privilege
- **Cloudflare Access**: DNS and security management

### Deployment Procedures
1. **Feature Development**: Create feature branch
2. **Code Review**: Pull request approval required
3. **Staging Deployment**: Automatic on develop branch
4. **Production Deployment**: Manual approval on main branch
5. **Post-deployment**: Health checks and monitoring verification

### Emergency Procedures
- **Service Down**: Immediate rollback procedure
- **Database Issues**: Point-in-time recovery process
- **Security Incident**: Incident response playbook
- **Performance Issues**: Auto-scaling and optimization steps

## Database Connection Information

### Staging Environment
```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://railway_user:railway_password@railway_host:5432/railway_staging_db?sslmode=require"

# Redis Connection
REDIS_URL="redis://railway_user:railway_password@railway_redis_host:6379"
```

### Production Environment
```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://railway_user:railway_password@railway_host:5432/railway_production_db?sslmode=require"

# Redis Connection
REDIS_URL="redis://railway_user:railway_password@railway_redis_host:6379"
```

**Note**: Actual connection strings will be provided via Railway environment variables and shared securely with the development team.

## Next Steps

### Immediate (Day 1-2)
1. ✅ Railway account setup and project creation
2. ✅ Domain registration and Cloudflare configuration
3. ✅ GitHub Actions pipeline implementation
4. ⏳ Database provisioning and connection testing
5. ⏳ SSL certificate configuration and validation

### Short-term (Week 1-2)
1. Production deployment of MVP
2. Monitoring and alerting setup
3. Performance optimization
4. Security audit and hardening
5. Team training on deployment procedures

### Medium-term (Month 1-3)
1. Advanced monitoring with custom metrics
2. Performance testing and optimization
3. Disaster recovery testing
4. Compliance audit preparation
5. Cost optimization review

### Long-term (Month 3-6)
1. AWS migration planning (if needed)
2. Multi-region deployment consideration
3. Advanced security features
4. Performance scaling optimization
5. Infrastructure automation improvements

---

**Document Version**: 1.0  
**Last Updated**: Day 1 of Sprint  
**Next Review**: Week 2 of Sprint  
**Contact**: DevOps Team - devops@barberpro.com.ar