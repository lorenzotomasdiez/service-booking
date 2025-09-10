#!/bin/bash

# BarberPro Infrastructure Validation Script
# This script validates the complete infrastructure setup

set -e

echo "🔍 BarberPro Infrastructure Validation"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VALIDATION_ERRORS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ((VALIDATION_ERRORS++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "ℹ️ $1"
}

echo ""
echo "🔧 Checking Local Development Environment..."

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    print_status 0 "Docker is running"
else
    print_status 1 "Docker is not running"
fi

# Check if Docker Compose file exists
if [ -f "docker-compose.yml" ]; then
    print_status 0 "Docker Compose configuration exists"
else
    print_status 1 "Docker Compose configuration missing"
fi

# Check if environment files exist
if [ -f ".env.example" ]; then
    print_status 0 "Environment template exists"
else
    print_status 1 "Environment template missing"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    print_status 0 "Package.json exists"
    
    # Check for required scripts
    if grep -q '"railway:setup"' package.json; then
        print_status 0 "Railway setup script configured"
    else
        print_status 1 "Railway setup script missing"
    fi
else
    print_status 1 "Package.json missing"
fi

echo ""
echo "🐳 Testing Docker Environment..."

# Test if Docker services can start
if docker-compose config >/dev/null 2>&1; then
    print_status 0 "Docker Compose configuration is valid"
else
    print_status 1 "Docker Compose configuration has errors"
fi

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        print_status 1 "Port $1 is already in use"
        return 1
    else
        print_status 0 "Port $1 is available"
        return 0
    fi
}

check_port 5432  # PostgreSQL
check_port 6379  # Redis
check_port 3000  # Backend
check_port 5173  # Frontend
check_port 8080  # pgAdmin
check_port 8081  # Redis Commander

echo ""
echo "📁 Checking File Structure..."

# Check for required directories and files
required_files=(
    "Dockerfile"
    "Dockerfile.dev"
    "railway.json"
    ".github/workflows/ci-cd.yml"
    "src/routes/health.ts"
    "docs/INFRASTRUCTURE.md"
    "scripts/setup-railway.sh"
    "config/redis.conf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

# Check for required directories
required_dirs=(
    "src/routes"
    "docs/infrastructure"
    "scripts"
    "config"
    ".github/workflows"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status 0 "Directory $dir exists"
    else
        print_status 1 "Directory $dir missing"
    fi
done

echo ""
echo "🔐 Checking Security Configuration..."

# Check if .env.example has required variables
required_env_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "NODE_ENV"
    "MERCADOPAGO_ACCESS_TOKEN"
    "DEFAULT_TIMEZONE"
)

if [ -f ".env.example" ]; then
    for var in "${required_env_vars[@]}"; do
        if grep -q "^$var=" .env.example; then
            print_status 0 "Environment variable $var defined"
        else
            print_status 1 "Environment variable $var missing"
        fi
    done
else
    print_warning ".env.example not found - skipping environment variable checks"
fi

# Check if .env file exists (should not be committed)
if [ -f ".env" ]; then
    print_warning ".env file exists - ensure it's in .gitignore"
else
    print_info ".env file not found (good - use .env.example as template)"
fi

echo ""
echo "🚀 Checking CI/CD Configuration..."

# Check GitHub Actions workflow
if [ -f ".github/workflows/ci-cd.yml" ]; then
    if grep -q "railway deploy" .github/workflows/ci-cd.yml; then
        print_status 0 "Railway deployment configured"
    else
        print_warning "Railway deployment not found in CI/CD"
    fi
    
    if grep -q "prisma migrate" .github/workflows/ci-cd.yml; then
        print_status 0 "Database migrations configured"
    else
        print_status 1 "Database migrations not configured"
    fi
    
    if grep -q "health" .github/workflows/ci-cd.yml; then
        print_status 0 "Health checks configured"
    else
        print_status 1 "Health checks not configured"
    fi
fi

echo ""
echo "🌐 Testing Railway Configuration..."

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    print_status 0 "Railway CLI is installed"
    
    # Check if logged in
    if railway whoami >/dev/null 2>&1; then
        print_status 0 "Railway CLI is authenticated"
        
        # Try to get project info
        if railway status >/dev/null 2>&1; then
            print_status 0 "Railway project is linked"
        else
            print_warning "Railway project not linked (run 'railway link')"
        fi
    else
        print_warning "Railway CLI not authenticated (run 'railway login')"
    fi
else
    print_warning "Railway CLI not installed (run 'npm install -g @railway/cli')"
fi

echo ""
echo "🔍 Testing Local Services..."

# Start services if requested
if [ "$1" = "--start-services" ]; then
    print_info "Starting local services..."
    
    if docker-compose up -d postgres redis; then
        print_status 0 "Database services started"
        
        # Wait for services to be ready
        print_info "Waiting for services to be ready..."
        sleep 10
        
        # Test PostgreSQL connection
        if docker-compose exec -T postgres pg_isready -U barberpro; then
            print_status 0 "PostgreSQL is ready"
        else
            print_status 1 "PostgreSQL connection failed"
        fi
        
        # Test Redis connection
        if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
            print_status 0 "Redis is ready"
        else
            print_status 1 "Redis connection failed"
        fi
        
        docker-compose down
        print_info "Test services stopped"
    else
        print_status 1 "Failed to start database services"
    fi
fi

echo ""
echo "📊 Validation Summary"
echo "==================="

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! Infrastructure is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run railway:setup' to configure Railway"
    echo "2. Configure your domain and SSL certificates"
    echo "3. Set up MercadoPago and other external service credentials"
    echo "4. Deploy to staging environment"
    echo "5. Test the complete application flow"
    
    exit 0
else
    echo -e "${RED}❌ Found $VALIDATION_ERRORS validation errors.${NC}"
    echo ""
    echo "Please fix the issues above before proceeding with deployment."
    echo ""
    echo "Common fixes:"
    echo "- Install missing dependencies: Docker, Railway CLI"
    echo "- Create missing files from templates"
    echo "- Configure environment variables"
    echo "- Ensure required ports are available"
    
    exit 1
fi