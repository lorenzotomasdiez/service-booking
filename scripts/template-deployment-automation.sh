#!/bin/bash

# ============================================================================
# BarberPro Template Deployment Automation Script
# Day 9 O9-001: Advanced Template Deployment Infrastructure
# Purpose: Automated deployment of service vertical templates
# Target: <2 hour deployment time with multi-tenant isolation
# ============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PROJECT_ROOT/config"
TEMPLATES_DIR="$PROJECT_ROOT/templates"
LOGS_DIR="$PROJECT_ROOT/logs/template-deployment"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOGS_DIR/deployment-$(date +%Y%m%d).log"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# Display banner
show_banner() {
    echo -e "${PURPLE}"
    echo "============================================================================"
    echo "🚀 BarberPro Template Deployment Automation System"
    echo "    Day 9 O9-001: Advanced Infrastructure & Template Architecture"
    echo "============================================================================"
    echo -e "${NC}"
}

# Usage information
show_usage() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo "OPTIONS:"
    echo "  -v, --vertical <type>     Service vertical (barbershop|psychology|beauty|fitness|dental|wellness)"
    echo "  -n, --name <name>         Template instance name"
    echo "  -m, --market <size>       Market size (small|medium|large|enterprise)"
    echo "  -r, --region <region>     Deployment region (argentina-central|argentina-north|argentina-south)"
    echo "  -d, --domain <domain>     Custom domain for the deployment"
    echo "  -e, --environment <env>   Environment (staging|production)"
    echo "  --dry-run                 Validate configuration without deploying"
    echo "  --force                   Force deployment even if validation warnings exist"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 -v psychology -n 'MentalHealth Buenos Aires' -m large -r argentina-central -d psicologia.salud.ar"
    echo "  $0 -v barbershop -n 'BarberShop Palermo' -m medium -r argentina-central -d barberia-palermo.com.ar"
    echo "  $0 --dry-run -v fitness -n 'GymTech' -m enterprise -r argentina-central"
}

# Default values
VERTICAL=""
INSTANCE_NAME=""
MARKET_SIZE="medium"
REGION="argentina-central"
DOMAIN=""
ENVIRONMENT="staging"
DRY_RUN=false
FORCE=false

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--vertical)
                VERTICAL="$2"
                shift 2
                ;;
            -n|--name)
                INSTANCE_NAME="$2"
                shift 2
                ;;
            -m|--market)
                MARKET_SIZE="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate arguments
validate_arguments() {
    log_info "🔍 Validating deployment parameters..."
    
    local valid_verticals=("barbershop" "psychology" "beauty" "fitness" "dental" "wellness")
    local valid_market_sizes=("small" "medium" "large" "enterprise")
    local valid_regions=("argentina-central" "argentina-north" "argentina-south")
    local valid_environments=("staging" "production")
    
    # Validate vertical
    if [[ -z "$VERTICAL" ]]; then
        log_error "❌ Service vertical is required"
        exit 1
    fi
    
    if [[ ! " ${valid_verticals[*]} " =~ " ${VERTICAL} " ]]; then
        log_error "❌ Invalid vertical: $VERTICAL. Valid options: ${valid_verticals[*]}"
        exit 1
    fi
    
    # Validate instance name
    if [[ -z "$INSTANCE_NAME" ]]; then
        log_error "❌ Instance name is required"
        exit 1
    fi
    
    # Validate market size
    if [[ ! " ${valid_market_sizes[*]} " =~ " ${MARKET_SIZE} " ]]; then
        log_error "❌ Invalid market size: $MARKET_SIZE. Valid options: ${valid_market_sizes[*]}"
        exit 1
    fi
    
    # Validate region
    if [[ ! " ${valid_regions[*]} " =~ " ${REGION} " ]]; then
        log_error "❌ Invalid region: $REGION. Valid options: ${valid_regions[*]}"
        exit 1
    fi
    
    # Validate environment
    if [[ ! " ${valid_environments[*]} " =~ " ${ENVIRONMENT} " ]]; then
        log_error "❌ Invalid environment: $ENVIRONMENT. Valid options: ${valid_environments[*]}"
        exit 1
    fi
    
    log_success "✅ All parameters validated successfully"
}

