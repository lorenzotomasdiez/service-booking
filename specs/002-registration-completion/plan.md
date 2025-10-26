# Implementation Plan: Registration Completion with Email and Google OAuth

**Branch**: `002-registration-completion` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-registration-completion/spec.md`

## Summary

Complete the user registration system by implementing Google OAuth 2.0 authentication and email verification flows. The existing email/password registration is fully functional; this plan adds OAuth integration for frictionless signup, email verification for security, and separate registration URLs for customer/provider user journeys.

**Key Technical Additions**:
- Google OAuth 2.0 backend integration with secure callback handling
- Email verification service with token generation and SMTP integration
- Separate SvelteKit routes for role-specific registration URLs
- Rate limiting for registration endpoints to prevent abuse

## Technical Context

**Language/Version**: TypeScript 5.9.2 with Node.js 24.6.0 (backend), TypeScript with SvelteKit/Vite (frontend)
**Primary Dependencies**:
- Backend: Fastify 5.6.0, Prisma 6.15.0 (ORM), @fastify/jwt (existing auth), Nodemailer (email), Google OAuth2 client library
- Frontend: SvelteKit (Vite-based), Zod (validation - existing), TailwindCSS (styling - existing)

**Storage**: PostgreSQL 15 (primary database - existing), Redis 7 (session/token caching - existing, Docker environment)
**Testing**: Jest (backend), Vitest (frontend), Supertest (API integration tests), Playwright (E2E)
**Target Platform**: Web application (desktop + mobile PWA), Docker Compose local development, Railway/AWS production
**Project Type**: Web (monorepo with separate backend/ and frontend/ directories)
**Performance Goals**:
- OAuth flow complete in <30 seconds
- Email verification sent within 500ms of registration
- Form validation feedback within 500ms
- Support 100 concurrent registrations

**Constraints**:
- Must maintain Argentina-first localization (es-AR, timezone, phone/DNI formats)
- Must work offline for core flows (PWA requirement - not applicable to registration)
- Must integrate with existing JWT authentication system
- Must support existing dual-role selection (CLIENT/PROVIDER)
- Email verification required before full account access

**Scale/Scope**:
- ~10 new backend routes (OAuth endpoints, verification endpoints)
- ~3 new frontend routes (/register/client, /register/provider, /verify-email)
- 2 new database models (EmailVerificationToken, OAuthProvider)
- ~8-12 new service methods (OAuth, email, verification)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-Driven Development (TDD) - ✅ COMPLIANT

**Status**: PASS - Plan enforces TDD workflow

**Verification**:
- All implementation tasks will require tests written FIRST
- Email verification service tests before implementation
- OAuth callback handler tests before implementation
- Registration route tests before implementation
- CI/CD coverage gates already in place (80%+)

**Action**: Tasks will be ordered as: Write test → Run test (verify RED) → Write implementation → Verify test GREEN → Refactor

---

### Principle II: Dockerized Local Development - ✅ COMPLIANT

**Status**: PASS - No changes to Docker environment needed

**Verification**:
- All services (PostgreSQL, Redis, backend, frontend) already Dockerized
- Hot reload working (tsx watch on backend, Vite HMR on frontend)
- `npm start` workflow unchanged
- No new external dependencies outside Docker

**Action**: No special configuration needed. OAuth credentials will be added to auto-generated `.env` files.

---

### Principle III: TypeScript Everywhere - ✅ COMPLIANT

**Status**: PASS - All new code will be TypeScript

**Verification**:
- OAuth service: TypeScript with strict types
- Email service: TypeScript with strict types
- API contracts: Zod schemas for validation
- Frontend routes: TypeScript SvelteKit components
- Shared types between frontend/backend (OAuth state, verification tokens)

**Action**: No `any` types permitted. All external library types will be properly declared.

---

### Principle IV: Argentina-First Localization - ✅ COMPLIANT

**Status**: PASS - Argentina localization maintained

**Verification**:
- Email templates in Spanish (es-AR)
- Timezone America/Argentina/Buenos_Aires preserved
- Phone/DNI validation unchanged
- WhatsApp integration consideration for verification (future enhancement)
- Error messages in Spanish

**Action**: Email verification templates will be in Spanish. OAuth error messages in Spanish.

---

### Principle V: Multi-Tenant Template Architecture - ✅ COMPLIANT

**Status**: PASS - OAuth and email verification are vertical-agnostic

**Verification**:
- Google OAuth is generic (works for barbers, psychologists, doctors, etc.)
- Email verification is universal across verticals
- No barber-specific logic in OAuth or email flows
- User role (CLIENT/PROVIDER) already abstracted

**Action**: OAuth and email services will be placed in core `/backend/src/services/` (not niche-specific).

---

### Principle VI: PWA Performance - ✅ COMPLIANT

**Status**: PASS - No performance degradation expected

**Verification**:
- OAuth redirects don't block UI (external redirect)
- Email verification is async (non-blocking)
- Registration form validation already optimized
- No additional bundle size concerns (OAuth library is backend-only)

**Action**: Frontend OAuth button will use standard link navigation (no heavy client library).

---

### Principle VII: Enterprise-Grade Observability - ✅ COMPLIANT

**Status**: PASS - Logging and monitoring extended to new flows

**Verification**:
- OAuth attempts logged with correlation IDs
- Email verification sends logged (success/failure)
- Registration errors tracked in structured logs
- Rate limiting violations logged

**Action**: Add structured logging to OAuth service and email service using existing Winston/Pino setup.

---

### Constitution Compliance Summary

**Overall Status**: ✅ PASS - No violations, no complexity budget required

All seven constitutional principles are satisfied. Feature aligns with existing architecture and requires no exceptions or justifications.

---

### Post-Design Re-Check (After Phase 1)

*This section will be updated after data model and contracts are finalized.*

**Status**: PENDING - Re-check after Phase 1 completion

## Project Structure

### Documentation (this feature)

```text
specs/002-registration-completion/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology decisions for OAuth & Email
├── data-model.md        # Phase 1 output - EmailVerificationToken & OAuthProvider models
├── quickstart.md        # Phase 1 output - Developer setup guide for OAuth & Email testing
├── contracts/           # Phase 1 output - OpenAPI specs for new endpoints
│   ├── oauth-endpoints.yaml
│   ├── verification-endpoints.yaml
│   └── registration-routes.yaml
├── checklists/          # Already exists
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (existing monorepo)

backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts                    # [EXTEND] Add OAuth & verification endpoints
│   │   └── NEW: oauth.ts              # [CREATE] OAuth callback handler routes
│   ├── services/
│   │   ├── auth.ts                    # [EXISTING] Core auth service
│   │   ├── user.ts                    # [EXISTING] User CRUD service
│   │   ├── NEW: oauth.service.ts      # [CREATE] Google OAuth integration
│   │   ├── NEW: email.service.ts      # [CREATE] Email sending service (Nodemailer)
│   │   └── NEW: verification.service.ts # [CREATE] Email verification token management
│   ├── config/
│   │   └── oauth.config.ts            # [CREATE] OAuth provider configuration
│   └── types/
│       └── NEW: oauth.types.ts        # [CREATE] OAuth state, tokens, provider types
└── tests/
    ├── integration/
    │   ├── NEW: oauth.test.ts         # [CREATE] OAuth flow integration tests
    │   ├── NEW: verification.test.ts  # [CREATE] Email verification tests
    │   └── registration.test.ts       # [EXTEND] Add OAuth & verification scenarios
    └── unit/
        ├── NEW: oauth.service.test.ts # [CREATE] OAuth service unit tests
        ├── NEW: email.service.test.ts # [CREATE] Email service unit tests
        └── NEW: verification.service.test.ts # [CREATE] Verification service tests

frontend/
├── src/
│   ├── routes/
│   │   ├── register/
│   │   │   ├── +page.svelte           # [EXISTING] Main registration page
│   │   │   ├── NEW: client/+page.svelte     # [CREATE] Client-specific registration
│   │   │   └── NEW: provider/+page.svelte   # [CREATE] Provider-specific registration
│   │   ├── NEW: verify-email/
│   │   │   └── +page.svelte           # [CREATE] Email verification confirmation page
│   │   └── NEW: auth/
│   │       └── callback/
│   │           └── google/+page.svelte # [CREATE] OAuth callback handler
│   ├── lib/
│   │   ├── api/
│   │   │   └── auth.ts                # [EXTEND] Add OAuth & verification API calls
│   │   ├── stores/
│   │   │   └── auth.ts                # [EXTEND] Add OAuth state management
│   │   └── components/
│   │       └── NEW: OAuthButton.svelte # [CREATE] Reusable OAuth button component
│   └── types/
│       └── NEW: oauth.types.ts        # [CREATE] OAuth frontend types (shared with backend)
└── tests/
    └── NEW: registration-oauth.spec.ts # [CREATE] Playwright E2E OAuth flow test

