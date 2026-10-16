CREATE TYPE "PaymentAccountKind" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK', 'OTHER');

CREATE TABLE "PaymentAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "PaymentAccountKind" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentAccount_name_key" ON "PaymentAccount"("name");
CREATE INDEX "PaymentAccount_isActive_kind_idx" ON "PaymentAccount"("isActive", "kind");

INSERT INTO "PaymentAccount" ("id", "name", "kind") VALUES
  ('payment-account-cash', 'Cash', 'CASH'),
  ('payment-account-mobile-money', 'Mobile Money', 'MOBILE_MONEY'),
  ('payment-account-bank-transfer', 'Virement bancaire', 'BANK'),
  ('payment-account-bank-deposit', 'Depot bancaire', 'BANK')
ON CONFLICT ("name") DO NOTHING;

ALTER TABLE "Transaction" ADD COLUMN "paymentAccountId" TEXT;
ALTER TABLE "CashMovement" ADD COLUMN "paymentAccountId" TEXT;

UPDATE "Transaction"
SET "paymentAccountId" = CASE "paymentMethod"
  WHEN 'CASH' THEN 'payment-account-cash'
  WHEN 'MOBILE_MONEY' THEN 'payment-account-mobile-money'
  WHEN 'BANK_TRANSFER' THEN 'payment-account-bank-transfer'
  WHEN 'BANK_DEPOSIT' THEN 'payment-account-bank-deposit'
END;

UPDATE "CashMovement"
SET "paymentAccountId" = CASE "method"
  WHEN 'CASH' THEN 'payment-account-cash'
  WHEN 'MOBILE_MONEY' THEN 'payment-account-mobile-money'
  WHEN 'BANK_TRANSFER' THEN 'payment-account-bank-transfer'
  WHEN 'BANK_DEPOSIT' THEN 'payment-account-bank-deposit'
END;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_paymentAccountId_fkey"
  FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CashMovement"
  ADD CONSTRAINT "CashMovement_paymentAccountId_fkey"
  FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Transaction_paymentAccountId_createdAt_idx" ON "Transaction"("paymentAccountId", "createdAt");
CREATE INDEX "CashMovement_paymentAccountId_createdAt_idx" ON "CashMovement"("paymentAccountId", "createdAt");
