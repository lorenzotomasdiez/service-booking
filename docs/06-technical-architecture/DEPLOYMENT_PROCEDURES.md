# BarberPro Deployment Procedures

## Quick Deployment Guide

### Prerequisites
- Railway CLI installed and configured
- GitHub repository access
- Environment variables configured
- Database migrations ready

### Standard Deployment Process

#### 1. Staging Deployment (Automatic)
```bash
# Push to develop branch triggers automatic staging deployment
git checkout develop
git pull origin develop
git merge feature-branch
git push origin develop

# Monitor deployment in GitHub Actions
# https://github.com/your-org/service-booking/actions
```

#### 2. Production Deployment (Manual Approval)
```bash
# Create pull request to main branch
git checkout main
git pull origin main
git merge develop
git push origin main

# Approve deployment in GitHub Actions
# Navigate to Actions tab and approve production deployment
```

## Railway Deployment Commands

### Manual Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Select project
railway link [project-id]

# Deploy to staging
railway deploy --environment staging

# Deploy to production (requires confirmation)
railway deploy --environment production
```

### Environment Management
```bash
# View current environment variables
railway vars

# Set environment variable
railway vars set KEY=value

# Deploy with specific environment
railway deploy --environment production
```

## Database Migration Procedures

### Automated Migrations (Recommended)
```bash
# Migrations run automatically during deployment
# Configured in GitHub Actions workflow

# Manual migration if needed
railway run --environment staging npx prisma migrate deploy
railway run --environment production npx prisma migrate deploy
```

### Manual Migration Process
```bash
# 1. Create migration locally
npx prisma migrate dev --name migration_name

# 2. Test migration on staging
railway run --environment staging npx prisma migrate deploy

# 3. Verify staging works correctly
curl https://staging.barberpro.com.ar/health

# 4. Deploy to production
railway run --environment production npx prisma migrate deploy

# 5. Verify production health
curl https://barberpro.com.ar/health
```

## Rollback Procedures

### Quick Rollback (GitHub Actions)
```bash
# Option 1: Revert commit and redeploy
git revert HEAD
git push origin main
# GitHub Actions will automatically deploy the reverted version

# Option 2: Deploy previous working commit
git checkout main
git reset --hard [previous-working-commit-hash]
git push --force-with-lease origin main
```

### Railway Rollback
```bash
# View deployment history
railway status

# Rollback to previous deployment
railway rollback [deployment-id]

# Or rollback to specific version
railway deploy --from [commit-hash]
```

### Database Rollback (Critical)
```bash
# 1. Stop application traffic (if possible)
railway scale --replicas 0

# 2. Restore from backup
railway db:restore [backup-id]

# 3. Apply necessary data fixes
railway run npx prisma db seed

# 4. Restart application
railway scale --replicas 2

# 5. Verify health
curl https://barberpro.com.ar/health
```

## Health Check Procedures

### Deployment Verification
```bash
# Basic health check
curl -f https://barberpro.com.ar/health

# Detailed health check
curl -f https://barberpro.com.ar/health/detailed

# Check specific services
curl -f https://api.barberpro.com.ar/health
```

### Post-Deployment Testing
```bash
# Run smoke tests
npm run test:smoke

# Check database connectivity
railway run --environment production npx prisma studio

# Verify payment integration
curl -X POST https://api.barberpro.com.ar/payments/test
```

## Emergency Procedures

### Service Down Emergency
```bash
# 1. Immediate assessment
curl -I https://barberpro.com.ar/health

# 2. Check Railway status
railway status

# 3. View logs
railway logs --environment production

# 4. Quick rollback if deployment issue
railway rollback

# 5. Scale up if resource issue
railway scale --replicas 3
```

### Database Emergency
```bash
# 1. Check database status
railway run --environment production npx prisma db pull

# 2. Check connection count
railway metrics

# 3. If connection limit reached
railway restart

# 4. If data corruption suspected
railway db:restore [latest-backup-id]
```

### Performance Emergency
```bash
# 1. Check metrics
railway metrics

