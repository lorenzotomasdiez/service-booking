/*
  Warnings:

  - You are about to drop the column `category` on the `services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "clientFeedback" TEXT,
ADD COLUMN     "clientRating" INTEGER,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "providerFeedback" TEXT,
ADD COLUMN     "remindersSent" JSONB;

-- AlterTable
ALTER TABLE "public"."services" DROP COLUMN "category",
ADD COLUMN     "allowSameDayBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bufferTimeAfter" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "bufferTimeBefore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "depositRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAdvanceBookingDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "requiresConsultation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[];

-- CreateTable
CREATE TABLE "public"."service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_name_key" ON "public"."service_categories"("name");

-- CreateIndex
CREATE INDEX "bookings_providerId_startTime_idx" ON "public"."bookings"("providerId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_clientId_startTime_idx" ON "public"."bookings"("clientId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_status_startTime_idx" ON "public"."bookings"("status", "startTime");

-- CreateIndex
CREATE INDEX "bookings_startTime_endTime_idx" ON "public"."bookings"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "bookings_providerId_status_startTime_idx" ON "public"."bookings"("providerId", "status", "startTime");

-- CreateIndex
CREATE INDEX "bookings_paymentStatus_idx" ON "public"."bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "public"."notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "public"."notifications"("type", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_sentAt_idx" ON "public"."notifications"("sentAt");

-- CreateIndex
CREATE INDEX "providers_isActive_isVerified_idx" ON "public"."providers"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "providers_city_province_idx" ON "public"."providers"("city", "province");

-- CreateIndex
CREATE INDEX "providers_latitude_longitude_idx" ON "public"."providers"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "providers_businessType_idx" ON "public"."providers"("businessType");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "services_providerId_isActive_idx" ON "public"."services"("providerId", "isActive");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "public"."services"("categoryId");

-- CreateIndex
CREATE INDEX "services_price_idx" ON "public"."services"("price");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_dni_idx" ON "public"."users"("dni");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "public"."users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_isVerified_idx" ON "public"."users"("isVerified");

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
