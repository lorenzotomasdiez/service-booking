-- CreateEnum for AuthMethod
CREATE TYPE "AuthMethod" AS ENUM ('EMAIL', 'OAUTH', 'BOTH');

-- CreateEnum for OAuthProviderType
CREATE TYPE "OAuthProviderType" AS ENUM ('GOOGLE', 'FACEBOOK');

-- AlterTable users - Add new columns
ALTER TABLE "users" ADD COLUMN "authMethod" "AuthMethod" NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AddIndex for authMethod
CREATE INDEX "users_authMethod_idx" ON "users"("authMethod");

-- CreateTable EmailVerificationToken
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable OAuthProvider
CREATE TABLE "oauth_providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProviderType" NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileData" JSONB,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for EmailVerificationToken
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex for OAuthProvider
CREATE UNIQUE INDEX "oauth_providers_provider_providerUserId_key" ON "oauth_providers"("provider", "providerUserId");
CREATE INDEX "oauth_providers_userId_idx" ON "oauth_providers"("userId");
CREATE INDEX "oauth_providers_provider_idx" ON "oauth_providers"("provider");
CREATE INDEX "oauth_providers_providerUserId_idx" ON "oauth_providers"("providerUserId");

-- AddForeignKey for EmailVerificationToken
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for OAuthProvider
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
