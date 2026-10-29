-- Safe, idempotent additive migration: legacy receipts remain explicitly unpriced.
ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2)
  CHECK (unit_cost IS NULL OR unit_cost >= 0);
