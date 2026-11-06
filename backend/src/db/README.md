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

## Browser Web Push setup

Real background push requires a secure frontend origin, a database-backed subscription table, and server-side VAPID keys. For an existing PostgreSQL database, apply the additive subscription migration from the repository root:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/20261107_add_web_push_subscriptions.sql
```

Generate one VAPID key pair from `backend/` with `npm exec -- web-push generate-vapid-keys`. Keep the private key server-side and store all values in the protected backend environment. Direct backend runs use `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (`mailto:...`); `docker-compose.backend.yml` reads `SMARTSTOCK_VAPID_PUBLIC_KEY`, `SMARTSTOCK_VAPID_PRIVATE_KEY`, and `SMARTSTOCK_VAPID_SUBJECT` and injects them under the backend variable names. Never expose the private key to the frontend.

After deployment, sign in, open Profile → Notifications, enable background push, and use **Send Test Push** to verify that device. The test endpoint reports failure if the subscription or server delivery is missing. Push content is generic and excludes order, customer, and product details. On iPhone/iPad, install the site from Safari’s **Add to Home Screen** (iOS 16.4+) and open the installed app before enabling notifications.