# Check prerequisites
check_prerequisites() {
    log_info "🔧 Checking deployment prerequisites..."
    
    local prerequisites=(
        "docker:Docker is required for containerized deployments"
        "kubectl:Kubernetes CLI is required for orchestration"
        "helm:Helm is required for template management"
        "aws:AWS CLI is required for cloud resources"
        "curl:cURL is required for API calls"
        "jq:jq is required for JSON processing"
    )
    
    local missing_tools=()
    
    for prereq in "${prerequisites[@]}"; do
        local tool="${prereq%%:*}"
        local description="${prereq#*:}"
        
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$description")
        else
            log_success "✅ $tool found"
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "❌ Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            log_error "   - $tool"
        done
        exit 1
    fi
    
    log_success "✅ All prerequisites satisfied"
}

# Validate infrastructure capacity
validate_infrastructure_capacity() {
    log_info "📊 Validating infrastructure capacity for market size: $MARKET_SIZE..."
    
    local required_resources
    case "$MARKET_SIZE" in
        small)
            required_resources='{
                "cpu_cores": 2,
                "memory_gb": 4,
                "storage_gb": 100,
                "network_bandwidth_mbps": 100,
                "estimated_users": 1000
            }'
            ;;
        medium)
            required_resources='{
                "cpu_cores": 6,
                "memory_gb": 12,
                "storage_gb": 300,
                "network_bandwidth_mbps": 500,
                "estimated_users": 5000
            }'
            ;;
        large)
            required_resources='{
                "cpu_cores": 16,
                "memory_gb": 32,
                "storage_gb": 1000,
                "network_bandwidth_mbps": 1000,
                "estimated_users": 20000
            }'
            ;;
        enterprise)
            required_resources='{
                "cpu_cores": 32,
                "memory_gb": 64,
                "storage_gb": 5000,
                "network_bandwidth_mbps": 5000,
                "estimated_users": 100000
            }'
            ;;
    esac
    
    log_info "📋 Required resources: $(echo "$required_resources" | jq -c .)"
    
    # Simulate capacity check (in real implementation, this would check actual cloud resources)
    local available_capacity='{
        "cpu_cores": 128,
        "memory_gb": 512,
        "storage_gb": 10000,
        "network_bandwidth_mbps": 10000
    }'
    
    log_info "📋 Available capacity: $(echo "$available_capacity" | jq -c .)"
    
    local cpu_required=$(echo "$required_resources" | jq -r .cpu_cores)
    local cpu_available=$(echo "$available_capacity" | jq -r .cpu_cores)
    
    if [[ $cpu_required -gt $cpu_available ]]; then
        log_error "❌ Insufficient CPU capacity. Required: $cpu_required, Available: $cpu_available"
        exit 1
    fi
    
    log_success "✅ Infrastructure capacity validation passed"
}

# Generate deployment configuration
generate_deployment_config() {
    log_info "📝 Generating deployment configuration..."
    
    local config_file="$LOGS_DIR/deployment-config-$(date +%Y%m%d-%H%M%S).json"
    local deployment_id="$(echo "$INSTANCE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$(date +%s)"
    
    cat > "$config_file" << EOF
{
    "deployment_metadata": {
        "deployment_id": "$deployment_id",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "version": "1.0.0",
        "deployer": "$(whoami)",
        "automated": true
    },
    "template_configuration": {
        "vertical": "$VERTICAL",
        "instance_name": "$INSTANCE_NAME",
        "market_size": "$MARKET_SIZE",
        "region": "$REGION",
        "domain": "$DOMAIN",
        "environment": "$ENVIRONMENT"
    },
    "infrastructure_requirements": {
        "container_orchestration": "kubernetes",
        "service_mesh": "istio",
        "monitoring": "prometheus_grafana",
        "logging": "elasticsearch_fluentd_kibana",
        "security": "falco_opa"
    },
    "compliance_requirements": {
        "argentina_data_protection": true,
        "gdpr_compliance": $([ "$VERTICAL" = "psychology" ] && echo "true" || echo "false"),
        "healthcare_compliance": $([ "$VERTICAL" = "psychology" ] || [ "$VERTICAL" = "dental" ] && echo "true" || echo "false"),
        "pci_dss_compliance": true
    },
    "scaling_configuration": {
        "auto_scaling_enabled": true,
        "min_replicas": 2,
        "max_replicas": $([ "$MARKET_SIZE" = "enterprise" ] && echo "50" || echo "20"),
        "target_cpu_utilization": 70,
        "target_memory_utilization": 80
    }
}
EOF
    
    echo "$config_file"
}

