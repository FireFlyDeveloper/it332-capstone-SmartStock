-- Forward-only observed inventory/policy history. Existing products receive one
-- current-state baseline; no pre-activation history or effects are inferred.
CREATE TABLE IF NOT EXISTS inventory_policy_history (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(40) NOT NULL CHECK (event_type IN (
    'baseline', 'stock_changed', 'threshold_changed', 'stock_and_threshold_changed'
  )),
  stock_before INTEGER,
  stock_after INTEGER NOT NULL,
  threshold_before INTEGER,
  threshold_after INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_policy_history_product_time
  ON inventory_policy_history (product_id, recorded_at, id);

CREATE OR REPLACE FUNCTION record_inventory_policy_history()
RETURNS TRIGGER AS $$
DECLARE
  changed_stock BOOLEAN;
  changed_threshold BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO inventory_policy_history
      (product_id, event_type, stock_before, stock_after, threshold_before, threshold_after)
    VALUES (NEW.id, 'baseline', NULL, NEW.stock, NULL, NEW.threshold);
    RETURN NEW;
  END IF;

  changed_stock := OLD.stock IS DISTINCT FROM NEW.stock;
  changed_threshold := OLD.threshold IS DISTINCT FROM NEW.threshold;
  IF NOT changed_stock AND NOT changed_threshold THEN
    RETURN NEW;
  END IF;

  INSERT INTO inventory_policy_history
    (product_id, event_type, stock_before, stock_after, threshold_before, threshold_after)
  VALUES (
    NEW.id,
    CASE WHEN changed_stock AND changed_threshold THEN 'stock_and_threshold_changed'
         WHEN changed_stock THEN 'stock_changed'
         ELSE 'threshold_changed' END,
    OLD.stock, NEW.stock, OLD.threshold, NEW.threshold
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_inventory_policy_history ON products;
CREATE TRIGGER products_inventory_policy_history
  AFTER INSERT OR UPDATE OF stock, threshold ON products
  FOR EACH ROW EXECUTE FUNCTION record_inventory_policy_history();

-- Backfill only a current baseline, once per product; never fabricate old transitions.
INSERT INTO inventory_policy_history
  (product_id, recorded_at, event_type, stock_before, stock_after, threshold_before, threshold_after)
SELECT p.id, NOW(), 'baseline', NULL, p.stock, NULL, p.threshold
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_policy_history h WHERE h.product_id = p.id
);
