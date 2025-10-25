#!/bin/bash

##############################################################################
# BarberPro Development Environment Setup Script
#
# Purpose: Automate first-time setup of the development environment
# Usage:   ./scripts/dev-setup.sh
#
# This script:
# 1. Checks prerequisites (Docker, Docker Compose, etc.)
# 2. Creates .env file if it doesn't exist
# 3. Starts Docker containers with proper health checks
# 4. Runs database migrations
# 5. Seeds initial data
# 6. Guides developer to running backend/frontend
#
##############################################################################

set -e

# Color definitions for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK='✓'
CROSS='✗'
ARROW='→'
WARN='!'
INFO='i'

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="${PROJECT_DIR}/docker"
SCRIPTS_DIR="${PROJECT_DIR}/scripts"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"

# Timing
START_TIME=$(date +%s)

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_step() {
    echo -e "${CYAN}[${ARROW}]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[${CHECK}]${NC} $1"
}

print_error() {
    echo -e "${RED}[${CROSS}]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[${WARN}]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[${INFO}]${NC} $1"
}

##############################################################################
# Prerequisite Checks
##############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    print_step "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo -e "\n${YELLOW}Installation instructions:${NC}"
        echo -e "  ${CYAN}macOS:${NC} https://docs.docker.com/desktop/install/mac-install/"
        echo -e "  ${CYAN}Linux:${NC} https://docs.docker.com/engine/install/"
        echo -e "  ${CYAN}Windows:${NC} https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    fi
    print_success "Docker installed: $(docker --version)"

    # Check Docker Compose
    print_step "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo -e "\n${YELLOW}Installation instructions:${NC}"
        echo "  https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose installed: $(docker-compose --version)"

    # Check Docker daemon
    print_step "Checking Docker daemon..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker daemon is not running"
        echo -e "\n${YELLOW}Platform-specific solutions:${NC}"

        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo -e "  ${CYAN}macOS:${NC}"
            echo "    1. Start Docker Desktop from Applications"
            echo "    2. Or run: open -a Docker"
            echo "    3. Wait for Docker icon in menu bar"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo -e "  ${CYAN}Linux:${NC}"
            echo "    1. Start Docker: sudo systemctl start docker"
            echo "    2. Enable on boot: sudo systemctl enable docker"
        fi
        exit 1
    fi
    print_success "Docker daemon is running"

    # Check Node.js and npm
    print_step "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed (optional for Docker-based development)"
    else
        print_success "Node.js installed: $(node --version)"
    fi

    # Check Git
    print_step "Checking Git installation..."
    if ! command -v git &> /dev/null; then
        print_warning "Git is not installed (optional but recommended)"
    else
        print_success "Git installed: $(git --version | head -n1)"
    fi

    echo ""
}

##############################################################################
# Environment Setup
##############################################################################

setup_environment() {
    print_header "Setting Up Environment"

    # Check for .env file
    print_step "Checking environment configuration..."
    if [ ! -f "${PROJECT_DIR}/.env" ]; then
        print_warning ".env file not found, creating from defaults..."
        cat > "${PROJECT_DIR}/.env" << 'EOF'
# Services configuration
POSTGRES_USER=barberpro
POSTGRES_PASSWORD=barberpro_dev_password
POSTGRES_DB=barberpro_dev

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@barberpro.com
PGADMIN_DEFAULT_PASSWORD=admin123

# Redis Commander
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin123

# Backend
BACKEND_PORT=3000
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
LOG_LEVEL=debug
APP_DEBUG=true

# Frontend
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Argentina
TIMEZONE=America/Argentina/Buenos_Aires
LOCALE=es-AR
CURRENCY=ARS
EOF
        print_success "Created .env file"
    else
        print_success ".env file exists"
    fi

    # Check backend .env
    if [ ! -f "${BACKEND_DIR}/.env" ]; then
        print_info "Backend .env not found. Will create during Docker setup."
    fi

    # Check frontend .env
    if [ ! -f "${FRONTEND_DIR}/.env" ]; then
        print_info "Frontend .env not found. Frontend will use defaults."
    fi

    echo ""
}

##############################################################################
# Docker Services
##############################################################################

start_docker_services() {
    print_header "Starting Docker Services"

    # Navigate to project root
    cd "${PROJECT_DIR}"

    # Check ports
    print_step "Checking port availability..."
    local ports_available=true

    for port in 5432 6379 3000 5173 8080 8081; do
        if lsof -ti:$port > /dev/null 2>&1; then
            print_warning "Port $port is already in use"
            ports_available=false
        fi
    done

    if [ "$ports_available" = false ]; then
        echo -e "\n${YELLOW}Some ports are in use. This might cause issues.${NC}"
        echo "Consider stopping conflicting services before continuing."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Setup cancelled"
            exit 1
        fi
    fi

    # Start services
    print_step "Starting Docker containers..."
    echo "This may take a minute on first run (downloading images)..."

    if docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d; then
        print_success "Docker containers started"
    else
        print_error "Failed to start Docker containers"
        echo -e "\n${YELLOW}Troubleshooting tips:${NC}"
        echo "  1. Check Docker daemon: docker info"
        echo "  2. View logs: docker-compose logs"
        echo "  3. Try rebuilding: docker-compose down && docker-compose build --no-cache"
        exit 1
    fi

    # Wait for services to be healthy
    print_step "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker/docker-compose.yml ps | grep -q "barberpro-postgres-dev.*healthy" && \
           docker-compose -f docker/docker-compose.yml ps | grep -q "barberpro-redis-dev.*healthy"; then
            print_success "Services are healthy"
            break
        fi

        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            print_error "Services did not become healthy in time"
            echo -e "\n${YELLOW}Check service status:${NC}"
            docker-compose -f docker/docker-compose.yml ps
            exit 1
        fi

        echo -n "."
        sleep 1
    done

    echo ""
}

