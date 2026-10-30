-- =============================================================
-- SmartStock :: Database Schema  (combined)
-- Engine:   PostgreSQL 14+
-- =============================================================
-- This is the single canonical schema file. The team works
-- directly on `main` — pull, modify, commit, push.
--
-- Section ownership (add your changes under the matching header
-- and update the "Author" line):
--
--   ============================================================
--   SECTION 1 :: Architecture & Technologies  (Kim)
--   SECTION 2 :: System Features & AI Analytics  (Luraine)
--   SECTION 3 :: Development Methodology  (Hazel)
--   ============================================================
--
-- Apply:
--   psql -f db/schema.sql
-- =============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- =============================================================
-- SECTION 1 :: Architecture & Technologies
-- Author: Kim Eduard Saludes <saludeskimdev@gmail.com>
-- Last touched: 2026-06-22
-- =============================================================
-- Core data backbone: identity, catalog, suppliers, branches,
-- stock movements. Other sections reference these tables.

-- -----------------------------------------------------------------
-- updated_at trigger (shared utility)
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------
-- Enumerations (CHECK-constraint style for migration safety)
-- -----------------------------------------------------------------

-- User role tiers inside SmartStock
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(64) UNIQUE NOT NULL,
    email         VARCHAR(160) UNIQUE NOT NULL,
    full_name     VARCHAR(160) NOT NULL,
    password_hash TEXT        NOT NULL,                  -- bcrypt/argon
    role          VARCHAR(24) NOT NULL
        CHECK (role IN ('admin', 'manager', 'staff', 'viewer')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    updated_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role)       WHERE deleted_at IS NULL;

