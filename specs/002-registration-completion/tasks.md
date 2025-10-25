# Tasks: Registration Completion with Email and Google OAuth

**Input**: Design documents from `/specs/002-registration-completion/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Following TDD workflow - tests written FIRST before implementation for all features

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

This is a **Web app** monorepo structure:
- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure environment for OAuth and email verification

- [X] T001 Install backend dependencies (@fastify/oauth2, @fastify/cookie, nodemailer, axios) in backend/package.json
- [X] T002 [P] Install backend dev dependencies (@types/nodemailer) in backend/package.json
- [X] T003 [P] Add MailHog service to docker-compose.yml with ports 1025 (SMTP) and 8025 (Web UI)
- [X] T004 [P] Update backend/.env.example with Google OAuth variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL, FRONTEND_URL)
- [X] T005 [P] Update backend/.env.example with SMTP configuration for MailHog development environment
- [X] T006 [P] Update frontend/.env.example with VITE_BACKEND_URL and VITE_FRONTEND_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T007 Update backend/prisma/schema.prisma to add AuthMethod enum (EMAIL, OAUTH, BOTH)
- [X] T008 [P] Update backend/prisma/schema.prisma to add OAuthProviderType enum (GOOGLE, FACEBOOK)
- [X] T009 Update backend/prisma/schema.prisma User model: make password nullable, add authMethod and emailVerifiedAt fields
- [X] T010 [P] Create EmailVerificationToken model in backend/prisma/schema.prisma with fields (id, userId, token, email, expiresAt, createdAt)
- [X] T011 [P] Create OAuthProvider model in backend/prisma/schema.prisma with fields (id, userId, provider, providerUserId, email, profileData, accessToken, refreshToken, tokenExpiresAt, createdAt, updatedAt)
- [X] T012 Add relations to User model in backend/prisma/schema.prisma (emailVerificationTokens, oauthProviders)
- [X] T013 Run Prisma generate to update client (npm run db:generate)
- [X] T014 Create database migration (npm run db:migrate) named "add-email-verification-and-oauth"
- [X] T015 Create and run backend/prisma/migrations/backfill-existing-users.sql to set existing users as verified EMAIL users

### Core Services & Configuration

- [X] T016 [P] Create backend/src/config/oauth.config.ts with Google OAuth configuration (client ID, secret, callback URL, scopes)
- [X] T017 [P] Create backend/src/config/email.config.ts with Nodemailer transport configuration (MailHog for dev, Resend for prod)
- [X] T018 [P] Create backend/src/types/oauth.types.ts with TypeScript types for OAuthState, OAuthProfile, GoogleProfile

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Email Registration (Priority: P1) 🎯 MVP

**Goal**: Users can register with email/password and receive email verification

**Independent Test**: Navigate to /register, fill form with email/password, submit, verify account created and verification email sent to MailHog (localhost:8025)

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T019 [P] [US1] Create backend/tests/unit/email.service.test.ts with unit tests for email sending (template rendering, SMTP connection)
- [ ] T020 [P] [US1] Create backend/tests/unit/verification.service.test.ts with unit tests for token generation, validation, and expiration
- [ ] T021 [P] [US1] Create backend/tests/integration/verification.test.ts with integration tests for full verification flow (register → receive email → verify token)

### Implementation for User Story 1

- [X] T022 [P] [US1] Create backend/src/services/email.service.ts with sendEmail method using Nodemailer
- [X] T023 [P] [US1] Create backend/src/services/verification.service.ts with methods: generateToken, sendVerificationEmail, validateToken, markEmailVerified
- [X] T024 [US1] Create backend/src/templates/email/verification.html with Spanish email verification template
- [ ] T025 [US1] Extend backend/src/routes/auth.ts POST /auth/register to send verification email after user creation
- [ ] T026 [US1] Extend backend/src/routes/auth.ts POST /auth/register to set authMethod='EMAIL' and isVerified=false
- [ ] T027 [US1] Create backend/src/routes/auth.ts GET /auth/verify-email endpoint to validate token and mark user verified
- [ ] T028 [P] [US1] Create backend/src/routes/auth.ts POST /auth/send-verification endpoint with rate limiting (3 emails/hour)
- [ ] T029 [P] [US1] Create backend/src/routes/auth.ts POST /auth/resend-verification endpoint (authenticated) with rate limiting
- [ ] T030 [P] [US1] Create backend/src/routes/auth.ts GET /auth/verification-status endpoint to check user verification status
- [ ] T031 [US1] Add structured logging to verification.service.ts for verification sends (success/failure)
- [ ] T032 [US1] Create frontend/src/routes/verify-email/+page.svelte to handle email verification confirmation

**Checkpoint**: At this point, User Story 1 should be fully functional - users can register, receive verification emails in MailHog, and verify their accounts

---

## Phase 4: User Story 2 - Google OAuth Registration (Priority: P2)

**Goal**: Users can register/login using Google OAuth in under 30 seconds

**Independent Test**: Click "Continue with Google" button, complete Google OAuth flow, verify account created with Google profile data and user logged in

### Tests for User Story 2

- [ ] T033 [P] [US2] Create backend/tests/unit/oauth.service.test.ts with unit tests for OAuth state generation, Google profile fetching, user creation
- [ ] T034 [P] [US2] Create backend/tests/integration/oauth.test.ts with integration tests for full OAuth flow (initiate → callback → user creation)
- [ ] T035 [P] [US2] Create frontend/tests/registration-oauth.spec.ts (Playwright E2E) for complete OAuth registration flow

### Implementation for User Story 2

- [ ] T036 [P] [US2] Create backend/src/services/oauth.service.ts with methods: generateState, storeState (Redis), validateState, fetchGoogleProfile, createOrUpdateOAuthUser
- [ ] T037 [US2] Register @fastify/cookie plugin in backend/src/server.ts (required BEFORE @fastify/oauth2)
- [ ] T038 [US2] Register @fastify/oauth2 plugin in backend/src/server.ts with Google OAuth configuration
- [ ] T039 [US2] Create backend/src/routes/oauth.ts GET /auth/oauth/google/initiate endpoint to redirect to Google with state token
- [ ] T040 [US2] Create backend/src/routes/oauth.ts GET /auth/oauth/google/callback endpoint to handle Google callback, validate state, create user, return JWT
- [ ] T041 [P] [US2] Create backend/src/routes/oauth.ts POST /auth/oauth/google/link endpoint (authenticated) to link Google account to existing user
- [ ] T042 [P] [US2] Create backend/src/routes/oauth.ts DELETE /auth/oauth/google/unlink endpoint (authenticated) to unlink Google account
- [ ] T043 [US2] Add OAuth attempt logging to oauth.service.ts with correlation IDs
- [ ] T044 [P] [US2] Create frontend/src/lib/components/OAuthButton.svelte reusable component with Google icon and redirect logic
- [ ] T045 [US2] Create frontend/src/routes/auth/callback/google/+page.svelte to receive tokens from OAuth redirect and store in auth store
- [ ] T046 [US2] Update frontend/src/routes/register/+page.svelte to add OAuthButton component with divider
- [ ] T047 [US2] Update frontend/src/lib/api/auth.ts to add OAuth-related API calls (initiateOAuth, linkOAuth, unlinkOAuth)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can register via email OR Google OAuth

---

## Phase 5: User Story 3 - Registration Form Validation (Priority: P1)

**Goal**: Real-time validation feedback on registration form (email format, password strength, field requirements)

**Independent Test**: Fill registration form with invalid data, verify immediate validation errors appear; correct errors, verify form submits successfully

### Tests for User Story 3

- [ ] T048 [P] [US3] Create frontend/tests/unit/validation.test.ts with unit tests for email format validation, password strength validation
- [ ] T049 [P] [US3] Create frontend/tests/integration/registration-validation.spec.ts (Playwright) for real-time validation behavior

### Implementation for User Story 3

- [ ] T050 [P] [US3] Create frontend/src/lib/validation/registration.ts with Zod schemas for email, password, name validation
- [ ] T051 [US3] Update frontend/src/routes/register/+page.svelte to add real-time field validation with onBlur and onChange handlers
- [ ] T052 [US3] Update frontend/src/routes/register/+page.svelte to add password strength indicator component (weak/medium/strong)
- [ ] T053 [US3] Update frontend/src/routes/register/+page.svelte to add confirm password field with mismatch validation
- [ ] T054 [US3] Update frontend/src/routes/register/+page.svelte to disable submit button until all fields valid
- [ ] T055 [US3] Add Spanish validation error messages to frontend/src/lib/validation/registration.ts
- [ ] T056 [US3] Update backend/src/routes/auth.ts POST /auth/register to return detailed Zod validation errors with field-level messages

**Checkpoint**: All user stories should now be independently functional - registration has email, OAuth, AND real-time validation

---

## Phase 6: User Story 4 - Post-Registration Flow (Priority: P3)

**Goal**: Welcome flow and profile completion prompts after registration

**Independent Test**: Complete registration (email or OAuth), verify welcome message appears, profile completion prompt shown, correct dashboard redirect based on role

### Tests for User Story 4

- [ ] T057 [P] [US4] Create frontend/tests/integration/post-registration.spec.ts (Playwright) for welcome flow and redirect behavior

### Implementation for User Story 4

- [ ] T058 [P] [US4] Create frontend/src/lib/components/WelcomeModal.svelte with welcome message and profile completion CTA
- [ ] T059 [US4] Update frontend/src/routes/auth/callback/google/+page.svelte to show welcome modal for new OAuth users
- [ ] T060 [US4] Update frontend/src/lib/stores/auth.ts to add firstLogin flag to track new registrations
- [ ] T061 [US4] Create frontend/src/routes/dashboard/+layout.svelte to check verification status and show verification reminder banner
- [ ] T062 [US4] Update frontend/src/lib/api/auth.ts to fetch verification status on app load
- [ ] T063 [US4] Add role-based redirect logic to frontend/src/routes/auth/callback/google/+page.svelte (CLIENT → /dashboard/client, PROVIDER → /dashboard/provider)

**Checkpoint**: Complete onboarding experience - users are welcomed and directed to appropriate dashboards

---

## Phase 7: Separate Registration URLs (Supporting Feature)

**Goal**: Dedicated URLs for client and provider registration (/register/client, /register/provider)

**Independent Test**: Navigate to /register/client, verify CLIENT role pre-selected and registration works; navigate to /register/provider, verify PROVIDER role pre-selected

### Implementation for Separate URLs

- [ ] T064 [P] Extract registration form logic to frontend/src/lib/components/RegistrationForm.svelte with role prop (null | 'client' | 'provider')
- [ ] T065 Update frontend/src/routes/register/+page.svelte to use RegistrationForm component with role={null}
- [ ] T066 [P] Create frontend/src/routes/register/client/+page.svelte using RegistrationForm with role="client" and custom SEO metadata
- [ ] T067 [P] Create frontend/src/routes/register/provider/+page.svelte using RegistrationForm with role="provider" and custom SEO metadata
- [ ] T068 Update RegistrationForm.svelte to hide role selection UI when role prop is not null
- [ ] T069 [P] Add analytics tracking to each registration route (client vs provider conversion tracking)

**Checkpoint**: Marketing-ready registration URLs with role-specific landing pages

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T070 [P] Create backend cleanup cron job in backend/src/jobs/cleanup-tokens.ts to delete expired EmailVerificationTokens daily
- [ ] T071 [P] Add rate limiting to backend/src/routes/auth.ts POST /auth/register (5 registrations per IP per hour using @fastify/rate-limit)
- [ ] T072 [P] Add rate limiting to backend/src/routes/auth.ts POST /auth/send-verification (3 emails per hour per email using Redis)
- [ ] T073 [P] Update backend/README.md with OAuth setup instructions and email service configuration
- [ ] T074 [P] Update frontend/README.md with new registration routes and OAuth flow documentation
- [ ] T075 [P] Create backend/tests/integration/registration.test.ts to extend existing tests with OAuth and verification scenarios
- [ ] T076 Code review and refactoring: check for TypeScript `any` types, ensure all error messages in Spanish
- [ ] T077 Performance optimization: add database indexes verification (token, userId, expiresAt)
- [ ] T078 Security hardening: verify bcrypt hashing for tokens, HTTPS in production OAuth redirects, PKCE enabled
- [ ] T079 Run quickstart.md validation: manually test all steps in quickstart guide, update if needed
- [ ] T080 [P] Update CLAUDE.md with new technologies: Google OAuth 2.0, Nodemailer, Email verification system

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Separate URLs (Phase 7)**: Can start after US1, US2, US3 (depends on RegistrationForm existence)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (independently testable)
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (frontend validation only)
- **User Story 4 (P3)**: Should start after US1 and US2 complete (depends on registration working)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD workflow)
- Models before services
- Services before routes/endpoints
- Backend endpoints before frontend pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: Tasks T002-T006 can all run in parallel (different config files)
- **Phase 2 - Schema**: Tasks T008, T010, T011 can run in parallel (different models in schema.prisma)
- **Phase 2 - Config**: Tasks T016-T018 can run in parallel (different config files)
- **US1 Tests**: Tasks T019-T021 can run in parallel (different test files)
- **US1 Implementation**: Tasks T022-T023 can run in parallel (different service files)
- **US1 Routes**: Tasks T028-T030 can run in parallel (different endpoints in same file, but need coordination)
- **US2 Tests**: Tasks T033-T035 can run in parallel (different test files)
- **US2 Routes**: Tasks T041-T042 can run in parallel (different endpoints)
- **US3 Tests**: Tasks T048-T049 can run in parallel (different test files)
- **Phase 7**: Tasks T066-T067 can run in parallel (different route files)
- **Phase 8**: Tasks T070-T075 can run in parallel (different files)
- **Once Foundational phase completes**: US1, US2, US3 can all start in parallel (different teams/developers)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T019: "Create backend/tests/unit/email.service.test.ts with unit tests for email sending"
Task T020: "Create backend/tests/unit/verification.service.test.ts with unit tests for token generation"
Task T021: "Create backend/tests/integration/verification.test.ts with integration tests for full verification flow"

# Launch all services for User Story 1 together:
Task T022: "Create backend/src/services/email.service.ts with sendEmail method using Nodemailer"
Task T023: "Create backend/src/services/verification.service.ts with token generation and validation methods"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task T033: "Create backend/tests/unit/oauth.service.test.ts with unit tests for OAuth state generation"
Task T034: "Create backend/tests/integration/oauth.test.ts with integration tests for full OAuth flow"
Task T035: "Create frontend/tests/registration-oauth.spec.ts (Playwright E2E) for complete OAuth registration flow"

# Launch routes for User Story 2 together:
Task T041: "Create backend/src/routes/oauth.ts POST /auth/oauth/google/link endpoint (authenticated)"
Task T042: "Create backend/src/routes/oauth.ts DELETE /auth/oauth/google/unlink endpoint (authenticated)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Email Registration)
4. Complete Phase 5: User Story 3 (Form Validation) - enhances US1
5. **STOP and VALIDATE**: Test email registration with validation independently
6. Deploy/demo basic registration with email verification

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + User Story 3 → Test independently → Deploy/Demo (MVP with email registration!)
3. Add User Story 2 (OAuth) → Test independently → Deploy/Demo (now with Google OAuth)
4. Add User Story 4 (Post-registration) → Test independently → Deploy/Demo (complete onboarding)
5. Add Phase 7 (Separate URLs) → Deploy/Demo (marketing-ready URLs)
6. Add Phase 8 (Polish) → Final production-ready release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Email Registration) + User Story 3 (Validation)
   - Developer B: User Story 2 (OAuth)
   - Developer C: User Story 4 (Post-registration) + Phase 7 (Separate URLs)
3. Stories complete and integrate independently
4. Team reconvenes for Phase 8 (Polish) together

---

## Success Criteria Tracking

Map tasks to success criteria from spec.md:

- **SC-001** (Email registration <2 min): Tasks T022-T032
- **SC-002** (OAuth <30 sec): Tasks T036-T047
- **SC-003** (95% success rate): All validation tasks T050-T056
- **SC-004** (24-hour token validity): Task T023 (verification.service.ts)
- **SC-005** (Validation <500ms): Tasks T050-T056
- **SC-006** (100 concurrent): Task T071 (rate limiting)
- **SC-008** (Zero duplicates): Task T025 (email uniqueness check)
- **SC-009** (OAuth 99% success): Task T043 (OAuth logging)

---

## Notes

- All tasks follow TDD workflow: Write test → Verify RED → Implement → Verify GREEN → Refactor
- [P] tasks = different files, no dependencies between them
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All error messages MUST be in Spanish (es-AR)
- All OAuth redirects MUST use HTTPS in production
- Email templates MUST be in Spanish with Argentina timezone
- Tokens MUST be bcrypt hashed before database storage
- Rate limiting MUST use Redis for distributed deployments

---

## Total Task Count: 80 tasks

### Breakdown by Phase:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 12 tasks
- Phase 3 (US1 - Email Registration): 14 tasks
- Phase 4 (US2 - OAuth): 15 tasks
- Phase 5 (US3 - Validation): 9 tasks
- Phase 6 (US4 - Post-Registration): 7 tasks
- Phase 7 (Separate URLs): 6 tasks
- Phase 8 (Polish): 11 tasks

### Breakdown by User Story:
- US1 (Email Registration): 14 tasks
- US2 (OAuth): 15 tasks
- US3 (Validation): 9 tasks
- US4 (Post-Registration): 7 tasks
- Infrastructure: 35 tasks (Setup + Foundational + Polish + Separate URLs)

### Parallel Opportunities Identified:
- 45 tasks marked with [P] can run in parallel with other tasks in same phase
- 4 user stories can be developed in parallel after Foundational phase
- Estimated 30-40% reduction in serial execution time with parallel execution

### Suggested MVP Scope:
- Phase 1: Setup (6 tasks)
- Phase 2: Foundational (12 tasks)
- Phase 3: User Story 1 - Email Registration (14 tasks)
- Phase 5: User Story 3 - Validation (9 tasks)
- **Total MVP: 41 tasks** (51% of total)

This MVP delivers complete email registration with verification and real-time validation - a fully functional authentication system that can be deployed and demonstrated independently.
