# Data Model: Registration Completion with Email and Google OAuth

**Feature**: Registration Completion
**Date**: 2025-10-25
**Status**: Phase 1 Design

This document defines the database schema changes required for implementing email verification and Google OAuth authentication.

---

## Overview

The feature requires two new database models and extensions to the existing User model:

1. **EmailVerificationToken** - Stores time-limited tokens for email verification
2. **OAuthProvider** - Links Google OAuth accounts to users (optional, may extend User instead)
3. **User Model Extensions** - Track authentication method and verification status

---

## Model 1: EmailVerificationToken

### Purpose
Store cryptographically secure, time-limited tokens sent to users for email verification after registration. Tokens are single-use and expire after 24 hours.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary key, CUID | Unique identifier for the token record |
| `userId` | String | Foreign key, indexed | References User.id (cascade delete) |
| `token` | String | Unique, indexed | Bcrypt hash of the actual verification token |
| `email` | String | Not null | Email address being verified (snapshot in case user changes email) |
| `expiresAt` | DateTime | Not null, indexed | Token expiration timestamp (24 hours from creation) |
| `createdAt` | DateTime | Default: now() | Token creation timestamp |

### Relationships

- **Belongs to User**: Each token is associated with exactly one user
  - Foreign key: `userId` → `User.id`
  - Cascade delete: When user is deleted, their verification tokens are deleted
  - One-to-many: User can have multiple verification tokens (old + resent)

### Validation Rules

1. **Token Uniqueness**: The hashed token must be unique across all records
2. **Expiration**: Tokens expire 24 hours after creation
3. **Single-Use**: Token is deleted immediately after successful verification
4. **User Cleanup**: Old tokens are automatically invalidated when new token is created for same user

### State Transitions

```
[Created] → [Verified] (success path)
[Created] → [Expired] (24 hours elapsed)
[Created] → [Invalidated] (new token created for same user)
```

### Indexes

- `token` (unique): Fast lookup during verification
- `userId`: Query all tokens for a specific user
- `expiresAt`: Efficient cleanup of expired tokens via cron job

### Prisma Schema

```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("email_verification_tokens")
}
```

