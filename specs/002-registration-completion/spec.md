# Feature Specification: Registration Completion with Email and Google OAuth

**Feature Branch**: `002-registration-completion`
**Created**: 2025-10-25
**Status**: Draft
**Input**: User description: "finish the registration, email and google should be available"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Email Registration (Priority: P1)

A new user wants to create an account using their email address and password. They navigate to the registration page, enter their email, create a password, and submit the form. The system validates their email format, checks that the email isn't already registered, creates their account, and sends a verification email.

**Why this priority**: Email registration is the most fundamental authentication method, required for users without Google accounts or those who prefer not to use OAuth. It serves as the baseline registration flow.

**Independent Test**: Can be fully tested by navigating to the registration page, filling out the email and password fields, submitting the form, and verifying that the account is created and a verification email is sent. Delivers a complete registration experience.

**Acceptance Scenarios**:

1. **Given** a user is on the registration page, **When** they enter a valid email and password and submit the form, **Then** their account is created and a verification email is sent to their inbox
2. **Given** a user enters an email that's already registered, **When** they submit the form, **Then** they see an error message indicating the email is already in use
3. **Given** a user enters an invalid email format, **When** they attempt to submit, **Then** they see a validation error before submission
4. **Given** a user enters a weak password, **When** they attempt to submit, **Then** they see password strength requirements and cannot proceed
5. **Given** a user successfully registers, **When** they click the verification link in their email, **Then** their email is verified and they can log in

---

### User Story 2 - Google OAuth Registration (Priority: P2)

A new user wants to quickly create an account using their existing Google account. They click the "Continue with Google" button, are redirected to Google's authentication page, grant permissions, and are redirected back to the application with their account automatically created using their Google profile information.

**Why this priority**: Google OAuth provides a frictionless registration experience and is expected by modern users. It reduces abandonment rates by eliminating password creation steps, but is secondary to email registration as not all users have or want to use Google accounts.

**Independent Test**: Can be fully tested by clicking the "Continue with Google" button, completing Google's OAuth flow, and verifying that the user is redirected back with an authenticated session and their profile populated from Google data. Delivers complete OAuth registration.

**Acceptance Scenarios**:

1. **Given** a user is on the registration page, **When** they click "Continue with Google", **Then** they are redirected to Google's authentication page
2. **Given** a user successfully authenticates with Google, **When** Google redirects them back, **Then** their account is created with data from their Google profile (name, email, profile picture)
3. **Given** a user authenticates with a Google account that's already registered, **When** they complete OAuth, **Then** they are logged into their existing account instead of creating a duplicate
4. **Given** a user cancels the Google OAuth flow, **When** they return to the registration page, **Then** they can try again or choose email registration
5. **Given** a user's Google account doesn't grant email permission, **When** OAuth completes, **Then** they see an error explaining that email access is required

---

### User Story 3 - Registration Form Validation (Priority: P1)

A user filling out the registration form receives immediate, helpful feedback about any input errors before submission. Field-level validation occurs as they type or leave each field, showing clear error messages and requirements.

**Why this priority**: Real-time validation is critical for user experience and reduces frustration. Without it, users waste time filling out forms only to get errors on submission. This is P1 because it affects both email and Google OAuth flows (email validation).

**Independent Test**: Can be fully tested by interacting with each registration form field and verifying that appropriate validation messages appear and disappear based on input. Delivers a complete validation experience.

**Acceptance Scenarios**:

1. **Given** a user is typing an email address, **When** they enter an invalid format and leave the field, **Then** they see a specific error message about the format requirement
2. **Given** a user is creating a password, **When** they type, **Then** they see real-time feedback on password strength and requirements (minimum length, character types)
3. **Given** a user enters mismatched passwords in password and confirm password fields, **When** they leave the confirm field, **Then** they see an error indicating the passwords don't match
4. **Given** all form fields are valid, **When** the user submits, **Then** the submit button is enabled and the form processes
5. **Given** required fields are empty, **When** the user attempts to submit, **Then** they see clear indicators of which fields are required

---

### User Story 4 - Post-Registration Flow (Priority: P3)

