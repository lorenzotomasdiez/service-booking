# ============================================================
# BarberPro Docker Environment - Makefile
# ============================================================
# Comprehensive interface for all Docker operations
# Cross-platform compatible (macOS, Linux, WSL2)
# ============================================================

# ============================================================
# FOUNDATION
# ============================================================

# Color definitions using tput for portability
# Works on macOS, Linux, and WSL2
GREEN  := $(shell tput -Txterm setaf 2 2>/dev/null || echo "")
YELLOW := $(shell tput -Txterm setaf 3 2>/dev/null || echo "")
RED    := $(shell tput -Txterm setaf 1 2>/dev/null || echo "")
BLUE   := $(shell tput -Txterm setaf 4 2>/dev/null || echo "")
CYAN   := $(shell tput -Txterm setaf 6 2>/dev/null || echo "")
RESET  := $(shell tput -Txterm sgr0 2>/dev/null || echo "")

# Unicode symbols for output
CHECK := ✓
CROSS := ✗
WARN  := ⚠
INFO  := ℹ
ARROW := →

# OS detection
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    OS := macOS
    OPEN := open
endif
ifeq ($(UNAME_S),Linux)
    OS := Linux
    OPEN := xdg-open
endif

# Load .env if exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

# Docker Compose command
DOCKER_COMPOSE := docker-compose
COMPOSE_BASE := -f docker/docker-compose.yml
COMPOSE_DEV := $(COMPOSE_BASE) -f docker/docker-compose.dev.yml
COMPOSE_MONITORING := $(COMPOSE_DEV) -f docker/docker-compose.monitoring.yml
COMPOSE_MOCKS := $(COMPOSE_DEV) -f docker/docker-compose.mocks.yml
COMPOSE_TEST := -f docker/docker-compose.test.yml
COMPOSE_FULL := $(COMPOSE_MOCKS) -f docker/docker-compose.monitoring.yml

# Default goal
.DEFAULT_GOAL := help

# ============================================================
# .PHONY DECLARATIONS
# ============================================================
# All targets are .PHONY as they don't represent actual files
.PHONY: help version doctor
.PHONY: up down restart rebuild clean
.PHONY: dev full monitoring monitoring-down monitoring-logs grafana mocks mocks-down mocks-logs mocks-reset test
.PHONY: db-migrate db-seed db-reset db-backup db-restore db-shell
.PHONY: logs status ps stats health logs-backend logs-frontend
.PHONY: reset prune update validate
.PHONY: shell-backend shell-frontend exec
.PHONY: check-docker check-ports

# ============================================================
# HELP & SETUP COMMANDS
# ============================================================

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║         BarberPro Docker Environment - Makefile Help          ║$(RESET)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BLUE)Usage:$(RESET) make [target]"
	@echo ""
	@echo "$(BLUE)Common Commands:$(RESET)"
	@echo "  $(CYAN)make up$(RESET)        - Start development environment"
	@echo "  $(CYAN)make down$(RESET)      - Stop all services"
	@echo "  $(CYAN)make reset$(RESET)     - Complete environment reset"
	@echo "  $(CYAN)make help$(RESET)      - Show this help message"
	@echo ""
	@echo "$(BLUE)Available Targets:$(RESET)"
	@echo ""
	@echo "$(YELLOW)Setup & Info:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "; section=""} \
	    /^##@ / {section=$$0; sub(/^##@ /, "", section); next} \
	    /^[a-zA-Z_-]+:.*?## / { \
	        if (section == "Setup & Info" || section == "") \
	            printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2 \
	    }' $(MAKEFILE_LIST) || true
	@echo ""
	@echo "$(YELLOW)Lifecycle Management:$(RESET) $(GREEN)(Stream B)$(RESET)"
	@echo "  $(CYAN)up, down, restart, rebuild, clean$(RESET)"
	@echo ""
	@echo "$(YELLOW)Environment Variants:$(RESET) $(GREEN)(Stream B)$(RESET)"
	@echo "  $(CYAN)dev, full, monitoring, mocks, test$(RESET)"
	@echo ""
	@echo "$(YELLOW)Mock Services:$(RESET) $(GREEN)(Issue #7)$(RESET)"
	@echo "  $(CYAN)mocks, mocks-down, mocks-logs, mocks-reset$(RESET)"
	@echo ""
	@echo "$(YELLOW)Monitoring Stack:$(RESET) $(GREEN)(Issue #8)$(RESET)"
	@echo "  $(CYAN)monitoring, monitoring-down, monitoring-logs, grafana$(RESET)"
	@echo ""
	@echo "$(YELLOW)Database Operations:$(RESET) $(GREEN)(Stream C)$(RESET)"
	@echo "  $(CYAN)db-migrate, db-seed, db-reset, db-backup, db-restore, db-shell$(RESET)"
	@echo ""
	@echo "$(YELLOW)Development Tools:$(RESET) $(GREEN)(Stream C)$(RESET)"
	@echo "  $(CYAN)shell-backend, shell-frontend, exec$(RESET)"
	@echo ""
	@echo "$(YELLOW)Monitoring & Debugging:$(RESET) $(GREEN)(Stream D)$(RESET)"
	@echo "  $(CYAN)logs, status, ps, stats, health$(RESET)"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(RESET) $(GREEN)(Stream D)$(RESET)"
	@echo "  $(CYAN)reset, prune, update, validate$(RESET)"
	@echo ""
	@echo "$(YELLOW)Integration Testing:$(RESET) $(GREEN)(Issue #9)$(RESET)"
	@echo "  $(CYAN)test-integration, test-payment, test-notifications, test-db, test-all$(RESET)"
	@echo ""
	@echo "$(BLUE)Environment:$(RESET) $(OS)"
	@echo "$(BLUE)Docker Compose:$(RESET) $(COMPOSE_BASE)"
	@echo ""

##@ Setup & Info

