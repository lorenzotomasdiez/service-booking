# BarberPro Disaster Recovery Plan
## Argentina Service Booking Platform

### Emergency Contact Information

**Primary Contacts (Argentina timezone)**
- DevOps Team Lead: +54 11 xxxx-xxxx
- System Administrator: +54 11 xxxx-xxxx  
- Database Administrator: +54 11 xxxx-xxxx
- Business Owner: +54 11 xxxx-xxxx

**Emergency Response Times**
- Critical (Service Down): 15 minutes
- High (Performance Impact): 1 hour
- Medium (Minor Issues): 4 hours
- Low (Maintenance): 24 hours

### Recovery Time Objectives (RTO) / Recovery Point Objectives (RPO)

| Scenario | RTO | RPO | Impact Level |
|----------|-----|-----|--------------|
| Database Corruption | 30 minutes | 15 minutes | Critical |
| Application Server Failure | 15 minutes | 0 (read replicas) | Critical |
| File Storage Loss | 2 hours | 1 hour | High |
| Network Outage | 10 minutes | 0 | Critical |
| Complete Data Center Loss | 4 hours | 1 hour | Critical |

### Disaster Scenarios and Response Procedures

## 1. Database Failure Scenarios

### 1.1 Primary Database Corruption
**Detection:** Database connection failures, data inconsistency alerts

**Immediate Response (0-15 minutes):**
```bash
# 1. Assess damage
psql -h postgres -U barberpro -d barberpro_prod -c "SELECT 1;"

# 2. Check replication status
psql -h postgres -U barberpro -d barberpro_prod -c "SELECT * FROM pg_stat_replication;"

# 3. Switch to read replica if available
# Update DATABASE_URL to point to replica

# 4. Notify team
curl -X POST $SLACK_WEBHOOK -d '{"text":"🚨 Database failure detected. Switching to replica."}'
```

**Recovery Actions (15-30 minutes):**
```bash
# 1. Restore from latest backup
cd /app/scripts
./restore.sh -d -s latest

# 2. Verify data integrity
psql -h postgres -U barberpro -d barberpro_prod -c "SELECT COUNT(*) FROM bookings WHERE created_at > NOW() - INTERVAL '1 day';"

# 3. Update application configuration
# Point DATABASE_URL back to primary

# 4. Restart applications
docker-compose restart backend
```

### 1.2 Complete Data Loss
**Recovery Actions:**
```bash
# 1. Restore from S3 backup
./restore.sh -s -y latest

# 2. Verify business-critical data
psql -h postgres -U barberpro -d barberpro_prod -c "
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM bookings) as bookings,
  (SELECT COUNT(*) FROM services) as services;
"

# 3. Notify customers via WhatsApp/Email about potential data loss
```

## 2. Application Server Failure

### 2.1 Single Server Failure
**Detection:** Health check failures, HTTP 5xx errors

**Immediate Response:**
```bash
# 1. Check server status
curl -f https://barberpro.com.ar/api/health || echo "Server down"

# 2. Scale up additional instances (Railway)
railway up --replicas 2

# 3. Remove failed instance from load balancer
# Update nginx configuration to remove failed backend

# 4. Monitor traffic distribution
```

### 2.2 Complete Application Failure
**Recovery Actions:**
```bash
# 1. Deploy from latest Docker image
railway deploy --image ghcr.io/barberpro/backend:latest

# 2. Restore application files if needed
./restore.sh -f latest

# 3. Verify all services
curl -f https://barberpro.com.ar/api/health/ready

# 4. Test critical user flows
curl -X POST https://barberpro.com.ar/api/auth/login -d '{"email":"test@barberpro.com.ar","password":"test"}'
```

## 3. Network and Infrastructure Failures

### 3.1 Railway Platform Outage
**Mitigation:**
```bash
# 1. Deploy to backup infrastructure (AWS/DigitalOcean)
docker run -d --name barberpro-backup \
  -e DATABASE_URL=$BACKUP_DATABASE_URL \
  -e REDIS_URL=$BACKUP_REDIS_URL \
  -p 3000:3000 \
  ghcr.io/barberpro/backend:latest

# 2. Update DNS to point to backup
# Update A record for barberpro.com.ar

# 3. Notify customers about temporary service migration
```