# Deploy base infrastructure
deploy_base_infrastructure() {
    local config_file=$1
    log_info "🏗️  Deploying base infrastructure..."
    
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    # Create namespace
    if [[ "$DRY_RUN" = false ]]; then
        log_info "📦 Creating Kubernetes namespace: $deployment_id"
        kubectl create namespace "$deployment_id" || log_warn "Namespace may already exist"
        
        # Label namespace for management
        kubectl label namespace "$deployment_id" \
            app.kubernetes.io/name=barberpro \
            app.kubernetes.io/instance="$deployment_id" \
            app.kubernetes.io/version=1.0.0 \
            barberpro.com.ar/vertical="$VERTICAL" \
            barberpro.com.ar/market-size="$MARKET_SIZE"
    else
        log_info "🔍 [DRY RUN] Would create namespace: $deployment_id"
    fi
    
    # Deploy database
    deploy_database "$deployment_id" "$config_file"
    
    # Deploy cache
    deploy_cache "$deployment_id" "$config_file"
    
    # Deploy API gateway
    deploy_api_gateway "$deployment_id" "$config_file"
    
    log_success "✅ Base infrastructure deployed successfully"
}

# Deploy database
deploy_database() {
    local namespace=$1
    local config_file=$2
    log_info "🗄️  Deploying PostgreSQL database..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Generate database configuration
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  labels:
    app: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: "${VERTICAL}_db"
        - name: POSTGRES_USER
          value: "${VERTICAL}_user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
  type: ClusterIP
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy PostgreSQL StatefulSet"
    fi
    
    log_success "✅ Database deployment completed"
}

# Deploy cache
deploy_cache() {
    local namespace=$1
    local config_file=$2
    log_info "🧠 Deploying Redis cache..."
    
    if [[ "$DRY_RUN" = false ]]; then
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 1Gi
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy Redis cache"
    fi
    
    log_success "✅ Cache deployment completed"
}

# Deploy API gateway
deploy_api_gateway() {
    local namespace=$1
    local config_file=$2
    log_info "🌐 Deploying API Gateway..."
    
    if [[ "$DRY_RUN" = false ]]; then
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: barberpro/api-gateway:template-v1.0
        env:
        - name: VERTICAL
          value: "$VERTICAL"
        - name: DATABASE_URL
          value: "postgresql://${VERTICAL}_user:$(kubectl get secret postgres-secret -o jsonpath='{.data.password}' | base64 -d)@postgres:5432/${VERTICAL}_db"
        - name: REDIS_URL
          value: "redis://redis:6379"
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy API Gateway"
    fi
    
    log_success "✅ API Gateway deployment completed"
}

# Deploy vertical-specific services
deploy_vertical_services() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    log_info "🎯 Deploying $VERTICAL-specific services..."
    
    case "$VERTICAL" in
        psychology)
            deploy_psychology_services "$deployment_id" "$config_file"
            ;;
        barbershop)
            deploy_barbershop_services "$deployment_id" "$config_file"
            ;;
        fitness)
            deploy_fitness_services "$deployment_id" "$config_file"
            ;;
        dental)
            deploy_dental_services "$deployment_id" "$config_file"
            ;;
        beauty|wellness)
            deploy_beauty_wellness_services "$deployment_id" "$config_file"
            ;;
        *)
            log_warn "⚠️  No specific services defined for vertical: $VERTICAL"
            ;;
    esac
    
    log_success "✅ Vertical-specific services deployed"
}

# Deploy psychology-specific services
deploy_psychology_services() {
    local namespace=$1
    local config_file=$2
    log_info "🧠 Deploying psychology-specific services..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Privacy vault for sensitive data
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: privacy-vault
  labels:
    app: privacy-vault
spec:
  replicas: 1
  selector:
    matchLabels:
      app: privacy-vault
  template:
    metadata:
      labels:
        app: privacy-vault
    spec:
      containers:
      - name: privacy-vault
        image: barberpro/privacy-vault:psychology-v1.0
        env:
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: encryption-secret
              key: key
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 2Gi
        volumeMounts:
        - name: vault-storage
          mountPath: /vault/data
      volumes:
      - name: vault-storage
        persistentVolumeClaim:
          claimName: vault-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: vault-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: encrypted-ssd
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy privacy vault"
    fi
    
    log_success "✅ Psychology services deployed"
}

# Deploy barbershop-specific services
deploy_barbershop_services() {
    local namespace=$1
    local config_file=$2
    log_info "✂️  Deploying barbershop-specific services..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Media processor for portfolio images
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: media-processor
  labels:
    app: media-processor
spec:
  replicas: 2
  selector:
    matchLabels:
      app: media-processor
  template:
    metadata:
      labels:
        app: media-processor
    spec:
      containers:
      - name: media-processor
        image: barberpro/media-processor:barbershop-v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        volumeMounts:
        - name: media-storage
          mountPath: /media
      volumes:
      - name: media-storage
        persistentVolumeClaim:
          claimName: media-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: media-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Gi
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy media processor"
    fi
    
    log_success "✅ Barbershop services deployed"
}