### Example Data

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h1",
  "userId": "user_abc123xyz789",
  "token": "$2a$10$N9qo8uLOickgx2ZMRZoMye.hash.here.bcrypt", // bcrypt hash
  "email": "juan@example.com.ar",
  "expiresAt": "2025-10-26T21:30:00.000Z", // 24 hours from now
  "createdAt": "2025-10-25T21:30:00.000Z"
}
```

---

## Model 2: OAuthProvider

### Purpose
Link external OAuth provider accounts (Google, Facebook, etc.) to BarberPro users. Enables users to log in with social accounts and prevents duplicate registrations.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary key, CUID | Unique identifier for the OAuth link |
| `userId` | String | Foreign key, indexed | References User.id (cascade delete) |
| `provider` | Enum | 'GOOGLE', 'FACEBOOK' | OAuth provider name |
| `providerUserId` | String | Not null | User's ID from the OAuth provider (e.g., Google user ID) |
| `email` | String | Not null | Email address from OAuth provider |
| `profileData` | JSON | Nullable | Additional profile data (name, picture, locale, etc.) |
| `accessToken` | String | Nullable | OAuth access token (optional, for accessing provider APIs) |
| `refreshToken` | String | Nullable | OAuth refresh token (optional, for token renewal) |
| `tokenExpiresAt` | DateTime | Nullable | When the access token expires |
| `createdAt` | DateTime | Default: now() | When the OAuth link was created |
| `updatedAt` | DateTime | Auto-update | Last time the OAuth data was refreshed |

### Relationships

- **Belongs to User**: Each OAuth provider link belongs to exactly one user
  - Foreign key: `userId` → `User.id`
  - Cascade delete: When user is deleted, their OAuth links are deleted
  - One-to-many: User can have multiple OAuth providers (Google + Facebook)

### Validation Rules

1. **Unique OAuth Identity**: Combination of `(provider, providerUserId)` must be unique
   - Prevents duplicate registrations with same Google account
2. **Email Format**: Email must be valid format
3. **Provider Enum**: Only allowed values are GOOGLE, FACEBOOK (extensible)

### State Transitions

```
[Created] → [Active] (user logs in via OAuth)
[Active] → [Refreshed] (tokens renewed)
[Active] → [Disconnected] (user unlinks provider - future feature)
```

### Indexes

- `(provider, providerUserId)` (unique compound): Prevent duplicate OAuth accounts
- `userId`: Query all OAuth providers for a user
- `email`: Find user by OAuth email

### Prisma Schema

```prisma
enum OAuthProviderType {
  GOOGLE
  FACEBOOK
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

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
  @@index([userId])
  @@index([email])
  @@map("oauth_providers")
}
```

### Example Data

```json
{
  "id": "clx1y2z3a4b5c6d7e8f9g0h2",
  "userId": "user_abc123xyz789",
  "provider": "GOOGLE",
  "providerUserId": "115678901234567890123",
  "email": "juan@gmail.com",
  "profileData": {
    "name": "Juan Pérez",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "locale": "es-AR",
    "verified_email": true
  },
  "accessToken": null, // Not storing long-term
  "refreshToken": null,
  "tokenExpiresAt": null,
  "createdAt": "2025-10-25T21:30:00.000Z",
  "updatedAt": "2025-10-25T21:30:00.000Z"
}
```

---

## Model 3: User Model Extensions

### Purpose
Track how users registered (email vs OAuth) and their email verification status.

### New/Modified Fields

| Field | Type | Constraints | Description | Status |
|-------|------|-------------|-------------|--------|
| `isVerified` | Boolean | Default: false | Whether email has been verified | **EXISTING** (unused) |
| `authMethod` | Enum | Nullable | How user registered: EMAIL, OAUTH, BOTH | **NEW** |
| `emailVerifiedAt` | DateTime | Nullable | When email was verified | **NEW** |

### Field Details

#### `isVerified` (Existing Field - Now Activated)
- **Type**: Boolean
- **Default**: `false` (changed from current `true` assumption)
- **Purpose**: Flag indicating email verification status
- **Business Logic**:
  - Email/password registrations: Set to `false`, requires verification email
  - OAuth registrations: Set to `true` (Google/Facebook email is pre-verified)
  - Blocks certain actions until verified (optional enforcement)

#### `authMethod` (New Field)
- **Type**: Enum (`EMAIL`, `OAUTH`, `BOTH`)
- **Default**: `null` (will be set based on registration method)
- **Purpose**: Track how user registered and which login methods are available
- **Values**:
  - `EMAIL`: User registered with email/password (has password hash)
  - `OAUTH`: User registered via OAuth only (no password)
  - `BOTH`: User started with email/password, then linked OAuth (or vice versa)

#### `emailVerifiedAt` (New Field)
- **Type**: DateTime
- **Default**: `null`
- **Purpose**: Audit trail for when email was verified
- **Business Logic**:
  - Set when user clicks verification link
  - Used for analytics and compliance reporting
  - Helps distinguish between unverified and recently verified users

### Updated Relationships

```prisma
model User {
  // ... existing fields ...

  isVerified          Boolean                  @default(false)
  authMethod          AuthMethod?
  emailVerifiedAt     DateTime?

  // New relations
  emailVerificationTokens EmailVerificationToken[]
  oauthProviders          OAuthProvider[]

  // ... existing relations ...
}

enum AuthMethod {
  EMAIL
  OAUTH
  BOTH
}
```

### Migration Considerations

**Existing Users**:
- All current users have `isVerified = false` (field exists but unused)
- Migration should set `isVerified = true` for all existing users (grandfather them in)
- Migration should set `authMethod = EMAIL` for all existing users (they all registered via email)

**Migration Script**:
```sql
-- Set existing users as verified and email-based
UPDATE users
SET
  is_verified = true,
  auth_method = 'EMAIL',
  email_verified_at = created_at
