-- CreateEnum
CREATE TYPE "PackageTier" AS ENUM ('starter', 'basic', 'pro');

-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('pending', 'active', 'blocked');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('omada', 'mikrotik');

-- CreateEnum
CREATE TYPE "APStatus" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('minutes', 'hours', 'days');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('unused', 'used');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('mpesa', 'tigopesa', 'airtel', 'voucher');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'expired');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mpesa" TEXT,
    "region" TEXT,
    "package" "PackageTier" NOT NULL DEFAULT 'starter',
    "status" "OperatorStatus" NOT NULL DEFAULT 'pending',
    "deviceType" "DeviceType" NOT NULL DEFAULT 'omada',
    "operatorId" TEXT NOT NULL,
    "commissionRate" INTEGER NOT NULL DEFAULT 10,
    "voucherCommission" INTEGER NOT NULL DEFAULT 3,
    "noSubscription" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionEnd" TIMESTAMP(3),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "siteId" TEXT,
    "omadaEmail" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "ipAddress" TEXT,
    "ssid" TEXT,
    "model" TEXT,
    "status" "APStatus" NOT NULL DEFAULT 'offline',
    "deviceType" "DeviceType" NOT NULL DEFAULT 'omada',
    "siteId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "mikrotikIp" TEXT,
    "mikrotikUser" TEXT,
    "mikrotikPass" TEXT,
    "mikrotikPort" INTEGER NOT NULL DEFAULT 8728,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL DEFAULT 'hours',
    "speed" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'active',
    "operatorId" TEXT NOT NULL,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "duration" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL DEFAULT 'hours',
    "speed" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'unused',
    "usedBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "adminCommission" INTEGER NOT NULL,
    "operatorEarning" INTEGER NOT NULL,
    "clientMac" TEXT,
    "apMac" TEXT,
    "siteId" TEXT,
    "duration" INTEGER,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalWithdrawn" INTEGER NOT NULL DEFAULT 0,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "clientMac" TEXT NOT NULL,
    "apMac" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "packageId" TEXT,
    "amount" INTEGER,
    "speed" INTEGER,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSettings" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#FF8C42',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1a1f2e',
    "logoEmoji" TEXT NOT NULL DEFAULT '🐆',
    "businessName" TEXT,
    "subtitle" TEXT,
    "footer" TEXT,
    "template" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "operatorId" TEXT,
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_email_key" ON "Operator"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_operatorId_key" ON "Operator"("operatorId");

-- CreateIndex
CREATE INDEX "Operator_status_idx" ON "Operator"("status");

-- CreateIndex
CREATE INDEX "Operator_deviceType_idx" ON "Operator"("deviceType");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Site_operatorId_idx" ON "Site"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessPoint_macAddress_key" ON "AccessPoint"("macAddress");

-- CreateIndex
CREATE INDEX "AccessPoint_operatorId_idx" ON "AccessPoint"("operatorId");

-- CreateIndex
CREATE INDEX "AccessPoint_siteId_idx" ON "AccessPoint"("siteId");

-- CreateIndex
CREATE INDEX "Package_operatorId_idx" ON "Package"("operatorId");

-- CreateIndex
CREATE INDEX "Package_siteId_idx" ON "Package"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_operatorId_idx" ON "Voucher"("operatorId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE INDEX "Voucher_title_idx" ON "Voucher"("title");

-- CreateIndex
CREATE INDEX "Transaction_operatorId_idx" ON "Transaction"("operatorId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_operatorId_key" ON "Wallet"("operatorId");

-- CreateIndex
CREATE INDEX "Session_operatorId_idx" ON "Session"("operatorId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Session_clientMac_idx" ON "Session"("clientMac");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSettings_operatorId_key" ON "PortalSettings"("operatorId");

-- CreateIndex
CREATE INDEX "Notification_operatorId_idx" ON "Notification"("operatorId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessPoint" ADD CONSTRAINT "AccessPoint_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessPoint" ADD CONSTRAINT "AccessPoint_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSettings" ADD CONSTRAINT "PortalSettings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