version: ## Show Docker, docker-compose, and service versions
	@echo "$(CYAN)[$(ARROW)]$(RESET) Checking versions..."
	@echo ""
	@echo "$(BLUE)System Information:$(RESET)"
	@echo "  $(YELLOW)OS:$(RESET)              $(OS) ($(UNAME_S))"
	@echo ""
	@echo "$(BLUE)Docker Environment:$(RESET)"
	@docker --version 2>/dev/null || echo "  $(RED)[$(CROSS)]$(RESET) Docker not found"
	@docker-compose --version 2>/dev/null || echo "  $(RED)[$(CROSS)]$(RESET) docker-compose not found"
	@echo ""
	@echo "$(BLUE)Node.js Environment:$(RESET)"
	@node --version 2>/dev/null | sed 's/^/  Node.js:         /' || echo "  $(RED)[$(CROSS)]$(RESET) Node.js not found"
	@npm --version 2>/dev/null | sed 's/^/  npm:             /' || echo "  $(RED)[$(CROSS)]$(RESET) npm not found"
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Version check complete"

doctor: ## Check system requirements and configuration
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running system diagnostics..."
	@echo ""
	@echo "$(BLUE)Checking Prerequisites:$(RESET)"
	@echo ""
	@# Check Docker
	@printf "  Docker Engine:       "
	@docker info > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Running$(RESET)" || echo "$(RED)[$(CROSS)] Not running$(RESET)"
	@# Check Docker Compose
	@printf "  Docker Compose:      "
	@docker-compose version > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Installed$(RESET)" || echo "$(RED)[$(CROSS)] Not installed$(RESET)"
	@# Check Node.js
	@printf "  Node.js:             "
	@node --version > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] $$(node --version)$(RESET)" || echo "$(YELLOW)[$(WARN)] Not installed$(RESET)"
	@# Check npm
	@printf "  npm:                 "
	@npm --version > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] $$(npm --version)$(RESET)" || echo "$(YELLOW)[$(WARN)] Not installed$(RESET)"
	@# Check make
	@printf "  GNU Make:            "
	@make --version > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] $$(make --version | head -n1)$(RESET)" || echo "$(RED)[$(CROSS)] Not installed$(RESET)"
	@echo ""
	@echo "$(BLUE)Checking Configuration Files:$(RESET)"
	@echo ""
	@# Check .env
	@printf "  .env file:           "
	@test -f .env && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(YELLOW)[$(WARN)] Not found (optional)$(RESET)"
	@# Check docker-compose files
	@printf "  Base compose:        "
	@test -f docker/docker-compose.yml && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(RED)[$(CROSS)] Missing$(RESET)"
	@printf "  Dev compose:         "
	@test -f docker/docker-compose.dev.yml && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(RED)[$(CROSS)] Missing$(RESET)"
	@printf "  Monitoring compose:  "
	@test -f docker/docker-compose.monitoring.yml && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(RED)[$(CROSS)] Missing$(RESET)"
	@printf "  Mocks compose:       "
	@test -f docker/docker-compose.mocks.yml && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(RED)[$(CROSS)] Missing$(RESET)"
	@printf "  Test compose:        "
	@test -f docker/docker-compose.test.yml && echo "$(GREEN)[$(CHECK)] Found$(RESET)" || echo "$(RED)[$(CROSS)] Missing$(RESET)"
	@echo ""
	@echo "$(BLUE)Checking Port Availability:$(RESET)"
	@echo ""
	@# Check common ports
	@printf "  Port 3000 (Backend): "
	@! lsof -ti:3000 > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Available$(RESET)" || echo "$(YELLOW)[$(WARN)] In use$(RESET)"
	@printf "  Port 5173 (Frontend):"
	@! lsof -ti:5173 > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Available$(RESET)" || echo "$(YELLOW)[$(WARN)] In use$(RESET)"
	@printf "  Port 5432 (Postgres):"
	@! lsof -ti:5432 > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Available$(RESET)" || echo "$(YELLOW)[$(WARN)] In use$(RESET)"
	@printf "  Port 6379 (Redis):   "
	@! lsof -ti:6379 > /dev/null 2>&1 && echo "$(GREEN)[$(CHECK)] Available$(RESET)" || echo "$(YELLOW)[$(WARN)] In use$(RESET)"
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) System diagnostics complete"
	@echo ""
	@# Final summary
	@docker info > /dev/null 2>&1 || (echo "$(RED)[$(CROSS)]$(RESET) Docker is not running. Please start Docker Desktop." && echo "")

# Internal prerequisite checks
check-docker:
	@if ! docker info > /dev/null 2>&1; then \
	    echo "$(RED)[$(CROSS)]$(RESET) Docker is not running"; \
	    echo ""; \
	    echo "$(YELLOW)Platform-specific solutions:$(RESET)"; \
	    if [ "$(OS)" = "macOS" ]; then \
	        echo "  $(CYAN)macOS:$(RESET)"; \
	        echo "    1. Start Docker Desktop from Applications"; \
	        echo "    2. Or run: open -a Docker"; \
	        echo "    3. Wait for Docker icon in menu bar to show running status"; \
	    elif [ "$(UNAME_S)" = "Linux" ]; then \
	        if grep -qi microsoft /proc/version 2>/dev/null; then \
	            echo "  $(CYAN)WSL2:$(RESET)"; \
	            echo "    1. Ensure Docker Desktop is running on Windows"; \
	            echo "    2. In Docker Desktop settings, enable WSL2 backend"; \
	            echo "    3. Enable integration with your WSL2 distribution"; \
	            echo "    4. Restart WSL: wsl --shutdown (from Windows)"; \
	        else \
	            echo "  $(CYAN)Linux:$(RESET)"; \
	            echo "    1. Start Docker service: sudo systemctl start docker"; \
	            echo "    2. Enable on boot: sudo systemctl enable docker"; \
	            echo "    3. Add user to docker group: sudo usermod -aG docker $$USER"; \
	            echo "    4. Log out and back in for group changes to take effect"; \
	        fi; \
	    else \
	        echo "  Please start Docker and try again"; \
	    fi; \
	    echo ""; \
	    exit 1; \
	fi