-- Auth session tokens (JWT-style opaque tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL UNIQUE,           -- SHA-256 of the bearer
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions (expires_at);

-- -----------------------------------------------------------------
-- Branches (warehouse / store locations)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(16) UNIQUE NOT NULL,              -- e.g. "MAIN", "NORTH"
    name        VARCHAR(120) NOT NULL,
    address     TEXT,
    city        VARCHAR(80),
    province    VARCHAR(80),
    phone       VARCHAR(32),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- -----------------------------------------------------------------
-- Product catalog
-- -----------------------------------------------------------------
-- categories:  "Glass" / "Aluminum Profile" / "Hardware" / "Sealant"
-- materials:   a category-scoped product template (e.g. "6mm Clear Glass")
-- products:    a buyable SKU — the actual SKU Glassram tracks on invoices
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS materials (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id  UUID           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    code         VARCHAR(64)    UNIQUE NOT NULL,         -- internal code
    name         VARCHAR(160)   NOT NULL,                -- "6mm Clear Tempered Glass"
    description  TEXT,
    unit         VARCHAR(16)    NOT NULL,                -- "sheet", "meter", "kg", "pcs"
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials (category_id);

CREATE TABLE IF NOT EXISTS products (
    id            VARCHAR(64)    PRIMARY KEY,
    sku           VARCHAR(64)    UNIQUE NOT NULL,        -- the SKU on the invoice
    material_id   UUID           REFERENCES materials(id) ON DELETE SET NULL,
    category      VARCHAR(32)    DEFAULT 'glass',
    name          VARCHAR(200)   NOT NULL,
    description   TEXT,
    unit_price    NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    cost_price    NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    unit          VARCHAR(16)    NOT NULL,
    stock         INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
    threshold     INTEGER        NOT NULL DEFAULT 0 CHECK (threshold >= 0),
    min_stock     INTEGER        NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    status        VARCHAR(20)    NOT NULL DEFAULT 'active',
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_material ON products (material_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- Forward-only observed inventory/policy history; fresh product INSERTs create baselines.
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
    IF NOT changed_stock AND NOT changed_threshold THEN RETURN NEW; END IF;
    INSERT INTO inventory_policy_history
        (product_id, event_type, stock_before, stock_after, threshold_before, threshold_after)
    VALUES (
        NEW.id,
        CASE WHEN changed_stock AND changed_threshold THEN 'stock_and_threshold_changed'
             WHEN changed_stock THEN 'stock_changed' ELSE 'threshold_changed' END,
        OLD.stock, NEW.stock, OLD.threshold, NEW.threshold
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_inventory_policy_history ON products;
CREATE TRIGGER products_inventory_policy_history
    AFTER INSERT OR UPDATE OF stock, threshold ON products
    FOR EACH ROW EXECUTE FUNCTION record_inventory_policy_history();

-- Suppliers
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(160) NOT NULL,
    contact_person VARCHAR(120),
    phone       VARCHAR(32),
    email       VARCHAR(160),
    address     TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- Many-to-many: a product can be sourced from multiple suppliers
CREATE TABLE IF NOT EXISTS product_suppliers (
    product_id   VARCHAR(64) NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    supplier_id  UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(64),                           -- supplier's own SKU
    lead_time_days INTEGER NOT NULL DEFAULT 0,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, supplier_id)
);

-- -----------------------------------------------------------------
-- Stock movements & per-branch stock
-- -----------------------------------------------------------------
-- Stock is denormalized into branch_stock for fast reads, with the
-- full audit trail in stock_movements. Every change to a branch's
-- on-hand qty MUST insert a stock_movements row in the same TX.
CREATE TABLE IF NOT EXISTS branch_stock (
    branch_id    UUID        NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    product_id   VARCHAR(64) NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved     INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (branch_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_branch_stock_product ON branch_stock (product_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id            VARCHAR(64) PRIMARY KEY,
    branch_id     UUID        REFERENCES branches(id)  ON DELETE RESTRICT,
    product_id    VARCHAR(64) NOT NULL REFERENCES products(id)  ON DELETE RESTRICT,
    movement_type VARCHAR(20) NOT NULL DEFAULT 'in'
        CHECK (movement_type IN ('in', 'out', 'transfer_in', 'transfer_out',
                                 'adjustment', 'return', 'damage', 'inbound', 'outbound')),
    type          VARCHAR(20) NOT NULL DEFAULT 'inbound',
    quantity      INTEGER     NOT NULL CHECK (quantity > 0),
    unit_cost     NUMERIC(12,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
    reference_no  VARCHAR(64),                            -- PO# / DR# / etc.
    supplier_id   UUID        REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier      VARCHAR(160),
    notes         TEXT,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(160),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(12,2) CHECK (unit_cost IS NULL OR unit_cost >= 0);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch   ON stock_movements (branch_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product  ON stock_movements (product_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type     ON stock_movements (movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref      ON stock_movements (reference_no);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_movements_reference_normalized
  ON stock_movements (UPPER(BTRIM(reference_no)));

-- -----------------------------------------------------------------
-- Materialized view: low-stock products (fast dashboard read)
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_low_stock;
-- -----------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS mv_low_stock CASCADE;
CREATE MATERIALIZED VIEW mv_low_stock AS
SELECT
    p.id           AS product_id,
    p.sku,
    p.name,
    p.min_stock,
    COALESCE(SUM(bs.quantity), 0)::INTEGER AS total_qty
FROM products p
LEFT JOIN branch_stock bs ON bs.product_id = p.id
WHERE p.deleted_at IS NULL AND p.is_active = TRUE
GROUP BY p.id
HAVING COALESCE(SUM(bs.quantity), 0) <= p.min_stock;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_low_stock_pk ON mv_low_stock (product_id);

-- -----------------------------------------------------------------
-- updated_at triggers (Kim's tables)
-- -----------------------------------------------------------------
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at     BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS branches_set_updated_at ON branches;
CREATE TRIGGER branches_set_updated_at  BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS materials_set_updated_at ON materials;
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at  BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS suppliers_set_updated_at ON suppliers;
CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();


-- =============================================================
-- SECTION 2 :: System Features & AI Analytics
-- Author: Luraine Villaranda <lurainevillaranda@gmail.com>
-- Last touched: 2026-06-22
-- =============================================================
-- Customer-facing workflows + AI/analytics layer.
-- Depends on SECTION 1 (users, branches, products).

-- -----------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(32) UNIQUE NOT NULL,              -- "CUST-0001"
    name        VARCHAR(160) NOT NULL,
    contact_person VARCHAR(120),
    phone       VARCHAR(32),
    email       VARCHAR(160),
    address     TEXT,
    city        VARCHAR(80),
    province    VARCHAR(80),
    customer_type VARCHAR(24) NOT NULL DEFAULT 'walk_in'
        CHECK (customer_type IN ('walk_in', 'contractor', 'dealer', 'corporate')),
    credit_limit  NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_type   ON customers (customer_type);

-- -----------------------------------------------------------------
-- Orders  +  order items
-- -----------------------------------------------------------------
-- A customer's order. Status machine:
--   draft -> confirmed -> allocated -> out_for_delivery -> delivered
--                          \-> cancelled
CREATE TABLE IF NOT EXISTS orders (
    id            VARCHAR(64) PRIMARY KEY,
    order_no      VARCHAR(32) UNIQUE NOT NULL,            -- "SS-2026-00001"
    customer_id   UUID        REFERENCES customers(id) ON DELETE SET NULL,
    branch_id     UUID        REFERENCES branches(id)  ON DELETE SET NULL,
    customer_name VARCHAR(160),
    customer_phone VARCHAR(64),
    delivery_address TEXT,
    delivery_date DATE,
    status        VARCHAR(24) NOT NULL DEFAULT 'draft',
    order_status  VARCHAR(24) NOT NULL DEFAULT 'processing',
    subtotal      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(24) NOT NULL DEFAULT 'unpaid',
    refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    refund_reason TEXT,
    refund_type   VARCHAR(16),
    items         JSONB       DEFAULT '[]'::jsonb,
    order_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    required_date TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(160),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_branch   ON orders (branch_id,   order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_ref      ON orders (order_no);

CREATE TABLE IF NOT EXISTS order_items (
    id            VARCHAR(64)    PRIMARY KEY,
    order_id      VARCHAR(64)    NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id    VARCHAR(64)    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    name          VARCHAR(200),
    quantity      INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(12,2)  NOT NULL CHECK (unit_price >= 0),
    line_total    NUMERIC(12,2)  NOT NULL CHECK (line_total   >= 0),
    notes         TEXT,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);

-- -----------------------------------------------------------------
-- Deliveries & route tracking
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id            VARCHAR(64) PRIMARY KEY,
    order_id      VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
    driver_id     UUID        REFERENCES users(id)  ON DELETE SET NULL,
    driver        VARCHAR(160),
    truck_number  VARCHAR(32),
    vehicle_plate VARCHAR(32),
    destination   TEXT,
    location      TEXT,
    current_step  INTEGER     NOT NULL DEFAULT 0,
    current_location JSONB    DEFAULT '{"x":0,"y":0}'::jsonb,
    traffic_level VARCHAR(16) NOT NULL DEFAULT 'low',
    predicted_delay BOOLEAN   NOT NULL DEFAULT FALSE,
    route_efficiency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    status        VARCHAR(24) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'scheduled', 'assigned', 'picked_up',
                          'in_transit', 'arrived', 'delivered', 'failed', 'returned')),
    scheduled_at  TIMESTAMPTZ,
    picked_up_at  TIMESTAMPTZ,
    delivered_at  TIMESTAMPTZ,
    delivery_address TEXT,
    recipient_name  VARCHAR(160),
    recipient_phone VARCHAR(32),
    signature_url   TEXT,                                  -- photo/scan ref
    failure_reason  TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID        REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order  ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries (driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries (status);

-- Append-only audit trail of every delivery status change
CREATE TABLE IF NOT EXISTS delivery_status_history (
    id            BIGSERIAL   PRIMARY KEY,
    delivery_id   VARCHAR(64) NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    from_status   VARCHAR(24),
    to_status     VARCHAR(24) NOT NULL,
    changed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_hist_delivery ON delivery_status_history (delivery_id, changed_at DESC);

-- Recommended route waypoints (computed by route optimizer, edited by staff)
CREATE TABLE IF NOT EXISTS delivery_routes (
    id            VARCHAR(64) PRIMARY KEY,
    delivery_id   VARCHAR(64) NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    sequence      INTEGER     NOT NULL,                   -- 1..N
    latitude      NUMERIC(9,6),
    longitude     NUMERIC(9,6),
    label         VARCHAR(160),
    eta_at        TIMESTAMPTZ,
    visited_at    TIMESTAMPTZ,
    UNIQUE (delivery_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_delivery ON delivery_routes (delivery_id);

-- -----------------------------------------------------------------
-- AI layer: demand forecasts + inventory classification
-- -----------------------------------------------------------------
-- DeepSeek / n8n pipeline writes here. Daily / weekly job produces
-- rows of (product, period_start, period_end, predicted_qty, confidence).
CREATE TABLE IF NOT EXISTS ai_forecasts (
    id            VARCHAR(64) PRIMARY KEY,
    product_id    VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id     UUID        REFERENCES branches(id)        ON DELETE CASCADE,
    period_start  DATE        NOT NULL,
    period_end    DATE        NOT NULL,
    predicted_qty NUMERIC(12,2) NOT NULL,
    confidence    NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    model         VARCHAR(64) NOT NULL,                    -- "deepseek-v3", etc.
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_forecasts_product ON ai_forecasts (product_id, period_start);
CREATE INDEX IF NOT EXISTS idx_forecasts_branch  ON ai_forecasts (branch_id,  period_start);

-- Fast vs slow-moving classification produced by the AI pipeline
CREATE TABLE IF NOT EXISTS inventory_classifications (
    id              VARCHAR(64) PRIMARY KEY,
    product_id      VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id       UUID        REFERENCES branches(id)        ON DELETE CASCADE,
    classification  VARCHAR(16) NOT NULL
        CHECK (classification IN ('fast', 'medium', 'slow', 'dead')),
    movement_count  INTEGER     NOT NULL DEFAULT 0,
    turnover_ratio  NUMERIC(8,3),
    classified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model           VARCHAR(64) NOT NULL,
    UNIQUE (product_id, branch_id, classified_at)
);
CREATE INDEX IF NOT EXISTS idx_classifications_product ON inventory_classifications (product_id);
CREATE INDEX IF NOT EXISTS idx_classifications_class   ON inventory_classifications (classification);

-- -----------------------------------------------------------------
-- Pre-computed analytics snapshots (dashboard read model)
-- -----------------------------------------------------------------
-- One row per (snapshot_type, period). Written by the n8n workflow,
-- read by the React dashboard. Avoids scanning large fact tables
-- on every page load.
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_type   VARCHAR(32) NOT NULL,                  -- "daily_sales", "top_products", ...
    period_start    DATE        NOT NULL,
    period_end      DATE        NOT NULL,
    branch_id       UUID        REFERENCES branches(id)   ON DELETE CASCADE,
    payload         JSONB       NOT NULL,                  -- the computed metrics
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by    VARCHAR(64) NOT NULL DEFAULT 'system'  -- "n8n" / "manual"
);
CREATE INDEX IF NOT EXISTS idx_snapshots_type_period ON analytics_snapshots (snapshot_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_branch      ON analytics_snapshots (branch_id, period_start DESC);

-- -----------------------------------------------------------------
-- Customer self-service portal tokens
-- -----------------------------------------------------------------
-- A customer can view their own order/delivery status via a public
-- magic link. This table stores the short-lived bearer tokens.
CREATE TABLE IF NOT EXISTS public_portal_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    scope       VARCHAR(32) NOT NULL,                      -- "order:<id>" or "all"
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_customer ON public_portal_tokens (customer_id);

-- -----------------------------------------------------------------
-- In-app notifications
-- -----------------------------------------------------------------
-- Low-stock alerts, delivery updates, order confirmations.
CREATE TABLE IF NOT EXISTS notifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,   -- NULL = broadcast
    category    VARCHAR(32) NOT NULL
        CHECK (category IN ('low_stock', 'order', 'delivery', 'forecast', 'system')),
    severity    VARCHAR(16) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'critical')),
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    payload     JSONB,                                       -- optional structured data
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;

-- -----------------------------------------------------------------
-- updated_at triggers (Luraine's tables)
-- -----------------------------------------------------------------
DROP TRIGGER IF EXISTS customers_set_updated_at ON customers;
CREATE TRIGGER customers_set_updated_at  BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at     BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS deliveries_set_updated_at ON deliveries;
CREATE TRIGGER deliveries_set_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();


-- =============================================================
-- SECTION 3 :: Development Methodology
-- Author: Hazel <23-14869@g.batstate-u.edu.ph>
-- Last touched: 2026-06-22
-- =============================================================
-- Audit trail + Agile workflow + deployment/test history.
-- Depends on SECTION 1 (users) and SECTION 2 (orders, deliveries).

-- -----------------------------------------------------------------
-- System-wide audit log
-- -----------------------------------------------------------------
-- Every privileged write goes through the application's audit
-- middleware, which inserts a row here in the same transaction.
-- Append-only; never updated, never deleted.
CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGSERIAL   PRIMARY KEY,
    actor_id     UUID        REFERENCES users(id) ON DELETE SET NULL,  -- NULL = system
    actor_label  VARCHAR(120),                           -- snapshot of name at the time
    entity_type  VARCHAR(64) NOT NULL,                   -- "product", "order", ...
    entity_id    UUID,                                   -- may be NULL for bulk actions
    action       VARCHAR(32) NOT NULL,                   -- "create", "update", "delete",
                                                       -- "login", "logout", "export"
    changes      JSONB,                                  -- {"field": {"from": x, "to": y}}
    ip_address   INET,
    user_agent   TEXT,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor      ON audit_logs (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_logs (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs (action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_occurred   ON audit_logs (occurred_at DESC);

-- -----------------------------------------------------------------
-- Development phases (Agile six-phase model)
-- -----------------------------------------------------------------
-- Phases: Planning, Design, Development, Testing, Deployment, Review
CREATE TABLE IF NOT EXISTS development_phases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(40) UNIQUE NOT NULL
        CHECK (name IN ('planning', 'design', 'development',
                        'testing', 'deployment', 'review')),
    description TEXT,
    sort_order  INTEGER     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seed the six phases
INSERT INTO development_phases (name, sort_order, description) VALUES
    ('planning',     1, 'Requirements gathering, sprint planning, and backlog grooming.'),
    ('design',       2, 'UI/UX wireframes, architecture diagrams, and database design.'),
    ('development',  3, 'Implementation of features in code (frontend + backend).'),
    ('testing',      4, 'Unit tests, integration tests, and UAT with the client.'),
    ('deployment',   5, 'Release to staging/production and post-deploy verification.'),
    ('review',       6, 'Retrospective, client review, and feedback incorporation.')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------------------
-- Sprints  +  sprint tasks
-- -----------------------------------------------------------------
-- A sprint is a 2-week Agile iteration. Sprint tasks map directly
-- to user stories / GitHub issues.
CREATE TABLE IF NOT EXISTS sprints (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80) UNIQUE NOT NULL,            -- "Sprint 1 — Inventory MVP"
    goal        TEXT,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    status      VARCHAR(16) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS sprint_tasks (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id    UUID        NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    phase_id     UUID        NOT NULL REFERENCES development_phases(id) ON DELETE RESTRICT,
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    assignee_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
    story_points INTEGER     NOT NULL DEFAULT 0 CHECK (story_points >= 0),
    status       VARCHAR(16) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
    priority     VARCHAR(16) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    github_issue_url TEXT,
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by   UUID        REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_sprint   ON sprint_tasks (sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_assignee ON sprint_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_sprint_tasks_status   ON sprint_tasks (status);

-- Daily standup notes
CREATE TABLE IF NOT EXISTS sprint_standups (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sprint_id   UUID        NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    standup_date DATE       NOT NULL,
    author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    yesterday   TEXT        NOT NULL,
    today       TEXT        NOT NULL,
    blockers    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sprint_id, standup_date, author_id)
);

-- -----------------------------------------------------------------
-- Client feedback (admin/owner of Glassram)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_feedback (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    review_type   VARCHAR(24) NOT NULL
        CHECK (review_type IN ('sprint_review', 'uat', 'general', 'bug_report')),
    sprint_id     UUID        REFERENCES sprints(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(120) NOT NULL,
    reviewer_role VARCHAR(80),                          -- "Owner", "Admin", "Staff"
    rating        INTEGER     CHECK (rating BETWEEN 1 AND 5),
    summary       VARCHAR(200) NOT NULL,
    details       TEXT,
    status        VARCHAR(16) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'wont_fix')),
    resolved_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_status  ON client_feedback (status);
CREATE INDEX IF NOT EXISTS idx_feedback_sprint  ON client_feedback (sprint_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type    ON client_feedback (review_type);

-- -----------------------------------------------------------------
-- Deployment history
-- -----------------------------------------------------------------
-- Records every release to staging/production. Populated by the
-- deploy pipeline (or by hand for hot-fixes).
CREATE TABLE IF NOT EXISTS deployments (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    environment    VARCHAR(16) NOT NULL
        CHECK (environment IN ('staging', 'production')),
    version_tag    VARCHAR(64) NOT NULL,                 -- "v0.3.1" or git SHA
    commit_sha     VARCHAR(40),
    branch         VARCHAR(80),
    deployed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    status         VARCHAR(16) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'success', 'failed', 'rolled_back')),
    notes          TEXT,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ,
    rollback_of    UUID        REFERENCES deployments(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_deployments_env      ON deployments (environment, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status   ON deployments (status);
CREATE INDEX IF NOT EXISTS idx_deployments_commit   ON deployments (commit_sha);

-- -----------------------------------------------------------------
-- Test cases & runs
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_cases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(40) UNIQUE NOT NULL,            -- "TC-INV-001"
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    category    VARCHAR(24) NOT NULL
        CHECK (category IN ('unit', 'integration', 'e2e', 'uat')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_runs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id  UUID        NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    deployment_id UUID        REFERENCES deployments(id) ON DELETE SET NULL,
    run_by        UUID        REFERENCES users(id) ON DELETE SET NULL,
    status        VARCHAR(16) NOT NULL
        CHECK (status IN ('passed', 'failed', 'skipped', 'errored')),
    duration_ms   INTEGER     CHECK (duration_ms >= 0),
    error_log     TEXT,
    ran_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_runs_case  ON test_runs (test_case_id, ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_runs_dep   ON test_runs (deployment_id);

-- -----------------------------------------------------------------
-- updated_at triggers (Hazel's tables)
-- -----------------------------------------------------------------
DROP TRIGGER IF EXISTS sprints_set_updated_at ON sprints;
CREATE TRIGGER sprints_set_updated_at         BEFORE UPDATE ON sprints
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS sprint_tasks_set_updated_at ON sprint_tasks;
CREATE TRIGGER sprint_tasks_set_updated_at    BEFORE UPDATE ON sprint_tasks
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS client_feedback_set_updated_at ON client_feedback;
CREATE TRIGGER client_feedback_set_updated_at BEFORE UPDATE ON client_feedback
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
DROP TRIGGER IF EXISTS test_cases_set_updated_at ON test_cases;
CREATE TRIGGER test_cases_set_updated_at      BEFORE UPDATE ON test_cases
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