### 3.2 DNS Provider Failure
**Recovery Actions:**
```bash
# 1. Switch to backup DNS provider
# Update nameservers with domain registrar

# 2. Verify DNS propagation
dig barberpro.com.ar @8.8.8.8
dig barberpro.com.ar @1.1.1.1

# 3. Monitor resolution times from Argentina
```

## 4. Security Incidents

### 4.1 Data Breach
**Immediate Response (0-15 minutes):**
```bash
# 1. Isolate affected systems
iptables -A INPUT -s suspicious_ip -j DROP

# 2. Change all credentials
# Update JWT_SECRET, database passwords, API keys

# 3. Enable audit logging
tail -f /var/log/barberpro-audit.log

# 4. Notify Argentina data protection authorities within 72 hours
```

**Investigation Actions:**
```bash
# 1. Analyze access logs
grep "suspicious_pattern" /var/log/nginx/access.log

# 2. Check for data exfiltration
psql -h postgres -U barberpro -d barberpro_prod -c "
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
"

# 3. Generate security incident report
```

### 4.2 DDoS Attack
**Mitigation:**
```bash
# 1. Enable DDoS protection at CDN level
# Configure Cloudflare DDoS protection

# 2. Implement rate limiting
# Update nginx configuration with stricter limits

# 3. Block malicious IPs
fail2ban-client set nginx-limit-req banip malicious_ip

# 4. Scale infrastructure if needed
railway scale --instances 5
```

## 5. Business Continuity Procedures

### 5.1 Customer Communication Plan
**Argentina-Specific Considerations:**
- All communications in Spanish
- Use WhatsApp for urgent notifications (primary channel in Argentina)
- Respect Argentina timezone (UTC-3) for business hours communication
- Include estimated resolution time in CLAT (Argentina timezone)

**Communication Templates:**

**WhatsApp Message (Service Down):**
```
🚨 BarberPro - Mantenimiento de Emergencia

Estimado cliente, estamos experimentando problemas técnicos temporales. 

⏱️ Tiempo estimado de resolución: [TIME] CLAT
🔄 Actualizaciones cada: 30 minutos

Pedimos disculpas por las molestias.

El equipo BarberPro
```

**Email Template (Extended Outage):**
```
Asunto: BarberPro - Actualización de Estado del Servicio

Estimado [NOMBRE],

Le informamos sobre el estado actual de nuestros servicios:

SITUACIÓN: [DESCRIPTION]
INICIO DEL INCIDENTE: [TIME] CLAT  
RESOLUCIÓN ESTIMADA: [TIME] CLAT
SERVICIOS AFECTADOS: [SERVICES]

ACCIONES TOMADAS:
- [ACTION 1]
- [ACTION 2]

Sus datos están seguros y trabajamos para restablecer el servicio completo.

Saludos cordiales,
Equipo Técnico BarberPro
```

### 5.2 Business Impact Assessment
**Critical Business Functions:**
1. Booking creation/modification (Revenue impact: High)
2. Payment processing (Revenue impact: Critical)
3. Provider schedule management (Operational impact: High)
4. Customer notifications (Customer satisfaction: High)

**Alternative Procedures:**
- Manual booking via WhatsApp during system outage
- Phone-based payment processing with MercadoPago
- Email-based schedule coordination
- SMS notifications as backup for app notifications

## 6. Recovery Verification Procedures

### 6.1 Database Recovery Verification
```bash
# 1. Test data integrity
psql -h postgres -U barberpro -d barberpro_prod -c "
-- Check for data consistency
SELECT 
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') as new_users,
  (SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED') as confirmed_bookings,
  (SELECT COUNT(*) FROM payments WHERE status = 'COMPLETED') as completed_payments;
"

# 2. Verify Argentina-specific data
psql -h postgres -U barberpro -d barberpro_prod -c "
SELECT COUNT(*) FROM bookings 
WHERE timezone = 'America/Argentina/Buenos_Aires' 
AND created_at > NOW() - INTERVAL '1 day';
"

# 3. Test primary business workflows
curl -X POST https://barberpro.com.ar/api/bookings -H "Authorization: Bearer $TEST_TOKEN" -d '{
  "service_id": "test",
  "provider_id": "test", 
  "date": "2024-12-11",
  "time": "14:00",
  "timezone": "America/Argentina/Buenos_Aires"
}'
```