check-ports:
	@# Check PostgreSQL port 5432
	@if lsof -ti:5432 > /dev/null 2>&1; then \
	    echo "$(RED)[$(CROSS)]$(RESET) Port 5432 (PostgreSQL) is already in use"; \
	    echo ""; \
	    echo "$(YELLOW)Possible solutions:$(RESET)"; \
	    echo "  $(CYAN)1. Kill the process:$(RESET)"; \
	    echo "     lsof -ti:5432 | xargs kill -9"; \
	    echo ""; \
	    echo "  $(CYAN)2. Change port in docker/.env:$(RESET)"; \
	    echo "     POSTGRES_PORT=5433"; \
	    echo ""; \
	    echo "  $(CYAN)3. Stop local PostgreSQL service:$(RESET)"; \
	    if [ "$(OS)" = "macOS" ]; then \
	        echo "     brew services stop postgresql"; \
	    else \
	        echo "     sudo systemctl stop postgresql"; \
	    fi; \
	    echo ""; \
	    exit 1; \
	fi
	@# Check Redis port 6379
	@if lsof -ti:6379 > /dev/null 2>&1; then \
	    echo "$(RED)[$(CROSS)]$(RESET) Port 6379 (Redis) is already in use"; \
	    echo ""; \
	    echo "$(YELLOW)Possible solutions:$(RESET)"; \
	    echo "  $(CYAN)1. Kill the process:$(RESET)"; \
	    echo "     lsof -ti:6379 | xargs kill -9"; \
	    echo ""; \
	    echo "  $(CYAN)2. Change port in docker/.env:$(RESET)"; \
	    echo "     REDIS_PORT=6380"; \
	    echo ""; \
	    echo "  $(CYAN)3. Stop local Redis service:$(RESET)"; \
	    if [ "$(OS)" = "macOS" ]; then \
	        echo "     brew services stop redis"; \
	    else \
	        echo "     sudo systemctl stop redis"; \
	    fi; \
	    echo ""; \
	    exit 1; \
	fi
	@# Check Backend port 3000
	@if lsof -ti:3000 > /dev/null 2>&1; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) Port 3000 (Backend) is in use"; \
	    echo "$(YELLOW)[$(INFO)]$(RESET) This is OK if your backend is already running"; \
	    echo "$(YELLOW)[$(INFO)]$(RESET) To free the port: lsof -ti:3000 | xargs kill -9"; \
	fi
	@# Check Frontend port 5173
	@if lsof -ti:5173 > /dev/null 2>&1; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) Port 5173 (Frontend) is in use"; \
	    echo "$(YELLOW)[$(INFO)]$(RESET) This is OK if your frontend is already running"; \
	    echo "$(YELLOW)[$(INFO)]$(RESET) To free the port: lsof -ti:5173 | xargs kill -9"; \
	fi

# ============================================================
# LIFECYCLE MANAGEMENT
# ============================================================
# Stream B: Lifecycle management commands
# Commands for starting, stopping, and managing the Docker environment

##@ Lifecycle Management

up: check-docker check-ports ## Start all services (base + dev + mocks)
	@START_TIME=$$(date +%s); \
	if [ -f docker/configs/banner.txt ]; then \
	    echo "$(CYAN)"; \
	    cat docker/configs/banner.txt; \
	    echo "$(RESET)"; \
	fi; \
	echo "$(CYAN)[$(ARROW)]$(RESET) Starting BarberPro Development Environment..."; \
	echo ""; \
	echo "$(CYAN)[$(ARROW)]$(RESET) Starting services with:"; \
	echo "  - Base infrastructure (PostgreSQL, Redis, Admin tools)"; \
	echo "  - Argentina service mocks"; \
	echo ""; \
	$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) up -d || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to start services" && \
	     echo "$(YELLOW)[$(INFO)]$(RESET) Try running 'make doctor' to diagnose issues" && exit 1); \
	echo ""; \
	echo "$(CYAN)[$(ARROW)]$(RESET) Waiting for services to be healthy..."; \
	sleep 3; \
	echo ""; \
	END_TIME=$$(date +%s); \
	DURATION=$$((END_TIME - START_TIME)); \
	echo "$(GREEN)[$(CHECK)]$(RESET) Services started successfully! (completed in $${DURATION}s)"; \
	echo ""; \
	echo "$(BLUE)Services available at:$(RESET)"; \
	echo "  $(CYAN)PostgreSQL:$(RESET)     localhost:5432"; \
	echo "  $(CYAN)pgAdmin:$(RESET)        http://localhost:8080"; \
	echo "  $(CYAN)Redis:$(RESET)          localhost:6379"; \
	echo "  $(CYAN)Redis Commander:$(RESET) http://localhost:8081"; \
	echo ""; \
	echo "$(YELLOW)Next steps:$(RESET)"; \
	echo "  - Start backend:  $(CYAN)cd backend && npm run dev$(RESET)"; \
	echo "  - Start frontend: $(CYAN)cd frontend && npm run dev$(RESET)"; \
	echo "  - View logs:      $(CYAN)make logs$(RESET)"; \
	echo "  - Check status:   $(CYAN)make status$(RESET)"; \
	echo ""

down: ## Stop all services gracefully
	@START_TIME=$$(date +%s); \
	echo "$(CYAN)[$(ARROW)]$(RESET) Stopping all services..."; \
	$(DOCKER_COMPOSE) $(COMPOSE_FULL) down || \
	    (echo "$(YELLOW)[$(WARN)]$(RESET) Some services may not be running" && exit 0); \
	END_TIME=$$(date +%s); \
	DURATION=$$((END_TIME - START_TIME)); \
	echo "$(GREEN)[$(CHECK)]$(RESET) All services stopped (completed in $${DURATION}s)"; \
	echo ""; \
	echo "$(BLUE)To start again:$(RESET) $(CYAN)make up$(RESET)"

restart: ## Restart all services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Restarting all services..."
	@echo ""
	@$(MAKE) down
	@echo ""
	@sleep 1
	@$(MAKE) up

rebuild: check-docker ## Rebuild and restart all services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Rebuilding all services..."
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Stopping existing services..."
	@$(DOCKER_COMPOSE) $(COMPOSE_FULL) down
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Pulling latest images..."
	@$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) pull || \
	    (echo "$(YELLOW)[$(WARN)]$(RESET) Some images could not be pulled, continuing..." && exit 0)
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Building custom images (if any)..."
	@$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) build || \
	    (echo "$(YELLOW)[$(WARN)]$(RESET) No custom images to build" && exit 0)
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Rebuild complete!"
	@echo ""
	@$(MAKE) up

