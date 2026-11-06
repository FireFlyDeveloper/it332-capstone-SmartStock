-- Remove person-assignment data from deliveries. This intentionally deletes
-- existing driver names and driver-to-user links; restore only from backup if needed.
BEGIN;
DROP INDEX IF EXISTS idx_deliveries_driver;
ALTER TABLE deliveries DROP COLUMN IF EXISTS driver_id;
ALTER TABLE deliveries DROP COLUMN IF EXISTS driver;
COMMIT;
