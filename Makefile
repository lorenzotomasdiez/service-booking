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
COMPOSE_TEST := $(COMPOSE_BASE) -f docker/docker-compose.test.yml
COMPOSE_FULL := $(COMPOSE_MOCKS) -f docker/docker-compose.monitoring.yml

# Default goal
.DEFAULT_GOAL := help

# ============================================================
# .PHONY DECLARATIONS
# ============================================================
# All targets are .PHONY as they don't represent actual files
.PHONY: help version doctor
.PHONY: up down restart rebuild clean
.PHONY: dev full monitoring mocks test
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
	@docker info > /dev/null 2>&1 || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Docker is not running. Please start Docker Desktop." && exit 1)

check-ports:
	@! lsof -ti:5432 > /dev/null 2>&1 || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Port 5432 (PostgreSQL) is already in use." && \
	     echo "$(YELLOW)[$(INFO)]$(RESET) Run 'lsof -ti:5432 | xargs kill' to free the port or stop the conflicting service." && exit 1)
	@! lsof -ti:6379 > /dev/null 2>&1 || \
	    (echo "$(RED)[$(CROSS)]$(RESET) Port 6379 (Redis) is already in use." && \
	     echo "$(YELLOW)[$(INFO)]$(RESET) Run 'lsof -ti:6379 | xargs kill' to free the port or stop the conflicting service." && exit 1)

# ============================================================
# LIFECYCLE MANAGEMENT
# ============================================================
# Stream B will add code here:
# - make up
# - make down
# - make restart
# - make rebuild
# - make clean

##@ Lifecycle Management

# Placeholder - Stream B will implement
up: check-docker check-ports ## Start all services (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Lifecycle commands not yet implemented"
	@echo "$(CYAN)[$(INFO)]$(RESET) This command will start all services when Stream B completes"

down: ## Stop all services (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Lifecycle commands not yet implemented"

restart: ## Restart all services (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Lifecycle commands not yet implemented"

rebuild: ## Rebuild and restart all services (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Lifecycle commands not yet implemented"

clean: ## Remove all containers, volumes, networks (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Lifecycle commands not yet implemented"

# ============================================================
# ENVIRONMENT VARIANTS
# ============================================================
# Stream B will add code here:
# - make dev
# - make full
# - make monitoring
# - make mocks
# - make test

##@ Environment Variants

dev: ## Start development environment only (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Environment variant commands not yet implemented"

full: ## Start everything (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Environment variant commands not yet implemented"

monitoring: ## Start monitoring stack only (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Environment variant commands not yet implemented"

mocks: ## Start Argentina mocks only (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Environment variant commands not yet implemented"

test: ## Start test environment (Stream B will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream B: Environment variant commands not yet implemented"

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

db-migrate: ## Run Prisma migrations (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

db-seed: ## Seed database with test data (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

db-reset: ## Drop, migrate, seed (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

db-backup: ## Backup database to file (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

db-restore: ## Restore database from backup (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

db-shell: ## Open PostgreSQL shell (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Database commands not yet implemented"

# ============================================================
# DEVELOPMENT TOOLS
# ============================================================
# Stream C will add code here:
# - make shell-backend
# - make shell-frontend
# - make exec

##@ Development Tools

shell-backend: ## Open shell in backend container (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Development tool commands not yet implemented"

shell-frontend: ## Open shell in frontend container (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Development tool commands not yet implemented"

exec: ## Execute command in service container (Stream C will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream C: Development tool commands not yet implemented"
	@echo "$(CYAN)[$(INFO)]$(RESET) Usage will be: make exec SERVICE='backend' CMD='npm run test'"

# ============================================================
# MONITORING & DEBUGGING
# ============================================================
# Stream D will add code here:
# - make logs
# - make status
# - make ps
# - make stats
# - make health
# - make logs-backend
# - make logs-frontend

##@ Monitoring & Debugging

logs: ## Tail logs from all services (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

status: ## Show health status of all services (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

ps: ## List running containers (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

stats: ## Show resource usage (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

health: ## Run health checks on all services (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

logs-backend: ## Show backend logs (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

logs-frontend: ## Show frontend logs (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Monitoring commands not yet implemented"

# ============================================================
# MAINTENANCE
# ============================================================
# Stream D will add code here:
# - make reset
# - make prune
# - make update
# - make validate

##@ Maintenance

reset: ## Complete environment reset (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Maintenance commands not yet implemented"

prune: ## Remove unused Docker resources (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Maintenance commands not yet implemented"

update: ## Pull latest images and rebuild (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Maintenance commands not yet implemented"

validate: ## Validate all docker-compose files (Stream D will implement)
	@echo "$(YELLOW)[$(WARN)]$(RESET) Stream D: Maintenance commands not yet implemented"

# ============================================================
# END OF MAKEFILE
# ============================================================
# Total targets: 30+ (Foundation complete, Streams B/C/D pending)
# ============================================================