After successfully registering (via email or Google), a user is guided through the next steps of their journey. They receive a welcome message, are prompted to complete their profile if needed, and are directed to the appropriate landing page based on their user type (customer or service provider).

**Why this priority**: Post-registration experience is important for engagement and retention, but the core registration functionality must work first. This can be enhanced after the primary registration flows are complete.

**Independent Test**: Can be fully tested by completing registration (either method) and verifying that the welcome flow, profile completion prompts, and landing page redirect work correctly. Delivers complete onboarding.

**Acceptance Scenarios**:

1. **Given** a user completes email registration and verifies their email, **When** they first log in, **Then** they see a welcome message and are prompted to complete their profile
2. **Given** a user completes Google OAuth registration, **When** they land on the platform, **Then** they see their profile pre-populated with Google data and can proceed to the appropriate dashboard
3. **Given** a user registers as a customer, **When** registration completes, **Then** they are directed to the service booking interface
4. **Given** a user registers as a service provider, **When** registration completes, **Then** they are directed to the provider onboarding flow
5. **Given** a user closes the browser before completing email verification, **When** they return and verify later, **Then** they can resume from where they left off

---

### Edge Cases

- What happens when a user tries to register with an email that belongs to a Google OAuth account (or vice versa)?
  **Resolution**: System automatically links accounts by email match. If email exists (registered via email/password), OAuth flow upgrades account to `authMethod: BOTH` and marks email as verified.
- How does the system handle network failures during the Google OAuth redirect?
- What happens if a user's email verification token expires?
- How does the system handle users who register but never verify their email?
- What happens when Google OAuth returns incomplete profile data?
- What happens when Google OAuth returns a profile with `email_verified: false`?
  **Resolution**: System allows registration. Google's `email_verified` flag indicates Google's internal verification status, independent of our app's verification system. OAuth flow validates email ownership through Google's authentication, so users are auto-verified regardless of Google's flag.
- How does the system handle concurrent registration attempts with the same email?
- What happens when a user manually crafts a verification URL with an invalid token?
- How does the system handle Argentina-specific email domains and formatting (e.g., .com.ar)?
- What happens if Google OAuth is temporarily unavailable?
- What happens when an OAuth-only user (no password) tries to login via email/password?
  **Resolution**: Login fails. OAuth-only users must authenticate via Google or set a password in-app settings first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to register using email and password
- **FR-002**: System MUST allow users to register using Google OAuth 2.0
- **FR-003**: System MUST validate email addresses for proper format and uniqueness
- **FR-004**: System MUST enforce password requirements (minimum 8 characters, at least one uppercase, one lowercase, one number)
- **FR-005**: System MUST send email verification links to users who register via email
- **FR-006**: System MUST prevent duplicate accounts with the same email address across both registration methods
- **FR-007**: System MUST create user accounts with data from Google profile (name, email, profile picture) when using OAuth
- **FR-008**: System MUST persist user registration data including registration method (email or Google)
- **FR-009**: System MUST display clear, actionable error messages for all validation failures
- **FR-010**: System MUST provide real-time validation feedback as users fill out the registration form
- **FR-011**: System MUST handle OAuth redirect flows securely with state validation
- **FR-012**: System MUST allow users to cancel Google OAuth flow and return to registration page
- **FR-013**: System MUST verify email addresses before allowing full account access for email registrations
- **FR-014**: System MUST set appropriate session expiration times after successful registration
- **FR-015**: System MUST support Argentina-specific email formats and domains
- **FR-016**: System MUST support separate registration URLs for customers and providers while maintaining the existing dual-role selection on the main registration page
- **FR-017**: System MUST log all registration attempts for security monitoring
- **FR-018**: System MUST rate-limit registration attempts to prevent abuse

### Key Entities