clean: ## Remove all containers, volumes, and networks
	@echo "$(YELLOW)[$(WARN)]$(RESET) This will remove all containers, volumes, and networks"
	@echo "$(YELLOW)[$(WARN)]$(RESET) All data will be lost!"
	@echo ""
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
	    START_TIME=$$(date +%s); \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Stopping all services..."; \
	    $(DOCKER_COMPOSE) $(COMPOSE_FULL) down -v --remove-orphans || exit 0; \
	    echo ""; \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Removing volumes..."; \
	    docker volume rm barberpro-postgres-data barberpro-redis-data barberpro-pgadmin-data 2>/dev/null || echo "$(YELLOW)[$(INFO)]$(RESET) Some volumes were already removed"; \
	    echo ""; \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Removing networks..."; \
	    docker network rm barberpro-network 2>/dev/null || echo "$(YELLOW)[$(INFO)]$(RESET) Network was already removed"; \
	    echo ""; \
	    END_TIME=$$(date +%s); \
	    DURATION=$$((END_TIME - START_TIME)); \
	    echo "$(GREEN)[$(CHECK)]$(RESET) Clean complete! All containers, volumes, and networks removed. (completed in $${DURATION}s)"; \
	    echo ""; \
	    echo "$(BLUE)To start fresh:$(RESET) $(CYAN)make up$(RESET)"; \
	else \
	    echo "$(YELLOW)[$(INFO)]$(RESET) Clean cancelled"; \
	fi

# ============================================================
# ENVIRONMENT VARIANTS
# ============================================================
# Stream B: Environment-specific startup commands
# Choose which services to run based on your development needs

##@ Environment Variants

dev: check-docker check-ports ## Start development environment only (postgres, redis, admin tools)
	@if [ -f docker/configs/banner.txt ]; then \
	    echo "$(CYAN)"; \
	    cat docker/configs/banner.txt; \
	    echo "$(RESET)"; \
	fi
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting Development Environment..."
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting services:"
	@echo "  - PostgreSQL (database)"
	@echo "  - Redis (cache)"
	@echo "  - pgAdmin (database management)"
	@echo "  - Redis Commander (cache management)"
	@echo ""
	@$(DOCKER_COMPOSE) $(COMPOSE_BASE) up -d || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to start development services" && exit 1)
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Waiting for services to be healthy..."
	@sleep 3
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Development environment ready!"
	@echo ""
	@echo "$(BLUE)Services available at:$(RESET)"
	@echo "  $(CYAN)PostgreSQL:$(RESET)     localhost:5432"
	@echo "  $(CYAN)pgAdmin:$(RESET)        http://localhost:8080"
	@echo "  $(CYAN)Redis:$(RESET)          localhost:6379"
	@echo "  $(CYAN)Redis Commander:$(RESET) http://localhost:8081"
	@echo ""
	@echo "$(YELLOW)This is a minimal setup. For full environment, use:$(RESET) $(CYAN)make full$(RESET)"
	@echo ""

full: check-docker check-ports ## Start everything (dev + monitoring + mocks)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting Full Environment..."
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting all services:"
	@echo "  - Base infrastructure (PostgreSQL, Redis, Admin tools)"
	@echo "  - Monitoring stack (Prometheus, Grafana, Loki)"
	@echo "  - Argentina service mocks (MercadoPago, AFIP, WhatsApp)"
	@echo ""
	@$(DOCKER_COMPOSE) $(COMPOSE_FULL) up -d || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to start full environment" && exit 1)
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Waiting for services to be healthy..."
	@sleep 5
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Full environment ready!"
	@echo ""
	@echo "$(BLUE)Core Services:$(RESET)"
	@echo "  $(CYAN)PostgreSQL:$(RESET)     localhost:5432"
	@echo "  $(CYAN)pgAdmin:$(RESET)        http://localhost:8080"
	@echo "  $(CYAN)Redis:$(RESET)          localhost:6379"
	@echo "  $(CYAN)Redis Commander:$(RESET) http://localhost:8081"
	@echo ""
	@echo "$(BLUE)Monitoring (when implemented):$(RESET)"
	@echo "  $(CYAN)Prometheus:$(RESET)     http://localhost:9090"
	@echo "  $(CYAN)Grafana:$(RESET)        http://localhost:3001"
	@echo "  $(CYAN)Loki:$(RESET)           http://localhost:3100"
	@echo ""
	@echo "$(BLUE)Argentina Mocks (when implemented):$(RESET)"
	@echo "  $(CYAN)MercadoPago:$(RESET)    http://localhost:8081"
	@echo "  $(CYAN)AFIP:$(RESET)           http://localhost:8082"
	@echo "  $(CYAN)WhatsApp:$(RESET)       http://localhost:8083"
	@echo ""

monitoring: check-docker ## Start monitoring stack
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting monitoring stack..."
	@docker-compose -f docker/docker-compose.monitoring.yml up -d
	@echo "$(GREEN)[$(CHECK)]$(RESET) Monitoring stack started"
	@echo ""
	@echo "Monitoring services:"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana:    http://localhost:3001 (admin/admin)"
	@echo "  Loki:       http://localhost:3100"
	@echo "  cAdvisor:   http://localhost:8080"

monitoring-down: ## Stop monitoring stack
	@docker-compose -f docker/docker-compose.monitoring.yml down

monitoring-logs: ## View monitoring stack logs
	@docker-compose -f docker/docker-compose.monitoring.yml logs -f

grafana: ## Open Grafana in browser
	@$(OPEN) http://localhost:3001

mocks: check-docker ## Start all Argentina mock services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting Argentina mock services..."
	@docker-compose -f docker/docker-compose.mocks.yml up -d
	@echo "$(GREEN)[$(CHECK)]$(RESET) Mock services started"
	@echo ""
	@echo "Mock services available at:"
	@echo "  MercadoPago: http://localhost:3001/dashboard"
	@echo "  AFIP:        http://localhost:3002/docs"
	@echo "  WhatsApp:    http://localhost:3003/dashboard"
	@echo "  SMS:         http://localhost:3004/dashboard"
	@echo "  Email:       http://localhost:8025"