##############################################################################
# Database Setup
##############################################################################

setup_database() {
    print_header "Setting Up Database"

    # Run migrations in backend container
    print_step "Running database migrations..."
    if docker exec barberpro-backend-dev npx prisma migrate deploy --skip-generate 2>/dev/null; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations may have had issues (this is OK on first run)"
    fi

    # Run seed
    print_step "Seeding initial data..."
    if docker exec barberpro-backend-dev npm run seed 2>/dev/null; then
        print_success "Database seeded successfully"
    else
        print_info "Database seeding skipped (manual setup may be needed)"
    fi

    echo ""
}

##############################################################################
# Validation
##############################################################################

validate_setup() {
    print_header "Validating Setup"

    local all_good=true

    # Check PostgreSQL
    print_step "Checking PostgreSQL..."
    if docker exec barberpro-postgres-dev pg_isready -U barberpro > /dev/null 2>&1; then
        print_success "PostgreSQL is responding"
    else
        print_error "PostgreSQL is not responding"
        all_good=false
    fi

    # Check Redis
    print_step "Checking Redis..."
    if docker exec barberpro-redis-dev redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is responding"
    else
        print_error "Redis is not responding"
        all_good=false
    fi

    # Check Backend health
    print_step "Checking Backend API..."
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API is not responding (this is OK, it will start on demand)"
    fi

    # Check Frontend
    print_step "Checking Frontend..."
    if curl -s http://localhost:5173 > /dev/null; then
        print_success "Frontend is responding"
    else
        print_info "Frontend is not running (needs to be started manually)"
    fi

    echo ""

    if [ "$all_good" = false ]; then
        print_warning "Some services have issues. Check logs with: docker-compose logs"
    fi
}

##############################################################################
# Final Instructions
##############################################################################

print_final_instructions() {
    # Calculate elapsed time
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    print_header "Setup Complete!"

    echo -e "${GREEN}✓ Development environment is ready!${NC}"
    echo -e "Time elapsed: ${DURATION}s"

    echo -e "\n${BLUE}Services Available:${NC}"
    echo -e "  ${CYAN}PostgreSQL:${NC}       localhost:5432"
    echo -e "  ${CYAN}pgAdmin:${NC}          http://localhost:8080"
    echo -e "  ${CYAN}Redis:${NC}            localhost:6379"
    echo -e "  ${CYAN}Redis Commander:${NC}  http://localhost:8081"
    echo -e "  ${CYAN}Backend API:${NC}      http://localhost:3000"
    echo -e "  ${CYAN}Frontend:${NC}         http://localhost:5173"

    echo -e "\n${BLUE}Credentials:${NC}"
    echo -e "  ${CYAN}pgAdmin:${NC} admin@barberpro.com / admin123"
    echo -e "  ${CYAN}Redis Commander:${NC} admin / admin123"

    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "  ${CYAN}Option 1: Run everything in Docker (recommended for first-time setup)${NC}"
    echo -e "    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up"

    echo -e "\n  ${CYAN}Option 2: Run backend and frontend locally${NC}"
    echo -e "    Terminal 1: cd backend && npm run dev"
    echo -e "    Terminal 2: cd frontend && npm run dev"

    echo -e "\n${BLUE}Useful Commands:${NC}"
    echo -e "  ${CYAN}make logs${NC}              - View all service logs"
    echo -e "  ${CYAN}make db-reset${NC}          - Reset database to clean state"
    echo -e "  ${CYAN}make down${NC}              - Stop all services"
    echo -e "  ${CYAN}make doctor${NC}            - Run diagnostics"

    echo -e "\n${BLUE}Documentation:${NC}"
    echo -e "  See ${CYAN}docker/README.md${NC} for detailed development guide"
    echo -e "  See ${CYAN}README.md${NC} for project overview"

    echo ""
}

##############################################################################
# Main Execution
##############################################################################

main() {
    # Print welcome message
    echo -e "\n${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     BarberPro Development Environment Setup                ║"
    echo "║     First-time setup automation script                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Run setup steps
    check_prerequisites
    setup_environment
    start_docker_services
    setup_database
    validate_setup
    print_final_instructions
}

# Handle errors
trap 'print_error "Setup failed. Check the output above for details."; exit 1' ERR

# Run main
main
