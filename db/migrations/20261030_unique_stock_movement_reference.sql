-- Fail closed if legacy references collide after the application's trim/uppercase normalization.
-- Resolve duplicate groups manually after review; this migration never deletes or rewrites business rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM stock_movements
    WHERE reference_no IS NOT NULL
    GROUP BY UPPER(BTRIM(reference_no))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique stock movement references: normalized duplicates exist; review and resolve them before retrying';
  END IF;
END;
$$;

-- Matches normalizeReference() and prevents races across concurrent/multiple instances.
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_movements_reference_normalized
  ON stock_movements (UPPER(BTRIM(reference_no)));