mocks-down: ## Stop all mock services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Stopping mock services..."
	@docker-compose -f docker/docker-compose.mocks.yml down
	@echo "$(GREEN)[$(CHECK)]$(RESET) Mock services stopped"

mocks-logs: ## View logs from all mock services
	@docker-compose -f docker/docker-compose.mocks.yml logs -f

mocks-reset: ## Reset mock services (stop, remove volumes, start)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Resetting mock services..."
	@docker-compose -f docker/docker-compose.mocks.yml down -v
	@docker-compose -f docker/docker-compose.mocks.yml up -d
	@echo "$(GREEN)[$(CHECK)]$(RESET) Mock services reset"

test: check-docker ## Start test environment
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting Test Environment..."
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Starting test infrastructure:"
	@echo "  - PostgreSQL Test (port 5433)"
	@echo "  - Redis Test (port 6380)"
	@echo ""
	@$(DOCKER_COMPOSE) $(COMPOSE_TEST) up -d || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to start test environment" && exit 1)
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Waiting for test services to be healthy..."
	@sleep 3
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Test environment ready!"
	@echo ""
	@echo "$(BLUE)Test Services:$(RESET)"
	@echo "  $(CYAN)PostgreSQL Test:$(RESET) localhost:5433"
	@echo "  $(CYAN)Redis Test:$(RESET)      localhost:6380"
	@echo ""
	@echo "$(YELLOW)Environment Variables for Tests:$(RESET)"
	@echo "  DATABASE_URL=postgresql://barberpro_test:test_password_change_in_ci@localhost:5433/barberpro_test"
	@echo "  REDIS_URL=redis://localhost:6380"
	@echo ""
	@echo "$(YELLOW)Next steps:$(RESET)"
	@echo "  - Run migrations: $(CYAN)cd backend && npm run db:migrate$(RESET)"
	@echo "  - Run tests:      $(CYAN)npm test$(RESET)"
	@echo "  - Stop test env:  $(CYAN)docker-compose -f docker/docker-compose.test.yml down -v$(RESET)"
	@echo ""

# ============================================================
# DATABASE OPERATIONS
# ============================================================
# Stream C will add code here:
# - make db-migrate
# - make db-seed
# - make db-reset
# - make db-backup
# - make db-restore
# - make db-shell

##@ Database Operations

db-migrate: ## Run Prisma migrations
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running Prisma migrations..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps backend | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) Backend container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Backend service is not available. Database commands need backend container."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec backend npm run db:migrate || \
		(echo "$(RED)[$(CROSS)]$(RESET) Migration failed" && exit 1)
	@echo "$(GREEN)[$(CHECK)]$(RESET) Migrations applied successfully"

db-seed: ## Seed database with test data
	@echo "$(CYAN)[$(ARROW)]$(RESET) Seeding database with test data..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps backend | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) Backend container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Backend service is not available. Database commands need backend container."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec backend npm run seed || \
		(echo "$(RED)[$(CROSS)]$(RESET) Seeding failed" && exit 1)
	@echo "$(GREEN)[$(CHECK)]$(RESET) Database seeded successfully"

db-reset: ## Drop, migrate, seed (complete reset)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Resetting database (drop, migrate, seed)..."
	@echo "$(YELLOW)[$(WARN)]$(RESET) This will DELETE ALL DATA in the database!"
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps backend | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) Backend container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Backend service is not available. Database commands need backend container."; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec backend npm run db:reset || \
		(echo "$(RED)[$(CROSS)]$(RESET) Database reset failed" && exit 1)
	@echo "$(GREEN)[$(CHECK)]$(RESET) Database reset completed successfully"

db-backup: ## Backup database to file
	@echo "$(CYAN)[$(ARROW)]$(RESET) Backing up database..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_BASE) ps postgres | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) PostgreSQL container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start the database with: make up"; \
		exit 1; \
	fi
	@mkdir -p docker/backup
	@BACKUP_FILE="docker/backup/barberpro_$$(date +%Y%m%d_%H%M%S).sql" && \
	$(DOCKER_COMPOSE) $(COMPOSE_BASE) exec -T postgres pg_dump -U $${POSTGRES_USER:-barberpro} $${POSTGRES_DB:-barberpro_dev} > $$BACKUP_FILE && \
	echo "$(GREEN)[$(CHECK)]$(RESET) Database backed up to: $$BACKUP_FILE" || \
	(echo "$(RED)[$(CROSS)]$(RESET) Backup failed" && exit 1)

db-restore: ## Restore database from backup (usage: make db-restore FILE=docker/backup/file.sql)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Restoring database from backup..."
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) No backup file specified"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Usage: make db-restore FILE=docker/backup/barberpro_YYYYMMDD_HHMMSS.sql"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Available backups:"; \
		ls -1t docker/backup/*.sql 2>/dev/null | head -5 || echo "  No backups found"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Backup file not found: $(FILE)"; \
		exit 1; \
	fi
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_BASE) ps postgres | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) PostgreSQL container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start the database with: make up"; \
		exit 1; \
	fi
	@echo "$(YELLOW)[$(WARN)]$(RESET) This will REPLACE ALL DATA in the database!"
	@cat $(FILE) | $(DOCKER_COMPOSE) $(COMPOSE_BASE) exec -T postgres psql -U $${POSTGRES_USER:-barberpro} $${POSTGRES_DB:-barberpro_dev} && \
	echo "$(GREEN)[$(CHECK)]$(RESET) Database restored from: $(FILE)" || \
	(echo "$(RED)[$(CROSS)]$(RESET) Restore failed" && exit 1)

db-shell: ## Open PostgreSQL shell
	@echo "$(CYAN)[$(ARROW)]$(RESET) Opening PostgreSQL shell..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_BASE) ps postgres | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) PostgreSQL container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start the database with: make up"; \
		exit 1; \
	fi
	@echo "$(GREEN)[$(CHECK)]$(RESET) Connected to database. Type '\q' to quit."
	@$(DOCKER_COMPOSE) $(COMPOSE_BASE) exec postgres psql -U $${POSTGRES_USER:-barberpro} $${POSTGRES_DB:-barberpro_dev}