- **User Account**: Represents a registered user with attributes including email (unique identifier), registration method (email or Google OAuth), email verification status, created timestamp, user type (customer or provider), profile data (name, profile picture), and password hash (for email registrations only)
- **Email Verification Token**: Represents a time-limited token sent to users registering via email, with attributes including token value, associated user email, expiration timestamp, and verification status
- **OAuth Session**: Represents a temporary session during Google OAuth flow, with attributes including state token (for CSRF protection), redirect URL, and expiration timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete email registration in under 2 minutes from landing on the registration page to receiving verification email
- **SC-002**: Users can complete Google OAuth registration in under 30 seconds from clicking "Continue with Google" to landing on the authenticated dashboard
- **SC-003**: 95% of valid registration submissions succeed without errors
- **SC-004**: Email verification links remain valid for 24 hours and work on first click
- **SC-005**: Registration form validation provides feedback within 500 milliseconds of user input
- **SC-006**: System handles 100 concurrent registration attempts without performance degradation
- **SC-007**: 90% of users who start registration complete it successfully (measure completion rate)
- **SC-008**: Zero duplicate accounts are created when a user attempts to register with an already-registered email
- **SC-009**: OAuth flow completes successfully 99% of the time when Google services are available
- **SC-010**: Users understand error messages and can correct issues on first attempt (measure error recovery rate)

## Existing Implementation *(current state)*

### Already Completed
- **Frontend Registration UI** (`frontend/src/routes/register/+page.svelte`): Complete email/password registration form with user type selection (Client/Provider), Argentina phone formatting, password validation, and terms acceptance
- **Backend Email Registration** (`backend/src/routes/auth.ts`, `backend/src/services/auth.ts`): Fully functional POST /auth/register endpoint with email/password, role selection, Argentina-specific validations (DNI, CUIT, phone format)
- **Database Schema** (`backend/prisma/schema.prisma`): User model with all required fields including role (CLIENT/PROVIDER), email verification status, Argentina timezone/locale defaults
- **JWT Authentication**: Complete token system with access tokens, refresh tokens, and secure cookie storage
- **Auth State Management** (`frontend/src/lib/stores/auth.ts`): Working registration flow with automatic role-based redirect to appropriate dashboard
- **Form Validation**: Zod schemas on frontend and backend for email format, password strength, phone format (+54 9 XX XXXX-XXXX)

### Not Yet Implemented
- **Google OAuth Integration**: UI buttons exist but no backend OAuth endpoints, callback handlers, or OAuth provider configuration
- **Email Verification System**: No email verification flow, token generation, or email sending service (isVerified field exists but unused)
- **Separate Registration URLs**: Currently single /register route with dual-role selection; needs /register/client and /register/provider routes
- **Email Service Configuration**: No SMTP or transactional email service integrated for verification emails

## Assumptions *(included when present)*

- Google OAuth 2.0 credentials will need to be obtained from Google Cloud Console (not currently configured)
- Email delivery service (SMTP or transactional email provider) needs to be configured and integrated
- User profile completion (beyond registration) is handled by a separate onboarding flow
- Argentina-specific phone number and DNI collection is already part of the registration form
- Password reset functionality is outside the scope of this feature
- Multi-factor authentication (MFA) is not required for initial registration but may be added later
- Rate limiting infrastructure (Redis) is already available in the Docker environment
- Frontend registration UI exists with email/password flow complete; requires addition of Google OAuth buttons and email verification handling
- Backend email/password registration is fully implemented; requires addition of OAuth endpoints and email verification service

## Dependencies *(included when present)*

- **Email Service**: Requires configured email delivery service for verification emails
- **Google OAuth**: Requires Google Cloud project with OAuth 2.0 credentials configured
- **Database Schema**: Requires user table with support for both email and OAuth registration methods
- **Session Management**: Requires JWT or session-based authentication system
- **Frontend Routes**: Requires registration page, email verification confirmation page, and OAuth callback handling

## Out of Scope *(included when present)*

- Password reset and recovery flows
- Multi-factor authentication (MFA)
- Social login with providers other than Google (Facebook, Apple, etc.)
- User profile editing after registration
- Argentina-specific document verification (DNI, CUIL)
- Account deletion and data export
- Admin user management interface
- Email template customization beyond basic verification
- Referral code or invitation-based registration
- Account merging (combining email and OAuth accounts)