# 2. Scale horizontally
railway scale --replicas 4

# 3. Enable CDN caching (if not enabled)
# Update Cloudflare cache settings

# 4. Database performance check
railway logs --filter "slow query"
```

## Security Incident Response

### Suspected Security Breach
```bash
# 1. Immediate response
railway vars unset JWT_SECRET
railway vars set JWT_SECRET=[new-secure-secret]

# 2. Force all users to re-authenticate
railway run npx prisma db execute --stdin < "UPDATE users SET updated_at = NOW()"

# 3. Review access logs
railway logs --environment production | grep "suspicious activity"

# 4. Deploy security patches
git checkout security-patch
railway deploy --environment production
```

### API Key Compromise
```bash
# 1. Rotate all API keys
railway vars set MERCADOPAGO_ACCESS_TOKEN=[new-token]
railway vars set AWS_ACCESS_KEY_ID=[new-key]

# 2. Redeploy application
railway deploy

# 3. Monitor for unauthorized usage
railway logs | grep "401\|403"
```

## Monitoring During Deployment

### Key Metrics to Watch
- Response time: <200ms for Argentina users
- Error rate: <1% of requests
- Database connections: <80% of limit
- Memory usage: <85% of allocated
- CPU usage: <75% of allocated

### Automated Alerts
```bash
# Set up alerts in Railway dashboard
# Configure Slack/email notifications
# Monitor GitHub Actions status
```

### Manual Monitoring Commands
```bash
# Real-time logs
railway logs --follow

# Performance metrics
railway metrics --live

# Database performance
railway run npx prisma studio
```

## Team Communication

### Deployment Notifications
```bash
# Slack notification format:
# 🚀 [STAGING] Deployment started - Feature: user-authentication
# ✅ [STAGING] Deployment successful - Version: 1.2.3
# ❌ [STAGING] Deployment failed - Rolling back
# 🔄 [PRODUCTION] Rollback completed - Previous version restored
```

### Incident Communication
```bash
# Status page update template:
# "We are investigating reports of slow response times..."
# "Issue identified - deploying fix..."
# "Service restored - monitoring for stability..."
```

## Troubleshooting Guide

### Common Issues

#### Deployment Fails
```bash
# Check build logs
railway logs --deployment [deployment-id]

# Common fixes:
# 1. Environment variable missing
railway vars set MISSING_VAR=value

# 2. Docker build issue
# Check Dockerfile syntax
docker build . --no-cache

# 3. Database connection issue
railway vars | grep DATABASE_URL
```

#### Health Check Fails
```bash
# Check service status
railway status

# Check dependencies
curl https://barberpro.com.ar/health/detailed

# Common fixes:
# 1. Database not responding
railway restart

# 2. Redis connection issue
railway vars set REDIS_URL=[correct-url]

# 3. External API timeout
# Check MercadoPago status
```

#### Performance Issues
```bash
# Check resource usage
railway metrics

# Scale if needed
railway scale --replicas 3

# Database optimization
railway run npx prisma db optimize

# CDN cache optimization
# Update Cloudflare cache rules
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup created
- [ ] Team notified

### During Deployment
- [ ] Monitor deployment logs
- [ ] Watch health checks
- [ ] Verify database migrations
- [ ] Test critical user flows
- [ ] Monitor error rates

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance within SLA
- [ ] No elevated error rates
- [ ] Database queries optimized
- [ ] Team notified of completion

## Contact Information

**Emergency Contacts:**
- DevOps Lead: devops@barberpro.com.ar
- Tech Lead: tech@barberpro.com.ar
- On-call Rotation: +54 11 xxxx-xxxx

**External Support:**
- Railway Support: support@railway.app
- Cloudflare Support: cloudflare.com/support
- GitHub Support: support.github.com

---

**Document Version**: 1.0  
**Last Updated**: Day 1 of Sprint  
**Next Review**: Week 1 of Sprint