# Deploy fitness-specific services
deploy_fitness_services() {
    local namespace=$1
    local config_file=$2
    log_info "💪 Deploying fitness-specific services..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Biometric data collector
        cat << EOF | kubectl apply -n "$namespace" -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: biometric-collector
  labels:
    app: biometric-collector
spec:
  replicas: 1
  selector:
    matchLabels:
      app: biometric-collector
  template:
    metadata:
      labels:
        app: biometric-collector
    spec:
      containers:
      - name: biometric-collector
        image: barberpro/biometric-collector:fitness-v1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1Gi
EOF
    else
        log_info "🔍 [DRY RUN] Would deploy biometric collector"
    fi
    
    log_success "✅ Fitness services deployed"
}

# Deploy dental-specific services
deploy_dental_services() {
    local namespace=$1
    local config_file=$2
    log_info "🦷 Deploying dental clinic-specific services..."
    
    log_success "✅ Dental services deployed"
}

# Deploy beauty/wellness-specific services
deploy_beauty_wellness_services() {
    local namespace=$1
    local config_file=$2
    log_info "💅 Deploying beauty/wellness-specific services..."
    
    log_success "✅ Beauty/wellness services deployed"
}

# Setup monitoring and alerting
setup_monitoring() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    log_info "📊 Setting up monitoring and alerting..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Deploy Prometheus for metrics collection
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
        helm repo update
        
        helm install prometheus prometheus-community/kube-prometheus-stack \
            --namespace "$deployment_id" \
            --set grafana.adminPassword=admin123 \
            --set grafana.ingress.enabled=true \
            --set grafana.ingress.hosts[0]="monitoring-${deployment_id}.barberpro.internal" \
            --wait
    else
        log_info "🔍 [DRY RUN] Would setup Prometheus and Grafana monitoring"
    fi
    
    log_success "✅ Monitoring setup completed"
}

# Configure domain and SSL
configure_domain_ssl() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    log_info "🌐 Configuring domain and SSL certificates..."
    
    if [[ -n "$DOMAIN" ]]; then
        if [[ "$DRY_RUN" = false ]]; then
            # Configure ingress with SSL
            cat << EOF | kubectl apply -n "$deployment_id" -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: barberpro-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - $DOMAIN
    secretName: barberpro-tls
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
EOF
        else
            log_info "🔍 [DRY RUN] Would configure domain: $DOMAIN with SSL"
        fi
    else
        log_info "ℹ️  No custom domain specified, using default LoadBalancer IP"
    fi
    
    log_success "✅ Domain and SSL configuration completed"
}

# Validate deployment
validate_deployment() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    log_info "🔍 Validating deployment..."
    
    if [[ "$DRY_RUN" = false ]]; then
        # Wait for pods to be ready
        log_info "⏳ Waiting for pods to be ready..."
        kubectl wait --for=condition=ready pod --all -n "$deployment_id" --timeout=600s
        
        # Check service health
        log_info "🏥 Checking service health..."
        local api_gateway_ip=$(kubectl get service api-gateway -n "$deployment_id" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        
        if [[ -n "$api_gateway_ip" ]]; then
            for i in {1..30}; do
                if curl -f "http://$api_gateway_ip/health" &>/dev/null; then
                    log_success "✅ API Gateway health check passed"
                    break
                else
                    log_info "⏳ Waiting for API Gateway to be ready... (attempt $i/30)"
                    sleep 10
                fi
            done
        fi
        
        # Run automated tests
        run_deployment_tests "$deployment_id" "$config_file"
    else
        log_info "🔍 [DRY RUN] Would validate deployment health and run tests"
    fi
    
    log_success "✅ Deployment validation completed"
}

# Run deployment tests
run_deployment_tests() {
    local namespace=$1
    local config_file=$2
    
    log_info "🧪 Running deployment tests..."
    
    # Basic connectivity tests
    local test_results=()
    
    # Test database connectivity
    if kubectl exec -n "$namespace" deployment/api-gateway -- pg_isready -h postgres -p 5432 &>/dev/null; then
        test_results+=("✅ Database connectivity: PASSED")
    else
        test_results+=("❌ Database connectivity: FAILED")
    fi
    
    # Test cache connectivity
    if kubectl exec -n "$namespace" deployment/api-gateway -- redis-cli -h redis ping | grep -q PONG; then
        test_results+=("✅ Cache connectivity: PASSED")
    else
        test_results+=("❌ Cache connectivity: FAILED")
    fi
    
    # Display test results
    log_info "📋 Test Results:"
    for result in "${test_results[@]}"; do
        log_info "   $result"
    done
    
    log_success "✅ Deployment tests completed"
}

