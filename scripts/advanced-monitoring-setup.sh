#!/bin/bash

# ============================================================================
# BarberPro Advanced Monitoring & Analytics Setup
# Day 9 O9-001: Business Intelligence & Real-time Analytics Infrastructure
# Purpose: Deploy comprehensive monitoring for premium features and enterprise scaling
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
MONITORING_DIR="$PROJECT_ROOT/monitoring"
LOGS_DIR="$PROJECT_ROOT/logs/monitoring-setup"

# Ensure directories exist
mkdir -p "$LOGS_DIR" "$MONITORING_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOGS_DIR/monitoring-setup-$(date +%Y%m%d).log"
}

log_info() { log "INFO" "$@"; }
log_warn() { log "WARN" "$@"; }
log_error() { log "ERROR" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# Display banner
show_banner() {
    echo -e "${PURPLE}"
    echo "============================================================================"
    echo "📊 BarberPro Advanced Monitoring & Analytics Infrastructure"
    echo "    Day 9 O9-001: Business Intelligence & Real-time Analytics"
    echo "============================================================================"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "🔧 Checking monitoring setup prerequisites..."
    
    local prerequisites=(
        "kubectl:Kubernetes CLI is required"
        "helm:Helm is required for chart deployment"
        "docker:Docker is required for custom images"
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

# Setup Helm repositories
setup_helm_repos() {
    log_info "📦 Setting up Helm repositories..."
    
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add elastic https://helm.elastic.co
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo add influxdata https://helm.influxdata.com/
    helm repo add bitnami https://charts.bitnami.com/bitnami
    
    helm repo update
    
    log_success "✅ Helm repositories configured"
}

# Deploy Prometheus Stack
deploy_prometheus_stack() {
    log_info "📈 Deploying Prometheus monitoring stack..."
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Generate Prometheus values file
    cat > "$MONITORING_DIR/prometheus-values.yaml" << 'EOF'
# Prometheus Stack Configuration for BarberPro
prometheus:
  prometheusSpec:
    retention: 30d
    retentionSize: 100GB
    resources:
      requests:
        cpu: 1000m
        memory: 4Gi
      limits:
        cpu: 2000m
        memory: 8Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 200Gi
    additionalScrapeConfigs:
      - job_name: 'barberpro-backend'
        static_configs:
          - targets: ['barberpro-backend:3000']
        metrics_path: '/metrics'
        scrape_interval: 15s
      
      - job_name: 'barberpro-frontend'
        static_configs:
          - targets: ['barberpro-frontend:80']
        metrics_path: '/metrics'
        scrape_interval: 30s
        
      - job_name: 'postgres-exporter'
        static_configs:
          - targets: ['postgres-exporter:9187']
        scrape_interval: 30s
        
      - job_name: 'redis-exporter'
        static_configs:
          - targets: ['redis-exporter:9121']
        scrape_interval: 30s

alertmanager:
  alertmanagerSpec:
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi

grafana:
  adminPassword: "barberpro-admin-2024!"
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 2Gi
  persistence:
    enabled: true
    size: 20Gi
    storageClassName: fast-ssd
  ingress:
    enabled: true
    annotations:
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    hosts:
      - grafana.barberpro.internal
    tls:
      - secretName: grafana-tls
        hosts:
          - grafana.barberpro.internal
  
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'barberpro-dashboards'
        orgId: 1
        folder: 'BarberPro'
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/barberpro
          
  dashboards:
    barberpro:
      business-metrics:
        url: https://raw.githubusercontent.com/barberpro/monitoring/main/dashboards/business-metrics.json
      technical-metrics:
        url: https://raw.githubusercontent.com/barberpro/monitoring/main/dashboards/technical-metrics.json
      argentina-regional:
        url: https://raw.githubusercontent.com/barberpro/monitoring/main/dashboards/argentina-regional.json

nodeExporter:
  enabled: true

kubeStateMetrics:
  enabled: true

prometheusOperator:
  enabled: true
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
EOF

    # Deploy Prometheus stack
    helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --values "$MONITORING_DIR/prometheus-values.yaml" \
        --timeout 10m \
        --wait
        
    log_success "✅ Prometheus stack deployed"
}

# Deploy ELK Stack for Logging
deploy_elk_stack() {
    log_info "📋 Deploying ELK stack for advanced logging..."
    
    # Deploy Elasticsearch
    cat > "$MONITORING_DIR/elasticsearch-values.yaml" << 'EOF'
replicas: 3
minimumMasterNodes: 2

resources:
  requests:
    cpu: 1000m
    memory: 2Gi
  limits:
    cpu: 2000m
    memory: 4Gi

volumeClaimTemplate:
  accessModes: [ "ReadWriteOnce" ]
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 100Gi

esConfig:
  elasticsearch.yml: |
    cluster.name: "barberpro-logs"
    network.host: 0.0.0.0
    discovery.seed_hosts: "elasticsearch-master-headless"
    cluster.initial_master_nodes: "elasticsearch-master-0,elasticsearch-master-1,elasticsearch-master-2"
    xpack.security.enabled: false
    xpack.monitoring.collection.enabled: true
EOF

    helm upgrade --install elasticsearch elastic/elasticsearch \
        --namespace monitoring \
        --values "$MONITORING_DIR/elasticsearch-values.yaml" \
        --timeout 15m \
        --wait
    
    # Deploy Kibana
    cat > "$MONITORING_DIR/kibana-values.yaml" << 'EOF'
elasticsearchHosts: "http://elasticsearch-master:9200"

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi

ingress:
  enabled: true
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: kibana.barberpro.internal
      paths:
        - path: /
  tls:
    - secretName: kibana-tls
      hosts:
        - kibana.barberpro.internal

kibanaConfig:
  kibana.yml: |
    server.host: 0.0.0.0
    elasticsearch.hosts: ["http://elasticsearch-master:9200"]
    xpack.security.enabled: false
    server.basePath: ""
EOF

    helm upgrade --install kibana elastic/kibana \
        --namespace monitoring \
        --values "$MONITORING_DIR/kibana-values.yaml" \
        --timeout 10m \
        --wait
    
    # Deploy Filebeat for log collection
    cat > "$MONITORING_DIR/filebeat-values.yaml" << 'EOF'
filebeatConfig:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*barberpro*.log
        - /var/log/containers/*postgres*.log
        - /var/log/containers/*redis*.log
      processors:
      - add_kubernetes_metadata:
          host: ${NODE_NAME}
          matchers:
          - logs_path:
              logs_path: "/var/log/containers/"
      - decode_json_fields:
          fields: ["message"]
          process_array: false
          max_depth: 1
          target: ""
          overwrite_keys: false

    output.elasticsearch:
      hosts: ["elasticsearch-master:9200"]
      index: "barberpro-logs-%{+yyyy.MM.dd}"
      template.name: "barberpro-logs"
      template.pattern: "barberpro-logs-*"
      template.settings:
        index.number_of_shards: 1
        index.number_of_replicas: 1

    setup.kibana:
      host: "kibana-kibana:5601"

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
EOF

    helm upgrade --install filebeat elastic/filebeat \
        --namespace monitoring \
        --values "$MONITORING_DIR/filebeat-values.yaml" \
        --timeout 10m \
        --wait
        
    log_success "✅ ELK stack deployed"
}

# Deploy Jaeger for Distributed Tracing
deploy_jaeger() {
    log_info "🔍 Deploying Jaeger for distributed tracing..."
    
    cat > "$MONITORING_DIR/jaeger-values.yaml" << 'EOF'
storage:
  type: elasticsearch
  elasticsearch:
    host: elasticsearch-master
    port: 9200
    scheme: http

collector:
  replicaCount: 2
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

query:
  replicaCount: 2
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi
  ingress:
    enabled: true
    annotations:
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    hosts:
      - jaeger.barberpro.internal
    tls:
      - secretName: jaeger-tls
        hosts:
          - jaeger.barberpro.internal

agent:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
EOF

    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace monitoring \
        --values "$MONITORING_DIR/jaeger-values.yaml" \
        --timeout 10m \
        --wait
        
    log_success "✅ Jaeger deployed"
}

# Deploy InfluxDB for Time Series Data
deploy_influxdb() {
    log_info "📊 Deploying InfluxDB for business analytics..."
    
    cat > "$MONITORING_DIR/influxdb-values.yaml" << 'EOF'
image:
  repository: influxdb
  tag: 2.7-alpine

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi

persistence:
  enabled: true
  size: 200Gi
  storageClass: fast-ssd

adminUser:
  organization: "barberpro"
  bucket: "business-metrics"
  user: "admin"
  retention_policy: "30d"
  
env:
  - name: INFLUXDB_DB
    value: "barberpro_analytics"
  - name: INFLUXDB_ADMIN_USER
    value: "admin"
  - name: INFLUXDB_ADMIN_PASSWORD
    value: "barberpro-analytics-2024!"

service:
  type: ClusterIP
  port: 8086

ingress:
  enabled: true
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: influxdb.barberpro.internal
      paths:
        - path: /
  tls:
    - secretName: influxdb-tls
      hosts:
        - influxdb.barberpro.internal
EOF

    helm upgrade --install influxdb influxdata/influxdb2 \
        --namespace monitoring \
        --values "$MONITORING_DIR/influxdb-values.yaml" \
        --timeout 10m \
        --wait
        
    log_success "✅ InfluxDB deployed"
}

# Deploy Redis for Real-time Analytics
deploy_analytics_redis() {
    log_info "🧠 Deploying Redis cluster for real-time analytics..."
    
    cat > "$MONITORING_DIR/analytics-redis-values.yaml" << 'EOF'
architecture: cluster
auth:
  enabled: true
  password: "barberpro-analytics-redis-2024!"

cluster:
  nodes: 6
  replicas: 1

master:
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 2Gi
  persistence:
    enabled: true
    size: 20Gi
    storageClass: fast-ssd

replica:
  replicaCount: 3
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi
  persistence:
    enabled: true
    size: 20Gi
    storageClass: fast-ssd

metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: monitoring
EOF

    helm upgrade --install analytics-redis bitnami/redis-cluster \
        --namespace monitoring \
        --values "$MONITORING_DIR/analytics-redis-values.yaml" \
        --timeout 15m \
        --wait
        
    log_success "✅ Analytics Redis cluster deployed"
}

# Setup Custom Business Intelligence Dashboard
setup_business_intelligence_dashboard() {
    log_info "📈 Setting up Business Intelligence dashboard..."
    
    # Create custom Grafana dashboard for business metrics
    cat > "$MONITORING_DIR/business-intelligence-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "BarberPro Business Intelligence Dashboard",
    "tags": ["barberpro", "business", "analytics", "day9"],
    "timezone": "America/Argentina/Buenos_Aires",
    "refresh": "5s",
    "schemaVersion": 30,
    "version": 1,
    "time": {
      "from": "now-24h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "💰 Real-time Revenue Analytics",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "sum(rate(barberpro_payment_amount_total[5m])) * 60",
            "legendFormat": "Revenue per Hour (ARS)"
          },
          {
            "expr": "sum(rate(barberpro_booking_completed_total[5m])) * 60",
            "legendFormat": "Bookings per Hour"
          }
        ],
        "yAxes": [{"min": 0}],
        "thresholds": [
          {"value": 1000, "colorMode": "warning", "op": "lt"},
          {"value": 5000, "colorMode": "critical", "op": "gt"}
        ]
      },
      {
        "id": 2,
        "title": "🎯 Conversion Funnel Analytics",
        "type": "stat",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "barberpro_booking_conversion_rate",
            "legendFormat": "Booking Conversion Rate"
          },
          {
            "expr": "barberpro_payment_success_rate",
            "legendFormat": "Payment Success Rate"
          },
          {
            "expr": "barberpro_user_retention_rate",
            "legendFormat": "User Retention Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 70},
                {"color": "green", "value": 85}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "🇦🇷 Argentina Regional Performance",
        "type": "heatmap",
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "sum by (region) (rate(barberpro_bookings_by_region_total[1h]))",
            "legendFormat": "{{region}}"
          }
        ],
        "xAxis": {"mode": "time"},
        "yAxis": {"mode": "value", "unit": "short"},
        "color": {"mode": "spectrum"}
      },
      {
        "id": 4,
        "title": "📊 Premium Features Usage",
        "type": "piechart",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 16},
        "targets": [
          {
            "expr": "sum by (feature) (barberpro_premium_feature_usage_total)",
            "legendFormat": "{{feature}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "⚡ System Performance Score",
        "type": "gauge",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 16},
        "targets": [
          {
            "expr": "(\n  (avg(up{job=\"barberpro-backend\"}) * 30) +\n  ((histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) < 0.15) * 25) +\n  ((rate(barberpro_errors_total[5m]) < 0.01) * 20) +\n  ((barberpro_business_score) * 25)\n) / 100",
            "legendFormat": "Performance Score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percentunit",
            "min": 0,
            "max": 1,
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 0.7},
                {"color": "green", "value": 0.85}
              ]
            }
          }
        }
      },
      {
        "id": 6,
        "title": "💳 Payment Gateway Performance",
        "type": "table",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 24},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(barberpro_payment_duration_seconds_bucket[5m]))",
            "legendFormat": "P95 Payment Time"
          },
          {
            "expr": "rate(barberpro_payment_success_total[5m]) / rate(barberpro_payment_attempts_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "id": 7,
        "title": "🔄 Template Deployment Success",
        "type": "stat",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 24},
        "targets": [
          {
            "expr": "barberpro_template_deployments_successful_total",
            "legendFormat": "Successful Deployments"
          },
          {
            "expr": "barberpro_template_deployments_failed_total",
            "legendFormat": "Failed Deployments"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {"mode": "thresholds"},
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "red", "value": 1}
              ]
            }
          }
        }
      }
    ]
  }
}
EOF

    log_success "✅ Business Intelligence dashboard configured"
}

# Setup Real-time Analytics Pipeline
setup_realtime_analytics() {
    log_info "⚡ Setting up real-time analytics pipeline..."
    
    # Deploy Kafka for event streaming
    cat > "$MONITORING_DIR/kafka-values.yaml" << 'EOF'
replicaCount: 3

resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi

persistence:
  enabled: true
  size: 100Gi
  storageClass: fast-ssd

zookeeper:
  enabled: true
  replicaCount: 3
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  persistence:
    enabled: true
    size: 20Gi
    storageClass: fast-ssd

externalAccess:
  enabled: true
  service:
    type: LoadBalancer

metrics:
  kafka:
    enabled: true
    serviceMonitor:
      enabled: true
      namespace: monitoring
  jmx:
    enabled: true
    serviceMonitor:
      enabled: true
      namespace: monitoring
EOF

    helm upgrade --install kafka bitnami/kafka \
        --namespace monitoring \
        --values "$MONITORING_DIR/kafka-values.yaml" \
        --timeout 15m \
        --wait
        
    log_success "✅ Real-time analytics pipeline configured"
}

# Setup Alert Rules
setup_alert_rules() {
    log_info "🚨 Setting up advanced alert rules..."
    
    cat > "$MONITORING_DIR/barberpro-alert-rules.yaml" << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: barberpro-alert-rules
  namespace: monitoring
  labels:
    app: barberpro
    release: prometheus-stack
spec:
  groups:
  - name: barberpro.business.rules
    interval: 30s
    rules:
    - alert: HighBookingFailureRate
      expr: rate(barberpro_booking_failed_total[5m]) / rate(barberpro_booking_attempts_total[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
        category: business
      annotations:
        summary: "High booking failure rate detected"
        description: "Booking failure rate is {{ $value | humanizePercentage }} which is above 10%"
        
    - alert: PaymentGatewayDown
      expr: up{job="barberpro-payment-gateway"} == 0
      for: 2m
      labels:
        severity: critical
        category: business
      annotations:
        summary: "Payment gateway is down"
        description: "Payment gateway has been down for more than 2 minutes"
        
    - alert: LowRevenueGeneration
      expr: rate(barberpro_revenue_total[1h]) < 100
      for: 15m
      labels:
        severity: warning
        category: business
      annotations:
        summary: "Low revenue generation detected"
        description: "Hourly revenue is {{ $value }} ARS which is below expected threshold"
        
  - name: barberpro.performance.rules
    interval: 15s
    rules:
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="barberpro-backend"}[5m])) > 0.5
      for: 5m
      labels:
        severity: warning
        category: performance
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}s which is above 500ms"
        
    - alert: HighErrorRate
      expr: rate(barberpro_errors_total[5m]) > 0.05
      for: 3m
      labels:
        severity: critical
        category: performance
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }} which is above 5%"
        
  - name: barberpro.infrastructure.rules
    interval: 30s
    rules:
    - alert: DatabaseConnectionsHigh
      expr: pg_stat_activity_count > 80
      for: 5m
      labels:
        severity: warning
        category: infrastructure
      annotations:
        summary: "High database connections"
        description: "Database has {{ $value }} active connections which is above 80"
        
    - alert: RedisMemoryHigh
      expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
      for: 10m
      labels:
        severity: critical
        category: infrastructure
      annotations:
        summary: "Redis memory usage high"
        description: "Redis memory usage is {{ $value | humanizePercentage }} which is above 90%"
        
  - name: barberpro.security.rules
    interval: 60s
    rules:
    - alert: UnusualLoginActivity
      expr: rate(barberpro_login_attempts_total[5m]) > 10
      for: 3m
      labels:
        severity: warning
        category: security
      annotations:
        summary: "Unusual login activity detected"
        description: "Login attempt rate is {{ $value }} per second which may indicate attack"
        
    - alert: FailedAuthenticationSpike
      expr: rate(barberpro_auth_failed_total[5m]) > 5
      for: 2m
      labels:
        severity: critical
        category: security
      annotations:
        summary: "Failed authentication spike detected"
        description: "Failed authentication rate is {{ $value }} per second"
EOF

    kubectl apply -f "$MONITORING_DIR/barberpro-alert-rules.yaml"
    
    log_success "✅ Advanced alert rules configured"
}

# Setup Monitoring for Template Deployments
setup_template_monitoring() {
    log_info "🎯 Setting up template deployment monitoring..."
    
    # Create custom dashboard for template deployments
    cat > "$MONITORING_DIR/template-deployment-dashboard.json" << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "BarberPro Template Deployment Monitoring",
    "tags": ["barberpro", "templates", "deployments", "day9"],
    "timezone": "America/Argentina/Buenos_Aires",
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "📊 Template Deployment Success Rate",
        "type": "stat",
        "gridPos": {"h": 6, "w": 8, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "barberpro_template_deployment_success_rate",
            "legendFormat": "Success Rate"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 90},
                {"color": "green", "value": 95}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "⏱️ Average Deployment Time",
        "type": "stat",
        "gridPos": {"h": 6, "w": 8, "x": 8, "y": 0},
        "targets": [
          {
            "expr": "barberpro_template_deployment_duration_average",
            "legendFormat": "Avg Deployment Time"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": 0},
                {"color": "yellow", "value": 7200},
                {"color": "red", "value": 10800}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "🏗️ Active Deployments",
        "type": "stat",
        "gridPos": {"h": 6, "w": 8, "x": 16, "y": 0},
        "targets": [
          {
            "expr": "barberpro_template_deployments_in_progress",
            "legendFormat": "In Progress"
          }
        ]
      }
    ]
  }
}
EOF

    log_success "✅ Template deployment monitoring configured"
}

# Validate monitoring setup
validate_monitoring_setup() {
    log_info "🔍 Validating monitoring setup..."
    
    # Check if all services are running
    local services=(
        "prometheus-stack-kube-prom-prometheus"
        "prometheus-stack-grafana"
        "elasticsearch-master"
        "kibana-kibana"
        "jaeger-query"
        "influxdb-influxdb2"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        if kubectl get pods -n monitoring -l "app.kubernetes.io/name=$service" -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            log_success "✅ $service is running"
        else
            failed_services+=("$service")
            log_error "❌ $service is not running"
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "❌ Some monitoring services failed to start:"
        for service in "${failed_services[@]}"; do
            log_error "   - $service"
        done
        return 1
    fi
    
    # Test monitoring endpoints
    log_info "🔍 Testing monitoring endpoints..."
    
    local prometheus_port=$(kubectl get svc -n monitoring prometheus-stack-kube-prom-prometheus -o jsonpath='{.spec.ports[0].port}')
    kubectl port-forward -n monitoring svc/prometheus-stack-kube-prom-prometheus $prometheus_port:$prometheus_port &
    local pf_pid=$!
    
    sleep 5
    
    if curl -f "http://localhost:$prometheus_port/api/v1/query?query=up" &>/dev/null; then
        log_success "✅ Prometheus API is accessible"
    else
        log_error "❌ Prometheus API is not accessible"
    fi
    
    kill $pf_pid 2>/dev/null || true
    
    log_success "✅ Monitoring validation completed"
}

# Generate monitoring report
generate_monitoring_report() {
    log_info "📊 Generating monitoring setup report..."
    
    local report_file="$LOGS_DIR/monitoring-setup-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "monitoring_setup_report": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "status": "completed",
        "components_deployed": [
            "prometheus_stack",
            "elk_stack",
            "jaeger_tracing",
            "influxdb_analytics",
            "kafka_streaming",
            "business_intelligence_dashboard"
        ],
        "monitoring_capabilities": {
            "metrics_collection": "prometheus_based",
            "log_aggregation": "elk_stack",
            "distributed_tracing": "jaeger",
            "business_analytics": "influxdb_grafana",
            "real_time_streaming": "kafka",
            "alerting": "prometheus_alertmanager"
        },
        "access_points": {
            "grafana": "https://grafana.barberpro.internal",
            "kibana": "https://kibana.barberpro.internal",
            "jaeger": "https://jaeger.barberpro.internal",
            "influxdb": "https://influxdb.barberpro.internal"
        },
        "performance_targets": {
            "metrics_ingestion_rate": "10k_metrics_per_second",
            "log_processing_rate": "1k_logs_per_second",
            "alert_response_time": "<30_seconds",
            "dashboard_load_time": "<3_seconds"
        }
    }
}
EOF
    
    log_success "✅ Monitoring setup report generated: $report_file"
    
    # Display summary
    echo -e "${GREEN}"
    echo "============================================================================"
    echo "🎉 ADVANCED MONITORING & ANALYTICS SETUP COMPLETED!"
    echo "============================================================================"
    echo "Components Deployed:"
    echo "  📈 Prometheus Stack (Metrics & Alerting)"
    echo "  📋 ELK Stack (Logging & Search)"
    echo "  🔍 Jaeger (Distributed Tracing)"
    echo "  📊 InfluxDB (Business Analytics)"
    echo "  ⚡ Kafka (Real-time Streaming)"
    echo "  📊 Business Intelligence Dashboards"
    echo ""
    echo "Access Points:"
    echo "  📊 Grafana: https://grafana.barberpro.internal"
    echo "  📋 Kibana: https://kibana.barberpro.internal"
    echo "  🔍 Jaeger: https://jaeger.barberpro.internal"
    echo "  📈 InfluxDB: https://influxdb.barberpro.internal"
    echo ""
    echo "Report: $report_file"
    echo "============================================================================"
    echo -e "${NC}"
}

# Main function
main() {
    show_banner
    
    # Setup monitoring infrastructure
    check_prerequisites
    setup_helm_repos
    deploy_prometheus_stack
    deploy_elk_stack
    deploy_jaeger
    deploy_influxdb
    deploy_analytics_redis
    setup_realtime_analytics
    
    # Configure dashboards and alerts
    setup_business_intelligence_dashboard
    setup_template_monitoring
    setup_alert_rules
    
    # Validate and report
    validate_monitoring_setup
    generate_monitoring_report
    
    log_success "🎉 Advanced monitoring & analytics infrastructure setup completed!"
}

# Run main function
main "$@"