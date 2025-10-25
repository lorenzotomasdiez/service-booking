# Quick Start Guide: Registration Completion Implementation

**Feature**: Registration Completion with Email and Google OAuth
**Date**: 2025-10-25
**Target Audience**: Developers implementing this feature

This guide provides step-by-step instructions for setting up the development environment and implementing the registration completion feature.

---

## Prerequisites

Before starting, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ Node.js 24.6.0+ installed
- ✅ PostgreSQL 15 and Redis 7 running in Docker (via `npm start`)
- ✅ Access to Google Cloud Console (for OAuth credentials)
- ✅ Git repository cloned and on branch `002-registration-completion`

---

## Part 1: Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `BarberPro` (or your preference)
4. Click "Create"

### Step 2: Enable Google OAuth API

1. In the project dashboard, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google People API"
3. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (or Internal if G Workspace)
3. Click "Create"

**App Information**:
- App name: `BarberPro`
- User support email: Your email
- Developer contact: Your email

**Scopes**:
- Click "Add or Remove Scopes"
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click "Update"

**Test users** (for development):
- Add your Gmail address
- Add team members' Gmail addresses

Click "Save and Continue" → "Back to Dashboard"

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "+ Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: `BarberPro Backend`

**Authorized JavaScript origins**:
```
http://localhost:5173
http://localhost:3000
```

**Authorized redirect URIs**:
```
http://localhost:3000/api/auth/oauth/google/callback
```

5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

### Step 5: Add Credentials to Environment

Create or update `backend/.env`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**⚠️ Security Note**: Never commit `.env` files to git. They're already in `.gitignore`.

---

## Part 2: Email Service Setup

### Option A: MailHog (Development - Recommended)

MailHog is a local email testing tool that runs in Docker.

#### Step 1: Add MailHog to Docker Compose

The project already includes MailHog configuration. Verify it's present in `docker-compose.yml`:

```yaml
services:
  mailhog:
    image: mailhog/mailhog:latest
    container_name: barberpro-mailhog
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web UI
    networks:
      - barberpro-network
    restart: unless-stopped
```

#### Step 2: Configure Backend for MailHog

Update `backend/.env`:

```bash
# Email Configuration (Development - MailHog)
NODE_ENV=development
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@barberpro.com.ar
SMTP_FROM_NAME=BarberPro
SMTP_TIMEOUT=10000
SMTP_MAX_RETRIES=3
```

#### Step 3: Start MailHog

```bash
# Start all services (includes MailHog)
npm start

# Or just MailHog
docker-compose up -d mailhog
```

#### Step 4: Access MailHog Web UI

Open browser: http://localhost:8025

All verification emails will appear here.

### Option B: Resend (Production)

For production or testing real email delivery:

#### Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month, no credit card required)
3. Verify your email address

#### Step 2: Add Domain

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter: `barberpro.com.ar` (or your domain)
4. Add DNS records (DKIM, SPF, DMARC) as shown

#### Step 3: Generate API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name: `BarberPro Backend`
4. Permissions: **Send emails**
5. Click "Create"
6. Copy the API key (starts with `re_`)

#### Step 4: Configure Backend for Resend

Update `backend/.env.production`:

```bash
# Email Configuration (Production - Resend)
NODE_ENV=production
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxxxxxxxxxxx  # Your API key
SMTP_FROM=noreply@barberpro.com.ar
SMTP_FROM_NAME=BarberPro
SMTP_TIMEOUT=10000
SMTP_MAX_RETRIES=3
```

---

## Part 3: Database Migration

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install @fastify/oauth2 @fastify/cookie nodemailer axios
npm install --save-dev @types/nodemailer

# Return to root
cd ..
```

### Step 2: Update Prisma Schema

The data model is defined in `specs/002-registration-completion/data-model.md`.

Add to `backend/prisma/schema.prisma`:

```prisma
// Enums
enum AuthMethod {
  EMAIL
  OAUTH
  BOTH
}

enum OAuthProviderType {
  GOOGLE
  FACEBOOK
}

// Update User model
model User {
  // ... existing fields ...

  password        String?   // Made nullable for OAuth-only users
  isVerified      Boolean   @default(false)  // Now used
  authMethod      AuthMethod?
  emailVerifiedAt DateTime?

  // New relations
  emailVerificationTokens EmailVerificationToken[]
  oauthProviders          OAuthProvider[]

  // ... existing relations ...
}

// New models
model EmailVerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}

model OAuthProvider {
  id              String            @id @default(cuid())
  userId          String
  provider        OAuthProviderType
  providerUserId  String
  email           String
  profileData     Json?
  accessToken     String?
  refreshToken    String?
  tokenExpiresAt  DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
  @@index([userId])
  @@index([email])
  @@map("oauth_providers")
}
```

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

### Step 4: Create Migration

```bash
npm run db:migrate
# Migration name: add-email-verification-and-oauth
```

### Step 5: Verify Migration

```bash
# Check database
npm run db:studio

