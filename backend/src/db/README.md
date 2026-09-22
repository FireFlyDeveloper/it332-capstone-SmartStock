# SmartStock database foundation

The backend can run without `DATABASE_URL`; in that case `/health/db` reports in-memory mode for the existing fallback stores.

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