### 6.2 Application Recovery Verification
```bash
# 1. Health checks
curl -f https://barberpro.com.ar/api/health
curl -f https://barberpro.com.ar/api/health/ready

# 2. Critical API endpoints
curl -f https://barberpro.com.ar/api/services
curl -f https://barberpro.com.ar/api/providers

# 3. Payment integration
curl -f https://barberpro.com.ar/api/payments/mercadopago/status

# 4. Real-time features
# Test WebSocket connections for notifications
```

### 6.3 Performance Verification
```bash
# 1. Response time checks (Argentina SLA: <200ms)
curl -o /dev/null -s -w "%{time_total}\n" https://barberpro.com.ar/api/health

# 2. Load testing
artillery run tests/performance/load-test.yml

# 3. Database performance
psql -h postgres -U barberpro -d barberpro_prod -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

## 7. Post-Incident Procedures

### 7.1 Incident Documentation
**Required Information:**
- Incident start/end time (Argentina timezone)
- Root cause analysis
- Business impact assessment (revenue, customers affected)
- Recovery actions taken
- Lessons learned
- Preventive measures implemented

### 7.2 Regulatory Compliance (Argentina)
**Data Protection Requirements:**
- Incident reporting to AAIP (Argentina data protection authority) within 72 hours if personal data affected
- Customer notification within 72 hours if high risk to rights and freedoms
- Documentation retention for audit purposes (5 years minimum)

### 7.3 Improvement Actions
**Process Improvements:**
1. Update runbooks based on lessons learned
2. Enhance monitoring and alerting
3. Conduct post-incident review meeting
4. Update disaster recovery plan
5. Schedule disaster recovery drills

### 7.4 Argentina Business Hours Considerations
**Normal Business Hours:** 
- Monday-Friday: 9:00 AM - 6:00 PM CLAT (UTC-3)
- Saturday: 9:00 AM - 1:00 PM CLAT
- Sunday: Closed

**Peak Usage Hours:**
- Booking creation: 8:00 AM - 10:00 AM, 6:00 PM - 8:00 PM CLAT
- Payment processing: 10:00 AM - 12:00 PM, 2:00 PM - 4:00 PM CLAT

**Maintenance Windows:**
- Preferred: Sunday 2:00 AM - 6:00 AM CLAT (minimal user impact)
- Emergency: Any time with immediate customer notification

## 8. Regular Testing Schedule

### 8.1 Disaster Recovery Drills
**Monthly Tests:**
- Database backup/restore (first Monday of month)
- Application deployment rollback (second Monday)
- Security incident response (third Monday)
- Network failover procedures (fourth Monday)

**Quarterly Tests:**
- Complete system recovery simulation
- Business continuity procedures
- Customer communication workflows
- Performance under stress conditions

### 8.2 Monitoring and Alerting Tests
**Weekly Tests:**
- Alert notification delivery
- Escalation procedures
- Dashboard accessibility
- Backup verification

## 9. Emergency Contacts and Resources

### 9.1 Technical Support
- Railway Support: support@railway.app
- MercadoPago Technical: developers@mercadopago.com
- Cloudflare Support: support@cloudflare.com
- DNS Provider: [Provider specific]

### 9.2 Business Contacts
- Legal Counsel (Argentina): +54 11 xxxx-xxxx
- Insurance Provider: +54 11 xxxx-xxxx
- Key Business Partners: [Contact list]
- Backup Service Providers: [Contact list]

### 9.3 Government and Regulatory
- AAIP (Data Protection): 0800-999-2247
- AFIP (Tax Authority): 0810-999-2347
- Emergency Services: 911

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-10  
**Next Review:** 2025-03-10  
**Owner:** DevOps Team  
**Approved By:** Technical Director