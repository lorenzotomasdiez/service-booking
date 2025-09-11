-- CreateEnum
CREATE TYPE "public"."RewardType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'BUY_ONE_GET_ONE');

-- CreateEnum
CREATE TYPE "public"."LoyaltyTransactionType" AS ENUM ('EARNED', 'SPENT', 'EXPIRED', 'BONUS');

-- CreateTable
CREATE TABLE "public"."referral_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "referrerReward" DECIMAL(10,2) NOT NULL,
    "refereeDiscount" DECIMAL(10,2) NOT NULL,
    "rewardType" "public"."RewardType" NOT NULL DEFAULT 'FIXED_AMOUNT',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "bookingId" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardAmount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "rewardPaidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotions" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minimumAmount" DECIMAL(10,2),
    "maxDiscountAmount" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "applicableToAllServices" BOOLEAN NOT NULL DEFAULT true,
    "serviceIds" TEXT[],
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "isNewClientOnly" BOOLEAN NOT NULL DEFAULT false,
    "isBirthdayPromo" BOOLEAN NOT NULL DEFAULT false,
    "isGroupBooking" BOOLEAN NOT NULL DEFAULT false,
    "minGroupSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotion_usages" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loyalty_transactions" (
    "id" TEXT NOT NULL,
    "loyaltyPointsId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "public"."LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_analytics" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "completedBookings" INTEGER NOT NULL DEFAULT 0,
    "cancelledBookings" INTEGER NOT NULL DEFAULT 0,
    "noShowBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "newClients" INTEGER NOT NULL DEFAULT 0,
    "returningClients" INTEGER NOT NULL DEFAULT 0,
    "serviceMetrics" JSONB,
    "averageServiceTime" INTEGER,
    "utilizationRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_notes" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_providerId_isActive_idx" ON "public"."referral_codes"("providerId", "isActive");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "public"."referral_codes"("code");

-- CreateIndex
CREATE INDEX "referrals_codeId_idx" ON "public"."referrals"("codeId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "public"."referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_refereeId_idx" ON "public"."referrals"("refereeId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "public"."referrals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "public"."promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_providerId_isActive_idx" ON "public"."promotions"("providerId", "isActive");

-- CreateIndex
CREATE INDEX "promotions_code_idx" ON "public"."promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_validFrom_validUntil_idx" ON "public"."promotions"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "promotions_isActive_validFrom_validUntil_idx" ON "public"."promotions"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "promotion_usages_promotionId_idx" ON "public"."promotion_usages"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_usages_userId_idx" ON "public"."promotion_usages"("userId");

-- CreateIndex
CREATE INDEX "promotion_usages_bookingId_idx" ON "public"."promotion_usages"("bookingId");

-- CreateIndex
CREATE INDEX "loyalty_points_userId_idx" ON "public"."loyalty_points"("userId");

-- CreateIndex
CREATE INDEX "loyalty_points_providerId_idx" ON "public"."loyalty_points"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_points_userId_providerId_key" ON "public"."loyalty_points"("userId", "providerId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_loyaltyPointsId_idx" ON "public"."loyalty_transactions"("loyaltyPointsId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_bookingId_idx" ON "public"."loyalty_transactions"("bookingId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_type_createdAt_idx" ON "public"."loyalty_transactions"("type", "createdAt");

-- CreateIndex
CREATE INDEX "provider_analytics_providerId_date_idx" ON "public"."provider_analytics"("providerId", "date");

-- CreateIndex
CREATE INDEX "provider_analytics_date_idx" ON "public"."provider_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "provider_analytics_providerId_date_key" ON "public"."provider_analytics"("providerId", "date");

-- CreateIndex
CREATE INDEX "client_notes_providerId_clientId_idx" ON "public"."client_notes"("providerId", "clientId");

-- CreateIndex
CREATE INDEX "client_notes_providerId_tags_idx" ON "public"."client_notes"("providerId", "tags");

-- AddForeignKey
ALTER TABLE "public"."referral_codes" ADD CONSTRAINT "referral_codes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "public"."referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotions" ADD CONSTRAINT "promotions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_usages" ADD CONSTRAINT "promotion_usages_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "public"."promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_usages" ADD CONSTRAINT "promotion_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."promotion_usages" ADD CONSTRAINT "promotion_usages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_points" ADD CONSTRAINT "loyalty_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_points" ADD CONSTRAINT "loyalty_points_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_loyaltyPointsId_fkey" FOREIGN KEY ("loyaltyPointsId") REFERENCES "public"."loyalty_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_analytics" ADD CONSTRAINT "provider_analytics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_notes" ADD CONSTRAINT "client_notes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_notes" ADD CONSTRAINT "client_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
