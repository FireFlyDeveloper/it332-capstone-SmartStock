# SmartStock :: Database Schema

PostgreSQL 14+ schema for the SmartStock capstone project.

The schema is intentionally split into **three files** that mirror
the team's chapter structure, so each teammate can own the data
model for the section they authored:

| File | Section | Owner | Branch |
| --- | --- | --- | --- |
| [`schema.kim.sql`](./schema.kim.sql) | Architecture & Technologies | Kim Eduard Saludes | `Kim` |
| [`schema.luraine.sql`](./schema.luraine.sql) | System Features & AI Analytics | Luraine Villaranda | `Luraine` |
| [`schema.hazel.sql`](./schema.hazel.sql) | Development Methodology | Hazel | `Hazel` |

## Apply order

The files are **not** independent — later files reference tables
created by earlier ones. Apply in this order:

```bash
psql -f schema.kim.sql
psql -f schema.luraine.sql
psql -f schema.hazel.sql
```

The master file [`schema.sql`](./schema.sql) is a documentation stub
that points to the three split files; do not execute it directly.

## What lives where

### `schema.kim.sql` — the data backbone
Identity, catalog, suppliers, branches, and stock movement.
*Users, sessions, categories, materials, products, suppliers,
branches, branch_stock, stock_movements, mv_low_stock.*

### `schema.luraine.sql` — features & AI
Customer-facing workflows and the AI/analytics layer.
*Customers, orders, order_items, deliveries,
delivery_status_history, delivery_routes, ai_forecasts,
inventory_classifications, analytics_snapshots,
public_portal_tokens, notifications.*

### `schema.hazel.sql` — methodology
Audit trail, agile workflow, deployments, tests, and client
feedback.
*audit_logs, development_phases, sprints, sprint_tasks,
sprint_standups, client_feedback, deployments, test_cases,
test_runs.*

## Conventions

- UUID PKs via `gen_random_uuid()` (pgcrypto).
- Soft delete via `deleted_at TIMESTAMPTZ` on user-facing tables.
- `created_at` / `updated_at` / `created_by` / `updated_by` on every
  mutable table.
- Money stored as `NUMERIC(12,2)`.
- Enumerations modelled as `VARCHAR + CHECK` (no PG `ENUM` types —
  friendlier migrations).
- Auto-refreshing `updated_at` via the shared
  `trg_set_updated_at()` function defined in `schema.kim.sql`.