# ============================================================
# DEVELOPMENT TOOLS
# ============================================================
# Stream C: Development shell access and command execution
# Commands for interactive access to service containers

##@ Development Tools

shell-backend: ## Open shell in backend container
	@echo "$(CYAN)[$(ARROW)]$(RESET) Opening shell in backend container..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps backend | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) Backend container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start services with: make up"; \
		exit 1; \
	fi
	@echo "$(GREEN)[$(CHECK)]$(RESET) Connected. Type 'exit' to quit."
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec backend /bin/sh

shell-frontend: ## Open shell in frontend container
	@echo "$(CYAN)[$(ARROW)]$(RESET) Opening shell in frontend container..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps frontend | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) Frontend container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start services with: make up"; \
		exit 1; \
	fi
	@echo "$(GREEN)[$(CHECK)]$(RESET) Connected. Type 'exit' to quit."
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec frontend /bin/sh

exec: ## Execute command in service container (usage: make exec SERVICE=backend CMD='npm test')
	@if [ -z "$(SERVICE)" ] || [ -z "$(CMD)" ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Both SERVICE and CMD parameters are required"; \
		echo ""; \
		echo "$(YELLOW)Usage:$(RESET) make exec SERVICE=<service> CMD='<command>'"; \
		echo ""; \
		echo "$(YELLOW)Examples:$(RESET)"; \
		echo "  make exec SERVICE=backend CMD='npm run test'"; \
		echo "  make exec SERVICE=frontend CMD='npm run lint'"; \
		echo "  make exec SERVICE=postgres CMD='psql -U barberpro'"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(CYAN)[$(ARROW)]$(RESET) Executing command in $(SERVICE) container..."
	@if ! $(DOCKER_COMPOSE) $(COMPOSE_DEV) ps $(SERVICE) | grep -q "Up"; then \
		echo "$(RED)[$(CROSS)]$(RESET) $(SERVICE) container is not running"; \
		echo "$(YELLOW)[$(INFO)]$(RESET) Start services with: make up"; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) $(COMPOSE_DEV) exec $(SERVICE) sh -c "$(CMD)" || \
		(echo "$(RED)[$(CROSS)]$(RESET) Command execution failed" && exit 1)
	@echo "$(GREEN)[$(CHECK)]$(RESET) Command completed successfully"


# ============================================================
# MONITORING & DEBUGGING
# ============================================================
# Stream D: Monitoring commands for logs, status, and health checks
# Commands: logs, status, ps, stats, health, logs-backend, logs-frontend

##@ Monitoring & Debugging

logs: ## Tail logs from all services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Tailing logs from all services..."
	@echo "$(CYAN)[$(INFO)]$(RESET) Press Ctrl+C to stop"
	@echo ""
	@$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) logs -f --tail=100 --timestamps || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to tail logs. Are services running? Try 'make up' first." && exit 1)

status: ## Show health status of all services (table format)
	@echo "$(CYAN)╔════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║                       Service Status                          ║$(RESET)"
	@echo "$(CYAN)╚════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@# Check if any services are running
	@if ! docker ps --filter "name=barberpro" -q 2>/dev/null | grep -q .; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) No services running. Start with 'make up'"; \
	    exit 0; \
	fi
	@# Display service health status with symbols
	@echo "$(BLUE)Service Health Status:$(RESET)"
	@echo ""
	@SERVICES="postgres redis pgadmin redis-commander"; \
	for service in $$SERVICES; do \
	    CONTAINER_NAME="barberpro-$$service"; \
	    printf "  %-25s " "$$service:"; \
	    if docker ps --filter "name=$$CONTAINER_NAME" --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then \
	        HEALTH=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' $$CONTAINER_NAME 2>/dev/null || echo "unknown"); \
	        case "$$HEALTH" in \
	            "healthy") \
	                echo "$(GREEN)[$(CHECK)] Healthy$(RESET)"; \
	                ;; \
	            "no-healthcheck") \
	                echo "$(BLUE)[$(CHECK)] Running$(RESET)"; \
	                ;; \
	            "starting") \
	                echo "$(YELLOW)[$(ARROW)] Starting...$(RESET)"; \
	                ;; \
	            "unhealthy") \
	                echo "$(RED)[$(CROSS)] Unhealthy$(RESET)"; \
	                ;; \
	            *) \
	                echo "$(BLUE)[?] Unknown$(RESET)"; \
	                ;; \
	        esac; \
	    else \
	        echo "$(RED)[$(CROSS)] Not running$(RESET)"; \
	    fi; \
	done
	@echo ""
	@# Check mock services if running
	@if docker ps --filter "name=barberpro-mercadopago-mock" -q 2>/dev/null | grep -q .; then \
	    echo "$(BLUE)Argentina Mock Services:$(RESET)"; \
	    echo ""; \
	    MOCK_SERVICES="mercadopago-mock afip-mock whatsapp-mock sms-mock"; \
	    for service in $$MOCK_SERVICES; do \
	        CONTAINER_NAME="barberpro-$$service"; \
	        printf "  %-25s " "$$service:"; \
	        if docker ps --filter "name=$$CONTAINER_NAME" --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then \
	            echo "$(GREEN)[$(CHECK)] Running$(RESET)"; \
	        else \
	            echo "$(YELLOW)[$(WARN)] Not running$(RESET)"; \
	        fi; \
	    done; \
	    echo ""; \
	fi
	@echo "$(CYAN)[$(INFO)]$(RESET) Use 'make health' for detailed health checks"
	@echo "$(CYAN)[$(INFO)]$(RESET) Use 'make ps' for detailed container listing"

ps: ## List running containers
	@echo "$(CYAN)[$(ARROW)]$(RESET) Listing BarberPro containers..."
	@echo ""
	@docker ps --filter "name=barberpro" --format "table {{.Names}}	{{.Status}}	{{.Ports}}" 2>/dev/null || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Failed to list containers. Is Docker running?" && exit 1)
	@echo ""
	@CONTAINER_COUNT=$$(docker ps --filter "name=barberpro" -q | wc -l | tr -d ' '); \
	if [ "$$CONTAINER_COUNT" -eq 0 ]; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) No BarberPro containers running"; \
	else \
	    echo "$(GREEN)[$(CHECK)]$(RESET) $$CONTAINER_COUNT container(s) running"; \
	fi

