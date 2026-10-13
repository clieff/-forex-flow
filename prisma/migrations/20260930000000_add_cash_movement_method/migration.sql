-- Store the payment channel for every cash movement.
-- Existing rows are safely backfilled as cash payments.
DO $$
BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'BANK_DEPOSIT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CashMovement"
ADD COLUMN IF NOT EXISTS "method" "PaymentMethod" NOT NULL DEFAULT 'CASH';
