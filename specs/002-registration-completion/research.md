# Research: Technology Decisions for Registration Completion

**Feature**: Registration Completion with Email and Google OAuth
**Date**: 2025-10-25
**Status**: Complete

This document captures all technology decisions made during Phase 0 research for implementing Google OAuth authentication and email verification flows in BarberPro.

---

## Research Task 1: Google OAuth Library Selection

### Decision

**Use `@fastify/oauth2` for Google OAuth 2.0 integration**

### Rationale

1. **Native Fastify Integration**: Official Fastify plugin (299 stars, actively maintained) that follows Fastify patterns with decorators, hooks, and plugin architecture
2. **TypeScript Support**: Native TypeScript definitions with declaration merging for strict typing
3. **Modern Security**: Built-in PKCE (Proof Key for Code Exchange) support with `pkce: 'S256'`, state parameter validation, and cookie-based security
4. **Multi-Provider Support**: Pre-configured for Google, Facebook, GitHub, Microsoft, Apple - future-proofs template replication strategy
5. **Ease of JWT Integration**: Straightforward flow that works seamlessly with existing `@fastify/jwt` system

### Alternatives Considered

- **`passport-google-oauth20`**: Rejected - Built for Express, requires beta `@fastify/passport` with compatibility issues
- **`googleapis` (google-auth-library)**: Not recommended - Excellent for server-to-server auth but over-engineered for user-facing OAuth flows; requires manual implementation of authorization URL generation, callback handling, and state management

### Implementation Notes

**Required Dependencies**:
```bash
npm install @fastify/oauth2 @fastify/cookie axios
```

**Note**: `@fastify/cookie` is required as of v7.2.0+ for secure PKCE and state management.

**Configuration Approach**:
- Plugin registration order: Register `@fastify/cookie` BEFORE `@fastify/oauth2`
- Use `OAuth2Plugin.GOOGLE_CONFIGURATION` for pre-configured Google endpoints
- Enable PKCE with `pkce: 'S256'` for security
- Request scopes: `['profile', 'email']`

**Integration Points**:
1. User initiates OAuth → `@fastify/oauth2` handles redirect to Google
2. Google callback → Extract user profile via `token.access_token`
3. Create/update user in database
4. Generate JWT with existing `@fastify/jwt` → Return to frontend

**Security Considerations**:
- Always use PKCE to prevent authorization code interception
- State validation is automatic via `@fastify/cookie`
- Ensure `BACKEND_URL` uses HTTPS in production for OAuth callbacks
- Never store Google access tokens long-term; generate own JWT

---

## Research Task 2: Email Service Provider Selection

### Decision

**Production**: **Resend** (primary) or **Mailgun** (alternative)
**Development**: **MailHog** (Docker-based local testing)

### Rationale

**Resend (Primary)**:
1. **Modern Developer Experience**: Built for developers with excellent TypeScript/Node.js SDK
2. **Generous Free Tier**: 3,000 emails/month free, no credit card required
3. **Excellent Deliverability**: Modern infrastructure with built-in DKIM/SPF/DMARC
4. **Simple Pricing**: $20/month for 50,000 emails when ready to scale
5. **Docker-Friendly**: Pure API-based service, no special Docker configuration

**Mailgun (Alternative)**:
1. **Proven Track Record**: Mature service with 11.4% better deliverability than SendGrid
2. **Free Tier**: 100 emails/day (~3,000/month) with no expiration
3. **Built-in Validation**: Email validation before sending, reducing bounces
4. **Enterprise Ready**: Easy scaling to $15/month for 10,000 emails

**MailHog (Development)**:
1. **Zero External Dependencies**: Runs entirely in Docker, no internet required
2. **Visual Testing**: Web UI at localhost:8025 to preview emails
3. **Safe Testing**: Never accidentally sends emails to real users
4. **Already Configured**: Project has `email.config.ts` ready for MailHog

### Alternatives Considered

- **SendGrid**: Rejected - Free tier eliminated (July 2025), now requires $19.95/month minimum
- **AWS SES**: Not recommended for MVP - Complex setup (IAM, sandbox exit), regional pricing disadvantages for Argentina
- **Nodemailer + Gmail SMTP**: Rejected - 500 emails/day limit, account suspension risk, violates Gmail ToS

### Implementation Notes

**Argentina-Specific Considerations**:
- Gmail & Hotmail dominate 70%+ of Argentina email traffic
- No .com.ar domain penalties from major providers
- SPF, DKIM, DMARC required for 5,000+ emails/day (Gmail/Yahoo policy 2025)
- Keep spam rates < 0.3% complaint rate

