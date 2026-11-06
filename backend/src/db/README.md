# SmartStock database foundation

The backend requires `DATABASE_URL` before starting. `/health/db` returns HTTP 503 with `{"mode":"unavailable","ok":false}` when persistent storage is not configured, and HTTP 503 when PostgreSQL is unreachable. It reports `{"mode":"postgres","ok":true}` only after a successful database query.

## Local PostgreSQL setup

1. Create a local database:

   ```bash
   createdb smartstock
   ```

2. Copy the example environment file and set local values:

   ```bash
   cp .env.example .env
   ```

3. Set `DATABASE_URL` in `.env` or export it in your shell:

   ```bash
   export DATABASE_URL=postgresql://user:password@localhost:5432/smartstock
   ```

## Apply schema

Run the schema script from the repository root:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/smartstock node scripts/apply-schema.mjs
```

The script applies `db/schema.sql` and exits with a clear error when `DATABASE_URL` is missing.

## Existing databases

For an existing database, apply the delivery-assignment removal migration from the repository root:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/20261106_remove_delivery_driver_assignment.sql
```

This migration permanently drops `deliveries.driver` and `deliveries.driver_id`, including their stored person-assignment values. Confirm the target database and take any required backup before applying it.

Daily Sales is derived directly from backend order records; no cashier cash-reconciliation workflow or tender-method field is used.