backend/prisma/
├── schema.prisma                      # [EXTEND] Add EmailVerificationToken & OAuthProvider models
└── migrations/
    └── NEW: add-verification-oauth/   # [CREATE] Database migration for new models

docker-compose.yml                     # [NO CHANGE] All services already configured
.env.example                           # [EXTEND] Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SMTP config
```

**Structure Decision**: Web application structure (Option 2) is used. The project is a monorepo with separate `backend/` and `frontend/` directories. This feature extends existing registration functionality by adding:
- Backend: 3 new services (OAuth, Email, Verification), 1 new route file, 2 new database models
- Frontend: 3 new routes (client/provider registration, verification page, OAuth callback), 1 new component

**File Modification Legend**:
- `[EXISTING]`: File already exists, no changes needed
- `[EXTEND]`: File exists, will be modified to add new functionality
- `[CREATE]`: New file to be created
- `NEW:`: Prefix for new files/directories

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitutional violations detected. All principles compliant.

This section is intentionally left empty as there are no complexity budget items requiring justification.

## Phase 0: Research & Technology Decisions

### Research Tasks

The following unknowns from Technical Context require research before design:

1. **Google OAuth Library Selection**
   - Unknown: Which Node.js library for Google OAuth 2.0?
   - Research: Evaluate `googleapis` vs `passport-google-oauth20` vs `@fastify/oauth2`
   - Decision criteria: TypeScript support, Fastify compatibility, maintenance status

2. **Email Service Provider**
   - Unknown: SMTP configuration or transactional email service (SendGrid, Mailgun, AWS SES)?
   - Research: Argentina-specific email delivery considerations, cost, ease of setup
   - Decision criteria: Deliverability in Argentina, Docker compatibility, cost for MVP

3. **Email Verification Token Strategy**
   - Unknown: JWT-based tokens vs random UUID tokens?
   - Research: Security best practices for email verification, expiration handling
   - Decision criteria: Security, ease of implementation, token storage requirements

4. **OAuth State Management**
   - Unknown: Redis vs database vs in-memory for OAuth state tokens?
   - Research: Best practices for OAuth CSRF protection, state token storage
   - Decision criteria: Security, performance, existing Redis infrastructure

5. **Separate Registration URL Strategy**
   - Unknown: SvelteKit routing approach for `/register/client` and `/register/provider`?
   - Research: Nested routes vs separate pages, shared component strategy
   - Decision criteria: Code reuse, SEO, maintenance burden

### Research Deliverable

`research.md` will document:
- **Decision**: Chosen technology/approach
- **Rationale**: Why it was selected
- **Alternatives Considered**: What else was evaluated and why rejected
- **Implementation Notes**: Key integration points with existing architecture

**Output**: `specs/002-registration-completion/research.md`

## Phase 1: Design & Contracts

### Prerequisites

✅ Phase 0 (`research.md`) must be complete before Phase 1 begins

### 1. Data Model Design

**Extract entities from spec** → `data-model.md`:

From functional requirements and existing implementation, the following models are needed:

#### EmailVerificationToken
- **Purpose**: Store time-limited tokens for email verification
- **Fields**: id, userId, token (unique), email, expiresAt, verifiedAt, createdAt
- **Relationships**: Belongs to User (userId foreign key)
- **Validation**: Token expires after 24 hours, single-use
- **State Transitions**: Created → Verified (or Expired)

#### OAuthProvider (optional - may extend User model instead)
- **Purpose**: Link Google OAuth accounts to users
- **Fields**: id, userId, provider ('GOOGLE'), providerUserId, email, profileData (JSON)
- **Relationships**: Belongs to User (userId foreign key)
- **Validation**: Unique constraint on (provider, providerUserId)
- **State Transitions**: N/A (read-only after creation)

#### User Model Extensions
- **New Fields**: authMethod (enum: 'EMAIL', 'OAUTH', 'BOTH'), oauthProviderId (optional reference)
- **Existing Fields**: isVerified (already exists but unused), email (already unique)

**Output**: `specs/002-registration-completion/data-model.md`

---

### 2. API Contract Generation

**Generate OpenAPI contracts** from functional requirements:

#### OAuth Endpoints (`contracts/oauth-endpoints.yaml`)

```yaml
POST /auth/oauth/google/initiate
  - Initiates Google OAuth flow
  - Returns: redirectUrl, state token

