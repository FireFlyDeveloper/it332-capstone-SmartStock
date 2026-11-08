-- Preserve the existing selling price and add supplier cost for existing databases.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (cost_price >= 0);
