# GitHub Workflows

This directory contains GitHub Actions workflows for the BarberPro service booking platform.

## Current Workflows

### Infrastructure Monitoring (`monitoring.yml`)

**Status**: Modified for staging-only monitoring

Monitors the health and performance of the BarberPro platform environments:

- **Schedule**: Runs every 5 minutes via cron
- **Manual Trigger**: Can be triggered via `workflow_dispatch`

#### Current Configuration (Production Disabled)

The workflow has been modified to only monitor staging until production deployment:

**Active Checks:**
- ✅ Health check for staging environment (`staging.barberpro.com.ar`)
- ✅ Performance/latency testing for staging
- ✅ SSL certificate monitoring for staging domain
- ✅ Status report generation

**Disabled Checks (until production deployment):**
- ❌ Production health checks (`barberpro.com.ar`)
- ❌ Production latency monitoring
- ❌ Production SSL certificate checks
- ❌ Database connectivity checks (manual trigger only)

#### Jobs Overview

1. **Health Check**: Tests basic service availability and API endpoints
2. **Performance Check**: Runs load tests and latency measurements
3. **SSL Certificate Check**: Monitors SSL certificate expiration
4. **Database Health Check**: Database connectivity (manual only)
5. **Generate Status Report**: Creates summary of all check results

#### Re-enabling Production Monitoring

When ready to deploy to production, update `monitoring.yml`:

```yaml
# Change this:
environment: [staging]

# Back to this:
environment: [staging, production]
```

And uncomment the production-related checks in:
- Performance latency tests
- SSL domain list
- Any production-specific endpoints

#### Notifications

- Slack notifications configured for failures (requires `SLACK_WEBHOOK_URL` secret)
- Status reports uploaded as workflow artifacts

### CI/CD Pipeline (`ci-cd.yml`)

Handles continuous integration and deployment workflows for both frontend and backend.

## Secrets Required

- `SLACK_WEBHOOK_URL`: For failure notifications to Slack channel

## Monitoring Domains

- **Staging**: `staging.barberpro.com.ar`
- **Production**: `barberpro.com.ar` (currently disabled)
- **API**: `api.barberpro.com.ar` (currently disabled)

## Notes

- The monitoring workflow was modified to prevent 51+ failure emails caused by non-existent production deployments
- All TODO comments in the workflow indicate where to re-enable production checks
- SSL checks include 30-day expiration warnings
- Performance thresholds set at 2 seconds for Argentina-optimized response times