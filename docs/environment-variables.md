# Environment Variables Reference

Complete reference for all environment variables used in the BarberPro application.

## Table of Contents

1. [Overview](#overview)
2. [Variable Categories](#variable-categories)
3. [Core Application](#core-application)
4. [Database Configuration](#database-configuration)
5. [Redis Configuration](#redis-configuration)
6. [Authentication & Security](#authentication--security)
7. [CORS Configuration](#cors-configuration)
8. [Argentina Configuration](#argentina-configuration)
9. [MercadoPago Integration](#mercadopago-integration)
10. [AFIP Integration](#afip-integration)
11. [WhatsApp Integration](#whatsapp-integration)
12. [SMS Integration](#sms-integration)
13. [Email Configuration](#email-configuration)
14. [Frontend Configuration](#frontend-configuration)
15. [Monitoring & Observability](#monitoring--observability)
16. [Admin Tools](#admin-tools)
17. [File Upload](#file-upload)
18. [Testing](#testing)
19. [Performance & Optimization](#performance--optimization)
20. [Docker Configuration](#docker-configuration)

---

## Overview

### Naming Conventions

| Prefix | Purpose | Where Used | Example |
|--------|---------|------------|---------|
| `VITE_` | Frontend build-time variables | SvelteKit/Vite | `VITE_API_URL` |
| `PUBLIC_` | Frontend public variables | SvelteKit | `PUBLIC_APP_NAME` |
| None | Backend variables | Node.js/Fastify | `DATABASE_URL` |
| `POSTGRES_` | PostgreSQL specific | PostgreSQL container | `POSTGRES_DB` |
| `REDIS_` | Redis specific | Redis container | `REDIS_HOST` |

### Variable Types

- **Required**: Must be set for application to function
- **Optional**: Has default values or only needed for specific features
- **Secret**: Contains sensitive data (passwords, tokens, keys)
- **Public**: Safe to expose to browser/clients

### Environment-Specific Values

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | development | production |
| Service URLs | Docker service names | Real domains/IPs |
| Secrets | Weak/test values | Strong random values |
| Debug flags | Enabled | Disabled |
| CORS | Permissive | Restrictive |

---

## Variable Categories

### Quick Reference Table

| Category | Count | Key Variables |
|----------|-------|---------------|
| Core Application | 5 | NODE_ENV, FRONTEND_URL, BACKEND_URL |
| Database | 6 | DATABASE_URL, POSTGRES_* |
| Redis | 5 | REDIS_URL, REDIS_HOST |
| Auth & Security | 8 | JWT_SECRET, SESSION_SECRET |
| CORS | 6 | CORS_ORIGIN, CORS_CREDENTIALS |
| Argentina | 4 | TIMEZONE, LOCALE, CURRENCY |
| MercadoPago | 7 | MERCADOPAGO_ACCESS_TOKEN |
| AFIP | 8 | AFIP_CUIT, AFIP_CERT_PATH |
| WhatsApp | 7 | WHATSAPP_API_TOKEN |
| SMS | 6 | SMS_API_KEY |
| Email | 7 | SMTP_HOST, SMTP_PORT |
| Frontend | 15 | VITE_*, PUBLIC_* |
| Monitoring | 10 | PROMETHEUS_URL, GRAFANA_* |
| Admin Tools | 6 | PGADMIN_*, REDIS_COMMANDER_* |
| File Upload | 8 | MAX_FILE_SIZE, AWS_* |
| Testing | 4 | TEST_DATABASE_URL |
| Performance | 6 | RATE_LIMIT_*, BCRYPT_SALT_ROUNDS |

---

## Core Application

### `NODE_ENV`
- **Type**: String (enum)
- **Required**: Yes
- **Default**: development
- **Valid Values**: `development`, `production`, `test`
- **Description**: Application environment mode
- **Example**:
  ```bash
  NODE_ENV=development
  ```

### `FRONTEND_URL`
- **Type**: URL
- **Required**: Yes
- **Public**: Yes
- **Description**: Frontend application URL (for CORS, redirects, emails)
- **Development**: `http://localhost:5173`
- **Production**: `https://barberpro.com.ar`
- **Example**:
  ```bash
  FRONTEND_URL=http://localhost:5173
  ```

### `BACKEND_URL`
- **Type**: URL
- **Required**: Yes
- **Public**: Yes
- **Description**: Backend API URL (for webhooks, callbacks)
- **Development**: `http://localhost:3000`
- **Production**: `https://api.barberpro.com.ar`
- **Example**:
  ```bash
  BACKEND_URL=http://localhost:3000
  ```

### `API_BASE_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: Alias for BACKEND_URL
- **Example**:
  ```bash
  API_BASE_URL=http://localhost:3000
  ```

### `APP_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: Main application URL (used in emails, QR codes)
- **Example**:
  ```bash
  APP_URL=http://localhost:5173
  ```

---

## Database Configuration

### `DATABASE_URL`
- **Type**: Connection String
- **Required**: Yes
- **Secret**: Yes (contains password)
- **Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- **Description**: PostgreSQL connection string for Prisma ORM
- **Docker Development**: Use service name `postgres`
- **Production**: Use managed database host
- **Example**:
  ```bash
  # Docker Development
  DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_dev

  # Production
  DATABASE_URL=postgresql://barberpro:secure_password@db.example.com:5432/barberpro_prod
  ```
- **Advanced Options**:
  ```bash
  # With connection pool
  DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20

  # With SSL
  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  ```

### `POSTGRES_DB`
- **Type**: String
- **Required**: Yes
- **Description**: PostgreSQL database name
- **Recommendation**: Use different names per environment
- **Example**:
  ```bash
  POSTGRES_DB=barberpro_dev        # Development
  POSTGRES_DB=barberpro_prod       # Production
  POSTGRES_DB=barberpro_test       # Testing
  ```

### `POSTGRES_USER`
- **Type**: String
- **Required**: Yes
- **Description**: PostgreSQL username
- **Example**:
  ```bash
  POSTGRES_USER=barberpro
  ```

### `POSTGRES_PASSWORD`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: PostgreSQL password
- **Development**: Simple password is OK
- **Production**: Use strong random password (32+ characters)
- **Example**:
  ```bash
  # Development
  POSTGRES_PASSWORD=barberpro_dev_password

  # Production (generate with: openssl rand -base64 32)
  POSTGRES_PASSWORD=xK9mP2nL5qR8tY3wE6vB1zA4sC7dF0gH
  ```

### `POSTGRES_HOST`
- **Type**: String (hostname or IP)
- **Required**: Yes
- **Description**: PostgreSQL server hostname
- **Docker**: Use service name
- **Local**: Use `localhost`
- **Remote**: Use FQDN or IP
- **Example**:
  ```bash
  POSTGRES_HOST=postgres           # Docker
  POSTGRES_HOST=localhost          # Local
  POSTGRES_HOST=db.example.com     # Remote
  ```

### `POSTGRES_PORT`
- **Type**: Integer
- **Required**: Yes
- **Default**: 5432
- **Description**: PostgreSQL server port
- **Example**:
  ```bash
  POSTGRES_PORT=5432
  ```

---

## Redis Configuration

### `REDIS_URL`
- **Type**: Connection String
- **Required**: Yes
- **Format**: `redis://[user:password@]HOST:PORT[/database]`
- **Description**: Redis connection string
- **Example**:
  ```bash
  # Docker (no password)
  REDIS_URL=redis://redis:6379

  # With password
  REDIS_URL=redis://:password@redis:6379

  # Specific database
  REDIS_URL=redis://redis:6379/1

  # Production with auth
  REDIS_URL=redis://user:password@cache.example.com:6379/0
  ```

### `REDIS_HOST`
- **Type**: String (hostname or IP)
- **Required**: Yes
- **Description**: Redis server hostname
- **Example**:
  ```bash
  REDIS_HOST=redis                 # Docker
  REDIS_HOST=localhost             # Local
  REDIS_HOST=cache.example.com     # Remote
  ```

### `REDIS_PORT`
- **Type**: Integer
- **Required**: Yes
- **Default**: 6379
- **Description**: Redis server port
- **Example**:
  ```bash
  REDIS_PORT=6379
  ```

### `REDIS_PASSWORD`
- **Type**: String
- **Required**: No (recommended for production)
- **Secret**: Yes
- **Description**: Redis authentication password
- **Example**:
  ```bash
  REDIS_PASSWORD=                  # Development (no password)
  REDIS_PASSWORD=secure_redis_pass # Production
  ```

### `REDIS_DB`
- **Type**: Integer (0-15)
- **Required**: No
- **Default**: 0
- **Description**: Redis database number
- **Example**:
  ```bash
  REDIS_DB=0                       # Production
  REDIS_DB=1                       # Testing
  ```

---

## Authentication & Security

### `JWT_SECRET`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Minimum Length**: 32 characters
- **Description**: Secret key for signing JWT tokens
- **Example**:
  ```bash
  # Development
  JWT_SECRET=dev_jwt_secret_change_in_production_minimum_32_characters_required

  # Production (generate with: openssl rand -base64 64)
  JWT_SECRET=xK9mP2nL5qR8tY3wE6vB1zA4sC7dF0gHjI1kM3lN5oP7qR9sT2uV4wX6yZ8aB0cD
  ```
- **Security**: Never commit production secrets to git!

### `JWT_EXPIRES_IN`
- **Type**: String (duration)
- **Required**: No
- **Default**: 7d
- **Format**: `1h`, `2d`, `7d`, `30d`, `365d`
- **Description**: JWT token expiration time
- **Example**:
  ```bash
  JWT_EXPIRES_IN=7d                # 7 days
  JWT_EXPIRES_IN=24h               # 24 hours
  ```

### `JWT_REFRESH_EXPIRES_IN`
- **Type**: String (duration)
- **Required**: No
- **Default**: 30d
- **Description**: JWT refresh token expiration time
- **Example**:
  ```bash
  JWT_REFRESH_EXPIRES_IN=30d       # 30 days
  ```

### `SESSION_SECRET`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Minimum Length**: 32 characters
- **Description**: Secret for session encryption
- **Example**:
  ```bash
  # Development
  SESSION_SECRET=dev_session_secret_change_in_production

  # Production
  SESSION_SECRET=yL0nP3oR6sU9vX2zB5cE8gJ1lN4qT7wA0dF3hK6mO9rV2yZ5bC8eG1jM4pS7uX0
  ```

### `SESSION_MAX_AGE`
- **Type**: Integer (milliseconds)
- **Required**: No
- **Default**: 604800000 (7 days)
- **Description**: Session cookie max age
- **Example**:
  ```bash
  SESSION_MAX_AGE=604800000        # 7 days
  SESSION_MAX_AGE=86400000         # 1 day
  ```

### `BCRYPT_SALT_ROUNDS`
- **Type**: Integer (4-31)
- **Required**: No
- **Default**: 10
- **Description**: BCrypt hashing rounds (higher = more secure but slower)
- **Development**: 10 (faster)
- **Production**: 12-14 (more secure)
- **Example**:
  ```bash
  BCRYPT_SALT_ROUNDS=10            # Development
  BCRYPT_SALT_ROUNDS=12            # Production
  ```

### `APP_DEBUG`
- **Type**: Boolean
- **Required**: No
- **Default**: false
- **Description**: Enable debug mode (verbose errors, stack traces)
- **Security**: NEVER enable in production!
- **Example**:
  ```bash
  APP_DEBUG=true                   # Development
  APP_DEBUG=false                  # Production
  ```

### `ENABLE_SWAGGER`
- **Type**: Boolean
- **Required**: No
- **Default**: false
- **Description**: Enable Swagger API documentation UI
- **Security**: Disable in production!
- **Example**:
  ```bash
  ENABLE_SWAGGER=true              # Development
  ENABLE_SWAGGER=false             # Production
  ```

---

## CORS Configuration

### `CORS_ORIGIN`
- **Type**: String (comma-separated URLs or *)
- **Required**: Yes
- **Description**: Allowed CORS origins
- **Development**: Include localhost AND Docker service names
- **Production**: Restrict to your domains only
- **Example**:
  ```bash
  # Development (permissive)
  CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://frontend:5173,http://backend:3000

  # Production (restrictive)
  CORS_ORIGIN=https://barberpro.com.ar,https://api.barberpro.com.ar

  # Allow all (NOT recommended for production)
  CORS_ORIGIN=*

  # With container IP ranges
  CORS_ORIGIN=http://localhost:5173,http://172.18.0.0/16
  ```

### `CORS_CREDENTIALS`
- **Type**: Boolean
- **Required**: No
- **Default**: true
- **Description**: Allow credentials (cookies, authorization headers)
- **Example**:
  ```bash
  CORS_CREDENTIALS=true
  ```

### `CORS_METHODS`
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
- **Description**: Allowed HTTP methods
- **Example**:
  ```bash
  CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
  ```

### `CORS_ALLOWED_HEADERS`
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: Content-Type,Authorization,X-Requested-With
- **Description**: Allowed request headers
- **Example**:
  ```bash
  CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
  ```

### `CORS_EXPOSED_HEADERS`
- **Type**: String (comma-separated)
- **Required**: No
- **Default**: Content-Range,X-Content-Range
- **Description**: Headers exposed to client
- **Example**:
  ```bash
  CORS_EXPOSED_HEADERS=Content-Range,X-Content-Range
  ```

### `CORS_MAX_AGE`
- **Type**: Integer (seconds)
- **Required**: No
- **Default**: 86400
- **Description**: Preflight request cache duration
- **Example**:
  ```bash
  CORS_MAX_AGE=86400               # 24 hours
  ```

---

## Argentina Configuration

### `TIMEZONE`
- **Type**: String (IANA timezone)
- **Required**: Yes
- **Fixed Value**: `America/Argentina/Buenos_Aires`
- **Description**: Argentina timezone for date/time operations
- **Example**:
  ```bash
  TIMEZONE=America/Argentina/Buenos_Aires
  ```

### `LOCALE`
- **Type**: String (locale code)
- **Required**: Yes
- **Fixed Value**: `es-AR`
- **Description**: Spanish (Argentina) locale
- **Example**:
  ```bash
  LOCALE=es-AR
  ```

### `CURRENCY`
- **Type**: String (currency code)
- **Required**: Yes
- **Fixed Value**: `ARS`
- **Description**: Argentine Peso currency code
- **Example**:
  ```bash
  CURRENCY=ARS
  ```

### `COUNTRY_CODE`
- **Type**: String (ISO 3166-1 alpha-2)
- **Required**: No
- **Default**: AR
- **Description**: Argentina country code
- **Example**:
  ```bash
  COUNTRY_CODE=AR
  ```

### `PHONE_COUNTRY_CODE`
- **Type**: String
- **Required**: No
- **Default**: +54
- **Description**: Argentina phone country code
- **Example**:
  ```bash
  PHONE_COUNTRY_CODE=+54
  ```

---

## MercadoPago Integration

### `MERCADOPAGO_BASE_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: MercadoPago API base URL
- **Development**: Mock service URL
- **Production**: Real MercadoPago API
- **Example**:
  ```bash
  # Development (mock)
  MERCADOPAGO_BASE_URL=http://mercadopago-mock:3001

  # Production
  MERCADOPAGO_BASE_URL=https://api.mercadopago.com
  ```

### `MERCADOPAGO_ENVIRONMENT`
- **Type**: String (enum)
- **Required**: Yes
- **Valid Values**: `sandbox`, `production`
- **Description**: MercadoPago environment mode
- **Example**:
  ```bash
  MERCADOPAGO_ENVIRONMENT=sandbox      # Development/Testing
  MERCADOPAGO_ENVIRONMENT=production   # Production
  ```

### `MERCADOPAGO_ACCESS_TOKEN`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: MercadoPago private access token
- **Get From**: https://www.mercadopago.com.ar/developers
- **Example**:
  ```bash
  # Development (mock)
  MERCADOPAGO_ACCESS_TOKEN=test_mock_access_token_development

  # Production
  MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-abcdef-ghijklmnopqrstuvwxyz-12345678
  ```

### `MERCADOPAGO_PUBLIC_KEY`
- **Type**: String
- **Required**: Yes
- **Public**: Yes (exposed to frontend)
- **Description**: MercadoPago public key
- **Example**:
  ```bash
  # Development (mock)
  MERCADOPAGO_PUBLIC_KEY=test_mock_public_key_development

  # Production
  MERCADOPAGO_PUBLIC_KEY=APP_USR-abcd1234-efgh-5678-ijkl-9012mnop3456
  ```

### `MERCADOPAGO_WEBHOOK_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: Webhook URL for payment notifications
- **Docker**: Use `backend` service name
- **Production**: Use public domain
- **Example**:
  ```bash
  # Docker Development
  MERCADOPAGO_WEBHOOK_URL=http://backend:3000/api/webhooks/mercadopago

  # Production
  MERCADOPAGO_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/mercadopago
  ```

### `MERCADOPAGO_WEBHOOK_SECRET`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: Secret for webhook signature verification
- **Example**:
  ```bash
  # Development
  MERCADOPAGO_WEBHOOK_SECRET=test_webhook_secret_development

  # Production (generate with: openssl rand -hex 32)
  MERCADOPAGO_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  ```

### `MERCADOPAGO_DEFAULT_SCENARIO`
- **Type**: String (enum)
- **Required**: No (mock only)
- **Valid Values**: `success`, `pending`, `failure`, `timeout`
- **Description**: Default payment scenario for mock service
- **Example**:
  ```bash
  MERCADOPAGO_DEFAULT_SCENARIO=success
  ```

---

## AFIP Integration

### `AFIP_BASE_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: AFIP web services base URL
- **Development**: Mock service URL
- **Production**: Real AFIP endpoints
- **Example**:
  ```bash
  # Development (mock)
  AFIP_BASE_URL=http://afip-mock:3002

  # Production (homologation)
  AFIP_BASE_URL=https://wswhomo.afip.gov.ar

  # Production (real)
  AFIP_BASE_URL=https://servicios1.afip.gov.ar
  ```

### `AFIP_ENVIRONMENT`
- **Type**: String (enum)
- **Required**: Yes
- **Valid Values**: `sandbox`, `production`
- **Description**: AFIP environment mode
- **Example**:
  ```bash
  AFIP_ENVIRONMENT=sandbox         # Development/Testing
  AFIP_ENVIRONMENT=production      # Production
  ```

### `AFIP_CUIT`
- **Type**: String (11 digits)
- **Required**: Yes
- **Format**: `20123456789`
- **Description**: Company CUIT (tax ID)
- **Validation**: Must be valid CUIT with checksum
- **Example**:
  ```bash
  AFIP_CUIT=20123456789            # Development (test)
  AFIP_CUIT=20345678901            # Production (real company CUIT)
  ```

### `AFIP_CERT_PATH`
- **Type**: File Path
- **Required**: Yes
- **Secret**: Yes
- **Description**: Path to AFIP certificate file
- **Get From**: AFIP admin portal (https://www.afip.gob.ar)
- **Example**:
  ```bash
  # Development (mock cert)
  AFIP_CERT_PATH=/app/certs/afip-mock.crt

  # Production
  AFIP_CERT_PATH=/app/certs/afip-production.crt
  ```

### `AFIP_KEY_PATH`
- **Type**: File Path
- **Required**: Yes
- **Secret**: Yes
- **Description**: Path to AFIP private key file
- **Example**:
  ```bash
  # Development (mock key)
  AFIP_KEY_PATH=/app/certs/afip-mock.key

  # Production
  AFIP_KEY_PATH=/app/certs/afip-production.key
  ```

### `AFIP_WSFEV1_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: AFIP electronic invoicing web service URL
- **Example**:
  ```bash
  # Development (mock)
  AFIP_WSFEV1_URL=http://afip-mock:3002/wsfev1

  # Production
  AFIP_WSFEV1_URL=https://servicios1.afip.gov.ar/wsfev1
  ```

### `AFIP_WSAA_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: AFIP authentication web service URL
- **Example**:
  ```bash
  # Development (mock)
  AFIP_WSAA_URL=http://afip-mock:3002/wsaa

  # Production
  AFIP_WSAA_URL=https://wsaa.afip.gov.ar/ws/services/LoginCms
  ```

### `AFIP_PUNTO_VENTA`
- **Type**: Integer
- **Required**: No
- **Default**: 1
- **Description**: AFIP point of sale number
- **Example**:
  ```bash
  AFIP_PUNTO_VENTA=1
  ```

---

## WhatsApp Integration

### `WHATSAPP_API_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: WhatsApp Business API base URL
- **Development**: Mock service URL
- **Production**: Meta Graph API URL
- **Example**:
  ```bash
  # Development (mock)
  WHATSAPP_API_URL=http://whatsapp-mock:3003

  # Production
  WHATSAPP_API_URL=https://graph.facebook.com/v18.0
  ```

### `WHATSAPP_ACCESS_TOKEN`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: WhatsApp Business API access token
- **Get From**: Meta Business Manager
- **Example**:
  ```bash
  # Development (mock)
  WHATSAPP_ACCESS_TOKEN=test_mock_whatsapp_token_development

  # Production
  WHATSAPP_ACCESS_TOKEN=EAAB1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
  ```

### `WHATSAPP_BUSINESS_PHONE`
- **Type**: String (phone number)
- **Required**: Yes
- **Format**: `+54 9 11 1234-5678` (Argentina format)
- **Description**: WhatsApp Business phone number
- **Example**:
  ```bash
  WHATSAPP_BUSINESS_PHONE=+5491112345678
  ```

### `WHATSAPP_PHONE_NUMBER_ID`
- **Type**: String
- **Required**: Yes
- **Description**: WhatsApp phone number ID from Meta
- **Example**:
  ```bash
  # Development (mock)
  WHATSAPP_PHONE_NUMBER_ID=test_phone_id_development

  # Production
  WHATSAPP_PHONE_NUMBER_ID=123456789012345
  ```

### `WHATSAPP_WEBHOOK_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: Webhook URL for WhatsApp events
- **Docker**: Use `backend` service name
- **Example**:
  ```bash
  # Docker Development
  WHATSAPP_WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp

  # Production
  WHATSAPP_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/whatsapp
  ```

### `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: Token for webhook verification (set in Meta config)
- **Example**:
  ```bash
  # Development
  WHATSAPP_WEBHOOK_VERIFY_TOKEN=test_webhook_verify_token_development

  # Production
  WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secure_verify_token_12345
  ```

---

## SMS Integration

### `SMS_API_URL`
- **Type**: URL
- **Required**: Yes
- **Description**: SMS gateway API base URL
- **Example**:
  ```bash
  # Development (mock)
  SMS_API_URL=http://sms-mock:3004

  # Production
  SMS_API_URL=https://api.smsgateway.com.ar
  ```

### `SMS_API_KEY`
- **Type**: String
- **Required**: Yes
- **Secret**: Yes
- **Description**: SMS gateway API key
- **Example**:
  ```bash
  # Development (mock)
  SMS_API_KEY=test_mock_sms_api_key_development

  # Production
  SMS_API_KEY=sk_live_1234567890abcdef
  ```

### `SMS_API_SECRET`
- **Type**: String
- **Required**: No
- **Secret**: Yes
- **Description**: SMS gateway API secret
- **Example**:
  ```bash
  SMS_API_SECRET=test_mock_sms_api_secret_development
  ```

### `SMS_PROVIDER`
- **Type**: String (enum)
- **Required**: No
- **Default**: mock
- **Valid Values**: `mock`, `twilio`, `nexmo`, `infobip`, `custom`
- **Description**: SMS provider name
- **Example**:
  ```bash
  SMS_PROVIDER=mock                # Development
  SMS_PROVIDER=twilio              # Production
  ```

### `SMS_WEBHOOK_URL`
- **Type**: URL
- **Required**: No
- **Description**: Webhook URL for SMS delivery status
- **Example**:
  ```bash
  # Docker Development
  SMS_WEBHOOK_URL=http://backend:3000/api/webhooks/sms

  # Production
  SMS_WEBHOOK_URL=https://api.barberpro.com.ar/api/webhooks/sms
  ```

### `SMS_COST_PER_SEGMENT`
- **Type**: Float
- **Required**: No
- **Default**: 0.05
- **Description**: Cost per SMS segment (for tracking)
- **Example**:
  ```bash
  SMS_COST_PER_SEGMENT=0.05        # ARS 0.05 per segment
  ```

### `SMS_SENDER_ID`
- **Type**: String
- **Required**: No
- **Default**: BarberPro
- **Description**: SMS sender ID (shown to recipients)
- **Example**:
  ```bash
  SMS_SENDER_ID=BarberPro
  ```

---

## Email Configuration

### `SMTP_HOST`
- **Type**: String (hostname)
- **Required**: Yes
- **Description**: SMTP server hostname
- **Example**:
  ```bash
  # Development (MailHog)
  SMTP_HOST=mailhog

  # Production (SendGrid)
  SMTP_HOST=smtp.sendgrid.net

  # Production (Gmail)
  SMTP_HOST=smtp.gmail.com
  ```

### `SMTP_PORT`
- **Type**: Integer
- **Required**: Yes
- **Common Values**: 25, 587, 465, 1025
- **Description**: SMTP server port
- **Example**:
  ```bash
  SMTP_PORT=1025                   # MailHog (development)
  SMTP_PORT=587                    # TLS (production)
  SMTP_PORT=465                    # SSL (production)
  ```

### `SMTP_SECURE`
- **Type**: Boolean
- **Required**: No
- **Default**: false
- **Description**: Use SSL/TLS connection
- **Example**:
  ```bash
  SMTP_SECURE=false                # Development (MailHog)
  SMTP_SECURE=true                 # Production (port 465)
  ```

### `SMTP_USER`
- **Type**: String
- **Required**: No
- **Secret**: Yes
- **Description**: SMTP authentication username
- **Example**:
  ```bash
  SMTP_USER=                       # Development (MailHog, no auth)
  SMTP_USER=apikey                 # SendGrid
  SMTP_USER=your-email@gmail.com   # Gmail
  ```

### `SMTP_PASSWORD`
- **Type**: String
- **Required**: No
- **Secret**: Yes
- **Description**: SMTP authentication password
- **Example**:
  ```bash
  SMTP_PASSWORD=                   # Development (MailHog, no auth)
  SMTP_PASSWORD=SG.abc123xyz       # SendGrid API key
  SMTP_PASSWORD=app_password       # Gmail app password
  ```

### `SMTP_FROM`
- **Type**: Email Address
- **Required**: Yes
- **Description**: Default sender email address
- **Example**:
  ```bash
  SMTP_FROM=noreply@barberpro.local      # Development
  SMTP_FROM=noreply@barberpro.com.ar     # Production
  ```

### `SMTP_FROM_NAME`
- **Type**: String
- **Required**: No
- **Default**: BarberPro
- **Description**: Default sender name
- **Example**:
  ```bash
  SMTP_FROM_NAME=BarberPro
  ```

### `MAILHOG_UI_URL`
- **Type**: URL
- **Required**: No (development only)
- **Description**: MailHog web UI URL
- **Example**:
  ```bash
  MAILHOG_UI_URL=http://localhost:8025
  ```

---

## Frontend Configuration

All frontend variables must start with `VITE_` (build-time) or `PUBLIC_` (runtime).

### `VITE_API_URL`
- **Type**: URL
- **Required**: Yes
- **Public**: Yes
- **Description**: Backend API URL (for browser requests)
- **IMPORTANT**: Use localhost, NOT Docker service names
- **Example**:
  ```bash
  # ✅ CORRECT
  VITE_API_URL=http://localhost:3000

  # ❌ WRONG (browser can't resolve Docker service names)
  VITE_API_URL=http://backend:3000
  ```

### `VITE_WS_URL`
- **Type**: URL (WebSocket)
- **Required**: No
- **Public**: Yes
- **Description**: WebSocket server URL
- **Example**:
  ```bash
  VITE_WS_URL=ws://localhost:3000         # Development
  VITE_WS_URL=wss://api.barberpro.com.ar  # Production
  ```

### `PUBLIC_API_URL`
- **Type**: URL
- **Required**: Yes
- **Public**: Yes
- **Description**: Public API URL (with /api prefix)
- **Example**:
  ```bash
  PUBLIC_API_URL=http://localhost:3000/api
  ```

### `PUBLIC_APP_NAME`
- **Type**: String
- **Required**: No
- **Default**: BarberPro
- **Public**: Yes
- **Description**: Application name
- **Example**:
  ```bash
  PUBLIC_APP_NAME=BarberPro
  ```

### `PUBLIC_APP_VERSION`
- **Type**: String (semver)
- **Required**: No
- **Default**: 1.0.0
- **Public**: Yes
- **Description**: Application version
- **Example**:
  ```bash
  PUBLIC_APP_VERSION=1.0.0
  ```

### Argentina Frontend Variables

```bash
PUBLIC_TIMEZONE=America/Argentina/Buenos_Aires
VITE_TIMEZONE=America/Argentina/Buenos_Aires
PUBLIC_LOCALE=es-AR
VITE_LOCALE=es-AR
PUBLIC_CURRENCY=ARS
VITE_CURRENCY=ARS
```

### MercadoPago Frontend Variables

```bash
# ✅ Use PUBLIC_MERCADOPAGO_PUBLIC_KEY (safe for browser)
PUBLIC_MERCADOPAGO_PUBLIC_KEY=test_mock_public_key_development
VITE_MERCADOPAGO_PUBLIC_KEY=test_mock_public_key_development

# ❌ NEVER expose MERCADOPAGO_ACCESS_TOKEN to frontend!
```

### Feature Flags

```bash
PUBLIC_ENABLE_SOCIAL_LOGIN=true
PUBLIC_ENABLE_WHATSAPP_SUPPORT=true
PUBLIC_ENABLE_SMS_NOTIFICATIONS=true
PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

### Support Contact

```bash
PUBLIC_SUPPORT_WHATSAPP=+5491112345678
PUBLIC_SUPPORT_EMAIL=soporte@barberpro.local
PUBLIC_SUPPORT_PHONE=+54 11 1234-5678
```

---

## Monitoring & Observability

### Prometheus

```bash
PROMETHEUS_URL=http://prometheus:9090
ENABLE_METRICS=true
PROMETHEUS_RETENTION_DAYS=7
```

### Grafana

```bash
GRAFANA_URL=http://localhost:3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin                # Change in production!
```

### Loki

```bash
LOKI_URL=http://loki:3100
LOKI_RETENTION_DAYS=7
```

### Sentry (Error Tracking)

```bash
# Backend
SENTRY_DSN=https://abc123@sentry.io/456789
SENTRY_ENVIRONMENT=development

# Frontend
VITE_SENTRY_DSN=https://xyz789@sentry.io/123456
```

### Logging

```bash
LOG_LEVEL=debug                            # development
LOG_LEVEL=warn                             # production
LOG_PRETTY=true                            # development
LOG_PRETTY=false                           # production (JSON logs)
```

---

## Admin Tools

### pgAdmin

```bash
PGADMIN_DEFAULT_EMAIL=admin@barberpro.local
PGADMIN_DEFAULT_PASSWORD=admin             # Change in production!
PGADMIN_PORT=8080
```

### Redis Commander

```bash
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin             # Change in production!
REDIS_COMMANDER_PORT=8081
```

---

## File Upload

```bash
# File size limit (bytes)
MAX_FILE_SIZE=10485760                     # 10MB

# Allowed MIME types
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# Upload destination
UPLOAD_DESTINATION=local                   # or s3, cloudinary
UPLOAD_DIR=./uploads

# S3 (if UPLOAD_DESTINATION=s3)
AWS_S3_BUCKET=barberpro-uploads
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=sa-east-1
```

---

## Testing

```bash
# Test environment
NODE_ENV=test

# Test database (separate from development)
TEST_DATABASE_URL=postgresql://barberpro:barberpro_dev_password@postgres:5432/barberpro_test

# Test Redis (different database)
TEST_REDIS_URL=redis://redis:6379/1

# Mock external services
MOCK_EXTERNAL_SERVICES=true
```

---

## Performance & Optimization

### Rate Limiting

```bash
RATE_LIMIT_MAX_REQUESTS=1000               # Development (lenient)
RATE_LIMIT_MAX_REQUESTS=100                # Production (strict)
RATE_LIMIT_WINDOW_MS=900000                # 15 minutes
RATE_LIMIT_BY_IP=true
RATE_LIMIT_SKIP_IPS=                       # Comma-separated IPs to skip
```

### Caching

```bash
CACHE_TTL=3600                             # Default cache TTL (seconds)
ENABLE_CACHE=true
```

---

## Docker Configuration

```bash
# Docker network
DOCKER_NETWORK=barberpro-network

# Container resource limits
BACKEND_CPU_LIMIT=1.0
BACKEND_MEMORY_LIMIT=1G
FRONTEND_CPU_LIMIT=0.5
FRONTEND_MEMORY_LIMIT=512M
```

---

## Variable Validation

### Required Variables Checklist

**Minimal Development Setup:**
```bash
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
```

**Production Additions:**
```bash
# Strong secrets
JWT_SECRET=<64-character-random-string>
SESSION_SECRET=<64-character-random-string>
POSTGRES_PASSWORD=<strong-password>

# Real service credentials
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
AFIP_CUIT=<real-cuit>
WHATSAPP_ACCESS_TOKEN=<real-token>

# Production URLs
FRONTEND_URL=https://barberpro.com.ar
BACKEND_URL=https://api.barberpro.com.ar

# Monitoring
SENTRY_DSN=https://...
```

---

## Best Practices

1. **Never commit secrets**: Use `.env.local` for personal overrides
2. **Use different databases**: Separate dev/test/prod databases
3. **Rotate secrets regularly**: Change production secrets periodically
4. **Use strong passwords**: Minimum 32 characters for production
5. **Validate URLs**: Ensure Docker service names vs localhost
6. **Document custom variables**: Add to this reference
7. **Environment-specific values**: Use appropriate values per environment
8. **Test configurations**: Verify all variables load correctly

---

## See Also

- [Environment Setup Guide](./environment-setup.md) - How to configure environments
- [Docker Troubleshooting](./troubleshooting-docker.md) - Common issues and solutions
- [Docker README](../docker/README.md) - Infrastructure documentation
