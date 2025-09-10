# BarberPro Testing Procedures
**Version:** 1.0  
**Date:** September 10, 2025  
**Testing Framework:** Complete testing workflow for 14-day sprint cycles

## Quick Start - Testing Commands

### Essential Testing Commands (Use these for daily testing)
```bash
# Unit Tests
npm run test:unit              # Run all unit tests
npm run test:backend          # Backend unit tests only
npm run test:frontend         # Frontend unit tests only

# Integration Tests  
npm run test:integration      # API and database integration tests

# End-to-End Tests
npm run test:e2e              # Full E2E test suite (headless)
npm run test:e2e:ui           # E2E tests with browser UI (debugging)
npm run test:e2e:debug        # E2E tests with step-by-step debugging

# Performance Tests
npm run test:performance      # Load testing for Argentina network conditions
npm run test:performance:report # Performance test with detailed report

# Security Tests
npm run test:security         # Security vulnerability scanning

# Quick Health Check
npm run test:smoke            # Basic health check of running services
```

## Daily Testing Workflow

### Morning Standup Testing (15 minutes)
```bash
# 1. Verify services are running
npm run test:smoke

# 2. Run critical path tests
npm run test:e2e -- --grep "Critical User Journeys"

# 3. Check for new security vulnerabilities
npm run test:security:deps
```

### Feature Development Testing (Developer handoff)
```bash
# 1. Unit tests for new feature
npm run test:unit -- --grep "FeatureName"

# 2. Integration tests
npm run test:integration

# 3. E2E tests for complete user flow
npm run test:e2e -- --grep "FeatureName"

# 4. Mobile responsiveness check
npm run test:e2e -- --project="mobile-chrome"
```

### Pre-deployment Testing (Before staging/production)
```bash
# 1. Full test suite
npm run test

# 2. Performance validation
npm run test:performance:report

# 3. Security scan
npm run test:security

# 4. Cross-browser validation
npm run test:e2e -- --project="chromium-desktop,firefox-desktop,webkit-desktop"
```

## Testing Environment Setup

### Local Development Testing
```bash
# 1. Start all services
npm run dev

# 2. Setup test database
npm run db:migrate
npm run db:seed

# 3. Run initial smoke test
npm run test:smoke
```

### CI/CD Testing Environment
```bash
# Automated testing in GitHub Actions
# See .github/workflows/test.yml for configuration

# Manual trigger for CI tests
gh workflow run test.yml
```

## Test Data Management

### Creating Test Data
```bash
# Setup comprehensive test data for Argentina market
cd tests && npm run setup:test-data

# This creates:
# - Test users (providers and clients)
# - Sample services and bookings
# - Argentina-specific location data
# - Payment test scenarios
```

### Cleaning Test Data
```bash
# Clean test data between test runs
cd tests && npm run cleanup:test-data

# Reset test database to clean state
npm run db:reset -- --env=test
```

### Test User Accounts
**Pre-created test accounts for manual testing:**