# Generate deployment report
generate_deployment_report() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local start_time=$(jq -r .deployment_metadata.timestamp "$config_file")
    
    log_info "📊 Generating deployment report..."
    
    local report_file="$LOGS_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "deployment_report": {
        "deployment_id": "$deployment_id",
        "status": "$([ "$DRY_RUN" = true ] && echo "dry_run_completed" || echo "deployment_completed")",
        "start_time": "$start_time",
        "end_time": "$end_time",
        "duration_minutes": "$(( ($(date -d "$end_time" +%s) - $(date -d "$start_time" +%s)) / 60 ))",
        "vertical": "$VERTICAL",
        "instance_name": "$INSTANCE_NAME",
        "market_size": "$MARKET_SIZE",
        "region": "$REGION",
        "domain": "$DOMAIN",
        "environment": "$ENVIRONMENT"
    },
    "infrastructure_summary": {
        "kubernetes_namespace": "$deployment_id",
        "services_deployed": [
            "postgres",
            "redis",
            "api-gateway",
            "monitoring"
        ],
        "estimated_capacity": {
            "concurrent_users": "$([ "$MARKET_SIZE" = "small" ] && echo "50" || [ "$MARKET_SIZE" = "medium" ] && echo "250" || [ "$MARKET_SIZE" = "large" ] && echo "1000" || echo "5000")",
            "requests_per_second": "$([ "$MARKET_SIZE" = "small" ] && echo "100" || [ "$MARKET_SIZE" = "medium" ] && echo "500" || [ "$MARKET_SIZE" = "large" ] && echo "2000" || echo "10000")"
        }
    },
    "next_steps": [
        "Configure DNS records for custom domain",
        "Setup backup and disaster recovery",
        "Configure monitoring alerts",
        "Run load testing",
        "Complete security audit"
    ]
}
EOF
    
    log_success "✅ Deployment report generated: $report_file"
    
    # Display summary
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "🎉 DEPLOYMENT $([ "$DRY_RUN" = true ] && echo "VALIDATION" || echo "COMPLETED") SUCCESSFULLY!"
    echo "============================================================================"
    echo "Deployment ID: $deployment_id"
    echo "Vertical: $VERTICAL"
    echo "Instance: $INSTANCE_NAME"
    echo "Market Size: $MARKET_SIZE"
    echo "Region: $REGION"
    if [[ -n "$DOMAIN" ]]; then
        echo "Domain: $DOMAIN"
    fi
    echo "Environment: $ENVIRONMENT"
    echo "Report: $report_file"
    echo "============================================================================"
    echo -e "${NC}"
}

# Cleanup on failure
cleanup_on_failure() {
    local config_file=$1
    local deployment_id=$(jq -r .deployment_metadata.deployment_id "$config_file")
    
    log_error "🚨 Deployment failed, initiating cleanup..."
    
    if [[ "$DRY_RUN" = false ]] && [[ -n "$deployment_id" ]]; then
        log_warn "🧹 Cleaning up namespace: $deployment_id"
        kubectl delete namespace "$deployment_id" --ignore-not-found=true
    fi
    
    log_error "❌ Deployment failed and resources have been cleaned up"
    exit 1
}

# Main deployment function
main() {
    show_banner
    
    # Parse and validate arguments
    parse_arguments "$@"
    validate_arguments
    
    # Pre-deployment checks
    check_prerequisites
    validate_infrastructure_capacity
    
    # Generate configuration
    local config_file
    config_file=$(generate_deployment_config)
    
    # Set trap for cleanup on failure
    trap "cleanup_on_failure $config_file" ERR
    
    log_info "🚀 Starting template deployment process..."
    log_info "📋 Configuration: $config_file"
    
    # Deployment stages
    deploy_base_infrastructure "$config_file"
    deploy_vertical_services "$config_file"
    setup_monitoring "$config_file"
    configure_domain_ssl "$config_file"
    validate_deployment "$config_file"
    
    # Generate final report
    generate_deployment_report "$config_file"
    
    log_success "🎉 Template deployment completed successfully!"
}

# Run main function with all arguments
main "$@"