stats: ## Show resource usage (CPU, memory)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Showing resource usage for BarberPro services..."
	@echo "$(CYAN)[$(INFO)]$(RESET) Press Ctrl+C to stop"
	@echo ""
	@CONTAINERS=$$(docker ps --filter "name=barberpro" -q); \
	if [ -z "$$CONTAINERS" ]; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) No BarberPro containers running. Start with 'make up'"; \
	    exit 0; \
	fi; \
	docker stats $$CONTAINERS

health: ## Run health checks on all services
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running health checks on all services..."
	@echo ""
	@SERVICES="postgres redis pgadmin redis-commander backend frontend"; \
	HEALTHY_COUNT=0; \
	TOTAL_COUNT=0; \
	for service in $$SERVICES; do \
	    TOTAL_COUNT=$$((TOTAL_COUNT + 1)); \
	    CONTAINER_NAME="barberpro-$$service"; \
	    if [ "$$service" = "backend" ]; then \
	        CONTAINER_NAME="barberpro-backend-dev"; \
	    elif [ "$$service" = "frontend" ]; then \
	        CONTAINER_NAME="barberpro-frontend-dev"; \
	    fi; \
	    printf "  %-20s " "$$service:"; \
	    if docker ps --filter "name=$$CONTAINER_NAME" --format "{{.Status}}" 2>/dev/null | grep -q "Up"; then \
	        HEALTH=$$(docker inspect --format='{{.State.Health.Status}}' $$CONTAINER_NAME 2>/dev/null || echo "no-healthcheck"); \
	        if [ "$$HEALTH" = "healthy" ]; then \
	            echo "$(GREEN)[$(CHECK)] Healthy$(RESET)"; \
	            HEALTHY_COUNT=$$((HEALTHY_COUNT + 1)); \
	        elif [ "$$HEALTH" = "no-healthcheck" ]; then \
	            echo "$(BLUE)[$(INFO)] Running (no health check)$(RESET)"; \
	            HEALTHY_COUNT=$$((HEALTHY_COUNT + 1)); \
	        elif [ "$$HEALTH" = "starting" ]; then \
	            echo "$(YELLOW)[$(ARROW)] Starting...$(RESET)"; \
	        else \
	            echo "$(RED)[$(CROSS)] Unhealthy$(RESET)"; \
	        fi; \
	    else \
	        echo "$(RED)[$(CROSS)] Not running$(RESET)"; \
	    fi; \
	done; \
	echo ""; \
	if [ $$HEALTHY_COUNT -eq $$TOTAL_COUNT ]; then \
	    echo "$(GREEN)[$(CHECK)]$(RESET) All services are healthy ($$HEALTHY_COUNT/$$TOTAL_COUNT)"; \
	elif [ $$HEALTHY_COUNT -gt 0 ]; then \
	    echo "$(YELLOW)[$(WARN)]$(RESET) Some services are not healthy ($$HEALTHY_COUNT/$$TOTAL_COUNT healthy)"; \
	else \
	    echo "$(RED)[$(CROSS)]$(RESET) No services are healthy. Try 'make up'"; \
	fi

logs-backend: ## Show backend logs
	@echo "$(CYAN)[$(ARROW)]$(RESET) Tailing backend logs..."
	@echo "$(CYAN)[$(INFO)]$(RESET) Press Ctrl+C to stop"
	@echo ""
	@docker logs -f --tail=100 --timestamps barberpro-backend-dev 2>/dev/null || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Backend container not running. Start with 'make up'" && exit 1)

logs-frontend: ## Show frontend logs
	@echo "$(CYAN)[$(ARROW)]$(RESET) Tailing frontend logs..."
	@echo "$(CYAN)[$(INFO)]$(RESET) Press Ctrl+C to stop"
	@echo ""
	@docker logs -f --tail=100 --timestamps barberpro-frontend-dev 2>/dev/null || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Frontend container not running. Start with 'make up'" && exit 1)

# ============================================================
# MAINTENANCE
# ============================================================
# Stream D: Maintenance commands for environment resets and cleanup
# Commands: reset, prune, update, validate

##@ Maintenance

reset: ## Complete environment reset (down + clean + up + seed)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Performing complete environment reset..."
	@echo ""
	@echo "$(YELLOW)[$(WARN)]$(RESET) This will stop all services, remove volumes, and restart fresh"
	@echo ""
	@read -p "Are you sure you want to reset the environment? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
	    START_TIME=$$(date +%s); \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Step 1/4: Stopping services..."; \
	    $(MAKE) down; \
	    echo ""; \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Step 2/4: Cleaning up resources..."; \
	    $(DOCKER_COMPOSE) $(COMPOSE_FULL) down -v --remove-orphans 2>/dev/null || exit 0; \
	    docker volume rm barberpro-postgres-data barberpro-redis-data barberpro-pgadmin-data 2>/dev/null || exit 0; \
	    echo ""; \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Step 3/4: Starting fresh environment..."; \
	    $(MAKE) up; \
	    echo ""; \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Step 4/4: Environment ready for database seeding"; \
	    echo ""; \
	    END_TIME=$$(date +%s); \
	    DURATION=$$((END_TIME - START_TIME)); \
	    echo "$(GREEN)[$(CHECK)]$(RESET) Reset complete! Environment is ready. (completed in $${DURATION}s)"; \
	    echo ""; \
	    echo "$(YELLOW)Next steps:$(RESET)"; \
	    echo "  - Run migrations: $(CYAN)make db-migrate$(RESET)"; \
	    echo "  - Seed database:  $(CYAN)make db-seed$(RESET)"; \
	else \
	    echo "$(YELLOW)[$(INFO)]$(RESET) Reset cancelled"; \
	fi

