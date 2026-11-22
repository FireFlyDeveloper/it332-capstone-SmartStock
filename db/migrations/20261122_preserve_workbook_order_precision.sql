BEGIN;

-- Preserve workbook-derived fractional quantities and currency precision in order records.
ALTER TABLE orders
  ALTER COLUMN subtotal TYPE NUMERIC USING subtotal::NUMERIC,
  ALTER COLUMN total_amount TYPE NUMERIC USING total_amount::NUMERIC,
  ALTER COLUMN paid_amount TYPE NUMERIC USING paid_amount::NUMERIC,
  ALTER COLUMN refunded_amount TYPE NUMERIC USING refunded_amount::NUMERIC;

ALTER TABLE order_items
  ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC,
  ALTER COLUMN unit_price TYPE NUMERIC USING unit_price::NUMERIC,
  ALTER COLUMN line_total TYPE NUMERIC USING line_total::NUMERIC;

COMMIT;