# Or using psql
docker exec -it barberpro-postgres psql -U postgres -d barberpro

# In psql:
\dt  # List tables (should see email_verification_tokens, oauth_providers)
\d users  # Describe users table (should see authMethod, emailVerifiedAt)
```

### Step 6: Backfill Existing Users

Create `backend/prisma/migrations/backfill-existing-users.sql`:

```sql
-- Set existing users as verified email users
UPDATE users
SET
  is_verified = true,
  auth_method = 'EMAIL',
  email_verified_at = created_at
WHERE created_at < NOW() AND auth_method IS NULL;
```

Run manually:

```bash
docker exec -i barberpro-postgres psql -U postgres -d barberpro < backend/prisma/migrations/backfill-existing-users.sql
```

---

## Part 4: Testing OAuth Flow Locally

### Step 1: Start Development Environment

```bash
# Start all services
npm start

# In separate terminal, check logs
npm run logs
```

### Step 2: Test OAuth Initiation

Open browser:
```
http://localhost:3000/api/auth/oauth/google/initiate
```

You should be redirected to Google's consent screen.

### Step 3: Grant Permissions

1. Select your Google account (must be added as test user)
2. Click "Continue" to grant permissions
3. You'll be redirected to: `http://localhost:3000/api/auth/oauth/google/callback?code=...&state=...`
4. Backend processes OAuth, then redirects to: `http://localhost:5173/auth/callback/google?token=...&refresh=...`

### Step 4: Verify User Created

```bash
# Check database
npm run db:studio

# Or API call
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Part 5: Testing Email Verification

### Step 1: Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com.ar",
    "password": "SecurePass123",
    "name": "Test User",
    "role": "CLIENT"
  }'
```

### Step 2: Check MailHog

1. Open http://localhost:8025
2. You should see a verification email
3. Click the email to view
4. Copy the verification link (looks like: `http://localhost:5173/verify-email?token=...`)

### Step 3: Verify Email

Either:
- **Option A**: Click the link in MailHog (opens in browser)
- **Option B**: Extract token and call API:

```bash
curl "http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN_HERE"
```

### Step 4: Check User is Verified

```bash
# Via Prisma Studio
npm run db:studio
# Check users table → isVerified should be true

# Or via API
curl http://localhost:3000/api/auth/verification-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Part 6: Frontend Setup

### Step 1: Add OAuth Button Component

Create `frontend/src/lib/components/OAuthButton.svelte`:

```svelte
<script lang="ts">
  export let provider: 'google' | 'facebook' = 'google';
  export let text: string = 'Continuar con Google';

  const handleOAuth = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    window.location.href = `${backendUrl}/api/auth/oauth/${provider}/initiate`;
  };
</script>

<button
  type="button"
  on:click={handleOAuth}
  class="oauth-button oauth-{provider}"
>
  {#if provider === 'google'}
    <!-- Google Icon SVG -->
  {/if}
  <span>{text}</span>
</button>
```

### Step 2: Add OAuth to Registration Pages

Update `frontend/src/routes/register/+page.svelte`:

```svelte
<script lang="ts">
  import OAuthButton from '$lib/components/OAuthButton.svelte';
</script>

<!-- Existing form -->

<!-- Add OAuth section -->
<div class="oauth-section">
  <div class="divider">O</div>
  <OAuthButton provider="google" text="Continuar con Google" />
</div>
```

### Step 3: Create OAuth Callback Page

Create `frontend/src/routes/auth/callback/google/+page.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const refresh = $page.url.searchParams.get('refresh');

    if (token && refresh) {
      // Store tokens
      authStore.setTokens({ accessToken: token, refreshToken: refresh });

      // Fetch user data
      await authStore.fetchUser();

      // Redirect to dashboard
      goto('/dashboard');
    } else {
      // Error handling
      goto('/register?error=oauth_failed');
    }
  });
</script>