**Providers:**
- carlos.barberia@test.com (Traditional barber shop - Buenos Aires)
- martin.mobile@test.com (Mobile barber - Córdoba)
- ana.estilo@test.com (Women's specialist - Mendoza)

**Clients:**
- sofia.martinez@test.com (Busy professional - Buenos Aires)
- diego.tech@test.com (Young professional - Córdoba)
- roberto.clasico@test.com (Traditional client - Buenos Aires)

**Default Password:** `TestPassword123!`

## Mobile Testing Procedures

### Device Testing Matrix
**Priority 1 (Must test):**
- iPhone 12/13/14 (Safari)
- Samsung Galaxy S21/S22 (Chrome)
- Google Pixel 5/6 (Chrome)

**Priority 2 (Should test):**
- iPad Pro (Safari)
- OnePlus devices (Chrome)
- Motorola devices (Chrome)

### Mobile Testing Checklist
```bash
# 1. Mobile E2E tests
npm run test:e2e -- --project="mobile-chrome,mobile-safari"

# 2. Touch interaction testing
# Manual testing required for:
# - Swipe gestures on calendar
# - Pinch-to-zoom on maps
# - Touch-friendly button sizes
# - Mobile keyboard behavior

# 3. Mobile performance
npm run test:performance -- --profile=argentina-3g
```

## Argentina-Specific Testing

### Localization Testing
- **Language:** All text in Spanish (Argentina variant)
- **Currency:** Argentine Peso (ARS) formatting
- **Phone Numbers:** +54 country code validation
- **Addresses:** Argentina province and city validation
- **Timezone:** America/Argentina/Buenos_Aires

### Cultural Behavior Testing
- **Siesta Hours:** 13:00-15:00 blocked time slots
- **Business Hours:** Monday-Saturday typical (Sunday limited)
- **Payment Preferences:** MercadoPago integration
- **Mobile Usage:** 80% mobile traffic expected

### Argentina Compliance Validation
```bash
# Run Argentina-specific compliance checks
cd tests && npm run validate:argentina-compliance

# Checks:
# - AFIP integration readiness
# - DNI format validation
# - Argentina payment methods
# - Data protection compliance
```

## Payment Testing Procedures

### MercadoPago Testing
**Test Cards (Sandbox environment):**

**Successful Payment:**
- Card: 4507 9900 0000 4905
- Expiry: 11/25
- CVV: 123
- Name: APRO

**Failed Payment:**
- Card: 4074 0900 0000 0004
- Expiry: 11/25  
- CVV: 123
- Name: OTHE

**Pending Payment:**
- Card: 4507 9900 0000 4897
- Expiry: 11/25
- CVV: 123
- Name: PEND

### Payment Testing Scenarios
```bash
# 1. Successful booking with payment
npm run test:e2e -- --grep "successful payment"

# 2. Payment failure handling
npm run test:e2e -- --grep "payment failures"

# 3. Refund processing
npm run test:e2e -- --grep "refund"

# 4. Payment security
npm run test:security:payment
```

## Bug Reporting Procedures

### Bug Discovery Workflow
1. **Reproduce the bug** (3 attempts minimum)
2. **Document steps** clearly and completely
3. **Create GitHub issue** using bug report template
4. **Assign severity** (P0/P1/P2/P3)
5. **Tag relevant components** and team members
6. **Attach evidence** (screenshots, videos, logs)

### Bug Severity Classification

**P0 - Critical (Fix within 4 hours)**
- Payment system down
- Authentication broken
- Data corruption
- Security vulnerability
- Complete feature failure

**P1 - High (Fix within 24 hours)**
- Major feature not working
- Performance degradation
- Mobile responsiveness broken
- Integration failure

**P2 - Medium (Fix within sprint)**
- Minor feature issues
- UI/UX problems
- Non-critical validation errors

**P3 - Low (Fix in future sprint)**
- Cosmetic issues
- Text corrections
- Nice-to-have improvements

### GitHub Issue Labels
- `bug` - General bug report
- `test-failure` - Automated test failing
- `mobile-issue` - Mobile-specific problem
- `argentina-specific` - Argentina market issue
- `payment-issue` - Payment/MercadoPago problem
- `performance-issue` - Performance degradation
- `security-issue` - Security vulnerability

## Performance Testing

### Performance Benchmarks (Argentina Network)
- **Page Load Time:** < 3 seconds on 3G
- **API Response Time:** < 500ms average
- **Time to Interactive:** < 5 seconds
- **First Contentful Paint:** < 2 seconds
- **Concurrent Users:** 10,000+ without degradation

### Performance Testing Schedule
```bash
# Daily performance checks (5 minutes)
npm run test:performance -- --quick

# Weekly comprehensive testing (30 minutes)
npm run test:performance:report

# Pre-deployment stress testing (1 hour)
npm run test:performance -- --stress
```

### Network Simulation for Argentina
```bash
# Test with Argentina 3G conditions
npm run test:e2e -- --network-profile=argentina-3g

# Test with Argentina 4G conditions  
npm run test:e2e -- --network-profile=argentina-4g

# Test with poor WiFi conditions
npm run test:e2e -- --network-profile=argentina-wifi-poor
```

## Security Testing

### Security Testing Schedule
```bash
# Daily dependency check (2 minutes)
npm run test:security:deps

# Weekly vulnerability scan (15 minutes)
npm run test:security:owasp

# Pre-deployment comprehensive scan (45 minutes)
npm run test:security
```

### Security Testing Areas
- **Authentication/Authorization:** JWT token handling
- **Payment Security:** PCI DSS compliance
- **Data Protection:** Argentina PDPA compliance
- **API Security:** Input validation, SQL injection
- **Frontend Security:** XSS prevention, CSP headers

## Regression Testing

### Automated Regression Suite (30 minutes)
```bash
# Critical user journeys
npm run test:e2e -- --grep "Critical"

# Core API functionality
npm run test:integration

# Payment processing
npm run test:e2e -- --grep "payment"
```

### Manual Regression Testing (4 hours)
**Week 1 Focus:**
- Provider onboarding flow
- Client booking flow
- Payment processing
- Mobile responsiveness

**Week 2 Focus:**
- Provider dashboard
- Real-time updates
- Search functionality
- Performance validation

## Test Reporting

### Daily Test Report (Automated)
- Test execution summary
- Pass/fail rates by component
- Performance metrics
- New bugs discovered
- Critical path status

### Sprint End Report (Manual)
- Total test coverage
- Bug discovery/resolution rates  
- Performance benchmark results
- Security scan results
- Quality gate compliance

### Test Metrics Dashboard
- Real-time test execution status
- Test coverage trends
- Bug severity distribution
- Performance trends over time
- Argentina-specific metrics

## Quality Gates

### Sprint Completion Criteria
- [ ] Zero P0 (Critical) bugs
- [ ] < 3 P1 (High) bugs  
- [ ] All critical user journeys pass
- [ ] Mobile responsiveness validated
- [ ] Performance benchmarks met
- [ ] Security scan clear
- [ ] Payment integration functional

### Production Deployment Gates
- [ ] Full regression suite passes
- [ ] Cross-browser testing complete
- [ ] Mobile testing on physical devices
- [ ] Performance under load validated
- [ ] Security vulnerabilities resolved
- [ ] Argentina compliance verified
- [ ] Rollback procedures tested

## Troubleshooting

### Common Testing Issues

**Tests failing locally but passing in CI:**
```bash
# Check Node.js version consistency
node --version
npm --version

# Clear caches and reinstall
npm run clean
npm run install:all
```

**E2E tests timing out:**
```bash
# Increase timeout in playwright.config.ts
# Check if services are running
npm run test:smoke

# Run with debug mode
npm run test:e2e:debug
```

**Performance tests failing:**
```bash
# Check system resources
# Verify test environment is clean
npm run cleanup:test-data

# Run with reduced load
npm run test:performance -- --users=10
```

**Payment tests failing:**
```bash
# Verify MercadoPago sandbox credentials
# Check test card numbers are current
# Verify webhook endpoints are accessible
```

### Getting Help

**Team Contacts:**
- QA Lead: For testing strategy and complex issues
- Backend Developer: For API and integration test issues  
- Frontend Developer: For E2E and mobile test issues
- DevOps Engineer: For CI/CD and environment issues

**Documentation:**
- Playwright Documentation: https://playwright.dev/
- Jest Documentation: https://jestjs.io/
- Artillery Documentation: https://artillery.io/
- MercadoPago Testing: https://www.mercadopago.com.ar/developers/

**Emergency Procedures:**
- If critical tests are blocking deployment, contact QA Lead immediately
- If payment tests are failing, verify with Payment Integration Specialist
- If security tests fail, notify Tech Lead for immediate review

This comprehensive testing procedure ensures BarberPro maintains high quality while supporting rapid 14-day sprint cycles and Argentina market requirements.