WHERE created_at < '2025-10-25'; -- Before this feature deployment
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────┐
│ User                                        │
├─────────────────────────────────────────────┤
│ id (PK)                                     │
│ email (unique)                              │
│ password (nullable for OAuth users)         │
│ role (CLIENT/PROVIDER)                      │
│ isVerified (boolean, default: false)        │◄─┐
│ authMethod (EMAIL/OAUTH/BOTH, nullable)     │  │
│ emailVerifiedAt (datetime, nullable)        │  │
│ ... other existing fields ...               │  │
└─────────────────────────────────────────────┘  │
                  ▲           ▲                   │
                  │           │                   │
                  │           │                   │
        ┌─────────┘           └──────────┐        │
        │                                 │        │
        │                                 │        │
┌───────┴─────────────────────┐  ┌────────┴────────────────────┐
│ EmailVerificationToken      │  │ OAuthProvider               │
├─────────────────────────────┤  ├─────────────────────────────┤
│ id (PK)                     │  │ id (PK)                     │
│ userId (FK) ────────────────┼──┤ userId (FK)                 │
│ token (unique, bcrypt hash) │  │ provider (GOOGLE/FACEBOOK)  │
│ email                       │  │ providerUserId              │
│ expiresAt                   │  │ email                       │
│ createdAt                   │  │ profileData (JSON)          │
└─────────────────────────────┘  │ accessToken (nullable)      │
                                  │ refreshToken (nullable)     │
                                  │ tokenExpiresAt (nullable)   │
                                  │ createdAt                   │
                                  │ updatedAt                   │
                                  └─────────────────────────────┘

                                  Unique Index: (provider, providerUserId)
```

---

## Complete Prisma Schema Updates

### Full Schema Addition

```prisma
// ============================================
// ENUMS
// ============================================

enum AuthMethod {
  EMAIL
  OAUTH
  BOTH
}

enum OAuthProviderType {
  GOOGLE
  FACEBOOK
}

// ============================================
// MODELS
// ============================================

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  phone           String?   @unique
  password        String?   // Made nullable for OAuth-only users
  role            UserRole  @default(CLIENT)
  isActive        Boolean   @default(true)
  isVerified      Boolean   @default(false)  // NOW USED: Email verification status

  // Argentina specific
  dni             String?   @unique
  cuit            String?   @unique
  timezone        String    @default("America/Argentina/Buenos_Aires")
  locale          String    @default("es-AR")

  // Profile
  avatar          String?
  birthDate       DateTime?

  // NEW: Authentication tracking
  authMethod      AuthMethod?
  emailVerifiedAt DateTime?

  // Existing relations
  provider              Provider?
  refreshTokens         RefreshToken[]
  clientBookings        Booking[]
  // ... other existing relations ...

  // NEW: Email verification and OAuth relations
  emailVerificationTokens EmailVerificationToken[]
  oauthProviders          OAuthProvider[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("users")
}

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

---

## Database Migration Strategy

### Migration 1: Add New Models

```bash
# Generate migration
npx prisma migrate dev --name add-email-verification-and-oauth

# This will create:
# - email_verification_tokens table
# - oauth_providers table
# - Add authMethod, emailVerifiedAt to users table
# - Make users.password nullable
```

### Migration 2: Backfill Existing Users

```sql
-- Prisma will generate this, or add as raw SQL migration
-- Set existing users as verified email users
UPDATE users
SET
  is_verified = true,
  auth_method = 'EMAIL',
  email_verified_at = created_at
WHERE auth_method IS NULL;
```

### Rollback Plan

If migration needs to be rolled back:
1. Drop new tables: `email_verification_tokens`, `oauth_providers`
2. Remove new columns: `authMethod`, `emailVerifiedAt` from `users`
3. Revert `password` field to NOT NULL
4. Restore `isVerified` default to `true` (if desired)