<div class="loading">Autenticando...</div>
```

### Step 4: Create Email Verification Page

Create `frontend/src/routes/verify-email/+page.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authApi } from '$lib/api/auth';

  let loading = true;
  let success = false;
  let error = '';

  onMount(async () => {
    const token = $page.url.searchParams.get('token');

    if (!token) {
      error = 'Token de verificación no encontrado';
      loading = false;
      return;
    }

    try {
      await authApi.verifyEmail(token);
      success = true;
    } catch (err: any) {
      error = err.message || 'Error al verificar email';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="loading">Verificando email...</div>
{:else if success}
  <div class="success">
    <h2>Email verificado exitosamente</h2>
    <a href="/dashboard">Ir al Dashboard</a>
  </div>
{:else}
  <div class="error">
    <h2>Error al verificar email</h2>
    <p>{error}</p>
    <a href="/register">Volver al registro</a>
  </div>
{/if}
```

---

## Part 7: Manual Testing Checklist

### Email Registration Flow
- [ ] Navigate to http://localhost:5173/register
- [ ] Fill out registration form
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Check MailHog (http://localhost:8025) for verification email
- [ ] Click verification link
- [ ] Verify redirect to success page
- [ ] Check database: `isVerified = true`, `emailVerifiedAt` set

### Google OAuth Flow
- [ ] Navigate to http://localhost:5173/register
- [ ] Click "Continuar con Google"
- [ ] Verify redirect to Google consent screen
- [ ] Grant permissions
- [ ] Verify redirect back to app
- [ ] Check you're logged in (dashboard appears)
- [ ] Check database: user created with `authMethod = 'OAUTH'`, `isVerified = true`

### Separate Registration URLs
- [ ] Navigate to http://localhost:5173/register/client
- [ ] Verify role is pre-selected to CLIENT
- [ ] Complete registration
- [ ] Verify user has role CLIENT in database
- [ ] Navigate to http://localhost:5173/register/provider
- [ ] Verify role is pre-selected to PROVIDER
- [ ] Complete registration
- [ ] Verify user has role PROVIDER in database

### Error Handling
- [ ] Try registering with existing email → Verify error message
- [ ] Try OAuth with denied permissions → Verify error handling
- [ ] Try invalid verification token → Verify error message
- [ ] Try expired verification token (manually set expiresAt to past) → Verify error

---

## Part 8: Debugging Tips

### Check Backend Logs

```bash
# View all logs
npm run logs

# Filter for specific service
docker-compose logs -f backend

# Filter for OAuth/email
docker-compose logs -f backend | grep -i "oauth\|email"
```

### Check Redis State Tokens

```bash
# Access Redis CLI
docker exec -it barberpro-redis redis-cli

# In Redis CLI:
KEYS oauth:state:*         # List OAuth state tokens
GET oauth:state:YOUR_TOKEN  # View state data
TTL oauth:state:YOUR_TOKEN  # Check time-to-live
```

### Check Database Records

```bash
# Open Prisma Studio
npm run db:studio

# Or use psql
docker exec -it barberpro-postgres psql -U postgres -d barberpro

# Useful queries:
SELECT * FROM users WHERE email = 'test@example.com.ar';
SELECT * FROM email_verification_tokens WHERE user_id = 'USER_ID';
SELECT * FROM oauth_providers WHERE user_id = 'USER_ID';
```

### Common Issues

**Issue**: "OAuth redirect mismatch"
- **Fix**: Ensure `http://localhost:3000/api/auth/oauth/google/callback` is in Google Console → Authorized redirect URIs

**Issue**: "Email not sending"
- **Check**: MailHog is running (`docker ps | grep mailhog`)
- **Check**: `SMTP_HOST=mailhog` in backend/.env
- **Check**: Backend can reach MailHog (`docker exec barberpro-backend ping mailhog`)

**Issue**: "State token invalid"
- **Check**: Redis is running (`docker ps | grep redis`)
- **Check**: Backend can reach Redis (`docker exec barberpro-backend redis-cli -h redis ping`)
- **Check**: Token hasn't expired (10 minutes)

**Issue**: "CORS error on OAuth callback"
- **Fix**: Add `http://localhost:5173` to Google Console → Authorized JavaScript origins
- **Fix**: Ensure `FRONTEND_URL=http://localhost:5173` in backend/.env

---

## Part 9: Environment Variables Reference

### Backend .env (Development)

```bash
# Database (Docker)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/barberpro

# Redis (Docker)
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Email (MailHog)
NODE_ENV=development
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@barberpro.com.ar
SMTP_FROM_NAME=BarberPro
```

### Frontend .env (Development)

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

---

## Part 10: Production Deployment Checklist

Before deploying to production:

- [ ] Update Google OAuth redirect URIs to production URLs
- [ ] Replace MailHog with Resend (or production SMTP)
- [ ] Use HTTPS for all URLs (backend, frontend, OAuth redirects)
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Enable rate limiting on registration endpoints
- [ ] Set up email bounce handling
- [ ] Configure DNS records for email deliverability (SPF, DKIM, DMARC)
- [ ] Test email delivery to Gmail, Hotmail, Yahoo
- [ ] Set up monitoring for OAuth failures
- [ ] Set up monitoring for email delivery failures
- [ ] Configure cron job for expired token cleanup
- [ ] Review and adjust token expiration times (24h for email, 10min for OAuth state)

---

## Support

- **Documentation**: See `specs/002-registration-completion/` for full specifications
- **API Contracts**: See `specs/002-registration-completion/contracts/` for OpenAPI specs
- **Data Model**: See `specs/002-registration-completion/data-model.md` for database schema

---

**Status**: ✅ Quickstart guide complete. Developers can now set up and test the feature locally.