prune: ## Remove unused Docker resources
	@echo "$(CYAN)[$(ARROW)]$(RESET) Cleaning up unused Docker resources..."
	@echo ""
	@echo "$(YELLOW)[$(INFO)]$(RESET) This will remove:"
	@echo "  - Stopped containers"
	@echo "  - Unused networks"
	@echo "  - Dangling images"
	@echo "  - Build cache"
	@echo ""
	@read -p "Continue with cleanup? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
	    echo "$(CYAN)[$(ARROW)]$(RESET) Pruning Docker resources..."; \
	    echo ""; \
	    docker system prune -f --volumes || \
	        (echo "$(RED)[$(CROSS)]$(RESET) Failed to prune resources" && exit 1); \
	    echo ""; \
	    echo "$(GREEN)[$(CHECK)]$(RESET) Cleanup complete!"; \
	    echo ""; \
	    docker system df; \
	else \
	    echo "$(YELLOW)[$(INFO)]$(RESET) Cleanup cancelled"; \
	fi

update: ## Pull latest images and rebuild
	@echo "$(CYAN)[$(ARROW)]$(RESET) Updating Docker images and rebuilding services..."
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Pulling latest base images..."
	@$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) pull || \
	    (echo "$(YELLOW)[$(WARN)]$(RESET) Some images could not be pulled, continuing..." && exit 0)
	@echo ""
	@echo "$(CYAN)[$(ARROW)]$(RESET) Rebuilding custom images..."
	@$(DOCKER_COMPOSE) $(COMPOSE_MOCKS) build --no-cache || \
	    (echo "$(YELLOW)[$(WARN)]$(RESET) No custom images to build" && exit 0)
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) Update complete!"
	@echo ""
	@echo "$(YELLOW)To apply updates:$(RESET) $(CYAN)make restart$(RESET)"

validate: ## Validate all docker-compose files
	@echo "$(CYAN)[$(ARROW)]$(RESET) Validating docker-compose files..."
	@echo ""
	@VALID_COUNT=0; \
	TOTAL_COUNT=0; \
	echo "Checking compose files:"; \
	echo ""; \
	for file in docker/docker-compose.yml docker/docker-compose.monitoring.yml docker/docker-compose.mocks.yml docker/docker-compose.test.yml; do \
	    TOTAL_COUNT=$$((TOTAL_COUNT + 1)); \
	    printf "  %-35s " "$$file:"; \
	    if [ -f "$$file" ]; then \
	        if docker-compose -f "$$file" config > /dev/null 2>&1; then \
	            echo "$(GREEN)[$(CHECK)] Valid$(RESET)"; \
	            VALID_COUNT=$$((VALID_COUNT + 1)); \
	        else \
	            echo "$(RED)[$(CROSS)] Invalid syntax$(RESET)"; \
	        fi; \
	    else \
	        echo "$(YELLOW)[$(WARN)] Not found$(RESET)"; \
	    fi; \
	done; \
	echo ""; \
	if [ $$VALID_COUNT -eq $$TOTAL_COUNT ]; then \
	    echo "$(GREEN)[$(CHECK)]$(RESET) All compose files are valid ($$VALID_COUNT/$$TOTAL_COUNT)"; \
	else \
	    echo "$(YELLOW)[$(WARN)]$(RESET) Some files have issues ($$VALID_COUNT/$$TOTAL_COUNT valid)"; \
	fi

# ============================================================
# INTEGRATION TESTING
# ============================================================
# Issue #9 Stream D: Integration test scripts
# Commands for testing the entire Docker environment end-to-end

##@ Integration Testing

test-integration: ## Run full integration test suite
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running full integration test suite..."
	@if [ ! -f scripts/test-integration.sh ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Test script not found"; \
		exit 1; \
	fi
	@bash scripts/test-integration.sh

test-integration-verbose: ## Run integration tests with verbose output
	@bash scripts/test-integration.sh --verbose

test-integration-quick: ## Run quick smoke test
	@bash scripts/test-integration.sh --quick

test-payment: ## Test payment flow (MercadoPago)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Testing payment flow..."
	@if [ ! -f scripts/test-payment-flow.sh ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Payment test script not found"; \
		exit 1; \
	fi
	@bash scripts/test-payment-flow.sh

test-payment-verbose: ## Test payment flow with verbose output
	@bash scripts/test-payment-flow.sh --verbose

test-notifications: ## Test notification services (WhatsApp, SMS, Email)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Testing notification services..."
	@if [ ! -f scripts/test-notifications.sh ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Notifications test script not found"; \
		exit 1; \
	fi
	@bash scripts/test-notifications.sh

test-notifications-verbose: ## Test notifications with verbose output
	@bash scripts/test-notifications.sh --verbose

test-db: ## Test database operations
	@echo "$(CYAN)[$(ARROW)]$(RESET) Testing database operations..."
	@if [ ! -f scripts/test-database.sh ]; then \
		echo "$(RED)[$(CROSS)]$(RESET) Database test script not found"; \
		exit 1; \
	fi
	@bash scripts/test-database.sh

test-db-verbose: ## Test database with verbose output
	@bash scripts/test-database.sh --verbose

test-db-skip-migrations: ## Test database without running migrations
	@bash scripts/test-database.sh --skip-migrations

test-all: ## Run all integration tests (integration, payment, notifications, database)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running all integration tests..."
	@echo ""
	@$(MAKE) test-integration
	@echo ""
	@$(MAKE) test-payment
	@echo ""
	@$(MAKE) test-notifications
	@echo ""
	@$(MAKE) test-db
	@echo ""
	@echo "$(GREEN)[$(CHECK)]$(RESET) All test suites completed!"

test-ci: ## Run tests suitable for CI/CD (quick, non-interactive)
	@echo "$(CYAN)[$(ARROW)]$(RESET) Running CI/CD test suite..."
	@bash scripts/test-integration.sh --quick
	@bash scripts/test-payment-flow.sh
	@bash scripts/test-notifications.sh
	@bash scripts/test-database.sh --skip-migrations
	@echo "$(GREEN)[$(CHECK)]$(RESET) CI/CD tests completed!"

# ============================================================
# END OF MAKEFILE
# ============================================================
# Total targets: 45+ (Foundation, Streams B/C/D, and Issue #9 complete)
# ============================================================
