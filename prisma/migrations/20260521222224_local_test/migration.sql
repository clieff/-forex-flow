-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('TRANSACTION', 'STOCK', 'CASH', 'RATE', 'USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "StockDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('TRANSACTION', 'SUPPLIER_PURCHASE', 'ADJUSTMENT', 'DEBT_SETTLEMENT');

-- CreateEnum
CREATE TYPE "CashDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashReason" AS ENUM ('DEPOT', 'RETRAIT', 'DEPENSE', 'AJUSTEMENT', 'AUTRE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "category" "LogCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flagCode" TEXT NOT NULL,
    "buyRate" DECIMAL(18,4) NOT NULL,
    "sellRate" DECIMAL(18,4) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "RateHistory" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "oldBuyRate" DECIMAL(18,4) NOT NULL,
    "newBuyRate" DECIMAL(18,4) NOT NULL,
    "oldSellRate" DECIMAL(18,4) NOT NULL,
    "newSellRate" DECIMAL(18,4) NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDebt" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRate" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "buyRate" DECIMAL(18,4),
    "sellRate" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "type" "Type" NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amountGiven" DECIMAL(18,2) NOT NULL,
    "amountReceived" DECIMAL(18,2) NOT NULL,
    "rateUsed" DECIMAL(18,4) NOT NULL,
    "clientName" TEXT,
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "direction" "StockDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "unitPrice" DECIMAL(18,4),
    "totalCostXaf" DECIMAL(18,2),
    "reason" "StockReason" NOT NULL,
    "note" TEXT,
    "supplierId" TEXT,
    "transactionId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDebt" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "direction" "CashDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" "CashReason" NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptSequence" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReceiptSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE INDEX "ClientDebt_clientId_updatedAt_idx" ON "ClientDebt"("clientId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDebt_clientId_currencyCode_key" ON "ClientDebt"("clientId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRate_clientId_currencyCode_key" ON "ClientRate"("clientId", "currencyCode");

-- CreateIndex
CREATE INDEX "Transaction_clientId_createdAt_idx" ON "Transaction"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_currencyCode_createdAt_idx" ON "Transaction"("currencyCode", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_transactionId_key" ON "StockMovement"("transactionId");

-- CreateIndex
CREATE INDEX "StockMovement_supplierId_currencyCode_createdAt_idx" ON "StockMovement"("supplierId", "currencyCode", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_currencyCode_reason_createdAt_idx" ON "StockMovement"("currencyCode", "reason", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierDebt_supplierId_updatedAt_idx" ON "SupplierDebt"("supplierId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierDebt_supplierId_currencyCode_key" ON "SupplierDebt"("supplierId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSequence_year_month_key" ON "ReceiptSequence"("year", "month");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateHistory" ADD CONSTRAINT "RateHistory_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateHistory" ADD CONSTRAINT "RateHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDebt" ADD CONSTRAINT "ClientDebt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDebt" ADD CONSTRAINT "ClientDebt_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRate" ADD CONSTRAINT "ClientRate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRate" ADD CONSTRAINT "ClientRate_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebt" ADD CONSTRAINT "SupplierDebt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDebt" ADD CONSTRAINT "SupplierDebt_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