GET /auth/oauth/google/callback
  - OAuth callback handler
  - Query params: code, state
  - Returns: accessToken, refreshToken, user

POST /auth/oauth/google/register
  - Complete OAuth registration after callback
  - Body: oauthCode, state, role (CLIENT/PROVIDER)
  - Returns: accessToken, refreshToken, user
```

#### Email Verification Endpoints (`contracts/verification-endpoints.yaml`)

```yaml
POST /auth/send-verification
  - Send verification email to user
  - Body: email
  - Returns: success message

GET /auth/verify-email
  - Verify email with token
  - Query params: token
  - Returns: success message

POST /auth/resend-verification
  - Resend verification email
  - Body: email
  - Returns: success message (rate limited)
```

#### Registration Route Extensions (`contracts/registration-routes.yaml`)

```yaml
POST /auth/register
  - [EXISTING] Extend to send verification email after user creation
  - [EXISTING] Add authMethod: 'EMAIL' to user creation

# Frontend Routes (not API, but documented for contracts)
/register/client
  - Client-specific registration page (role pre-selected)

/register/provider
  - Provider-specific registration page (role pre-selected)

/verify-email?token=xxx
  - Email verification confirmation page
```

**Output**:
- `specs/002-registration-completion/contracts/oauth-endpoints.yaml`
- `specs/002-registration-completion/contracts/verification-endpoints.yaml`
- `specs/002-registration-completion/contracts/registration-routes.yaml`

---

### 3. Quickstart Guide

**Generate developer setup guide** → `quickstart.md`:

Content will include:
- **Google OAuth Setup**: How to create Google Cloud project, obtain client ID/secret
- **Environment Variables**: Required `.env` additions (GOOGLE_CLIENT_ID, SMTP config)
- **Database Migration**: Running `npm run db:migrate` for new models
- **Email Testing**: Using MailHog or Ethereal for local email testing
- **OAuth Testing**: Testing OAuth flow locally with ngrok (if needed for callback URL)
- **Manual Testing Checklist**: Step-by-step registration flows to verify

**Output**: `specs/002-registration-completion/quickstart.md`

---

### 4. Agent Context Update

**Run agent context update script**:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will:
- Detect that Claude Code is in use
- Update `CLAUDE.md` with new technologies:
  - Google OAuth 2.0 integration
  - Nodemailer email service
  - Email verification token system
- Preserve existing manual additions
- Add only new technology from this plan

**Output**: Updated `.specify/memory/claude.md` (or equivalent agent-specific file)

---

## Phase 2: Task Generation

**Command**: `/speckit.tasks` (separate command, not part of this plan)

After Phase 1 is complete, the `/speckit.tasks` command will:
- Generate dependency-ordered tasks in `tasks.md`
- Each task follows TDD workflow (test → implementation → refactor)
- Tasks reference data model, contracts, and quickstart guide
- Tasks are prioritized by user story priority (P1 → P2 → P3)

**Output**: `specs/002-registration-completion/tasks.md` (NOT created by this command)

---

## Post-Design Constitution Re-Check

*This section is completed after Phase 1 design artifacts are generated.*

**Status**: ✅ COMPLETE - All constitution principles verified against design artifacts

**Items verified**:
- [x] **Data model maintains Argentina timezone/locale defaults**
  - ✅ User model defaults: `timezone: "America/Argentina/Buenos_Aires"`, `locale: "es-AR"`
  - ✅ EmailVerificationToken stores email address (Argentina .com.ar domains supported)
  - ✅ OAuthProvider profileData includes locale information

- [x] **API contracts use Spanish error messages**
  - ✅ All error responses have Spanish `message` field: "Email inválido", "Token de verificación inválido o expirado", etc.
  - ✅ Success messages in Spanish: "Email verificado exitosamente", "Cuenta creada. Por favor, verifica tu email."
  - ✅ Error codes in English for programmatic handling, messages in Spanish for users

- [x] **OAuth integration is vertical-agnostic (no barber-specific logic)**
  - ✅ Google OAuth works for any service vertical (barbers, psychologists, doctors, etc.)
  - ✅ OAuthProvider model is generic (provider enum extensible to FACEBOOK, APPLE, etc.)
  - ✅ No barber-specific fields or logic in OAuth service design

- [x] **Email templates support es-AR localization**
  - ✅ Quickstart guide specifies Spanish email templates
  - ✅ EmailService sends emails with `locale: 'es-AR'` context
  - ✅ Verification email text: "¡Bienvenido a BarberPro!", "Por favor, verifica tu email"

- [x] **No TypeScript `any` types in contracts or services**
  - ✅ Research document specifies strict TypeScript with no `any` types
  - ✅ API contracts use proper TypeScript types (User, Error, OAuthState schemas)
  - ✅ Prisma schema generates fully-typed models

- [x] **New endpoints have rate limiting specs**
  - ✅ POST /auth/register: Rate limited to 5 registrations per IP per hour
  - ✅ POST /auth/send-verification: Rate limited to 3 emails per hour per email
  - ✅ POST /auth/resend-verification: Rate limited to 3 emails per hour
  - ✅ All rate limits documented in OpenAPI specs with 429 responses

- [x] **Logging added to all new services**
  - ✅ Research document specifies structured logging for OAuth and email services
  - ✅ OAuth attempts logged with correlation IDs
  - ✅ Email verification sends logged (success/failure)
  - ✅ Rate limiting violations logged

### Constitution Compliance Summary (Post-Design)

**Overall Status**: ✅ PASS - All design artifacts comply with constitutional principles

| Principle | Pre-Design Status | Post-Design Status | Notes |
|-----------|-------------------|-------------------|-------|
| I. TDD | ✅ PASS | ✅ PASS | Test-first workflow maintained in design |
| II. Docker | ✅ PASS | ✅ PASS | MailHog added to Docker Compose |
| III. TypeScript | ✅ PASS | ✅ PASS | Strict typing in all contracts, no `any` |
| IV. Argentina-First | ✅ PASS | ✅ PASS | Spanish errors, timezone defaults, .com.ar support |
| V. Multi-Tenant | ✅ PASS | ✅ PASS | OAuth/email verification vertical-agnostic |
| VI. PWA Performance | ✅ PASS | ✅ PASS | No performance degradation in design |
| VII. Observability | ✅ PASS | ✅ PASS | Logging specified for all new services |

**No violations detected. Feature design is ready for implementation.**

---

## Implementation Notes

### Critical Integration Points

1. **Existing JWT System**: OAuth flow must generate same JWT tokens as email/password flow
2. **Existing User Model**: Must extend without breaking existing authentication
3. **Existing Registration Form**: Must add OAuth button without disrupting form validation
4. **Existing Role Selection**: Must work with both dual-role selection and separate URLs

### Security Considerations

1. **OAuth State Validation**: CSRF protection via state parameter
2. **Email Verification**: Required before isVerified = true
3. **Rate Limiting**: Prevent abuse of verification email sends
4. **Token Expiration**: 24-hour expiry for verification tokens

### Argentina-Specific Considerations

1. **Email Deliverability**: Test with .com.ar domains
2. **SMTP Provider**: Choose provider with good Argentina deliverability
3. **Email Templates**: Spanish language, culturally appropriate
4. **WhatsApp Integration**: Future consideration for verification (out of scope)

---

## Estimated Scope

**Backend**:
- 3 new services (~400 lines total)
- 10 new endpoints/routes (~300 lines total)
- 2 new database models (~100 lines Prisma schema)
- 15+ new tests (~600 lines total)

**Frontend**:
- 3 new routes/pages (~300 lines total)
- 1 new component (~100 lines)
- API client extensions (~100 lines)
- 3+ new E2E tests (~200 lines)

**Total Estimated**: ~2,100 lines of new code + tests
**Estimated Effort**: 3-5 days for experienced developer (TDD workflow)

---

## Next Steps

1. ✅ Constitution Check passed - proceed to Phase 0
2. ⏳ Run research tasks → generate `research.md`
3. ⏳ Phase 1: Generate data model, contracts, quickstart
4. ⏳ Update agent context with new technologies
5. ⏳ Re-check constitution compliance after Phase 1
6. ⏳ Ready for `/speckit.tasks` command to generate implementation tasks

**Current Status**: Plan complete, ready to begin Phase 0 research.
