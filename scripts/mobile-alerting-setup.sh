#!/bin/bash

# ============================================================================
# BarberPro Mobile Alerting Setup Script
# Configure mobile notifications for critical production issues
# ============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PROJECT_ROOT/monitoring/mobile-alerts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}"
}

# Create mobile alerts configuration directory
setup_mobile_config_directory() {
    log "INFO" "Setting up mobile alerts configuration..."
    
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$CONFIG_DIR/templates"
    mkdir -p "$CONFIG_DIR/webhooks"
    
    log "INFO" "${GREEN}Mobile alerts directory structure created${NC}"
}

# Configure Alertmanager for mobile notifications
setup_alertmanager_mobile() {
    log "INFO" "Configuring Alertmanager for mobile notifications..."
    
    cat > "$CONFIG_DIR/alertmanager-mobile.yml" << 'EOF'
# ============================================================================
# Alertmanager Mobile Configuration for BarberPro
# Critical alerts routing to mobile devices
# ============================================================================

global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@barberpro.com.ar'
  smtp_auth_username: 'alerts@barberpro.com.ar'
  smtp_auth_password: '${SMTP_PASSWORD}'

# Define notification templates
templates:
  - '/etc/alertmanager/templates/*.tmpl'

# Alert routing tree
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
    # Critical business alerts - immediate mobile notification
    - match:
        severity: critical
      receiver: 'mobile-critical'
      group_wait: 0s
      repeat_interval: 5m
      routes:
        # Payment failures - highest priority
        - match_re:
            alertname: '(PaymentSuccessRateCritical|PaymentProcessingFailure)'
        receiver: 'mobile-payment-critical'
        group_wait: 0s
        repeat_interval: 2m
        
        # Application down - immediate escalation
        - match_re:
            alertname: '(BarberProApplicationDown|DatabaseConnectionFailure)'
        receiver: 'mobile-app-down'
        group_wait: 0s
        repeat_interval: 1m

    # Performance warnings during business hours
    - match:
        severity: warning
      receiver: 'mobile-warning'
      group_wait: 2m
      repeat_interval: 30m
      time_intervals:
        - 'argentina-business-hours'

    # Revenue-impacting alerts
    - match_re:
        impact: '(revenue|direct_revenue_loss|high_revenue)'
      receiver: 'mobile-revenue-impact'
      group_wait: 1m
      repeat_interval: 15m

# Time intervals (Argentina timezone)
time_intervals:
  - name: 'argentina-business-hours'
    time_intervals:
      - times:
        - start_time: '09:00'
          end_time: '18:00'
        weekdays: ['monday:friday']
        location: 'America/Argentina/Buenos_Aires'
  
  - name: 'argentina-peak-hours'
    time_intervals:
      - times:
        - start_time: '11:00'
          end_time: '14:00'
        - start_time: '16:00'
          end_time: '19:00'
        weekdays: ['monday:saturday']
        location: 'America/Argentina/Buenos_Aires'

# Inhibition rules
inhibit_rules:
  # Don't alert on instance down if entire service is down
  - source_match:
      alertname: 'BarberProApplicationDown'
    target_match:
      alertname: 'InstanceDown'
    equal: ['service']

  # Don't alert on high response time if app is down
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['service']

# Mobile notification receivers
receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:9093/webhook/default'

  # Critical mobile alerts
  - name: 'mobile-critical'
    # Slack for immediate team notification
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_CRITICAL}'
        channel: '#barberpro-critical'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        text: |
          *Service:* {{ .GroupLabels.service }}
          *Impact:* {{ .GroupLabels.impact }}
          *Description:* {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
          
          *Immediate Action Required*
          Dashboard: {{ .Annotations.dashboard_url }}
          Runbook: {{ .Annotations.runbook_url }}
        send_resolved: true
    
    # PagerDuty for on-call rotation
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        description: '{{ .GroupLabels.alertname }}: {{ .GroupLabels.service }}'
        details:
          severity: '{{ .GroupLabels.severity }}'
          service: '{{ .GroupLabels.service }}'
          impact: '{{ .GroupLabels.impact }}'
          description: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
          runbook_url: '{{ .Annotations.runbook_url }}'
          dashboard_url: '{{ .Annotations.dashboard_url }}'
    
    # SMS for immediate mobile notification
    webhook_configs:
      - url: '${SMS_WEBHOOK_URL}'
        send_resolved: false
        http_config:
          bearer_token: '${SMS_API_TOKEN}'
        title: 'BarberPro CRITICAL Alert'
        text: |
          CRITICAL: {{ .GroupLabels.alertname }}
          Service: {{ .GroupLabels.service }}
          Impact: {{ .GroupLabels.impact }}
          Time: {{ .Alerts.0.StartsAt.Format "15:04 ART" }}
          Action: Check dashboard immediately

  # Payment critical alerts - highest escalation
  - name: 'mobile-payment-critical'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_CRITICAL}'
        channel: '#barberpro-payments'
        title: '💳 PAYMENT CRITICAL: {{ .GroupLabels.alertname }}'
        text: |
          🚨 *REVENUE AT RISK* 🚨
          
          *Alert:* {{ .GroupLabels.alertname }}
          *Provider:* {{ .GroupLabels.provider }}
          *Impact:* Direct revenue loss occurring NOW
          
          *Description:* {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
          
          *IMMEDIATE ACTIONS:*
          1. Check MercadoPago dashboard
          2. Verify payment gateway status
          3. Contact payment provider if needed
          
          Dashboard: {{ .Annotations.dashboard_url }}
          Escalation: {{ .Annotations.escalation_path }}
        send_resolved: true
    
    # Multiple SMS alerts for payment issues
    webhook_configs:
      - url: '${SMS_WEBHOOK_URL}'
        title: 'BarberPro PAYMENT EMERGENCY'
        text: |
          🚨 PAYMENT FAILURE CRITICAL 🚨
          Provider: {{ .GroupLabels.provider }}
          Revenue at risk - check immediately!
          Time: {{ .Alerts.0.StartsAt.Format "15:04 ART" }}
      
      # Email to finance team
      - url: '${EMAIL_WEBHOOK_URL}'
        title: 'URGENT: Payment Processing Failure'
        text: |
          Critical payment processing failure detected.
          
          Provider: {{ .GroupLabels.provider }}
          Alert: {{ .GroupLabels.alertname }}
          Time: {{ .Alerts.0.StartsAt.Format "2006-01-02 15:04:05 ART" }}
          
          Description: {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
          
          Immediate investigation required to prevent revenue loss.

  # Application down alerts
  - name: 'mobile-app-down'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: 'critical'
        description: 'BarberPro Application Down - Immediate Response Required'
        details:
          alert: '{{ .GroupLabels.alertname }}'
          service: '{{ .GroupLabels.service }}'
          impact: 'Complete service outage'
          estimated_users_affected: 'All active users'
    
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_CRITICAL}'
        channel: '#barberpro-incidents'
        title: '🔴 APPLICATION DOWN'
        text: |
          🚨 *BARBERPRO IS DOWN* 🚨
          
          Service completely unavailable
          All customers affected
          Revenue generation stopped
          
          *IMMEDIATE ACTIONS:*
          1. Check server status
          2. Verify database connectivity  
          3. Review recent deployments
          4. Prepare status page update
          
          Incident Response: ON
        send_resolved: true

  # Warning level mobile alerts
  - name: 'mobile-warning'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_WARNING}'
        channel: '#barberpro-alerts'
        title: '⚠️ {{ .GroupLabels.alertname }}'
        text: |
          *Service:* {{ .GroupLabels.service }}
          *Severity:* {{ .GroupLabels.severity }}
          *Description:* {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
        send_resolved: true

  # Revenue impact alerts
  - name: 'mobile-revenue-impact'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_BUSINESS}'
        channel: '#barberpro-business'
        title: '💰 Revenue Impact: {{ .GroupLabels.alertname }}'
        text: |
          *Impact Type:* {{ .GroupLabels.impact }}
          *Service:* {{ .GroupLabels.service }}
          *Description:* {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
          
          Business team review recommended.
        send_resolved: true
    
    # Email to business stakeholders
    email_configs:
      - to: '${BUSINESS_TEAM_EMAIL}'
        from: 'alerts@barberpro.com.ar'
        subject: 'BarberPro Revenue Impact Alert: {{ .GroupLabels.alertname }}'
        body: |
          A revenue-impacting alert has been triggered on BarberPro.
          
          Alert: {{ .GroupLabels.alertname }}
          Impact: {{ .GroupLabels.impact }}
          Service: {{ .GroupLabels.service }}
          Time: {{ .Alerts.0.StartsAt.Format "2006-01-02 15:04:05 ART" }}
          
          Description: {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
          
          Please review the situation and take appropriate business actions.
          
          Dashboard: {{ .Annotations.dashboard_url }}
EOF

    log "INFO" "${GREEN}Alertmanager mobile configuration created${NC}"
}

# Setup SMS notification webhook
setup_sms_webhook() {
    log "INFO" "Setting up SMS notification webhook..."
    
    cat > "$CONFIG_DIR/webhooks/sms-webhook.py" << 'EOF'
#!/usr/bin/env python3
"""
BarberPro SMS Notification Webhook
Sends critical alerts via SMS to on-call engineers
"""

import json
import os
import sys
import requests
from flask import Flask, request, jsonify
from datetime import datetime
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER', '+5491123456789')

# On-call phone numbers (Argentina)
ON_CALL_NUMBERS = [
    os.getenv('ONCALL_PRIMARY', '+5491134567890'),
    os.getenv('ONCALL_SECONDARY', '+5491145678901'),
    os.getenv('ONCALL_ESCALATION', '+5491156789012')
]

@app.route('/webhook/sms', methods=['POST'])
def handle_alert():
    """Handle incoming Alertmanager webhooks and send SMS"""
    
    try:
        data = request.get_json()
        
        if not data or 'alerts' not in data:
            return jsonify({'error': 'Invalid webhook data'}), 400
        
        for alert in data['alerts']:
            if alert['status'] == 'firing':
                send_critical_sms(alert)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        logging.error(f"Error handling alert webhook: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def send_critical_sms(alert):
    """Send SMS notification for critical alert"""
    
    # Extract alert information
    alert_name = alert['labels'].get('alertname', 'Unknown Alert')
    service = alert['labels'].get('service', 'Unknown Service')
    severity = alert['labels'].get('severity', 'unknown')
    description = alert['annotations'].get('description', 'No description')
    
    # Format SMS message (limited to 160 characters for standard SMS)
    timestamp = datetime.now().strftime('%H:%M ART')
    sms_message = f"🚨 {alert_name}: {service} - {description[:80]}... Check dashboard! {timestamp}"
    
    # Send to on-call rotation
    for phone_number in ON_CALL_NUMBERS:
        if phone_number:
            send_sms(phone_number, sms_message)
            break  # Send to first available number in rotation
    
    logging.info(f"SMS alert sent for {alert_name}")

def send_sms(to_number, message):
    """Send SMS using Twilio API"""
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logging.warning("Twilio credentials not configured - SMS not sent")
        return False
    
    try:
        # Twilio API request
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        
        data = {
            'From': TWILIO_FROM_NUMBER,
            'To': to_number,
            'Body': message
        }
        
        response = requests.post(
            url,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
            data=data
        )
        
        if response.status_code == 201:
            logging.info(f"SMS sent successfully to {to_number}")
            return True
        else:
            logging.error(f"Failed to send SMS: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"Error sending SMS: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

    chmod +x "$CONFIG_DIR/webhooks/sms-webhook.py"
    log "INFO" "${GREEN}SMS webhook script created${NC}"
}

# Setup push notification service
setup_push_notifications() {
    log "INFO" "Setting up push notification service..."
    
    cat > "$CONFIG_DIR/push-notification-service.js" << 'EOF'
/**
 * BarberPro Push Notification Service
 * Handles mobile push notifications for critical alerts
 */

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Firebase Admin SDK initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
});

// Device tokens for on-call engineers
const ON_CALL_TOKENS = [
    process.env.ONCALL_PRIMARY_TOKEN,
    process.env.ONCALL_SECONDARY_TOKEN,
    process.env.ONCALL_ESCALATION_TOKEN
].filter(token => token);

// Alert severity to priority mapping
const PRIORITY_MAP = {
    'critical': 'high',
    'warning': 'normal',
    'info': 'low'
};

// Alert to icon mapping
const ICON_MAP = {
    'PaymentSuccessRateCritical': '💳',
    'BarberProApplicationDown': '🔴',
    'HighResponseTime': '⚡',
    'DatabaseConnectionFailure': '💾',
    'default': '🚨'
};

app.post('/webhook/push', async (req, res) => {
    try {
        const { alerts } = req.body;
        
        if (!alerts || !Array.isArray(alerts)) {
            return res.status(400).json({ error: 'Invalid webhook data' });
        }
        
        for (const alert of alerts) {
            if (alert.status === 'firing') {
                await sendPushNotification(alert);
            }
        }
        
        res.json({ status: 'success', processed: alerts.length });
        
    } catch (error) {
        console.error('Error processing push notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function sendPushNotification(alert) {
    const alertName = alert.labels.alertname || 'Unknown Alert';
    const service = alert.labels.service || 'BarberPro';
    const severity = alert.labels.severity || 'warning';
    const description = alert.annotations.description || 'No description';
    const impact = alert.labels.impact || 'unknown';
    
    // Format notification
    const icon = ICON_MAP[alertName] || ICON_MAP.default;
    const priority = PRIORITY_MAP[severity] || 'normal';
    
    const notification = {
        title: `${icon} BarberPro Alert: ${alertName}`,
        body: `${service}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
        data: {
            alertname: alertName,
            service: service,
            severity: severity,
            impact: impact,
            timestamp: new Date().toISOString(),
            dashboard_url: alert.annotations.dashboard_url || '',
            runbook_url: alert.annotations.runbook_url || ''
        },
        android: {
            priority: priority,
            notification: {
                channelId: severity === 'critical' ? 'critical_alerts' : 'general_alerts',
                sound: severity === 'critical' ? 'critical_alert.wav' : 'default',
                vibrate: severity === 'critical' ? [0, 500, 250, 500] : [0, 250]
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: severity === 'critical' ? 'critical_alert.caf' : 'default',
                    badge: 1,
                    alert: {
                        title: `${icon} ${alertName}`,
                        body: description.substring(0, 100)
                    }
                }
            }
        }
    };
    
    // Send to all on-call devices
    if (ON_CALL_TOKENS.length > 0) {
        try {
            const response = await admin.messaging().sendToDevice(ON_CALL_TOKENS, {
                notification: notification,
                data: notification.data
            });
            
            console.log('Push notifications sent:', response.successCount);
            
            // Handle failed tokens
            response.results.forEach((result, index) => {
                if (result.error) {
                    console.error(`Failed to send to token ${index}:`, result.error);
                }
            });
            
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        onCallTokens: ON_CALL_TOKENS.length 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Push notification service running on port ${PORT}`);
    console.log(`On-call tokens configured: ${ON_CALL_TOKENS.length}`);
});
EOF

    log "INFO" "${GREEN}Push notification service created${NC}"
}

# Create mobile alert management dashboard
setup_alert_management_dashboard() {
    log "INFO" "Creating mobile alert management dashboard..."
    
    mkdir -p "$CONFIG_DIR/dashboard"
    
    cat > "$CONFIG_DIR/dashboard/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BarberPro Mobile Alerts Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header {
            background: rgba(255,255,255,0.95);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .status-card {
            background: rgba(255,255,255,0.95);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-critical { border-left: 5px solid #e74c3c; }
        .status-warning { border-left: 5px solid #f39c12; }
        .status-healthy { border-left: 5px solid #27ae60; }
        .alert-list {
            background: rgba(255,255,255,0.95);
            border-radius: 10px;
            padding: 20px;
        }
        .alert-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .alert-critical { background: rgba(231,76,60,0.1); }
        .alert-warning { background: rgba(243,156,18,0.1); }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn-primary { background: #3498db; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-success { background: #27ae60; color: white; }
        .toggle-section {
            background: rgba(255,255,255,0.95);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 BarberPro Mobile Alerts Management</h1>
            <p>Real-time monitoring and alert configuration for production systems</p>
        </div>

        <div class="status-grid">
            <div class="status-card status-healthy">
                <h3>🟢 System Status</h3>
                <p><strong>All systems operational</strong></p>
                <p>Last check: <span id="last-check">--:--</span></p>
                <p>Uptime: <span id="uptime">99.9%</span></p>
            </div>
            
            <div class="status-card status-warning">
                <h3>⚠️ Active Alerts</h3>
                <p><strong><span id="active-alerts">0</span> alerts</strong></p>
                <p>Critical: <span id="critical-alerts">0</span></p>
                <p>Warning: <span id="warning-alerts">0</span></p>
            </div>
            
            <div class="status-card status-critical">
                <h3>📱 Mobile Notifications</h3>
                <p><strong>Status: <span id="mobile-status">Active</span></strong></p>
                <p>SMS Sent Today: <span id="sms-count">0</span></p>
                <p>Push Sent Today: <span id="push-count">0</span></p>
            </div>
        </div>

        <div class="alert-list">
            <h2>Recent Alerts</h2>
            <div id="alerts-container">
                <!-- Alerts will be loaded here -->
            </div>
        </div>

        <div class="toggle-section">
            <h2>Alert Configuration</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <label>
                    <input type="checkbox" id="sms-enabled" checked> SMS Notifications
                </label>
                <label>
                    <input type="checkbox" id="push-enabled" checked> Push Notifications
                </label>
                <label>
                    <input type="checkbox" id="slack-enabled" checked> Slack Notifications
                </label>
                <label>
                    <input type="checkbox" id="email-enabled" checked> Email Notifications
                </label>
            </div>
            <br>
            <button class="btn btn-primary" onclick="saveConfiguration()">Save Configuration</button>
            <button class="btn btn-danger" onclick="testAlert()">Test Critical Alert</button>
            <button class="btn btn-success" onclick="testRecovery()">Test Recovery</button>
        </div>
    </div>

    <script>
        // Mock data for demonstration
        function loadAlerts() {
            const alertsContainer = document.getElementById('alerts-container');
            const mockAlerts = [
                {
                    name: 'High Response Time',
                    severity: 'warning',
                    time: '10:30 AM',
                    description: 'API response time above 200ms threshold'
                },
                {
                    name: 'Memory Usage High',
                    severity: 'warning', 
                    time: '09:15 AM',
                    description: 'Server memory usage at 85%'
                }
            ];

            alertsContainer.innerHTML = mockAlerts.map(alert => `
                <div class="alert-item alert-${alert.severity}">
                    <div>
                        <strong>${alert.name}</strong><br>
                        <small>${alert.description}</small>
                    </div>
                    <div>
                        <span>${alert.time}</span>
                        <button class="btn btn-primary" style="margin-left: 10px;">Details</button>
                    </div>
                </div>
            `).join('');
        }

        function updateStatus() {
            document.getElementById('last-check').textContent = new Date().toLocaleTimeString('en-AR', {
                timeZone: 'America/Argentina/Buenos_Aires',
                hour12: false
            });
        }

        function saveConfiguration() {
            const config = {
                sms: document.getElementById('sms-enabled').checked,
                push: document.getElementById('push-enabled').checked,
                slack: document.getElementById('slack-enabled').checked,
                email: document.getElementById('email-enabled').checked
            };
            
            // Simulate API call
            console.log('Saving configuration:', config);
            alert('Configuration saved successfully!');
        }

        function testAlert() {
            // Simulate test alert
            console.log('Sending test critical alert...');
            alert('Test critical alert sent to all configured channels');
        }

        function testRecovery() {
            // Simulate recovery test
            console.log('Sending test recovery notification...');
            alert('Test recovery notification sent');
        }

        // Initialize
        loadAlerts();
        updateStatus();
        setInterval(updateStatus, 30000); // Update every 30 seconds
    </script>
</body>
</html>
EOF

    log "INFO" "${GREEN}Mobile alert management dashboard created${NC}"
}

# Create systemd services for mobile alert components
setup_systemd_services() {
    log "INFO" "Creating systemd services for mobile alert components..."
    
    # SMS webhook service
    cat > "$CONFIG_DIR/barberpro-sms-webhook.service" << EOF
[Unit]
Description=BarberPro SMS Webhook Service
After=network.target
Requires=network.target

[Service]
Type=simple
User=barberpro
Group=barberpro
WorkingDirectory=$CONFIG_DIR/webhooks
ExecStart=/usr/bin/python3 sms-webhook.py
Restart=always
RestartSec=10
Environment=PORT=5000
EnvironmentFile=$PROJECT_ROOT/.env.production

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/tmp /var/log
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF

    # Push notification service
    cat > "$CONFIG_DIR/barberpro-push-notifications.service" << EOF
[Unit]
Description=BarberPro Push Notification Service
After=network.target
Requires=network.target

[Service]
Type=simple
User=barberpro
Group=barberpro
WorkingDirectory=$CONFIG_DIR
ExecStart=/usr/bin/node push-notification-service.js
Restart=always
RestartSec=10
Environment=PORT=3001
EnvironmentFile=$PROJECT_ROOT/.env.production

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/tmp /var/log
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF

    log "INFO" "${GREEN}Systemd services created${NC}"
}

# Create mobile alert testing script
setup_alert_testing() {
    log "INFO" "Creating mobile alert testing script..."
    
    cat > "$CONFIG_DIR/test-mobile-alerts.sh" << 'EOF'
#!/bin/bash

# Mobile Alert Testing Script
# Tests all mobile notification channels

echo "🧪 Testing BarberPro Mobile Alerts..."

# Test SMS
echo "📱 Testing SMS notifications..."
curl -X POST http://localhost:5000/webhook/sms \
    -H "Content-Type: application/json" \
    -d '{
        "alerts": [{
            "status": "firing",
            "labels": {
                "alertname": "TestCriticalAlert",
                "service": "test",
                "severity": "critical"
            },
            "annotations": {
                "description": "This is a test critical alert for SMS validation"
            }
        }]
    }'

echo ""
echo "📲 Testing Push notifications..."
curl -X POST http://localhost:3001/webhook/push \
    -H "Content-Type: application/json" \
    -d '{
        "alerts": [{
            "status": "firing",
            "labels": {
                "alertname": "TestPushAlert",
                "service": "test",
                "severity": "critical"
            },
            "annotations": {
                "description": "This is a test push notification"
            }
        }]
    }'

echo ""
echo "✅ Mobile alert tests completed"
EOF

    chmod +x "$CONFIG_DIR/test-mobile-alerts.sh"
    log "INFO" "${GREEN}Mobile alert testing script created${NC}"
}

# Main function
main() {
    log "INFO" "${BLUE}Setting up BarberPro mobile alerting system...${NC}"
    
    # Create directory structure
    setup_mobile_config_directory
    
    # Setup components
    setup_alertmanager_mobile
    setup_sms_webhook
    setup_push_notifications
    setup_alert_management_dashboard
    setup_systemd_services
    setup_alert_testing
    
    log "INFO" "${GREEN}Mobile alerting setup completed successfully!${NC}"
    log "INFO" "${YELLOW}Next steps:${NC}"
    log "INFO" "1. Configure environment variables in .env.production"
    log "INFO" "2. Install required dependencies (twilio, firebase-admin)"
    log "INFO" "3. Copy systemd services to /etc/systemd/system/"
    log "INFO" "4. Start services: systemctl start barberpro-*"
    log "INFO" "5. Test alerts: $CONFIG_DIR/test-mobile-alerts.sh"
    
    return 0
}

# Execute main function
main "$@"