**Docker Configuration (Development)**:
```yaml
# Add to docker-compose.yml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - "1025:1025"  # SMTP server
    - "8025:8025"  # Web UI
```

**Environment Variables**:
- Development: `SMTP_HOST=mailhog`, `SMTP_PORT=1025`, `SMTP_SECURE=false`
- Production (Resend): `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_SECURE=true`

**Rate Limiting**:
- Max 3 verification emails per hour per user
- 5-minute cooldown between requests
- Implement with Redis using existing infrastructure

**Cost Comparison (MVP: 5,000 emails/month)**:
- Resend: $0/month (free tier)
- Mailgun: $0/month (free tier) or $15/month
- SendGrid: $19.95/month (no free tier)
- AWS SES: $0.50/month (complex setup)

---

## Research Task 3: Email Verification Token Strategy

### Decision

**Use cryptographic random tokens (`crypto.randomBytes(32)`) with bcrypt hashing and database storage**

### Rationale

1. **Security**: 256-bit entropy (2^256 combinations) makes tokens impossible to guess
2. **Integration**: Aligns with existing Prisma/Fastify/bcrypt stack patterns
3. **Single-Use Enforcement**: Database-backed revocation is trivial - delete token after validation
4. **Defense-in-Depth**: Hashing tokens with bcrypt protects even if database is compromised
5. **Simplicity**: Consistent with existing `RefreshToken` model pattern in codebase

### Alternatives Considered

- **JWT-based tokens**: Rejected - No reliable single-use enforcement (stateless nature defeats purpose), requires database blacklist anyway
- **Random UUID tokens**: Rejected - Weaker entropy (122 bits vs 256 bits), no hashing, not industry standard
- **Plain crypto tokens (no hashing)**: Considered - Works but lacks defense-in-depth that bcrypt provides

### Implementation Notes

**Database Schema**:
```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique  // bcrypt hash of actual token
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

**Token Generation**:
```typescript
const tokenBuffer = crypto.randomBytes(32);
const token = tokenBuffer.toString('hex'); // 64 hex characters
const tokenHash = await bcrypt.hash(token, 10);
```

**Validation Flow**:
1. User registers → Generate token → Store hash in database → Send raw token in email
2. User clicks link → System validates token hash → Marks email verified → Deletes token
3. Token expires after 24 hours automatically

**Security Properties**:
- Token guessing: 2^256 combinations (infeasible)
- Brute force: Rate limiting on verification endpoint
- Replay attacks: Token deleted after first use (Prisma transaction)
- Database compromise: Bcrypt hash protects tokens
- Timing attacks: `bcrypt.compare()` is constant-time

**Cleanup Strategy**:
- Database-enforced `expiresAt` check in queries
- Daily cron job to delete expired tokens (similar to RefreshToken cleanup)

---

## Research Task 4: OAuth State Management Strategy

### Decision

**Store OAuth state tokens in Redis with short TTL (10 minutes)**

### Rationale

1. **Infrastructure Alignment**: Redis 7 already running in Docker; RedisService fully configured at `/backend/src/services/redis.ts`
2. **Performance**: Sub-millisecond latency (<1ms) vs PostgreSQL (~5-20ms) for OAuth flows
3. **Security**: Native TTL ensures automatic expiration, easy single-use deletion
4. **Scalability**: Shared state across multiple backend instances (multi-pod deployments)
5. **Simplicity**: No database migrations, no cron jobs - TTL handles cleanup automatically

### Alternatives Considered

- **PostgreSQL Database**: Rejected - Over-engineering for 10-minute data, performance overhead, requires migrations and cleanup jobs
- **In-Memory Storage**: Rejected - Single-instance limitation, no persistence across restarts, production incompatible
- **Signed JWT**: Rejected - Cannot revoke/invalidate, replay vulnerability, against OAuth best practices

### Implementation Notes

**Key Naming Convention**:
```typescript
const key = `oauth:state:${randomStateToken}`;
// Example: oauth:state:a8b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7
```

**TTL Configuration**:
```typescript
const STATE_TOKEN_TTL = 10 * 60; // 10 minutes in seconds
```

**Storage Schema**:
```typescript
interface OAuthState {
  state: string;           // Random state token (UUID v4)
  redirectUri: string;     // Where to redirect after OAuth
  userId?: string;         // Optional: if user was logged in
  createdAt: number;       // Timestamp for debugging
  nonce?: string;          // Optional: OIDC nonce
}

