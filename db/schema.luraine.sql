-- =============================================================
-- SmartStock :: Database Schema
-- Section:  System Features & AI Analytics  (Luraine Villaranda)
-- Branch:   Luraine  →  ure23 / Ure
-- Engine:   PostgreSQL 14+
-- Layer:    Customer-facing features + AI/analytics layer
-- =============================================================
--
-- This file contains the tables that power SmartStock's customer
-- workflows (customers, orders, deliveries) and the AI-assisted
-- analytics layer (demand forecasts, fast/slow classification,
-- pre-computed dashboard snapshots, public portal tokens).
--
-- Dependencies (assumed already applied):
--   schema.kim.sql  — products, branches, users
--
-- See also:
--   schema.hazel.sql  — audit logs, agile workflow
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------
CREATE TABLE customers (
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
CREATE INDEX idx_customers_active ON customers (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_type   ON customers (customer_type);

-- -----------------------------------------------------------------
-- Orders  +  order items
-- -----------------------------------------------------------------
-- A customer's order. Status machine:
--   draft -> confirmed -> allocated -> out_for_delivery -> delivered
--                          \-> cancelled
CREATE TABLE orders (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no      VARCHAR(32) UNIQUE NOT NULL,            -- "ORD-202606-0001"
    customer_id   UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id     UUID        NOT NULL REFERENCES branches(id)  ON DELETE RESTRICT,
    status        VARCHAR(24) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'confirmed', 'allocated',
                          'out_for_delivery', 'delivered', 'cancelled')),
    order_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    required_date TIMESTAMPTZ,
    total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_orders_customer ON orders (customer_id, order_date DESC);
CREATE INDEX idx_orders_branch   ON orders (branch_id,   order_date DESC);
CREATE INDEX idx_orders_status   ON orders (status);

CREATE TABLE order_items (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID           NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id    UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity      INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(12,2)  NOT NULL CHECK (unit_price >= 0),
    line_total    NUMERIC(12,2)  NOT NULL CHECK (line_total   >= 0),
    notes         TEXT,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);

-- -----------------------------------------------------------------
-- Deliveries & route tracking
-- -----------------------------------------------------------------
CREATE TABLE deliveries (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    driver_id     UUID        REFERENCES users(id)         ON DELETE SET NULL,
    vehicle_plate VARCHAR(32),
    status        VARCHAR(24) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'scheduled', 'picked_up',
                          'in_transit', 'delivered', 'failed', 'returned')),
    scheduled_at  TIMESTAMPTZ,
    picked_up_at  TIMESTAMPTZ,
    delivered_at  TIMESTAMPTZ,
    delivery_address TEXT,
    recipient_name  VARCHAR(160),
    recipient_phone VARCHAR(32),
    signature_url   TEXT,                                  -- photo/scan ref
    failure_reason  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID        REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_deliveries_order  ON deliveries (order_id);
CREATE INDEX idx_deliveries_driver ON deliveries (driver_id);
CREATE INDEX idx_deliveries_status ON deliveries (status);

-- Append-only audit trail of every delivery status change
CREATE TABLE delivery_status_history (
    id            BIGSERIAL   PRIMARY KEY,
    delivery_id   UUID        NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    from_status   VARCHAR(24),
    to_status     VARCHAR(24) NOT NULL,
    changed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_delivery_hist_delivery ON delivery_status_history (delivery_id, changed_at DESC);

-- Recommended route waypoints (computed by route optimizer, edited by staff)
CREATE TABLE delivery_routes (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id   UUID        NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    sequence      INTEGER     NOT NULL,                   -- 1..N
    latitude      NUMERIC(9,6),
    longitude     NUMERIC(9,6),
    label         VARCHAR(160),
    eta_at        TIMESTAMPTZ,
    visited_at    TIMESTAMPTZ,
    UNIQUE (delivery_id, sequence)
);
CREATE INDEX idx_delivery_routes_delivery ON delivery_routes (delivery_id);

-- -----------------------------------------------------------------
-- AI layer: demand forecasts + inventory classification
-- -----------------------------------------------------------------
-- DeepSeek / n8n pipeline writes here. Daily / weekly job produces
-- rows of (product, period_start, period_end, predicted_qty, confidence).
CREATE TABLE ai_forecasts (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id     UUID        REFERENCES branches(id)        ON DELETE CASCADE,
    period_start  DATE        NOT NULL,
    period_end    DATE        NOT NULL,
    predicted_qty NUMERIC(12,2) NOT NULL,
    confidence    NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    model         VARCHAR(64) NOT NULL,                    -- "deepseek-v3", etc.
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (period_end >= period_start)
);
CREATE INDEX idx_forecasts_product ON ai_forecasts (product_id, period_start);
CREATE INDEX idx_forecasts_branch  ON ai_forecasts (branch_id,  period_start);

-- Fast vs slow-moving classification produced by the AI pipeline
CREATE TABLE inventory_classifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id       UUID        REFERENCES branches(id)        ON DELETE CASCADE,
    classification  VARCHAR(16) NOT NULL
        CHECK (classification IN ('fast', 'medium', 'slow', 'dead')),
    movement_count  INTEGER     NOT NULL DEFAULT 0,
    turnover_ratio  NUMERIC(8,3),
    classified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model           VARCHAR(64) NOT NULL,
    UNIQUE (product_id, branch_id, classified_at)
);
CREATE INDEX idx_classifications_product ON inventory_classifications (product_id);
CREATE INDEX idx_classifications_class   ON inventory_classifications (classification);

-- -----------------------------------------------------------------
-- Pre-computed analytics snapshots (dashboard read model)
-- -----------------------------------------------------------------
-- One row per (snapshot_type, period). Written by the n8n workflow,
-- read by the React dashboard. Avoids scanning large fact tables
-- on every page load.
CREATE TABLE analytics_snapshots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_type   VARCHAR(32) NOT NULL,                  -- "daily_sales", "top_products", ...
    period_start    DATE        NOT NULL,
    period_end      DATE        NOT NULL,
    branch_id       UUID        REFERENCES branches(id)   ON DELETE CASCADE,
    payload         JSONB       NOT NULL,                  -- the computed metrics
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by    VARCHAR(64) NOT NULL DEFAULT 'system'  -- "n8n" / "manual"
);
CREATE INDEX idx_snapshots_type_period ON analytics_snapshots (snapshot_type, period_start DESC);
CREATE INDEX idx_snapshots_branch      ON analytics_snapshots (branch_id, period_start DESC);

-- -----------------------------------------------------------------
-- Customer self-service portal tokens
-- -----------------------------------------------------------------
-- A customer can view their own order/delivery status via a public
-- magic link. This table stores the short-lived bearer tokens.
CREATE TABLE public_portal_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    scope       VARCHAR(32) NOT NULL,                      -- "order:<id>" or "all"
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_portal_tokens_customer ON public_portal_tokens (customer_id);

-- -----------------------------------------------------------------
-- In-app notifications
-- -----------------------------------------------------------------
-- Low-stock alerts, delivery updates, order confirmations.
CREATE TABLE notifications (
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
CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, created_at DESC)
    WHERE read_at IS NULL;

-- -----------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------
CREATE TRIGGER customers_set_updated_at  BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER orders_set_updated_at     BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER deliveries_set_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