---

## Query Patterns

### Common Queries

**1. Find User by Email (Email or OAuth)**
```typescript
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { email: inputEmail },
      { oauthProviders: { some: { email: inputEmail } } }
    ]
  },
  include: {
    oauthProviders: true
  }
});
```

**2. Check if Email is Available**
```typescript
const existingUser = await prisma.user.findFirst({
  where: {
    OR: [
      { email: inputEmail },
      { oauthProviders: { some: { email: inputEmail } } }
    ]
  }
});
const isAvailable = !existingUser;
```

**3. Validate Verification Token**
```typescript
const tokenRecord = await prisma.emailVerificationToken.findFirst({
  where: {
    token: hashedToken,
    expiresAt: { gte: new Date() }
  },
  include: { user: true }
});
```

**4. Cleanup Expired Tokens**
```typescript
const deleted = await prisma.emailVerificationToken.deleteMany({
  where: {
    expiresAt: { lt: new Date() }
  }
});
```

**5. Link OAuth Provider to Existing User**
```typescript
await prisma.$transaction([
  prisma.oAuthProvider.create({
    data: {
      userId: user.id,
      provider: 'GOOGLE',
      providerUserId: googleUserId,
      email: googleEmail,
      profileData: googleProfile
    }
  }),
  prisma.user.update({
    where: { id: user.id },
    data: {
      authMethod: user.authMethod === 'EMAIL' ? 'BOTH' : 'OAUTH',
      isVerified: true, // Google email is verified
      emailVerifiedAt: new Date()
    }
  })
]);
```

---

## Performance Considerations

### Indexes
- All foreign keys are indexed for join performance
- `token` field has unique index for fast verification lookups
- `expiresAt` indexed for efficient cleanup queries
- Compound unique index on `(provider, providerUserId)` prevents duplicate OAuth accounts

### Table Size Estimates
- **EmailVerificationToken**: ~1KB per record, temp storage (deleted after 24h)
  - 1,000 daily signups = ~1MB/day = ~30MB/month (before cleanup)
  - With cleanup: <5MB steady state
- **OAuthProvider**: ~2KB per record (includes JSON profile data)
  - 50% OAuth adoption = 500 records/day = ~1MB/day = ~365MB/year
  - Linear growth with user base
- **User table additions**: +16 bytes per user (2 fields)

### Cleanup Jobs
Run daily cron job to delete expired tokens:
```typescript
// Run at 2 AM daily
cron.schedule('0 2 * * *', async () => {
  const count = await prisma.emailVerificationToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  logger.info(`Cleaned up ${count} expired verification tokens`);
});
```

---

## Security Considerations

1. **Token Hashing**: Email verification tokens are stored as bcrypt hashes (never plaintext)
2. **Cascade Deletes**: User deletion removes all related tokens and OAuth links
3. **Expiration**: Tokens expire after 24 hours (database-enforced)
4. **Single-Use**: Tokens deleted immediately after verification
5. **OAuth Tokens**: Access/refresh tokens are optional and should be encrypted if stored
6. **Email Validation**: Both User.email and OAuthProvider.email should be validated

---

## Testing Checklist

- [ ] User can register with email/password (creates EmailVerificationToken)
- [ ] User can verify email with valid token (marks isVerified = true)
- [ ] Expired tokens cannot be used for verification
- [ ] Used tokens cannot be reused (deleted after first use)
- [ ] User can register with Google OAuth (creates OAuthProvider)
- [ ] Duplicate OAuth registrations are prevented (unique constraint)
- [ ] User can link OAuth to existing email account (authMethod = BOTH)
- [ ] Cascade delete works (deleting user removes tokens and OAuth links)
- [ ] Cleanup job removes expired tokens
- [ ] Migration backfills existing users correctly

---

## Status

**Phase 1 - Data Model**: ✅ COMPLETE

Next: Generate API contracts for OAuth and verification endpoints.
