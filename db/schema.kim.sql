-- =============================================================
-- SmartStock :: Database Schema
-- Section:  Architecture & Technologies  (Kim Eduard Saludes)
-- Branch:   Kim   →  FireFlyDeveloper
-- Engine:   PostgreSQL 14+
-- Layer:    Core data backbone — identity, products, stock
-- =============================================================
--
-- This file contains the tables that form the data backbone of
-- SmartStock: who uses the system, what the business sells, and
-- how physical inventory is tracked across warehouse branches.
--
-- See:
--   schema.luraine.sql   — orders, deliveries, AI analytics
--   schema.hazel.sql     — audit logs, agile workflow
-- =============================================================

BEGIN;

-- -----------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- -----------------------------------------------------------------
-- Enumerations (CHECK-constraint style for migration safety)
-- -----------------------------------------------------------------

-- User role tiers inside SmartStock
CREATE TABLE users (
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
CREATE INDEX idx_users_active ON users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role   ON users (role)       WHERE deleted_at IS NULL;

-- Auth session tokens (JWT-style opaque tokens)
CREATE TABLE user_sessions (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL UNIQUE,           -- SHA-256 of the bearer
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user    ON user_sessions (user_id);
CREATE INDEX idx_sessions_expires ON user_sessions (expires_at);

-- -----------------------------------------------------------------
-- Branches (warehouse / store locations)
-- -----------------------------------------------------------------
CREATE TABLE branches (
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
CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE materials (
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
CREATE INDEX idx_materials_category ON materials (category_id);

CREATE TABLE products (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(64)    UNIQUE NOT NULL,        -- the SKU on the invoice
    material_id   UUID           NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    name          VARCHAR(200)   NOT NULL,
    description   TEXT,
    unit_price    NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    cost_price    NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    unit          VARCHAR(16)    NOT NULL,
    min_stock     INTEGER        NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX idx_products_material ON products (material_id);
CREATE INDEX idx_products_active   ON products (is_active) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------
-- Suppliers
-- -----------------------------------------------------------------
CREATE TABLE suppliers (
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
CREATE TABLE product_suppliers (
    product_id   UUID NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
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
CREATE TABLE branch_stock (
    branch_id    UUID    NOT NULL REFERENCES branches(id)  ON DELETE CASCADE,
    product_id   UUID    NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
    quantity     INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved     INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (branch_id, product_id)
);
CREATE INDEX idx_branch_stock_product ON branch_stock (product_id);

CREATE TABLE stock_movements (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id     UUID        NOT NULL REFERENCES branches(id)  ON DELETE RESTRICT,
    product_id    UUID        NOT NULL REFERENCES products(id)  ON DELETE RESTRICT,
    movement_type VARCHAR(20) NOT NULL
        CHECK (movement_type IN ('in', 'out', 'transfer_in', 'transfer_out',
                                 'adjustment', 'return', 'damage')),
    quantity      INTEGER     NOT NULL CHECK (quantity > 0),
    reference_no  VARCHAR(64),                            -- PO# / DR# / etc.
    supplier_id   UUID        REFERENCES suppliers(id) ON DELETE SET NULL,
    notes         TEXT,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID        REFERENCES users(id)   ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_movements_branch   ON stock_movements (branch_id, occurred_at DESC);
CREATE INDEX idx_stock_movements_product  ON stock_movements (product_id, occurred_at DESC);
CREATE INDEX idx_stock_movements_type     ON stock_movements (movement_type);
CREATE INDEX idx_stock_movements_ref      ON stock_movements (reference_no);

-- -----------------------------------------------------------------
-- Materialized view: low-stock products (fast dashboard read)
-- Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_low_stock;
-- -----------------------------------------------------------------
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

CREATE UNIQUE INDEX idx_mv_low_stock_pk ON mv_low_stock (product_id);

-- -----------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at     BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER branches_set_updated_at  BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER products_set_updated_at  BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER suppliers_set_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMIT;
