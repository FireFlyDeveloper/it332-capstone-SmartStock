# SmartStock :: Database Schema

PostgreSQL 14+ schema for the SmartStock capstone project (Glassram
Glass and Aluminum Supply).

## Workflow: shared `main`, one file

We work directly on **`main`** — pull, modify the relevant section,
commit, push. No branch-per-section split, no merge commits.

```bash
git pull origin main
# edit db/schema.sql under your section header
git add db/schema.sql
git commit -m "feat(db): <what you changed>"
git push origin main
```

To minimise conflicts, **always edit only the section you own** and
touch the top-of-file `Last touched:` line in your section header
when you change anything.

## Apply

```bash
psql -f db/schema.sql
```

The file is wrapped in a single transaction, so a partial failure
rolls back cleanly.

## Section ownership

The combined file is divided into three clearly-labelled sections.
Each section has a header with the author name and email, and a
`Last touched:` timestamp — keep that up to date.

| Section | Owner | Contact |
| --- | --- | --- |
| 1. Architecture & Technologies | Kim Eduard Saludes | saludeskimdev@gmail.com |
| 2. System Features & AI Analytics | Luraine Villaranda | lurainevillaranda@gmail.com |
| 3. Development Methodology | Hazel | 23-14869@g.batstate-u.edu.ph |

## Apply order (within the file)

1. `pgcrypto` extension
2. `trg_set_updated_at()` utility function  *(used by every section)*
3. **Section 1** — users, branches, products, suppliers, branch_stock, stock_movements
4. **Section 2** — customers, orders, order_items, deliveries, AI/analytics tables
5. **Section 3** — audit logs, sprints, deployments, test runs, client feedback

Sections 2 and 3 reference tables created in Section 1, but the file
itself is a single `BEGIN … COMMIT` block, so order is automatic
when applied whole.

## Conventions

- UUID PKs via `gen_random_uuid()` (pgcrypto).
- Soft delete via `deleted_at TIMESTAMPTZ` on user-facing tables.
- `created_at` / `updated_at` / `created_by` / `updated_by` on every
  mutable table.
- Money stored as `NUMERIC(12,2)`.
- Enumerations modelled as `VARCHAR + CHECK` (no PG `ENUM` types —
  friendlier migrations).
- Auto-refreshing `updated_at` via the shared
  `trg_set_updated_at()` function defined at the top of Section 1.
