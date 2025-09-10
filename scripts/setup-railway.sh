#!/bin/bash

# BarberPro Railway Setup Script
# This script automates the Railway infrastructure setup process

set -e

echo "🚀 BarberPro Railway Infrastructure Setup"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create new project
echo "📦 Creating Railway project..."
railway init

# Set project name
railway project set-name "barberpro-service-booking"

# Create staging environment
echo "🏗️ Creating staging environment..."
railway environment create staging

# Create production environment
echo "🏗️ Creating production environment..."
railway environment create production

# Setup PostgreSQL for staging
echo "🗄️ Setting up PostgreSQL for staging..."
railway environment use staging
railway add postgresql

# Setup Redis for staging  
echo "🔴 Setting up Redis for staging..."
railway add redis

# Setup PostgreSQL for production
echo "🗄️ Setting up PostgreSQL for production..."
railway environment use production
railway add postgresql

# Setup Redis for production
echo "🔴 Setting up Redis for production..."
railway add redis

# Generate and set environment variables for staging
echo "⚙️ Configuring staging environment variables..."
railway environment use staging

# Generate JWT secret
JWT_SECRET_STAGING=$(openssl rand -base64 32)
railway vars set JWT_SECRET="$JWT_SECRET_STAGING"

# Set other staging variables
railway vars set NODE_ENV="staging"
railway vars set PORT="3000"
railway vars set LOG_LEVEL="debug"
railway vars set BCRYPT_ROUNDS="10"
railway vars set DEFAULT_TIMEZONE="America/Argentina/Buenos_Aires"
railway vars set DEFAULT_CURRENCY="ARS"
railway vars set DEFAULT_LANGUAGE="es-AR"

# Generate and set environment variables for production
echo "⚙️ Configuring production environment variables..."
railway environment use production

# Generate JWT secret for production
JWT_SECRET_PRODUCTION=$(openssl rand -base64 32)
railway vars set JWT_SECRET="$JWT_SECRET_PRODUCTION"

# Set other production variables
railway vars set NODE_ENV="production"
railway vars set PORT="3000"
railway vars set LOG_LEVEL="warn"
railway vars set BCRYPT_ROUNDS="12"
railway vars set DEFAULT_TIMEZONE="America/Argentina/Buenos_Aires"
railway vars set DEFAULT_CURRENCY="ARS"
railway vars set DEFAULT_LANGUAGE="es-AR"

# Get database URLs
echo "📊 Retrieving database connection information..."
railway environment use staging
STAGING_DB_URL=$(railway vars get DATABASE_URL)
STAGING_REDIS_URL=$(railway vars get REDIS_URL)

railway environment use production
PRODUCTION_DB_URL=$(railway vars get DATABASE_URL)
PRODUCTION_REDIS_URL=$(railway vars get REDIS_URL)

# Create environment file with connection information
echo "📝 Creating connection information file..."
cat > railway-connections.md << EOF
# Railway Database Connections

## Staging Environment
- **PostgreSQL**: \`$STAGING_DB_URL\`
- **Redis**: \`$STAGING_REDIS_URL\`
- **Domain**: https://staging.barberpro.com.ar (to be configured)

## Production Environment  
- **PostgreSQL**: \`$PRODUCTION_DB_URL\`
- **Redis**: \`$PRODUCTION_REDIS_URL\`
- **Domain**: https://barberpro.com.ar (to be configured)

## Next Steps
1. Configure custom domains in Railway dashboard
2. Add remaining environment variables (MercadoPago, AWS, etc.)
3. Deploy first version of the application
4. Setup monitoring and alerts

## Important Notes
- Database URLs contain credentials - keep secure
- Use Railway environment variables for deployment
- Test staging environment before production deployment
EOF

# Setup GitHub integration
echo "🔗 Setting up GitHub integration..."
echo "Please complete the following manual steps:"
echo "1. Go to Railway dashboard: https://railway.app/project"
echo "2. Connect GitHub repository: https://github.com/your-org/service-booking"
echo "3. Configure deployment triggers for staging (develop branch) and production (main branch)"
echo "4. Add GitHub secrets for Railway deployment tokens"

# Create domain configuration guide
cat > docs/infrastructure/DOMAIN_SETUP.md << EOF
# Domain Configuration Guide

## Cloudflare Setup

### 1. Register Domain
- Register \`barberpro.com.ar\` with your preferred registrar
- Update nameservers to Cloudflare nameservers

### 2. Cloudflare Configuration
\`\`\`bash
# DNS Records to create:
A    barberpro.com.ar          -> Railway production IP
A    www.barberpro.com.ar      -> Railway production IP  
A    staging.barberpro.com.ar  -> Railway staging IP
A    api.barberpro.com.ar      -> Railway production IP
CNAME admin.barberpro.com.ar   -> barberpro.com.ar
\`\`\`

### 3. SSL Configuration
- Enable "Always Use HTTPS"
- Set SSL/TLS encryption mode to "Full (strict)"
- Enable "Automatic HTTPS Rewrites"
- Configure "Minimum TLS Version" to 1.2

### 4. Performance Settings
- Enable "Auto Minify" for HTML, CSS, JS
- Enable "Brotli" compression
- Set "Browser Cache TTL" to 4 hours
- Enable "Always Online"

### 5. Security Settings
- Enable "WAF (Web Application Firewall)"
- Configure "Security Level" to Medium
- Enable "Bot Fight Mode"
- Set up "Rate Limiting" rules

### 6. Railway Domain Configuration
\`\`\`bash
# Add custom domains in Railway
railway domain add barberpro.com.ar
railway domain add staging.barberpro.com.ar
railway domain add api.barberpro.com.ar
\`\`\`
EOF

echo ""
echo "✅ Railway infrastructure setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. ✅ Railway project created with staging and production environments"
echo "2. ✅ PostgreSQL and Redis provisioned for both environments" 
echo "3. ✅ Basic environment variables configured"
echo "4. ⏳ Configure custom domains (see docs/infrastructure/DOMAIN_SETUP.md)"
echo "5. ⏳ Add remaining environment variables (MercadoPago, AWS, SMTP)"
echo "6. ⏳ Setup GitHub integration for automated deployments"
echo "7. ⏳ Deploy first version and test connectivity"
echo ""
echo "📊 Connection Information:"
echo "Check railway-connections.md for database URLs and connection details"
echo ""
echo "🔐 Security Notes:"
echo "- JWT secrets have been auto-generated and set"
echo "- Database URLs contain credentials - handle securely"  
echo "- Add additional secrets via Railway dashboard or CLI"
echo ""
echo "📞 Need Help?"
echo "- Railway docs: https://docs.railway.app"
echo "- Project dashboard: https://railway.app/project"
echo "- Team contact: devops@barberpro.com.ar"
EOF