await redisService.setJSON(`oauth:state:${state}`, oauthStateData, STATE_TOKEN_TTL);
```

**Cleanup Strategy**:
- Redis handles cleanup automatically via TTL expiration
- No manual cleanup needed
- Explicit deletion after successful validation for single-use enforcement

**Integration with Existing Code**:
- Reuse existing `RedisService` at `/backend/src/services/redis.ts`
- Follows same patterns as session management (`session:${userId}`)
- Redis Commander already available on `localhost:8081` for debugging

**Monitoring**:
- Track: `oauth_state_created_total`, `oauth_state_validated_total`, `oauth_state_expired_total`
- Monitor Redis memory usage via `redis-cli INFO memory`

---

## Research Task 5: SvelteKit Registration Routing Strategy

### Decision

**Use separate pages with shared component (`RegistrationForm.svelte`)**

**File Structure**:
```
/routes/register/
  +page.svelte              # Existing dual-role selection
  /client/+page.svelte      # Client-specific registration
  /provider/+page.svelte    # Provider-specific registration

/lib/components/
  RegistrationForm.svelte   # Shared form component
```

### Rationale

1. **Code Reuse**: Single `RegistrationForm.svelte` component shared across all three pages
2. **SEO Friendly**: Clean URLs (`/register/client`, `/register/provider`) perfect for marketing campaigns
3. **Ease of Maintenance**: Form logic changes happen in one place
4. **TypeScript Type Safety**: Strong typing for `role` prop: `role: 'client' | 'provider' | null`
5. **Matches Existing Patterns**: Codebase already uses this pattern in `/dashboard/client/` and `/dashboard/provider/`

### Alternatives Considered

- **Nested routes with layout**: Rejected - Unnecessary complexity, layouts better for UI chrome not form logic
- **Route parameters `[role]`**: Rejected - Allows arbitrary URLs, less explicit for SEO
- **Query parameters `?role=client`**: Rejected - Poor SEO, harder analytics tracking

### Implementation Notes

**Component Sharing Strategy**:
```typescript
// /routes/register/+page.svelte (existing)
<RegistrationForm role={null} />

// /routes/register/client/+page.svelte (new)
<RegistrationForm role="client" />

// /routes/register/provider/+page.svelte (new)
<RegistrationForm role="provider" />
```

**Role Parameter Passing**:
- `role={null}`: Shows dual-role selection (existing behavior)
- `role="client"`: Pre-selects CLIENT, hides role selection UI
- `role="provider"`: Pre-selects PROVIDER, hides role selection UI

**Type Safety**:
```typescript
export let role: 'client' | 'provider' | null = null;
```

**SEO Benefits**:
- Each route can have unique `<svelte:head>` metadata
- Client page: "Reserva servicios de barbería - BarberPro"
- Provider page: "Ofrece tus servicios de barbería - BarberPro"

**Marketing Benefits**:
- Direct links for Facebook Ads: `/register/provider` for barber recruitment
- Instagram links for clients: `/register/client`
- Better targeted campaigns with role-specific messaging

**Migration Path**:
1. Extract current logic into `RegistrationForm.svelte`
2. Update `/register/+page.svelte` to use component
3. Create new client/provider routes
4. Add analytics tracking per route
5. Update marketing materials with new URLs

---

## Summary of Technology Stack

| Component | Decision | Alternative Rejected |
|-----------|----------|---------------------|
| **Google OAuth** | @fastify/oauth2 | passport-google-oauth20, googleapis |
| **Email Service (Prod)** | Resend | SendGrid, AWS SES |
| **Email Service (Dev)** | MailHog | Ethereal, Gmail SMTP |
| **Verification Tokens** | crypto.randomBytes() + bcrypt | JWT, UUID |
| **OAuth State Storage** | Redis (10min TTL) | PostgreSQL, In-memory, JWT |
| **Frontend Routing** | Separate pages + shared component | Layout, route params, query params |

---

## Implementation Dependencies

**Backend**:
```bash
npm install @fastify/oauth2 @fastify/cookie nodemailer axios
npm install --save-dev @types/nodemailer
```

**Frontend**: No new dependencies (existing SvelteKit, Zod, TailwindCSS)

**Infrastructure**:
- MailHog Docker service (development)
- Resend account (production)
- Redis already configured

---

## Environment Variables Required

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Email Service (Development - MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=noreply@barberpro.com.ar
SMTP_FROM_NAME=BarberPro

# Email Service (Production - Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxxxxxxxxxxx
```

---

## Next Steps

All research tasks completed. Ready to proceed to Phase 1:
1. Generate `data-model.md` for EmailVerificationToken and OAuth models
2. Generate API contracts (OpenAPI specs) for OAuth and verification endpoints
3. Generate `quickstart.md` for developer setup guide
4. Update agent context with new technologies

**Research Status**: ✅ COMPLETE - All technology decisions finalized and documented
