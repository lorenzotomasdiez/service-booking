-- Backfill existing users with EMAIL auth method and verified status
-- Set authMethod to EMAIL for all existing users (they all have passwords)
UPDATE "users"
SET "authMethod" = 'EMAIL'::"AuthMethod", "emailVerifiedAt" = "createdAt"
WHERE "password" IS NOT NULL AND "authMethod" = 'EMAIL'::"AuthMethod";

-- Mark all existing users as verified (they were already created before email verification requirement)
UPDATE "users"
SET "isVerified" = true
WHERE "isVerified" = false;
