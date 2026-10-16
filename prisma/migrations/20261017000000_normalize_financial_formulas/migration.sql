ALTER TABLE "Transaction"
  ADD COLUMN "grossXaf" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "cashAmountXaf" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "stockCostXaf" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Existing transactions had no separate commission cash flow. Preserve their historic cash amount.
UPDATE "Transaction"
SET
  "grossXaf" = CASE WHEN "type" = 'BUY' THEN "amountReceived" ELSE "amountGiven" END,
  "cashAmountXaf" = CASE WHEN "type" = 'BUY' THEN "amountReceived" ELSE "amountGiven" END;

ALTER TABLE "SupplierDebt"
  ADD COLUMN "amountXaf" DECIMAL(18,2) NOT NULL DEFAULT 0;
