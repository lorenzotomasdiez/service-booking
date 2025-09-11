#!/bin/bash
# ============================================================================
# BarberPro Environment Validation Script
# Validates required environment variables for different environments
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get environment from first argument, default to development
ENV=${1:-development}

echo -e "${BLUE}🔍 Validating environment configuration for: ${ENV}${NC}"

# Function to check if a variable is set
check_var() {
    local var_name=$1
    local var_value=$(eval echo \$${var_name})
    local required=${2:-true}
    
    if [ -z "$var_value" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ MISSING: ${var_name}${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  OPTIONAL: ${var_name} (not set)${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ VALID: ${var_name}${NC}"
        return 0
    fi
}

# Function to validate URL format
validate_url() {
    local var_name=$1
    local var_value=$(eval echo \$${var_name})
    
    if [[ $var_value =~ ^https?://[^[:space:]]+$ ]]; then
        echo -e "${GREEN}✅ VALID URL: ${var_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ INVALID URL: ${var_name}${NC}"
        return 1
    fi
}

# Function to validate database URL
validate_database_url() {
    local var_name=$1
    local var_value=$(eval echo \$${var_name})
    
    if [[ $var_value =~ ^postgresql://[^[:space:]]+$ ]]; then
        echo -e "${GREEN}✅ VALID DATABASE URL: ${var_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ INVALID DATABASE URL: ${var_name}${NC}"
        return 1
    fi
}

# Function to validate Redis URL
validate_redis_url() {
    local var_name=$1
    local var_value=$(eval echo \$${var_name})
    
    if [[ $var_value =~ ^redis://[^[:space:]]*$ ]]; then
        echo -e "${GREEN}✅ VALID REDIS URL: ${var_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ INVALID REDIS URL: ${var_name}${NC}"
        return 1
    fi
}

# Load environment file based on environment
case $ENV in
    "development")
        ENV_FILE=".env.example"
        ;;
    "staging")
        ENV_FILE=".env.staging"
        ;;
    "production")
        ENV_FILE=".env.production"
        ;;
    *)
        echo -e "${RED}❌ Unknown environment: ${ENV}${NC}"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: ${ENV_FILE}${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📄 Loading environment from: ${ENV_FILE}${NC}"
set -a
source $ENV_FILE
set +a

echo -e "\n${BLUE}🔧 Core Application Configuration${NC}"
check_var "NODE_ENV"
check_var "APP_NAME"
check_var "APP_VERSION"
check_var "PORT"

echo -e "\n${BLUE}🌐 URLs Configuration${NC}"
validate_url "API_BASE_URL"
validate_url "APP_URL"
validate_url "FRONTEND_URL"

echo -e "\n${BLUE}🗄️ Database Configuration${NC}"
validate_database_url "DATABASE_URL"
check_var "DATABASE_POOL_MIN"
check_var "DATABASE_POOL_MAX"

echo -e "\n${BLUE}🔴 Redis Configuration${NC}"
validate_redis_url "REDIS_URL"
check_var "REDIS_TTL"

echo -e "\n${BLUE}🔐 Authentication & Security${NC}"
check_var "JWT_SECRET"
check_var "JWT_EXPIRES_IN"
check_var "BCRYPT_SALT_ROUNDS"

# Validate JWT secret strength
JWT_LENGTH=${#JWT_SECRET}
if [ $JWT_LENGTH -lt 32 ]; then
    echo -e "${RED}❌ JWT_SECRET too short (${JWT_LENGTH} chars, minimum 32)${NC}"
else
    echo -e "${GREEN}✅ JWT_SECRET length OK (${JWT_LENGTH} chars)${NC}"
fi

echo -e "\n${BLUE}🇦🇷 Argentina Configuration${NC}"
check_var "TIMEZONE"
check_var "LOCALE"
check_var "CURRENCY"

echo -e "\n${BLUE}💳 Payment Configuration${NC}"
if [ "$ENV" = "production" ]; then
    check_var "MERCADOPAGO_ACCESS_TOKEN"
    check_var "MERCADOPAGO_PUBLIC_KEY"
    if [ "$MERCADOPAGO_SANDBOX" = "true" ]; then
        echo -e "${RED}⚠️  WARNING: MercadoPago sandbox enabled in production${NC}"
    fi
else
    check_var "MERCADOPAGO_ACCESS_TOKEN" false
    check_var "MERCADOPAGO_PUBLIC_KEY" false
fi

echo -e "\n${BLUE}📧 Email Configuration${NC}"
check_var "SMTP_HOST"
check_var "SMTP_PORT"
check_var "FROM_EMAIL"

echo -e "\n${BLUE}📊 Monitoring Configuration${NC}"
if [ "$ENV" = "production" ]; then
    check_var "SENTRY_DSN"
    check_var "LOG_LEVEL"
else
    check_var "SENTRY_DSN" false
    check_var "LOG_LEVEL"
fi

echo -e "\n${BLUE}☁️ Cloud Storage Configuration${NC}"
if [ "$ENV" = "production" ]; then
    check_var "AWS_ACCESS_KEY_ID"
    check_var "AWS_SECRET_ACCESS_KEY"
    check_var "AWS_REGION"
    check_var "AWS_S3_BUCKET"
else
    check_var "AWS_ACCESS_KEY_ID" false
    check_var "AWS_SECRET_ACCESS_KEY" false
    check_var "AWS_REGION" false
    check_var "AWS_S3_BUCKET" false
fi

echo -e "\n${BLUE}🚀 Railway Configuration${NC}"
check_var "RAILWAY_ENVIRONMENT" false
check_var "RAILWAY_SERVICE_NAME" false

echo -e "\n${BLUE}🏗️ Feature Flags${NC}"
check_var "FEATURE_PAYMENTS_ENABLED" false
check_var "FEATURE_WHATSAPP_ENABLED" false
check_var "FEATURE_EMAIL_NOTIFICATIONS" false

# Environment-specific validations
case $ENV in
    "production")
        echo -e "\n${BLUE}🔒 Production-Specific Validations${NC}"
        
        # Ensure debug is disabled
        if [ "$APP_DEBUG" = "true" ]; then
            echo -e "${RED}❌ APP_DEBUG should be false in production${NC}"
        else
            echo -e "${GREEN}✅ APP_DEBUG correctly disabled${NC}"
        fi
        
        # Ensure Swagger is disabled
        if [ "$ENABLE_SWAGGER" = "true" ]; then
            echo -e "${RED}❌ ENABLE_SWAGGER should be false in production${NC}"
        else
            echo -e "${GREEN}✅ ENABLE_SWAGGER correctly disabled${NC}"
        fi
        
        # Check rate limiting is strict
        if [ "$RATE_LIMIT_MAX_REQUESTS" -gt 200 ]; then
            echo -e "${YELLOW}⚠️  Rate limiting may be too permissive for production${NC}"
        else
            echo -e "${GREEN}✅ Rate limiting appropriately configured${NC}"
        fi
        ;;
        
    "staging")
        echo -e "\n${BLUE}🧪 Staging-Specific Validations${NC}"
        
        # Ensure sandbox mode for payments
        if [ "$MERCADOPAGO_SANDBOX" != "true" ]; then
            echo -e "${RED}❌ MERCADOPAGO_SANDBOX should be true in staging${NC}"
        else
            echo -e "${GREEN}✅ MERCADOPAGO_SANDBOX correctly enabled${NC}"
        fi
        
        # Check staging URLs
        if [[ "$APP_URL" == *"staging"* ]]; then
            echo -e "${GREEN}✅ Staging URLs correctly configured${NC}"
        else
            echo -e "${YELLOW}⚠️  URLs may not indicate staging environment${NC}"
        fi
        ;;
        
    "development")
        echo -e "\n${BLUE}👩‍💻 Development-Specific Validations${NC}"
        
        # Ensure debug is enabled
        if [ "$APP_DEBUG" = "false" ]; then
            echo -e "${YELLOW}⚠️  APP_DEBUG is disabled in development${NC}"
        else
            echo -e "${GREEN}✅ APP_DEBUG correctly enabled${NC}"
        fi
        
        # Check for localhost URLs
        if [[ "$APP_URL" == *"localhost"* ]]; then
            echo -e "${GREEN}✅ Development URLs correctly configured${NC}"
        else
            echo -e "${YELLOW}⚠️  URLs may not be configured for local development${NC}"
        fi
        ;;
esac

# Final summary
echo -e "\n${BLUE}📋 Validation Summary${NC}"
echo -e "${GREEN}✅ Environment validation completed for: ${ENV}${NC}"

# Test database connection (if possible)
if command -v psql >/dev/null 2>&1; then
    echo -e "\n${BLUE}🔌 Testing database connection...${NC}"
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
    fi
fi

# Test Redis connection (if possible)
if command -v redis-cli >/dev/null 2>&1; then
    echo -e "\n${BLUE}🔌 Testing Redis connection...${NC}"
    REDIS_HOST=$(echo $REDIS_URL | sed 's|redis://||' | cut -d: -f1)
    REDIS_PORT=$(echo $REDIS_URL | sed 's|redis://||' | cut -d: -f2 | cut -d/ -f1)
    
    if redis-cli -h "$REDIS_HOST" -p "${REDIS_PORT:-6379}" ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis connection successful${NC}"
    else
        echo -e "${RED}❌ Redis connection failed${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 Environment validation completed!${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo -e "${BLUE}Configuration file: ${ENV_FILE}${NC}"