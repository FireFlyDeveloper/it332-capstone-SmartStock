/**
 * PostgreSQL Database Store for SmartStock
 * Full persistence implementation for Glassram Glass & Aluminum Supply
 */

import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { getPool } from './client.js';
import { hasDatabaseUrl } from './config.js';
import { setDbSyncActive } from './syncState.js';

import type { AnalyticsOrderSummary, MonthlyItemMovementCursor, MonthlyItemMovementRow, MonthlyStockMovementRow, OutboundMovementByUnit, RecentActivityRecord } from '../analytics/analytics.js';
import { decodeNotificationCursor, encodeNotificationCursor, notificationTypeRank, type NotificationFeedItem, type NotificationPageInput, type NotificationPageResult } from '../notifications/feed.js';
import type { InventoryPolicyEvent, Product, ProductCreateInput, ProductUpdateInput, StockMovement, StockMovementInput } from '../inventory/store.js';
import type { Order, OrderCreateInput, OrderUpdateInput, PaymentStatus, RefundType } from '../orders/store.js';
import type { Delivery, DeliveryCreateInput, DeliveryUpdateInput } from '../delivery/store.js';
import type { UserRecord, Role } from '../auth/users.js';

let dbInitialized = false;

export async function initDatabase(): Promise<void> {
  if (dbInitialized) return;
  if (!hasDatabaseUrl) throw new Error('DATABASE_URL is required; refusing to start without persistent storage');
  const pool = getPool();
  if (!pool) throw new Error('PostgreSQL connection pool is unavailable');

  try {
    await pool.query('SELECT 1');
    await hydrateStoresFromDb();
    dbInitialized = true;
    setDbSyncActive(true);
  } catch (err) {
    setDbSyncActive(false);
    throw err;
  }
}

export async function hydrateStoresFromDb(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  const [{ rows: prodRows }, { rows: orderRows }, { rows: delivRows }, { rows: movRows }, { rows: userRows }, { rows: policyRows }] = await Promise.all([
    pool.query('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC'),
    pool.query('SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY order_no ASC'),
    pool.query('SELECT * FROM deliveries ORDER BY id ASC'),
    pool.query('SELECT * FROM stock_movements ORDER BY occurred_at DESC'),
    pool.query('SELECT * FROM users WHERE deleted_at IS NULL'),
    pool.query('SELECT id, product_id, recorded_at, event_type, stock_before, stock_after, threshold_before, threshold_after FROM inventory_policy_history ORDER BY recorded_at, id'),
  ]);
  const [inventoryStore, orderStore, deliveryStore, usersStore] = await Promise.all([
    import('../inventory/store.js'),
    import('../orders/store.js'),
    import('../delivery/store.js'),
    import('../auth/users.js'),
  ]);
  inventoryStore._hydrateInventory(prodRows.map(rowToProduct));
  inventoryStore.hydrateInventoryPolicyHistory(policyRows.map(rowToInventoryPolicyEvent));
  orderStore._hydrateOrders(orderRows.map(rowToOrder));
  deliveryStore._hydrateDeliveries(delivRows.map(rowToDelivery));
  inventoryStore._hydrateMovements(movRows.map((r) => ({
    id: String(r.id),
    productId: String(r.product_id),
    type: (r.type as 'inbound' | 'outbound') || 'inbound',
    quantity: Number(r.quantity),
    referenceNo: String(r.reference_no),
    supplier: r.supplier ? String(r.supplier) : undefined,
    occurredAt: new Date(r.occurred_at as string | Date).toISOString(),
    createdBy: String(r.created_by),
    unitCost: r.unit_cost === null || r.unit_cost === undefined ? undefined : Number(r.unit_cost),
  })));
  usersStore._hydrateUsers(userRows.map(rowToUser));
}

function rowToInventoryPolicyEvent(row: Record<string, unknown>): InventoryPolicyEvent {
  return {
    id: Number(row.id),
    productId: String(row.product_id),
    recordedAt: new Date(row.recorded_at as string | Date).toISOString(),
    eventType: String(row.event_type) as InventoryPolicyEvent['eventType'],
    stockBefore: row.stock_before === null ? null : Number(row.stock_before),
    stockAfter: Number(row.stock_after),
    thresholdBefore: row.threshold_before === null ? null : Number(row.threshold_before),
    thresholdAfter: Number(row.threshold_after),
  };
}

export async function listInventoryPolicyHistoryDb(): Promise<InventoryPolicyEvent[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(`
    SELECT id, product_id, recorded_at, event_type, stock_before, stock_after, threshold_before, threshold_after
    FROM inventory_policy_history ORDER BY recorded_at, id
  `);
  return rows.map(rowToInventoryPolicyEvent);
}

// ── PRODUCTS ────────────────────────────────────────────────────────

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    category: (row.category as 'glass' | 'aluminum') || 'glass',
    unit: String(row.unit),
    stock: Number(row.stock),
    price: Number(row.unit_price ?? row.price ?? 0),
    threshold: Number(row.threshold ?? row.min_stock ?? 0),
    status: (row.status as 'active' | 'discontinued') || 'active',
    description: row.description ? String(row.description) : undefined,
    sku: String(row.sku),
  };
}

export interface ProductsDbPage {
  items: Product[];
  totalCount: number;
  totalProducts: number;
  glassCount: number;
  aluminumCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  glassInventoryValue: number;
  aluminumInventoryValue: number;
  activeProductCount: number;
  activeGlassCount: number;
  activeAluminumCount: number;
  activeLowStockCount: number;
  healthyStockCount: number;
  lowStockStatusCount: number;
  criticalStockCount: number;
  stockAlertProducts: {
    outOfStock: { id: string; name: string; stock: number; unit: string; threshold: number } | null;
    critical: { id: string; name: string; stock: number; unit: string; threshold: number } | null;
    low: { id: string; name: string; stock: number; unit: string; threshold: number } | null;
  };
  hasMore: boolean;
  nextCursor: { name: string; id: string } | null;
}

export interface AnnualPurchaseDbPage {
  groups: Array<{
    materialType: string;
    supplier: string;
    transactionCount: number;
    totalQuantity: number;
    totalCost: number;
    unpricedReceiptCount: number;
    unpricedQuantity: number;
  }>;
  totalSpend: number;
  unpricedReceiptCount: number;
  unpricedQuantity: number;
  pricedReceiptCount: number;
  page: {
    limit: number;
    totalCount: number;
    hasMore: boolean;
    nextCursor: { materialType: string; supplier: string } | null;
  };
}

export async function listAnnualPurchasesPageDb(input: {
  year: number;
  limit: number;
  cursor: { materialType: string; supplier: string } | null;
}): Promise<AnnualPurchaseDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const start = new Date(Date.UTC(input.year, 0, 1));
  const end = new Date(Date.UTC(input.year + 1, 0, 1));
  const { rows } = await pool.query(`
    WITH grouped AS (
      SELECT COALESCE(p.category, 'unknown') AS material_type,
        COALESCE(NULLIF(BTRIM(m.supplier), ''), 'Unspecified') AS supplier,
        COUNT(*)::int AS transaction_count,
        SUM(m.quantity)::numeric AS total_quantity,
        COALESCE(SUM(m.quantity * m.unit_cost), 0)::numeric AS total_cost,
        COUNT(*) FILTER (WHERE m.unit_cost IS NULL)::int AS unpriced_receipt_count,
        COALESCE(SUM(m.quantity) FILTER (WHERE m.unit_cost IS NULL), 0)::numeric AS unpriced_quantity
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
      WHERE m.type = 'inbound' AND m.occurred_at >= $1 AND m.occurred_at < $2
      GROUP BY 1, 2
    ), page_rows AS (
      SELECT * FROM grouped
      WHERE $3::text IS NULL
        OR material_type COLLATE "C" > $3::text COLLATE "C"
        OR (material_type COLLATE "C" = $3::text COLLATE "C" AND supplier COLLATE "C" > $4::text COLLATE "C")
      ORDER BY material_type COLLATE "C" ASC, supplier COLLATE "C" ASC
      LIMIT $5
    ), totals AS (
      SELECT COUNT(*)::int AS total_count,
        COALESCE(SUM(total_cost), 0)::numeric AS total_spend,
        COALESCE(SUM(unpriced_receipt_count), 0)::int AS unpriced_receipt_count,
        COALESCE(SUM(unpriced_quantity), 0)::numeric AS unpriced_quantity,
        COALESCE(SUM(transaction_count - unpriced_receipt_count), 0)::int AS priced_receipt_count
      FROM grouped
    )
    SELECT totals.total_count, totals.total_spend, totals.unpriced_receipt_count,
      totals.unpriced_quantity, totals.priced_receipt_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.material_type COLLATE "C", page_rows.supplier COLLATE "C") FROM page_rows), '[]'::jsonb) AS page_items
    FROM totals
  `, [start, end, input.cursor?.materialType ?? null, input.cursor?.supplier ?? null, input.limit + 1]);
  const row = rows[0];
  if (!row) return null;
  const rawItems = (typeof row.page_items === 'string' ? JSON.parse(row.page_items) : row.page_items ?? []) as Record<string, unknown>[];
  const groups = rawItems.slice(0, input.limit).map((item) => ({
    materialType: String(item.material_type),
    supplier: String(item.supplier),
    transactionCount: Number(item.transaction_count ?? 0),
    totalQuantity: Number(item.total_quantity ?? 0),
    totalCost: Number(item.total_cost ?? 0),
    unpricedReceiptCount: Number(item.unpriced_receipt_count ?? 0),
    unpricedQuantity: Number(item.unpriced_quantity ?? 0),
  }));
  const hasMore = rawItems.length > input.limit;
  const last = groups.at(-1);
  return {
    groups,
    totalSpend: Number(row.total_spend ?? 0),
    unpricedReceiptCount: Number(row.unpriced_receipt_count ?? 0),
    unpricedQuantity: Number(row.unpriced_quantity ?? 0),
    pricedReceiptCount: Number(row.priced_receipt_count ?? 0),
    page: {
      limit: input.limit,
      totalCount: Number(row.total_count ?? 0),
      hasMore,
      nextCursor: hasMore && last ? { materialType: last.materialType, supplier: last.supplier } : null,
    },
  };
}

export async function listProductsPageDb(input: {
  limit: number;
  category: 'all' | 'glass' | 'aluminum';
  stock: 'all' | 'low' | 'healthy';
  searchTokens: string[];
  cursorName: string | null;
  cursorId: string | null;
}): Promise<ProductsDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH filtered AS (
      SELECT * FROM products p
      WHERE p.deleted_at IS NULL
        AND ($1::text = 'all' OR p.category = $1::text)
        AND ($2::text = 'all' OR ($2::text = 'low' AND p.stock <= p.threshold) OR ($2::text = 'healthy' AND p.stock > p.threshold))
        AND NOT EXISTS (
          SELECT 1 FROM unnest($3::text[]) AS tokens(term)
          WHERE POSITION(term IN LOWER(CONCAT_WS(' ', p.id, p.sku, p.name, p.category, p.unit, p.description))) = 0
        )
    ), summary AS (
      SELECT COUNT(*)::int AS total_products,
        COUNT(*) FILTER (WHERE category = 'glass')::int AS glass_count,
        COUNT(*) FILTER (WHERE category = 'aluminum')::int AS aluminum_count,
        COUNT(*) FILTER (WHERE stock <= threshold)::int AS low_stock_count,
        COUNT(*) FILTER (WHERE stock <= 0)::int AS out_of_stock_count,
        COALESCE(SUM(stock * unit_price), 0)::numeric AS total_inventory_value,
        COALESCE(SUM(stock * unit_price) FILTER (WHERE category = 'glass'), 0)::numeric AS glass_inventory_value,
        COALESCE(SUM(stock * unit_price) FILTER (WHERE category = 'aluminum'), 0)::numeric AS aluminum_inventory_value,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_product_count,
        COUNT(*) FILTER (WHERE status = 'active' AND category = 'glass')::int AS active_glass_count,
        COUNT(*) FILTER (WHERE status = 'active' AND category = 'aluminum')::int AS active_aluminum_count,
        COUNT(*) FILTER (WHERE status = 'active' AND stock <= threshold)::int AS active_low_stock_count,
        COUNT(*) FILTER (WHERE stock > threshold)::int AS healthy_stock_count,
        COUNT(*) FILTER (WHERE stock > 0 AND stock > threshold * 0.5 AND stock <= threshold)::int AS low_stock_status_count,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= threshold * 0.5)::int AS critical_stock_count
      FROM products WHERE deleted_at IS NULL
    ), stock_alerts AS (
      SELECT
        (SELECT jsonb_build_object('id', p.id, 'name', p.name, 'stock', p.stock, 'unit', p.unit, 'threshold', p.threshold)
         FROM products p WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.stock <= 0
         ORDER BY p.name COLLATE "C", p.id::text COLLATE "C" LIMIT 1) AS out_of_stock,
        (SELECT jsonb_build_object('id', p.id, 'name', p.name, 'stock', p.stock, 'unit', p.unit, 'threshold', p.threshold)
         FROM products p WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.stock > 0 AND p.stock <= p.threshold * 0.5
         ORDER BY p.name COLLATE "C", p.id::text COLLATE "C" LIMIT 1) AS critical,
        (SELECT jsonb_build_object('id', p.id, 'name', p.name, 'stock', p.stock, 'unit', p.unit, 'threshold', p.threshold)
         FROM products p WHERE p.deleted_at IS NULL AND p.status = 'active' AND p.stock > p.threshold * 0.5 AND p.stock <= p.threshold
         ORDER BY p.name COLLATE "C", p.id::text COLLATE "C" LIMIT 1) AS low
    ), page_rows AS (
      SELECT * FROM filtered
      WHERE $4::text IS NULL
        OR name COLLATE "C" > $4::text COLLATE "C"
        OR (name COLLATE "C" = $4::text COLLATE "C" AND id::text COLLATE "C" > $5::text COLLATE "C")
      ORDER BY name COLLATE "C" ASC, id::text COLLATE "C" ASC
      LIMIT $6
    )
    SELECT (SELECT COUNT(*)::int FROM filtered) AS filtered_count,
      summary.total_products, summary.glass_count, summary.aluminum_count, summary.low_stock_count, summary.out_of_stock_count,
      summary.total_inventory_value, summary.glass_inventory_value, summary.aluminum_inventory_value,
      summary.active_product_count, summary.active_glass_count, summary.active_aluminum_count, summary.active_low_stock_count,
      summary.healthy_stock_count, summary.low_stock_status_count, summary.critical_stock_count,
      stock_alerts.out_of_stock AS stock_alert_out_of_stock,
      stock_alerts.critical AS stock_alert_critical,
      stock_alerts.low AS stock_alert_low,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.name COLLATE "C" ASC, page_rows.id::text COLLATE "C" ASC) FROM page_rows), '[]'::jsonb) AS page_items
    FROM summary CROSS JOIN stock_alerts
  `, [input.category, input.stock, input.searchTokens, input.cursorName, input.cursorId, input.limit + 1]);
  const row = rows[0];
  if (!row) return null;
  const rawItems = (typeof row.page_items === 'string' ? JSON.parse(row.page_items) : row.page_items ?? []) as Record<string, unknown>[];
  const visibleRows = rawItems.slice(0, input.limit);
  const hasMore = rawItems.length > input.limit;
  const lastVisible = visibleRows[visibleRows.length - 1];
  const parseAlertProduct = (value: unknown) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return null;
    const alert = parsed as Record<string, unknown>;
    return { id: String(alert.id), name: String(alert.name), stock: Number(alert.stock), unit: String(alert.unit), threshold: Number(alert.threshold) };
  };
  return {
    items: visibleRows.map(rowToProduct),
    totalCount: Number(row.filtered_count ?? 0),
    totalProducts: Number(row.total_products ?? 0),
    glassCount: Number(row.glass_count ?? 0),
    aluminumCount: Number(row.aluminum_count ?? 0),
    lowStockCount: Number(row.low_stock_count ?? 0),
    outOfStockCount: Number(row.out_of_stock_count ?? 0),
    totalInventoryValue: Number(row.total_inventory_value ?? 0),
    glassInventoryValue: Number(row.glass_inventory_value ?? 0),
    aluminumInventoryValue: Number(row.aluminum_inventory_value ?? 0),
    activeProductCount: Number(row.active_product_count ?? 0),
    activeGlassCount: Number(row.active_glass_count ?? 0),
    activeAluminumCount: Number(row.active_aluminum_count ?? 0),
    activeLowStockCount: Number(row.active_low_stock_count ?? 0),
    healthyStockCount: Number(row.healthy_stock_count ?? 0),
    lowStockStatusCount: Number(row.low_stock_status_count ?? 0),
    criticalStockCount: Number(row.critical_stock_count ?? 0),
    stockAlertProducts: {
      outOfStock: parseAlertProduct(row.stock_alert_out_of_stock),
      critical: parseAlertProduct(row.stock_alert_critical),
      low: parseAlertProduct(row.stock_alert_low),
    },
    hasMore,
    nextCursor: hasMore && lastVisible ? { name: String(lastVisible.name), id: String(lastVisible.id) } : null,
  };
}

export async function listProductsDb(): Promise<Product[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC'
  );
  return rows.map(rowToProduct);
}

export async function listLowStockProductsDb(): Promise<Product[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE deleted_at IS NULL AND stock <= threshold ORDER BY name ASC'
  );
  return rows.map(rowToProduct);
}

export async function findProductByIdDb(id: string): Promise<Product | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function createProductDb(input: ProductCreateInput & { id?: string }): Promise<Product> {
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const id = input.id ?? `PRD-${randomUUID().slice(0, 8).toUpperCase()}`;
  const sku = input.sku.trim().toUpperCase();

  const { rows } = await pool.query(`
    INSERT INTO products (id, sku, name, category, unit, stock, threshold, min_stock, unit_price, status, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10)
    RETURNING *
  `, [
    id,
    sku,
    input.name.trim(),
    input.category,
    input.unit.trim(),
    input.stock,
    input.threshold,
    input.price,
    input.status ?? 'active',
    input.description?.trim() || null,
  ]);
  return rowToProduct(rows[0]);
}

export async function updateProductDb(id: string, input: ProductUpdateInput): Promise<Product | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findProductByIdDb(id);
  if (!current) return null;

  const nextSku = input.sku === undefined ? current.sku : input.sku.trim().toUpperCase();
  const nextName = input.name === undefined ? current.name : input.name.trim();
  const nextCategory = input.category ?? current.category;
  const nextUnit = input.unit === undefined ? current.unit : input.unit.trim();
  const nextStock = input.stock ?? current.stock;
  const nextPrice = input.price ?? current.price;
  const nextThreshold = input.threshold ?? current.threshold;
  const nextStatus = input.status ?? current.status;
  const nextDescription = input.description === undefined ? current.description : input.description.trim() || null;

  const { rows } = await pool.query(`
    UPDATE products
    SET sku = $2, name = $3, category = $4, unit = $5, stock = $6, unit_price = $7,
        threshold = $8, min_stock = $8, status = $9, description = $10, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `, [
    id, nextSku, nextName, nextCategory, nextUnit, nextStock, nextPrice, nextThreshold, nextStatus, nextDescription
  ]);
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function deleteProductDb(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const { rowCount } = await pool.query(
    'UPDATE products SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return (rowCount ?? 0) > 0;
}

export async function recordInboundStockDb(
  productId: string,
  input: StockMovementInput & { id?: string }
): Promise<{ product: Product; movement: StockMovement } | null> {
  const pool = getPool();
  if (!pool) return null;

  const movementId = input.id ?? `MOV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = input.occurredAt ?? new Date().toISOString();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows: prodRows } = await client.query(`
      UPDATE products SET stock = stock + $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL RETURNING *
    `, [productId, input.quantity]);
    if (!prodRows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(`
      INSERT INTO stock_movements (id, product_id, type, movement_type, quantity, reference_no, supplier, occurred_at, created_by, unit_cost)
      VALUES ($1, $2, 'inbound', 'inbound', $3, $4, $5, $6, $7, $8)
    `, [
      movementId,
      productId,
      input.quantity,
      input.referenceNo.trim().toUpperCase(),
      input.supplier?.trim() || null,
      now,
      input.createdBy?.trim() || 'system',
      input.unitCost ?? null,
    ]);

    await client.query('COMMIT');
    const movement: StockMovement = {
      id: movementId,
      productId,
      type: 'inbound',
      quantity: input.quantity,
      ...(input.unitCost !== undefined ? { unitCost: input.unitCost } : {}),
      referenceNo: input.referenceNo.trim().toUpperCase(),
      supplier: input.supplier?.trim() || undefined,
      occurredAt: now,
      createdBy: input.createdBy?.trim() || 'system',
    };
    return { product: rowToProduct(prodRows[0]), movement };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function recordOutboundStockDb(
  productId: string,
  input: StockMovementInput & { id?: string }
): Promise<{ product: Product; movement: StockMovement } | null> {
  const pool = getPool();
  if (!pool) return null;

  const movementId = input.id ?? `MOV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = input.occurredAt ?? new Date().toISOString();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows: lockedRows } = await client.query(`
      SELECT stock FROM products WHERE id = $1 AND deleted_at IS NULL FOR UPDATE
    `, [productId]);
    if (!lockedRows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    if (Number(lockedRows[0].stock) < input.quantity) throw new Error('insufficient stock');

    const { rows: prodRows } = await client.query(`
      UPDATE products SET stock = stock - $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL RETURNING *
    `, [productId, input.quantity]);
    if (!prodRows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(`
      INSERT INTO stock_movements (id, product_id, type, movement_type, quantity, reference_no, supplier, occurred_at, created_by)
      VALUES ($1, $2, 'outbound', 'outbound', $3, $4, $5, $6, $7)
    `, [
      movementId,
      productId,
      input.quantity,
      input.referenceNo.trim().toUpperCase(),
      input.supplier?.trim() || null,
      now,
      input.createdBy?.trim() || 'system',
    ]);

    await client.query('COMMIT');
    const movement: StockMovement = {
      id: movementId,
      productId,
      type: 'outbound',
      quantity: input.quantity,
      referenceNo: input.referenceNo.trim().toUpperCase(),
      supplier: input.supplier?.trim() || undefined,
      occurredAt: now,
      createdBy: input.createdBy?.trim() || 'system',
    };
    return { product: rowToProduct(prodRows[0]), movement };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listProductMovementsDb(productId: string): Promise<StockMovement[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(`
    SELECT id, product_id as "productId", type, quantity, reference_no as "referenceNo",
           supplier, occurred_at as "occurredAt", created_by as "createdBy", unit_cost
    FROM stock_movements
    WHERE product_id = $1
    ORDER BY occurred_at DESC
  `, [productId]);
  return rows.map((r) => ({
    id: String(r.id),
    productId: String(r.productId),
    type: (r.type as 'inbound' | 'outbound') || 'inbound',
    quantity: Number(r.quantity),
    referenceNo: String(r.referenceNo),
    supplier: r.supplier ? String(r.supplier) : undefined,
    occurredAt: new Date(r.occurredAt as string | Date).toISOString(),
    createdBy: String(r.createdBy),
    unitCost: r.unit_cost === null || r.unit_cost === undefined ? undefined : Number(r.unit_cost),
  }));
}

export async function listAllMovementsDb(): Promise<StockMovement[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(`
    SELECT id, product_id as "productId", type, quantity, reference_no as "referenceNo",
           supplier, occurred_at as "occurredAt", created_by as "createdBy", unit_cost
    FROM stock_movements
    ORDER BY occurred_at DESC
  `);
  return rows.map((r) => ({
    id: String(r.id),
    productId: String(r.productId),
    type: (r.type as 'inbound' | 'outbound') || 'inbound',
    quantity: Number(r.quantity),
    referenceNo: String(r.referenceNo),
    supplier: r.supplier ? String(r.supplier) : undefined,
    occurredAt: new Date(r.occurredAt as string | Date).toISOString(),
    createdBy: String(r.createdBy),
    unitCost: r.unit_cost === null || r.unit_cost === undefined ? undefined : Number(r.unit_cost),
  }));
}

export async function listOutboundMovementByUnitDb(startAt: Date, endAt: Date): Promise<OutboundMovementByUnit[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    SELECT COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit,
      COALESCE(SUM(m.quantity), 0)::numeric AS quantity,
      COUNT(*)::int AS movement_count
    FROM stock_movements m
    LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
    WHERE m.type = 'outbound' AND m.occurred_at >= $1 AND m.occurred_at < $2
    GROUP BY 1
    ORDER BY COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') COLLATE "C"
  `, [startAt, endAt]);
  return rows.map((row) => ({
    unit: String(row.unit),
    quantity: Number(row.quantity ?? 0),
    movementCount: Number(row.movement_count ?? 0),
  }));
}

export async function listInsightMovementSummaryDb(startAt?: Date, endAt?: Date): Promise<Array<{ unit: string; inboundQuantity: number; outboundQuantity: number; inboundCount: number; outboundCount: number }> | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    SELECT COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit,
      COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'inbound'), 0)::numeric AS inbound_quantity,
      COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'outbound'), 0)::numeric AS outbound_quantity,
      COUNT(*) FILTER (WHERE m.type = 'inbound')::int AS inbound_count,
      COUNT(*) FILTER (WHERE m.type = 'outbound')::int AS outbound_count
    FROM stock_movements m
    LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
    WHERE m.type IN ('inbound', 'outbound')
      AND ($1::timestamptz IS NULL OR m.occurred_at >= $1)
      AND ($2::timestamptz IS NULL OR m.occurred_at < $2)
    GROUP BY COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown')
    ORDER BY COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') COLLATE "C"
  `, [startAt ?? null, endAt ?? null]);
  return rows.map((row) => ({ unit: String(row.unit), inboundQuantity: Number(row.inbound_quantity), outboundQuantity: Number(row.outbound_quantity), inboundCount: Number(row.inbound_count), outboundCount: Number(row.outbound_count) }));
}

export async function listInsightPurchaseSummaryDb(startAt?: Date, endAt?: Date): Promise<{ recordedCost: number; pricedReceipts: number; unpricedReceipts: number } | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(m.quantity * m.unit_cost), 0)::numeric AS recorded_cost,
      COUNT(*) FILTER (WHERE m.unit_cost IS NOT NULL)::int AS priced_receipts,
      COUNT(*) FILTER (WHERE m.unit_cost IS NULL)::int AS unpriced_receipts
    FROM stock_movements m
    WHERE m.type = 'inbound'
      AND ($1::timestamptz IS NULL OR m.occurred_at >= $1)
      AND ($2::timestamptz IS NULL OR m.occurred_at < $2)
  `, [startAt ?? null, endAt ?? null]);
  const row = rows[0];
  return row ? { recordedCost: Number(row.recorded_cost), pricedReceipts: Number(row.priced_receipts), unpricedReceipts: Number(row.unpriced_receipts) } : null;
}

export async function listInsightYtdPurchaseSummaryDb(year = new Date().getUTCFullYear(), now = new Date()): Promise<{
  year: number;
  categories: Array<{ category: string; transactionCount: number; totalQuantity: number; totalCost: number; pricedReceipts: number; unpricedReceipts: number; pricedQuantity: number; unpricedQuantity: number }>;
  categoryUnits: Array<{ category: string; unit: string; transactionCount: number; totalQuantity: number; totalCost: number; pricedReceipts: number; unpricedReceipts: number; pricedQuantity: number; unpricedQuantity: number }>;
} | null> {
  const pool = getPool();
  if (!pool) return null;
  const startAt = new Date(Date.UTC(year, 0, 1));
  const { rows } = await pool.query(`
    WITH inbound_materials AS (
      SELECT COALESCE(NULLIF(p.category, ''), 'unknown') AS category,
        COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit, m.quantity, m.unit_cost
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
      WHERE m.type = 'inbound' AND m.occurred_at >= $1::timestamptz AND m.occurred_at <= $2::timestamptz
    )
    SELECT category, unit,
      COUNT(*)::int AS transaction_count,
      COALESCE(SUM(quantity), 0)::numeric AS total_quantity,
      COALESCE(SUM(quantity * unit_cost) FILTER (WHERE unit_cost IS NOT NULL), 0)::numeric AS total_cost,
      COUNT(*) FILTER (WHERE unit_cost IS NOT NULL)::int AS priced_receipts,
      COUNT(*) FILTER (WHERE unit_cost IS NULL)::int AS unpriced_receipts,
      COALESCE(SUM(quantity) FILTER (WHERE unit_cost IS NOT NULL), 0)::numeric AS priced_quantity,
      COALESCE(SUM(quantity) FILTER (WHERE unit_cost IS NULL), 0)::numeric AS unpriced_quantity
    FROM inbound_materials
    GROUP BY category, unit
    ORDER BY category COLLATE "C", unit COLLATE "C"
  `, [startAt, now]);
  const categoryMap = new Map<string, Record<string, number | string>>();
  const mapped = rows.map((row) => ({ category: String(row.category), unit: String(row.unit),
    transactionCount: Number(row.transaction_count), totalQuantity: Number(row.total_quantity), totalCost: Number(row.total_cost),
    pricedReceipts: Number(row.priced_receipts), unpricedReceipts: Number(row.unpriced_receipts),
    pricedQuantity: Number(row.priced_quantity), unpricedQuantity: Number(row.unpriced_quantity) }));
  for (const row of mapped) {
    const current = categoryMap.get(row.category) ?? { category: row.category, transactionCount: 0, totalQuantity: 0, totalCost: 0, pricedReceipts: 0, unpricedReceipts: 0, pricedQuantity: 0, unpricedQuantity: 0 };
    for (const field of ['transactionCount', 'totalQuantity', 'totalCost', 'pricedReceipts', 'unpricedReceipts', 'pricedQuantity', 'unpricedQuantity'] as const) current[field] = Number(current[field]) + row[field];
    categoryMap.set(row.category, current);
  }
  return { year, categories: [...categoryMap.values()] as never, categoryUnits: mapped };
}

export async function listInsightInventorySummaryDb(): Promise<{
  productCount: number; activeProductCount: number; totalInventoryValue: number; categoryValues: Array<{ category: string; listedPriceValue: number }>;
  healthyStockCount: number; lowStockStatusCount: number; criticalStockCount: number; outOfStockCount: number; lowStockCount: number; activeLowStockCount: number; activeThresholdStockCount: number;
  activeAlertCounts: { outOfStock: number; critical: number; low: number };
} | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH products_summary AS (
      SELECT COUNT(*)::int AS product_count, COUNT(*) FILTER (WHERE status = 'active')::int AS active_product_count,
        COALESCE(SUM(stock * unit_price), 0)::numeric AS total_inventory_value,
        COUNT(*) FILTER (WHERE stock > threshold)::int AS healthy_stock_count,
        COUNT(*) FILTER (WHERE stock > 0 AND stock > threshold * 0.5 AND stock <= threshold)::int AS low_stock_status_count,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= threshold * 0.5)::int AS critical_stock_count,
        COUNT(*) FILTER (WHERE stock <= 0)::int AS out_of_stock_count,
        COUNT(*) FILTER (WHERE stock <= threshold)::int AS low_stock_count,
        COUNT(*) FILTER (WHERE status = 'active' AND stock <= threshold)::int AS active_low_stock_count,
        COUNT(*) FILTER (WHERE status = 'active' AND stock <= threshold)::int AS active_threshold_stock_count
      FROM products WHERE deleted_at IS NULL
    ), category_values AS (
      SELECT COALESCE(NULLIF(category, ''), 'unknown') AS category, COALESCE(SUM(stock * unit_price), 0)::numeric AS listed_price_value
      FROM products WHERE deleted_at IS NULL GROUP BY COALESCE(NULLIF(category, ''), 'unknown')
    ), active_alerts AS (
      SELECT COUNT(*) FILTER (WHERE stock <= 0)::int AS out_of_stock_count,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE(threshold, 0) * 0.5)::int AS critical_count,
        COUNT(*) FILTER (WHERE stock > COALESCE(threshold, 0) * 0.5 AND stock <= COALESCE(threshold, 0))::int AS low_count
      FROM products WHERE deleted_at IS NULL AND status = 'active'
    )
    SELECT s.product_count, s.active_product_count, s.total_inventory_value, s.healthy_stock_count, s.low_stock_status_count,
      s.critical_stock_count, s.out_of_stock_count, s.low_stock_count, s.active_low_stock_count, s.active_threshold_stock_count,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('category', category, 'listedPriceValue', listed_price_value) ORDER BY category COLLATE "C") FROM category_values), '[]'::jsonb) AS category_values,
      a.out_of_stock_count AS active_out_of_stock_count, a.critical_count AS active_critical_count, a.low_count AS active_low_count
    FROM products_summary s CROSS JOIN active_alerts a
  `);
  const row = rows[0];
  if (!row) return null;
  const values = typeof row.category_values === 'string' ? JSON.parse(row.category_values) : row.category_values;
  return { productCount: Number(row.product_count), activeProductCount: Number(row.active_product_count), totalInventoryValue: Number(row.total_inventory_value),
    healthyStockCount: Number(row.healthy_stock_count), lowStockStatusCount: Number(row.low_stock_status_count), criticalStockCount: Number(row.critical_stock_count),
    outOfStockCount: Number(row.out_of_stock_count), lowStockCount: Number(row.low_stock_count), activeLowStockCount: Number(row.active_low_stock_count), activeThresholdStockCount: Number(row.active_threshold_stock_count),
    categoryValues: Array.isArray(values) ? values.map((item: Record<string, unknown>) => ({ category: String(item.category), listedPriceValue: Number(item.listedPriceValue) })) : [],
    activeAlertCounts: { outOfStock: Number(row.active_out_of_stock_count), critical: Number(row.active_critical_count), low: Number(row.active_low_count) } };
}

export async function listMonthlyStockMovementAggregatesDb(startAt: Date, endAt: Date): Promise<MonthlyStockMovementRow[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH monthly AS (
      SELECT TO_CHAR(DATE_TRUNC('month', m.occurred_at AT TIME ZONE 'UTC'), 'YYYY-MM') AS month,
        COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit,
        COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'inbound'), 0)::numeric AS inbound_quantity,
        COALESCE(SUM(m.quantity) FILTER (WHERE m.type = 'outbound'), 0)::numeric AS outbound_quantity,
        COUNT(*) FILTER (WHERE m.type = 'inbound')::int AS inbound_movement_count,
        COUNT(*) FILTER (WHERE m.type = 'outbound')::int AS outbound_movement_count
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
      WHERE m.type IN ('inbound', 'outbound') AND m.occurred_at >= $1 AND m.occurred_at < $2
      GROUP BY 1, 2
    )
    SELECT month, unit, inbound_quantity, outbound_quantity, inbound_movement_count, outbound_movement_count
    FROM monthly
    ORDER BY month COLLATE "C", unit COLLATE "C"
  `, [startAt, endAt]);
  return rows.map((row) => ({
    month: String(row.month),
    unit: String(row.unit ?? 'unknown'),
    inboundQuantity: Number(row.inbound_quantity ?? 0),
    outboundQuantity: Number(row.outbound_quantity ?? 0),
    inboundMovementCount: Number(row.inbound_movement_count ?? 0),
    outboundMovementCount: Number(row.outbound_movement_count ?? 0),
  }));
}

export async function listMonthlyItemMovementPageDb(input: {
  month: string;
  threshold: number;
  limit: number;
  cursor: MonthlyItemMovementCursor | null;
}): Promise<{
  rows: MonthlyItemMovementRow[];
  summary: { productCount: number; fastMovingCount: number; slowMovingCount: number; outboundByUnit: Array<{ unit: string; quantity: number }> };
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: MonthlyItemMovementCursor | null };
} | null> {
  const pool = getPool();
  if (!pool) return null;
  const monthStart = new Date(`${input.month}-01T00:00:00.000Z`);
  const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  const { rows } = await pool.query(`
    WITH movement_totals AS MATERIALIZED (
      SELECT product_id, SUM(quantity)::numeric AS quantity
      FROM stock_movements
      WHERE type = 'outbound' AND occurred_at >= $1 AND occurred_at < $2
      GROUP BY product_id
    ), product_rows AS MATERIALIZED (
      SELECT p.id::text AS product_id, p.name, p.sku, p.category, p.unit, p.status, p.threshold,
        COALESCE(mt.quantity, 0)::numeric AS quantity,
        CASE WHEN COALESCE(mt.quantity, 0) > 0 AND COALESCE(mt.quantity, 0) >= $3
          THEN 'fast_moving' ELSE 'slow_moving' END AS classification
      FROM products p
      LEFT JOIN movement_totals mt ON mt.product_id = p.id
      WHERE p.deleted_at IS NULL
    ), summary AS (
      SELECT COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE classification = 'fast_moving')::int AS fast_moving_count,
        COUNT(*) FILTER (WHERE classification = 'slow_moving')::int AS slow_moving_count
      FROM product_rows
    ), unit_summary AS (
      SELECT COALESCE(NULLIF(BTRIM(unit), ''), 'unknown') AS unit,
        SUM(quantity)::numeric AS quantity
      FROM product_rows
      WHERE quantity > 0
      GROUP BY 1
    ), page_rows AS (
      SELECT * FROM product_rows
      WHERE $5::text IS NULL
        OR name COLLATE "C" > $5::text COLLATE "C"
        OR (name COLLATE "C" = $5::text COLLATE "C" AND product_id COLLATE "C" > $6::text COLLATE "C")
      ORDER BY name COLLATE "C", product_id COLLATE "C"
      LIMIT $4
    )
    SELECT summary.total_count, summary.fast_moving_count, summary.slow_moving_count,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'month', $7::text, 'productId', page_rows.product_id, 'name', page_rows.name,
        'sku', page_rows.sku, 'category', page_rows.category, 'unit', page_rows.unit,
        'status', page_rows.status, 'quantity', page_rows.quantity, 'threshold', page_rows.threshold,
        'classification', page_rows.classification
      ) ORDER BY page_rows.name COLLATE "C", page_rows.product_id COLLATE "C"), '[]'::jsonb) FROM page_rows) AS page_rows,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('unit', unit, 'quantity', quantity) ORDER BY unit COLLATE "C"), '[]'::jsonb) FROM unit_summary) AS outbound_by_unit
    FROM summary
  `, [monthStart, monthEnd, input.threshold, input.limit + 1, input.cursor?.name ?? null, input.cursor?.productId ?? null, input.month]);

  const record = rows[0] as Record<string, unknown> | undefined;
  if (!record) return null;
  const pageRowsRaw = Array.isArray(record.page_rows) ? record.page_rows
    : typeof record.page_rows === 'string' ? JSON.parse(record.page_rows) as unknown[] : [];
  const aggregateRows = Array.isArray(record.outbound_by_unit) ? record.outbound_by_unit
    : typeof record.outbound_by_unit === 'string' ? JSON.parse(record.outbound_by_unit) as unknown[] : [];
  const pageRows = pageRowsRaw.map((value) => {
    const row = value as Record<string, unknown>;
    return {
      month: String(row.month), productId: String(row.productId), name: String(row.name), sku: String(row.sku),
      category: String(row.category) as Product['category'], unit: String(row.unit ?? 'unknown'),
      status: String(row.status) as Product['status'], quantity: Number(row.quantity ?? 0),
      threshold: Number(row.threshold ?? 0), classification: String(row.classification) as MonthlyItemMovementRow['classification'],
    } satisfies MonthlyItemMovementRow;
  });
  const hasMore = pageRows.length > input.limit;
  const visibleRows = pageRows.slice(0, input.limit);
  const last = visibleRows.at(-1);
  return {
    rows: visibleRows,
    summary: {
      productCount: Number(record.total_count ?? 0),
      fastMovingCount: Number(record.fast_moving_count ?? 0),
      slowMovingCount: Number(record.slow_moving_count ?? 0),
      outboundByUnit: aggregateRows.map((value) => {
        const row = value as Record<string, unknown>;
        return { unit: String(row.unit ?? 'unknown'), quantity: Number(row.quantity ?? 0) };
      }),
    },
    page: {
      limit: input.limit,
      totalCount: Number(record.total_count ?? 0),
      hasMore,
      nextCursor: hasMore && last ? { name: last.name, productId: last.productId } : null,
    },
  };
}

// ── ORDERS ──────────────────────────────────────────────────────────

function rowToOrder(row: Record<string, unknown>): Order {
  const rawItems = typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [];
  return {
    id: String(row.id),
    referenceNumber: String(row.order_no ?? row.referenceNumber),
    customerName: String(row.customer_name ?? row.customerName),
    customerPhone: String(row.customer_phone ?? row.customerPhone ?? ''),
    deliveryAddress: String(row.delivery_address ?? row.deliveryAddress ?? ''),
    deliveryDate: row.delivery_date instanceof Date ? row.delivery_date.toISOString().split('T')[0] : String(row.delivery_date ?? row.deliveryDate ?? ''),
    items: rawItems,
    subtotal: Number(row.subtotal ?? row.total_amount ?? 0),
    total: Number(row.total_amount ?? row.total ?? 0),
    paidAmount: Number(row.paid_amount ?? row.paidAmount ?? 0),
    paymentStatus: (row.payment_status ?? row.paymentStatus ?? 'unpaid') as PaymentStatus,
    orderStatus: (row.order_status ?? row.orderStatus ?? 'processing') as Order['orderStatus'],
    refundedAmount: Number(row.refunded_amount ?? row.refundedAmount ?? 0),
    refundReason: row.refund_reason ? String(row.refund_reason) : undefined,
    refundType: row.refund_type ? (row.refund_type as RefundType) : undefined,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
  };
}

export async function listOrdersDb(): Promise<Order[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY order_no ASC'
  );
  return rows.map(rowToOrder);
}

export interface OrdersDbPage {
  orders: Order[];
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  hasMore: boolean;
  nextCursor: { createdAt: string; id: string } | null;
}

export interface PolicyPerformanceDbPage {
  rows: Array<{
    productId: string;
    sku: string;
    name: string;
    unit: string;
    trackingStartedAt: string | null;
    trackingDays: number;
    timeWeightedAverageOnHand: number | null;
    daysAtOrBelowReorderPoint: number;
    percentTimeAtOrBelowReorderPoint: number | null;
    outOfStockDays: number;
    reorderPointChanges: number;
    currentStock: number;
    currentReorderPoint: number;
    status: 'at_or_below_reorder_point' | 'above_reorder_point';
  }>;
  trackingStart: string | null;
  totals: {
    products: number;
    productsWithHistory: number;
    trackingDays: number;
    outOfStockProductCount: number;
    reorderPointChanges: number;
  };
  page: {
    limit: number;
    totalCount: number;
    hasMore: boolean;
    nextCursor: { name: string; productId: string } | null;
  };
}

export async function listPolicyPerformancePageDb(input: {
  now: Date;
  limit: number;
  cursor: { name: string; productId: string } | null;
}): Promise<PolicyPerformanceDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH event_windows AS (
      SELECT product_id, id, recorded_at, stock_after, threshold_after, threshold_before,
        LEAD(recorded_at) OVER (PARTITION BY product_id ORDER BY recorded_at, id) AS next_recorded_at
      FROM inventory_policy_history
    ), event_intervals AS (
      SELECT product_id, recorded_at, stock_after, threshold_after, threshold_before,
        GREATEST(0, EXTRACT(EPOCH FROM (
          GREATEST(LEAST($1::timestamptz, recorded_at), LEAST($1::timestamptz, COALESCE(next_recorded_at, $1::timestamptz)))
          - LEAST($1::timestamptz, recorded_at)
        )) * 1000)::numeric AS interval_ms
      FROM event_windows
    ), history_metrics AS (
      SELECT product_id,
        MIN(recorded_at) AS tracking_started_at,
        SUM(stock_after * interval_ms) AS weighted_stock_ms,
        SUM(interval_ms) AS tracked_ms,
        SUM(interval_ms) FILTER (WHERE stock_after <= threshold_after) AS at_or_below_ms,
        SUM(interval_ms) FILTER (WHERE stock_after <= 0) AS out_of_stock_ms,
        COUNT(*) FILTER (WHERE threshold_before IS NOT NULL AND threshold_before <> threshold_after)::int AS threshold_changes
      FROM event_intervals
      GROUP BY product_id
    ), ordered_events AS (
      SELECT e.*, SUM(CASE WHEN e.threshold_before IS NOT NULL AND e.threshold_before <> e.threshold_after THEN 1 ELSE 0 END)
        OVER (PARTITION BY product_id ORDER BY recorded_at, id ROWS UNBOUNDED PRECEDING)::int AS period_number
      FROM event_windows e
    ), period_intervals AS (
      SELECT product_id, period_number, MIN(recorded_at) AS started_at,
        MIN(threshold_after) AS reorder_point,
        GREATEST(0, EXTRACT(EPOCH FROM (LEAST($1::timestamptz, MAX(CASE WHEN next_recorded_at IS NULL THEN $1::timestamptz ELSE next_recorded_at END))
          - LEAST($1::timestamptz, MIN(recorded_at)))) * 1000)::numeric AS tracked_ms,
        SUM(stock_after * GREATEST(0, EXTRACT(EPOCH FROM (GREATEST(LEAST($1::timestamptz, recorded_at), LEAST($1::timestamptz, COALESCE(next_recorded_at, $1::timestamptz))) - LEAST($1::timestamptz, recorded_at))) * 1000))::numeric AS weighted_stock_ms,
        SUM(GREATEST(0, EXTRACT(EPOCH FROM (GREATEST(LEAST($1::timestamptz, recorded_at), LEAST($1::timestamptz, COALESCE(next_recorded_at, $1::timestamptz))) - LEAST($1::timestamptz, recorded_at))) * 1000)) FILTER (WHERE stock_after <= threshold_after)::numeric AS below_ms,
        SUM(GREATEST(0, EXTRACT(EPOCH FROM (GREATEST(LEAST($1::timestamptz, recorded_at), LEAST($1::timestamptz, COALESCE(next_recorded_at, $1::timestamptz))) - LEAST($1::timestamptz, recorded_at))) * 1000)) FILTER (WHERE stock_after <= 0)::numeric AS out_ms,
        CASE WHEN BOOL_OR(next_recorded_at IS NULL) THEN NULL ELSE MAX(next_recorded_at) END AS ended_at
      FROM ordered_events GROUP BY product_id, period_number
    ), policy_periods AS (
      SELECT product_id, jsonb_agg(jsonb_build_object(
        'started_at', started_at, 'ended_at', CASE WHEN ended_at IS NULL OR ended_at >= $1::timestamptz THEN NULL ELSE ended_at END,
        'reorder_point', reorder_point, 'tracking_days', ROUND((tracked_ms / 86400000)::numeric, 4),
        'time_weighted_average_on_hand', CASE WHEN tracked_ms > 0 THEN ROUND((weighted_stock_ms / tracked_ms)::numeric, 4) END,
        'days_at_or_below_reorder_point', ROUND((COALESCE(below_ms, 0) / 86400000)::numeric, 4),
        'percent_time_at_or_below_reorder_point', CASE WHEN tracked_ms > 0 THEN ROUND((COALESCE(below_ms, 0) / tracked_ms * 100)::numeric, 4) END,
        'out_of_stock_days', ROUND((COALESCE(out_ms, 0) / 86400000)::numeric, 4)
      ) ORDER BY period_number) FILTER (WHERE tracked_ms > 0 AND started_at < $1::timestamptz) AS policy_periods
      FROM period_intervals GROUP BY product_id
    ), product_rows AS (
      SELECT p.id::text AS product_id, p.sku, p.name, p.unit, p.stock, p.threshold,
        COALESCE(pp.policy_periods, '[]'::jsonb) AS policy_periods,
        h.tracking_started_at,
        COALESCE(h.tracked_ms, 0)::numeric AS tracked_ms,
        COALESCE(h.weighted_stock_ms, 0)::numeric AS weighted_stock_ms,
        COALESCE(h.at_or_below_ms, 0)::numeric AS at_or_below_ms,
        COALESCE(h.out_of_stock_ms, 0)::numeric AS out_of_stock_ms,
        COALESCE(h.threshold_changes, 0)::int AS threshold_changes
      FROM products p LEFT JOIN history_metrics h ON h.product_id = p.id LEFT JOIN policy_periods pp ON pp.product_id = p.id
      WHERE p.deleted_at IS NULL
    ), report_rows AS (
      SELECT product_id, sku, name, unit, policy_periods, tracking_started_at,
        ROUND((tracked_ms / 86400000)::numeric, 4) AS tracking_days,
        CASE WHEN tracked_ms > 0 THEN ROUND((weighted_stock_ms / tracked_ms)::numeric, 4) END AS time_weighted_average_on_hand,
        ROUND((at_or_below_ms / 86400000)::numeric, 4) AS days_at_or_below_reorder_point,
        CASE WHEN tracked_ms > 0 THEN ROUND((at_or_below_ms / tracked_ms * 100)::numeric, 4) END AS percent_time_at_or_below_reorder_point,
        ROUND((out_of_stock_ms / 86400000)::numeric, 4) AS out_of_stock_days,
        threshold_changes AS reorder_point_changes,
        stock AS current_stock, threshold AS current_reorder_point,
        CASE WHEN stock <= threshold THEN 'at_or_below_reorder_point' ELSE 'above_reorder_point' END AS status
      FROM product_rows
    ), totals AS (
      SELECT COUNT(*)::int AS products,
        COUNT(*) FILTER (WHERE tracking_started_at IS NOT NULL)::int AS products_with_history,
        COALESCE(ROUND(GREATEST(0, EXTRACT(EPOCH FROM ($1::timestamptz - MIN(tracking_started_at))) / 86400)::numeric, 4), 0) AS tracking_days,
        COUNT(*) FILTER (WHERE current_stock <= 0)::int AS out_of_stock_product_count,
        COALESCE(SUM(reorder_point_changes), 0)::int AS reorder_point_changes,
        MIN(tracking_started_at) AS tracking_start
      FROM report_rows
    ), page_rows AS (
      SELECT * FROM report_rows
      WHERE $2::text IS NULL
        OR name COLLATE "C" > $2::text COLLATE "C"
        OR (name COLLATE "C" = $2::text COLLATE "C" AND product_id COLLATE "C" > $3::text COLLATE "C")
      ORDER BY name COLLATE "C" ASC, product_id COLLATE "C" ASC
      LIMIT $4
    )
    SELECT totals.products, totals.products_with_history, totals.tracking_days,
      totals.out_of_stock_product_count, totals.reorder_point_changes, totals.tracking_start,
      (SELECT COUNT(*)::int FROM report_rows) AS total_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.name COLLATE "C", page_rows.product_id COLLATE "C") FROM page_rows), '[]'::jsonb) AS page_items
    FROM totals
  `, [input.now, input.cursor?.name ?? null, input.cursor?.productId ?? null, input.limit + 1]);
  const result = rows[0];
  if (!result) return null;
  const rawItems = (typeof result.page_items === 'string' ? JSON.parse(result.page_items) : result.page_items ?? []) as Record<string, unknown>[];
  const visible = rawItems.slice(0, input.limit);
  const parseTimestamp = (value: unknown) => value == null ? null : new Date(value as string | Date).toISOString();
  const reportRows = visible.map((row) => ({
    productId: String(row.product_id), sku: String(row.sku), name: String(row.name), unit: String(row.unit),
    trackingStartedAt: parseTimestamp(row.tracking_started_at),
    policyPeriods: (Array.isArray(row.policy_periods) ? row.policy_periods : typeof row.policy_periods === 'string' ? JSON.parse(row.policy_periods) : []).map((period: Record<string, unknown>) => ({
      startedAt: parseTimestamp(period.started_at), endedAt: parseTimestamp(period.ended_at), reorderPoint: Number(period.reorder_point),
      trackingDays: Number(period.tracking_days), timeWeightedAverageOnHand: period.time_weighted_average_on_hand == null ? null : Number(period.time_weighted_average_on_hand),
      daysAtOrBelowReorderPoint: Number(period.days_at_or_below_reorder_point), percentTimeAtOrBelowReorderPoint: period.percent_time_at_or_below_reorder_point == null ? null : Number(period.percent_time_at_or_below_reorder_point), outOfStockDays: Number(period.out_of_stock_days),
    })),
    trackingDays: Number(row.tracking_days ?? 0),
    timeWeightedAverageOnHand: row.time_weighted_average_on_hand == null ? null : Number(row.time_weighted_average_on_hand),
    daysAtOrBelowReorderPoint: Number(row.days_at_or_below_reorder_point ?? 0),
    percentTimeAtOrBelowReorderPoint: row.percent_time_at_or_below_reorder_point == null ? null : Number(row.percent_time_at_or_below_reorder_point),
    outOfStockDays: Number(row.out_of_stock_days ?? 0),
    reorderPointChanges: Number(row.reorder_point_changes ?? 0),
    currentStock: Number(row.current_stock ?? 0),
    currentReorderPoint: Number(row.current_reorder_point ?? 0),
    status: String(row.status) as 'at_or_below_reorder_point' | 'above_reorder_point',
  }));
  const hasMore = rawItems.length > input.limit;
  const last = reportRows.at(-1);
  const trackingStart = parseTimestamp(result.tracking_start);
  return {
    rows: reportRows,
    trackingStart,
    totals: {
      products: Number(result.products ?? 0),
      productsWithHistory: Number(result.products_with_history ?? 0),
      trackingDays: Number(result.tracking_days ?? 0),
      outOfStockProductCount: Number(result.out_of_stock_product_count ?? 0),
      reorderPointChanges: Number(result.reorder_point_changes ?? 0),
    },
    page: {
      limit: input.limit,
      totalCount: Number(result.total_count ?? 0),
      hasMore,
      nextCursor: hasMore && last ? { name: last.name, productId: last.productId } : null,
    },
  };
}

export interface DemandForecastDbPage {
  products: Array<{
    productId: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    reorderPoint: number;
    history: Array<{ month: string; quantity: number }>;
    positiveMonths: number;
    forecastQuantity: number | null;
    status: 'available' | 'insufficient_history';
    stockCoverageDays: number | null;
    recommendedOrderQuantity: number | null;
    policyAssessment: 'below_reorder_point' | 'below_forecast' | 'adequate' | 'insufficient_history';
  }>;
  summary: {
    productCount: number;
    availableForecasts: number;
    insufficientHistory: number;
    belowReorderPoint: number;
    recommendedOrderQuantity: number;
  };
  page: {
    limit: number;
    totalCount: number;
    hasMore: boolean;
    nextCursor: { name: string; productId: string } | null;
  };
}

export async function listDemandForecastPageDb(input: {
  now: Date;
  historyMonths: number;
  limit: number;
  cursor: { name: string; productId: string } | null;
}): Promise<DemandForecastDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH RECURSIVE bounds AS (
      SELECT date_trunc('month', ($1::timestamptz AT TIME ZONE 'UTC')) AS current_month,
        date_trunc('month', ($1::timestamptz AT TIME ZONE 'UTC')) - ($2::int * INTERVAL '1 month') AS start_month
    ), months AS (
      SELECT generate_series(bounds.start_month, bounds.current_month - INTERVAL '1 month', INTERVAL '1 month')::date AS month
      FROM bounds
    ), order_lines AS (
      SELECT item.value->>'productId' AS product_id,
        date_trunc('month', (o.created_at AT TIME ZONE 'UTC'))::date AS month,
        SUM((item.value->>'quantity')::int)::int AS quantity
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item(value)
      CROSS JOIN bounds
      WHERE o.deleted_at IS NULL AND o.order_status = 'delivered'
        AND o.created_at >= (bounds.start_month AT TIME ZONE 'UTC')
        AND o.created_at < (bounds.current_month AT TIME ZONE 'UTC')
      GROUP BY item.value->>'productId', date_trunc('month', (o.created_at AT TIME ZONE 'UTC'))::date
    ), product_months AS (
      SELECT p.id::text AS product_id, p.sku, p.name, COALESCE(NULLIF(p.category, ''), 'glass') AS category, p.unit, p.stock, p.threshold,
        m.month, COALESCE(ol.quantity, 0)::int AS quantity
      FROM products p CROSS JOIN months m
      LEFT JOIN order_lines ol ON ol.product_id = p.id::text AND ol.month = m.month
      WHERE p.deleted_at IS NULL
    ), numbered AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY month)::int AS month_number
      FROM product_months
    ), forecast_steps AS (
      SELECT product_id, month_number, quantity::double precision AS forecast
      FROM numbered WHERE month_number = 1
      UNION ALL
      SELECT n.product_id, n.month_number,
        0.3::double precision * n.quantity + 0.7::double precision * f.forecast
      FROM forecast_steps f JOIN numbered n
        ON n.product_id = f.product_id AND n.month_number = f.month_number + 1
    ), forecast_values AS (
      SELECT DISTINCT ON (product_id) product_id,
        ROUND(forecast::numeric, 2)::double precision AS forecast_quantity
      FROM forecast_steps ORDER BY product_id, month_number DESC
    ), product_metrics AS (
      SELECT n.product_id, n.sku, n.name, n.category, n.unit, n.stock, n.threshold,
        jsonb_agg(jsonb_build_object('month', to_char(n.month, 'YYYY-MM'), 'quantity', n.quantity) ORDER BY n.month) AS history,
        COUNT(*) FILTER (WHERE n.quantity > 0)::int AS positive_months,
        f.forecast_quantity
      FROM numbered n JOIN forecast_values f ON f.product_id = n.product_id
      GROUP BY n.product_id, n.sku, n.name, n.category, n.unit, n.stock, n.threshold, f.forecast_quantity
    ), report_rows AS (
      SELECT product_id, sku, name, category, unit, stock, threshold, history, positive_months,
        CASE WHEN positive_months >= 3 THEN forecast_quantity END AS forecast_quantity,
        CASE WHEN positive_months >= 3 THEN 'available' ELSE 'insufficient_history' END AS status,
        CASE WHEN positive_months >= 3 AND forecast_quantity > 0 THEN ROUND(stock::numeric / forecast_quantity * 30)::int END AS stock_coverage_days,
        CASE WHEN positive_months >= 3 THEN GREATEST(0, CEIL(forecast_quantity + threshold - stock))::int END AS recommended_order_quantity,
        CASE WHEN positive_months < 3 THEN 'insufficient_history'
          WHEN stock <= threshold THEN 'below_reorder_point'
          WHEN stock < forecast_quantity THEN 'below_forecast' ELSE 'adequate' END AS policy_assessment
      FROM product_metrics
    ), totals AS (
      SELECT COUNT(*)::int AS product_count,
        COUNT(*) FILTER (WHERE forecast_quantity IS NOT NULL)::int AS available_forecasts,
        COUNT(*) FILTER (WHERE forecast_quantity IS NULL)::int AS insufficient_history,
        COUNT(*) FILTER (WHERE policy_assessment = 'below_reorder_point')::int AS below_reorder_point,
        COALESCE(SUM(recommended_order_quantity), 0)::int AS recommended_order_quantity
      FROM report_rows
    ), page_rows AS (
      SELECT * FROM report_rows
      WHERE forecast_quantity IS NOT NULL
        AND ($3::text IS NULL OR name COLLATE "C" > $3::text COLLATE "C"
          OR (name COLLATE "C" = $3::text COLLATE "C" AND product_id COLLATE "C" > $4::text COLLATE "C"))
      ORDER BY name COLLATE "C" ASC, product_id COLLATE "C" ASC
      LIMIT $5
    )
    SELECT totals.product_count, totals.available_forecasts, totals.insufficient_history,
      totals.below_reorder_point, totals.recommended_order_quantity,
      (SELECT COUNT(*)::int FROM report_rows WHERE forecast_quantity IS NOT NULL) AS total_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.name COLLATE "C", page_rows.product_id COLLATE "C") FROM page_rows), '[]'::jsonb) AS page_items
    FROM totals
  `, [input.now, input.historyMonths, input.cursor?.name ?? null, input.cursor?.productId ?? null, input.limit + 1]);
  const result = rows[0];
  if (!result) return null;
  const rawItems = (typeof result.page_items === 'string' ? JSON.parse(result.page_items) : result.page_items ?? []) as Record<string, unknown>[];
  const products = rawItems.slice(0, input.limit).map((row) => {
    const rawHistory = typeof row.history === 'string' ? JSON.parse(row.history) : row.history;
    const history = (Array.isArray(rawHistory) ? rawHistory : []) as Array<Record<string, unknown>>;
    return {
      productId: String(row.product_id), sku: String(row.sku), name: String(row.name), category: String(row.category), unit: String(row.unit),
      currentStock: Number(row.stock ?? 0), reorderPoint: Number(row.threshold ?? 0),
      history: history.map((entry) => ({ month: String(entry.month), quantity: Number(entry.quantity ?? 0) })),
      positiveMonths: Number(row.positive_months ?? 0),
      forecastQuantity: row.forecast_quantity == null ? null : Number(row.forecast_quantity),
      status: String(row.status) as 'available' | 'insufficient_history',
      stockCoverageDays: row.stock_coverage_days == null ? null : Number(row.stock_coverage_days),
      recommendedOrderQuantity: row.recommended_order_quantity == null ? null : Number(row.recommended_order_quantity),
      policyAssessment: String(row.policy_assessment) as 'below_reorder_point' | 'below_forecast' | 'adequate' | 'insufficient_history',
    };
  });
  const hasMore = rawItems.length > input.limit;
  const last = products.at(-1);
  return {
    products,
    summary: {
      productCount: Number(result.product_count ?? 0),
      availableForecasts: Number(result.available_forecasts ?? 0),
      insufficientHistory: Number(result.insufficient_history ?? 0),
      belowReorderPoint: Number(result.below_reorder_point ?? 0),
      recommendedOrderQuantity: Number(result.recommended_order_quantity ?? 0),
    },
    page: {
      limit: input.limit,
      totalCount: Number(result.total_count ?? 0),
      hasMore,
      nextCursor: hasMore && last ? { name: last.name, productId: last.productId } : null,
    },
  };
}

const NOTIFICATION_FEED_CTE = `WITH notification_feed AS NOT MATERIALIZED (
  SELECT 'stock-' || p.id AS id, 'stock'::text AS type, 0::int AS type_rank,
    CASE WHEN p.stock = 0 OR (p.stock > 0 AND p.stock <= p.threshold * 0.5) THEN 'critical' ELSE 'warning' END AS severity,
    jsonb_build_object('name', p.name, 'stock', p.stock, 'threshold', p.threshold) AS source
  FROM products p
  WHERE p.deleted_at IS NULL AND (p.stock = 0 OR (p.stock > 0 AND p.stock <= p.threshold))
  UNION ALL
  SELECT 'order-pending-' || o.id, 'order', 1, 'info',
    jsonb_build_object('reference', o.order_no, 'customer', COALESCE(o.customer_name, ''), 'total', o.total_amount, 'createdAt', o.created_at)
  FROM orders o
  WHERE o.deleted_at IS NULL AND o.order_status = 'processing'
  UNION ALL
  SELECT 'order-payment-' || o.id, 'order', 1, 'warning',
    jsonb_build_object('reference', o.order_no, 'customer', COALESCE(o.customer_name, ''), 'total', o.total_amount,
      'paidAmount', o.paid_amount, 'paymentStatus', o.payment_status, 'createdAt', o.created_at)
  FROM orders o
  WHERE o.deleted_at IS NULL AND o.order_status <> 'processing' AND o.payment_status IN ('unpaid', 'partial')
  UNION ALL
  SELECT 'delivery-transit-' || o.id, 'delivery', 2, 'info',
    jsonb_build_object('reference', o.order_no, 'customer', COALESCE(o.customer_name, ''), 'deliveryAddress', o.delivery_address)
  FROM orders o
  WHERE o.deleted_at IS NULL AND o.order_status = 'in_transit'
)`;

function notificationItemFromDbRow(row: Record<string, unknown>): NotificationFeedItem {
  const sourceValue = typeof row.source === 'string' ? JSON.parse(row.source) : row.source;
  const source = sourceValue && typeof sourceValue === 'object' ? sourceValue as Record<string, unknown> : {};
  const type = String(row.type) as NotificationFeedItem['type'];
  const id = String(row.id);
  const severity = String(row.severity) as NotificationFeedItem['severity'];
  const currency = (amount: unknown) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount ?? 0));
  const date = (value: unknown) => new Date(value as string | Date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  if (type === 'stock') {
    const name = String(source.name ?? '');
    const stock = Number(source.stock ?? 0);
    const threshold = Number(source.threshold ?? 0);
    const outOfStock = stock === 0;
    return {
      id, type, severity,
      title: `${outOfStock ? 'Critical Stock' : severity === 'critical' ? 'Critical Stock' : 'Low Stock'}: ${name}`,
      message: outOfStock
        ? 'Item is completely out of stock! Restock urgently.'
        : severity === 'critical'
          ? `Only ${stock} remaining (min safety threshold is ${threshold}).`
          : `${stock} units remaining. Reorder suggested soon.`,
      contextLabel: severity === 'critical' ? 'Urgent' : 'Action needed',
      link: '/inventory',
    };
  }

  const reference = String(source.reference ?? '');
  const customer = String(source.customer ?? '');
  if (id.startsWith('order-pending-')) {
    return {
      id, type, severity, title: `Processing Order: ${reference}`,
      message: `Order for ${customer} (${currency(source.total)}) is being processed.`,
      contextLabel: `Created ${date(source.createdAt)}`, link: '/orders',
    };
  }
  if (id.startsWith('order-payment-')) {
    const paymentStatus = String(source.paymentStatus);
    return {
      id, type, severity,
      title: `Payment ${paymentStatus === 'partial' ? 'Partial' : 'Pending'}: ${reference}`,
      message: `${customer} has ${currency(Number(source.total ?? 0) - Number(source.paidAmount ?? 0))} balance remaining.`,
      contextLabel: `Created ${date(source.createdAt)}`, link: '/orders',
    };
  }
  return {
    id, type, severity, title: `Out for Delivery: ${reference}`,
    message: `En route to ${customer} (${String(source.deliveryAddress || 'Destination')}).`,
    contextLabel: 'En route', link: '/delivery',
  };
}

export async function getNotificationChangesDb(knownIds: string[] = [], dismissedIds: string[] = []): Promise<NotificationFeedItem[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    ${NOTIFICATION_FEED_CTE}
    SELECT id, type, severity, source
    FROM notification_feed
    WHERE NOT (id = ANY($1::text[])) AND NOT (id = ANY($2::text[]))
    ORDER BY type_rank ASC, id COLLATE "C" ASC
  `, [knownIds, dismissedIds]);
  return rows.map(notificationItemFromDbRow);
}

export async function getNotificationIdsDb(dismissedIds: string[] = []): Promise<string[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    ${NOTIFICATION_FEED_CTE}
    SELECT id FROM notification_feed
    WHERE NOT (id = ANY($1::text[]))
    ORDER BY type_rank ASC, id COLLATE "C" ASC
  `, [dismissedIds]);
  return rows.map((row) => String(row.id));
}

export async function getNotificationPageDb(input: NotificationPageInput = {}): Promise<NotificationPageResult | null> {
  const pool = getPool();
  if (!pool) return null;
  const limit = input.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer between 1 and 100');
  const cursor = input.cursor ? decodeNotificationCursor(input.cursor) : null;
  if (input.cursor && !cursor) throw new Error('cursor is invalid');
  const cursorType = cursor ? notificationTypeRank(cursor.type) : null;
  const { rows } = await pool.query(`
    ${NOTIFICATION_FEED_CTE}, visible AS MATERIALIZED (
      SELECT * FROM notification_feed WHERE NOT (id = ANY($2::text[]))
    ), summary AS (
      SELECT COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE NOT (id = ANY($1::text[])))::int AS unread_count
      FROM visible
    ), page_summary AS (
      SELECT COUNT(*)::int AS filtered_count FROM visible
      WHERE NOT $3::boolean OR NOT (id = ANY($1::text[]))
    ), page_rows AS (
      SELECT * FROM visible
      WHERE (NOT $3::boolean OR NOT (id = ANY($1::text[])))
        AND ($4::int IS NULL OR type_rank > $4::int
          OR (type_rank = $4::int AND id COLLATE "C" > $5::text COLLATE "C"))
      ORDER BY type_rank ASC, id COLLATE "C" ASC
      LIMIT $6::int
    )
    SELECT summary.total_count, summary.unread_count, page_summary.filtered_count,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', page_rows.id, 'type', page_rows.type,
        'severity', page_rows.severity, 'source', page_rows.source) ORDER BY page_rows.type_rank, page_rows.id COLLATE "C") FROM page_rows), '[]'::jsonb) AS page_items
    FROM summary CROSS JOIN page_summary
  `, [input.readIds ?? [], input.dismissedIds ?? [], input.unreadOnly ?? false, cursorType, cursor?.id ?? null, limit + 1]);
  const result = rows[0];
  if (!result) return null;
  const rawItems = (typeof result.page_items === 'string' ? JSON.parse(result.page_items) : result.page_items ?? []) as Record<string, unknown>[];
  const hasMore = rawItems.length > limit;
  const items = rawItems.slice(0, limit).map(notificationItemFromDbRow);
  const last = items.at(-1);
  return {
    items,
    page: {
      limit,
      totalCount: Number(result.filtered_count ?? 0),
      hasMore,
      nextCursor: hasMore && last ? encodeNotificationCursor(last) : null,
    },
    summary: {
      totalCount: Number(result.total_count ?? 0),
      unreadCount: Number(result.unread_count ?? 0),
    },
  };
}

export async function getAnalyticsOrderSummaryDb(fromDate?: string, toDate?: string): Promise<AnalyticsOrderSummary | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH filtered_orders AS MATERIALIZED (
      SELECT id, order_no, delivery_date, order_status, total_amount, items
      FROM orders o
      WHERE o.deleted_at IS NULL
        AND ($1::date IS NULL OR o.delivery_date >= $1::date)
        AND ($2::date IS NULL OR o.delivery_date <= $2::date)
    ), all_item_quantities AS (
      SELECT item.value->>'productId' AS product_id,
        SUM((item.value->>'quantity')::int)::int AS units_ordered
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item(value)
      WHERE o.deleted_at IS NULL AND o.order_status <> 'cancelled'
      GROUP BY item.value->>'productId'
    ), range_item_quantities AS (
      SELECT item.value->>'productId' AS product_id,
        (ARRAY_AGG(item.value->>'name' ORDER BY o.order_no COLLATE "C"))[1] AS name,
        SUM((item.value->>'quantity')::int)::int AS quantity
      FROM filtered_orders o
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item(value)
      WHERE o.order_status <> 'cancelled'
      GROUP BY item.value->>'productId'
    ), top_selling AS (
      SELECT r.product_id, r.name, COALESCE(NULLIF(p.category, ''), 'Unclassified') AS category, r.quantity
      FROM range_item_quantities r
      LEFT JOIN products p ON p.id = r.product_id AND p.deleted_at IS NULL
      ORDER BY r.quantity DESC, r.product_id COLLATE "C" ASC
      LIMIT 5
    ), rankings AS (
      SELECT p.id::text AS product_id, p.name,
        COALESCE(NULLIF(p.category, ''), 'glass') AS category,
        p.stock, COALESCE(p.threshold, 0) AS threshold,
        COALESCE(q.units_ordered, 0)::int AS units_ordered,
        CASE WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.threshold, 0) * 0.5 THEN 'critical'
          WHEN p.stock <= COALESCE(p.threshold, 0) THEN 'low'
          ELSE 'healthy' END AS status
      FROM products p
      LEFT JOIN all_item_quantities q ON q.product_id = p.id::text
      WHERE p.deleted_at IS NULL
    ), date_meta AS (
      SELECT CASE WHEN ($1::date IS NOT NULL OR $2::date IS NOT NULL)
          AND MAX(delivery_date) - MIN(delivery_date) <= 31 THEN TRUE ELSE FALSE END AS use_day_buckets
      FROM filtered_orders WHERE delivery_date IS NOT NULL
    ), trends AS (
      SELECT CASE WHEN d.use_day_buckets THEN o.delivery_date
          ELSE date_trunc('month', o.delivery_date::timestamp)::date END AS bucket,
        d.use_day_buckets,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status <> 'cancelled'), 0)::double precision AS sales,
        COUNT(*)::int AS orders
      FROM filtered_orders o CROSS JOIN date_meta d
      WHERE o.delivery_date IS NOT NULL
      GROUP BY 1, d.use_day_buckets
    ), monthly_base AS (
      SELECT date_trunc('month', delivery_date::timestamp)::date AS month,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status <> 'cancelled'), 0)::double precision AS gross_sales
      FROM filtered_orders WHERE delivery_date IS NOT NULL GROUP BY 1
    ), month_bounds AS (
      SELECT COALESCE(date_trunc('month', $1::date)::date, MIN(month), date_trunc('month', $2::date)::date) AS first_month,
        COALESCE(date_trunc('month', $2::date)::date, MAX(month),
          CASE WHEN $1::date IS NOT NULL THEN date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date END,
          date_trunc('month', $1::date)::date) AS last_month
      FROM monthly_base
    ), monthly_series AS (
      SELECT gs.month::date AS month, COALESCE(m.order_count, 0)::int AS order_count,
        COALESCE(m.gross_sales, 0)::double precision AS gross_sales
      FROM month_bounds b CROSS JOIN LATERAL generate_series(b.first_month, b.last_month, interval '1 month') gs(month)
      LEFT JOIN monthly_base m ON m.month = gs.month::date
    ), ranking_source AS (
      SELECT 'allTime'::text AS scope, o.items FROM orders o
      WHERE o.deleted_at IS NULL AND o.order_status <> 'cancelled'
      UNION ALL
      SELECT 'selectedRange'::text AS scope, o.items FROM filtered_orders o WHERE o.order_status <> 'cancelled'
    ), ranking_products AS (
      SELECT rs.scope, COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit,
        p.name, COALESCE(NULLIF(p.category, ''), 'unknown') AS category,
        p.stock, COALESCE(p.threshold, 0) AS threshold,
        item.value->>'productId' AS product_id,
        SUM((item.value->>'quantity')::numeric)::double precision AS quantity
      FROM ranking_source rs
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(rs.items, '[]'::jsonb)) item(value)
      JOIN products p ON p.id::text = item.value->>'productId' AND p.deleted_at IS NULL
      GROUP BY rs.scope, unit, p.name, category, p.stock, p.threshold, product_id
    ), ranked_items AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY scope, unit ORDER BY quantity DESC, name COLLATE "C", product_id COLLATE "C") AS item_rank
      FROM ranking_products
    ), unit_groups AS (
      SELECT r.scope, r.unit,
        jsonb_agg(jsonb_build_object('name', r.name, 'category', r.category, 'quantity', r.quantity, 'stock', r.stock,
          'unit', r.unit, 'status', CASE WHEN r.stock <= 0 THEN 'out_of_stock' WHEN r.stock <= r.threshold * 0.5 THEN 'critical'
          WHEN r.stock <= r.threshold THEN 'low' ELSE 'healthy' END) ORDER BY r.quantity DESC, r.name COLLATE "C", r.product_id COLLATE "C") AS items
      FROM ranked_items r
      WHERE r.item_rank <= 5 GROUP BY r.scope, r.unit
    ), ranked_units AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY scope ORDER BY unit COLLATE "C") AS unit_rank FROM unit_groups
    ), fewest_products AS (
      SELECT COALESCE(NULLIF(BTRIM(p.unit), ''), 'unknown') AS unit, p.name,
        COALESCE(NULLIF(p.category, ''), 'unknown') AS category, p.stock, COALESCE(p.threshold, 0) AS threshold,
        COALESCE(q.units_ordered, 0)::int AS quantity, p.id::text AS product_id
      FROM products p LEFT JOIN all_item_quantities q ON q.product_id = p.id::text WHERE p.deleted_at IS NULL
    ), fewest_ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY unit ORDER BY quantity ASC, name COLLATE "C", product_id COLLATE "C") AS item_rank
      FROM fewest_products
    ), fewest_unit_groups AS (
      SELECT r.unit,
        jsonb_agg(jsonb_build_object('name', r.name, 'category', r.category, 'quantity', r.quantity, 'stock', r.stock,
          'unit', r.unit, 'status', CASE WHEN r.stock <= 0 THEN 'out_of_stock' WHEN r.stock <= r.threshold * 0.5 THEN 'critical'
          WHEN r.stock <= r.threshold THEN 'low' ELSE 'healthy' END) ORDER BY r.quantity ASC, r.name COLLATE "C", r.product_id COLLATE "C") AS items
      FROM fewest_ranked r WHERE r.item_rank <= 5 GROUP BY r.unit
    ), fewest_ranked_units AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY unit COLLATE "C") AS unit_rank FROM fewest_unit_groups
    )
    SELECT
      (SELECT COUNT(*)::int FROM filtered_orders) AS total_order_count,
      COALESCE((SELECT SUM(total_amount) FILTER (WHERE order_status <> 'cancelled')
        / NULLIF(COUNT(*) FILTER (WHERE order_status <> 'cancelled'), 0) FROM filtered_orders), 0)::double precision AS average_order_value,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('productId', t.product_id, 'name', t.name,
        'quantity', t.quantity, 'category', t.category) ORDER BY t.quantity DESC, t.product_id COLLATE "C") FROM top_selling t), '[]'::jsonb) AS top_selling_items,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('name', r.name, 'category', r.category, 'stock', r.stock,
        'unitsOrdered', r.units_ordered, 'status', r.status) ORDER BY r.units_ordered DESC, r.name COLLATE "C", r.product_id COLLATE "C")
        FROM (SELECT * FROM rankings WHERE units_ordered > 0 ORDER BY units_ordered DESC, name COLLATE "C", product_id COLLATE "C" LIMIT 5) r), '[]'::jsonb) AS most_ordered_items,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('name', r.name, 'category', r.category, 'stock', r.stock,
        'unitsOrdered', r.units_ordered, 'status', r.status) ORDER BY r.units_ordered ASC, r.name COLLATE "C", r.product_id COLLATE "C")
        FROM (SELECT * FROM rankings ORDER BY units_ordered ASC, name COLLATE "C", product_id COLLATE "C" LIMIT 5) r), '[]'::jsonb) AS least_ordered_items,
      COALESCE((SELECT jsonb_object_agg(product_id, quantity) FROM range_item_quantities), '{}'::jsonb) AS ordered_quantities,
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'month', CASE WHEN use_day_buckets THEN to_char(bucket, 'FMMon FMDD') ELSE to_char(bucket, 'FMMon YY') END,
        'sales', sales, 'orders', orders) ORDER BY bucket ASC) FROM trends), '[]'::jsonb) AS sales_trend_data,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('month', to_char(month, 'YYYY-MM'), 'orderCount', order_count, 'grossSales', gross_sales) ORDER BY month)
        FROM (SELECT * FROM monthly_series ORDER BY month DESC LIMIT 12) capped), '[]'::jsonb) AS delivery_monthly_series,
      GREATEST((SELECT COUNT(*) FROM monthly_series) - 12, 0)::int AS omitted_month_count,
      CASE WHEN (SELECT COUNT(*) FROM monthly_series) > 12 THEN (SELECT to_char(MIN(month), 'YYYY-MM') FROM monthly_series) ELSE NULL END AS omitted_before,
      NULL::text AS omitted_after,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('unit', unit, 'items', items) ORDER BY unit COLLATE "C")
        FROM ranked_units WHERE scope = 'allTime' AND unit_rank <= 5), '[]'::jsonb) AS ai_rankings_all_time,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('unit', unit, 'items', items) ORDER BY unit COLLATE "C")
        FROM ranked_units WHERE scope = 'selectedRange' AND unit_rank <= 5), '[]'::jsonb) AS ai_rankings_selected_range,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('unit', unit, 'items', items) ORDER BY unit COLLATE "C")
        FROM fewest_ranked_units WHERE unit_rank <= 5), '[]'::jsonb) AS ai_rankings_all_time_fewest,
      GREATEST((SELECT COUNT(*) FROM unit_groups WHERE scope = 'allTime') - 5, 0)::int AS ai_omitted_unit_groups_all_time,
      GREATEST((SELECT COUNT(*) FROM unit_groups WHERE scope = 'selectedRange') - 5, 0)::int AS ai_omitted_unit_groups_selected_range,
      GREATEST((SELECT COUNT(*) FROM fewest_unit_groups) - 5, 0)::int AS ai_omitted_unit_groups_all_time_fewest
  `, [fromDate ?? null, toDate ?? null]);
  const row = rows[0];
  if (!row) return null;
  const decode = (value: unknown): unknown => typeof value === 'string' ? JSON.parse(value) : value;
  const array = (value: unknown): Record<string, unknown>[] => {
    const parsed = decode(value);
    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : [];
  };
  const rawQuantities = decode(row.ordered_quantities);
  const quantities = rawQuantities && typeof rawQuantities === 'object' && !Array.isArray(rawQuantities)
    ? Object.fromEntries(Object.entries(rawQuantities as Record<string, unknown>).map(([productId, quantity]) => [productId, Number(quantity)]))
    : {};
  return {
    totalOrderCount: Number(row.total_order_count ?? 0),
    averageOrderValue: Number(row.average_order_value ?? 0),
    topSellingItems: array(row.top_selling_items).map((item) => ({
      productId: String(item.productId), name: String(item.name ?? ''), quantity: Number(item.quantity ?? 0), category: String(item.category ?? 'Unclassified'),
    })),
    mostOrderedItems: array(row.most_ordered_items).map((item) => ({
      name: String(item.name ?? ''), category: String(item.category ?? 'glass'), stock: Number(item.stock ?? 0),
      unitsOrdered: Number(item.unitsOrdered ?? 0), status: String(item.status ?? 'healthy'),
    })),
    leastOrderedItems: array(row.least_ordered_items).map((item) => ({
      name: String(item.name ?? ''), category: String(item.category ?? 'glass'), stock: Number(item.stock ?? 0),
      unitsOrdered: Number(item.unitsOrdered ?? 0), status: String(item.status ?? 'healthy'),
    })),
    orderedQuantities: quantities,
    salesTrendData: array(row.sales_trend_data).map((item) => ({
      month: String(item.month), sales: Number(item.sales ?? 0), orders: Number(item.orders ?? 0),
    })),
    deliveryDateMonthlySeries: {
      months: array(row.delivery_monthly_series).map((item) => ({ month: String(item.month), orderCount: Number(item.orderCount ?? 0), grossSales: Number(item.grossSales ?? 0) })),
      omittedMonthCount: Number(row.omitted_month_count ?? 0),
      omittedBefore: row.omitted_before == null ? null : String(row.omitted_before),
      omittedAfter: row.omitted_after == null ? null : String(row.omitted_after),
    },
    aiProductRankings: {
      allTime: array(row.ai_rankings_all_time).map((group) => ({
        unit: String(group.unit), items: Array.isArray(group.items) ? (group.items as Record<string, unknown>[]).map((item) => ({
          name: String(item.name ?? ''), category: String(item.category ?? 'unknown'), quantity: Number(item.quantity ?? 0),
          stock: Number(item.stock ?? 0), unit: String(item.unit ?? group.unit), status: String(item.status ?? 'healthy'),
        })) : [],
      })),
      allTimeFewest: array(row.ai_rankings_all_time_fewest).map((group) => ({
        unit: String(group.unit), items: Array.isArray(group.items) ? (group.items as Record<string, unknown>[]).map((item) => ({
          name: String(item.name ?? ''), category: String(item.category ?? 'unknown'), quantity: Number(item.quantity ?? 0),
          stock: Number(item.stock ?? 0), unit: String(item.unit ?? group.unit), status: String(item.status ?? 'healthy'),
        })) : [],
      })),
      selectedRange: array(row.ai_rankings_selected_range).map((group) => ({
        unit: String(group.unit), items: Array.isArray(group.items) ? (group.items as Record<string, unknown>[]).map((item) => ({
          name: String(item.name ?? ''), category: String(item.category ?? 'unknown'), quantity: Number(item.quantity ?? 0),
          stock: Number(item.stock ?? 0), unit: String(item.unit ?? group.unit), status: String(item.status ?? 'healthy'),
        })) : [],
      })),
      omittedUnitGroups: {
        allTime: Number(row.ai_omitted_unit_groups_all_time ?? 0),
        allTimeFewest: Number(row.ai_omitted_unit_groups_all_time_fewest ?? 0),
        selectedRange: Number(row.ai_omitted_unit_groups_selected_range ?? 0),
      },
    },
  };
}

export async function listRecentActivityDb(limit: number): Promise<RecentActivityRecord[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH order_activity AS MATERIALIZED (
      SELECT 'order:' || o.id AS id, 'order_recorded'::text AS kind,
        o.created_at AS occurred_at, o.order_no AS reference_number,
        o.order_status, o.customer_name, o.total_amount AS order_total,
        NULL::text AS movement_type, NULL::text AS product_id,
        NULL::text AS product_name, NULL::text AS unit, NULL::int AS quantity
      FROM orders o
      WHERE o.deleted_at IS NULL
      ORDER BY date_trunc('milliseconds', o.created_at) DESC, ('order:' || o.id) COLLATE "C" ASC
      LIMIT $1
    ), movement_activity AS MATERIALIZED (
      SELECT 'movement:' || m.id AS id, 'stock_movement'::text AS kind,
        m.occurred_at, m.reference_no AS reference_number,
        NULL::text AS order_status, NULL::text AS customer_name, NULL::numeric AS order_total,
        m.type AS movement_type, m.product_id, p.name AS product_name, p.unit,
        m.quantity::int AS quantity
      FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id AND p.deleted_at IS NULL
      ORDER BY date_trunc('milliseconds', m.occurred_at) DESC, ('movement:' || m.id) COLLATE "C" ASC
      LIMIT $1
    ), combined AS (
      SELECT * FROM order_activity
      UNION ALL
      SELECT * FROM movement_activity
    )
    SELECT * FROM combined
    ORDER BY date_trunc('milliseconds', occurred_at) DESC, id COLLATE "C" ASC
    LIMIT $1
  `, [limit]);
  return rows.map((row) => {
    const base = {
      id: String(row.id),
      kind: String(row.kind) as RecentActivityRecord['kind'],
      occurredAt: new Date(row.occurred_at as string | Date).toISOString(),
      referenceNumber: String(row.reference_number),
    };
    if (row.kind === 'order_recorded') {
      return {
        ...base,
        orderStatus: String(row.order_status) as RecentActivityRecord['orderStatus'],
        ...(row.customer_name == null ? {} : { customerName: String(row.customer_name) }),
        orderTotal: Number(row.order_total ?? 0),
      };
    }
    return {
      ...base,
      movementType: (String(row.movement_type) || 'inbound') as RecentActivityRecord['movementType'],
      productId: String(row.product_id),
      ...(row.product_name == null ? {} : { productName: String(row.product_name) }),
      ...(row.unit == null ? {} : { unit: String(row.unit) }),
      quantity: Number(row.quantity ?? 0),
    };
  });
}

export interface MonthlySalesTrendDbRow {
  month: string;
  transactionCount: number;
  grossSales: number;
}

export async function listMonthlySalesTrendDb(range: '6M' | '1Y' | 'ALL' | undefined, now: Date): Promise<MonthlySalesTrendDbRow[] | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH params AS (
      SELECT $1::text AS range,
        date_trunc('month', ($2::timestamptz AT TIME ZONE 'UTC'))::date AS current_month
    ), bounds AS (
      SELECT range, current_month,
        CASE range WHEN '6M' THEN current_month - INTERVAL '5 months'
          WHEN '1Y' THEN current_month - INTERVAL '11 months' END::date AS first_month
      FROM params
    ), monthly_sales AS (
      SELECT date_trunc('month', (o.created_at AT TIME ZONE 'UTC'))::date AS month,
        COUNT(*)::int AS transaction_count,
        ROUND(SUM(o.total_amount)::numeric, 2)::double precision AS gross_sales
      FROM orders o CROSS JOIN bounds b
      WHERE o.deleted_at IS NULL AND o.order_status <> 'cancelled'
        AND (b.range IS NULL OR (
          o.created_at < ((b.current_month + INTERVAL '1 month')::timestamp AT TIME ZONE 'UTC')
          AND (b.range = 'ALL' OR o.created_at >= (b.first_month::timestamp AT TIME ZONE 'UTC'))
        ))
      GROUP BY date_trunc('month', (o.created_at AT TIME ZONE 'UTC'))::date
    ), calendar AS (
      SELECT generate_series(
        CASE WHEN b.range = 'ALL' THEN (SELECT MIN(month) FROM monthly_sales) ELSE b.first_month END,
        b.current_month,
        INTERVAL '1 month'
      )::date AS month
      FROM bounds b
      WHERE b.range IS NOT NULL AND (b.range <> 'ALL' OR EXISTS (SELECT 1 FROM monthly_sales))
    ), result AS (
      SELECT m.month, m.transaction_count, m.gross_sales
      FROM monthly_sales m CROSS JOIN bounds b WHERE b.range IS NULL
      UNION ALL
      SELECT c.month, COALESCE(m.transaction_count, 0)::int, COALESCE(m.gross_sales, 0)::double precision
      FROM calendar c LEFT JOIN monthly_sales m ON m.month = c.month
    )
    SELECT to_char(month, 'YYYY-MM') AS month, transaction_count, gross_sales
    FROM result ORDER BY month ASC
  `, [range ?? null, now]);
  return rows.map((row) => ({
    month: String(row.month),
    transactionCount: Number(row.transaction_count ?? 0),
    grossSales: Number(row.gross_sales ?? 0),
  }));
}

export interface OrderSummaryReportDb {
  totalOrders: number;
  totalSales: number;
  completedCount: number;
  pendingOrders: number;
  statusCounts: { completed: number; inProgress: number; pending: 0; cancelled: number };
  paymentCounts: { paid: number; pending: number; partial: number; refunded: number };
}

export async function getOrderSummaryReportDb(fromDate?: string, toDate?: string): Promise<OrderSummaryReportDb | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH filtered_orders AS MATERIALIZED (
      SELECT order_status, payment_status, total_amount
      FROM orders
      WHERE deleted_at IS NULL
        AND ($1::date IS NULL OR delivery_date >= $1::date)
        AND ($2::date IS NULL OR delivery_date <= $2::date)
    )
    SELECT COUNT(*)::int AS total_orders,
      ROUND(COALESCE(SUM(total_amount) FILTER (WHERE order_status = 'delivered'), 0)::numeric, 2)::double precision AS total_sales,
      COUNT(*) FILTER (WHERE order_status = 'delivered')::int AS completed_count,
      (COUNT(*) FILTER (WHERE order_status = 'processing') + COUNT(*) FILTER (WHERE order_status = 'in_transit'))::int AS pending_orders,
      COUNT(*) FILTER (WHERE order_status = 'cancelled')::int AS cancelled_count,
      COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_count,
      COUNT(*) FILTER (WHERE payment_status = 'unpaid')::int AS pending_payment_count,
      COUNT(*) FILTER (WHERE payment_status = 'partial')::int AS partial_count,
      COUNT(*) FILTER (WHERE payment_status = 'refunded')::int AS refunded_count
    FROM filtered_orders
  `, [fromDate ?? null, toDate ?? null]);
  const row = rows[0];
  if (!row) return null;
  const completedCount = Number(row.completed_count ?? 0);
  const processingAndTransit = Number(row.pending_orders ?? 0);
  return {
    totalOrders: Number(row.total_orders ?? 0),
    totalSales: Number(row.total_sales ?? 0),
    completedCount,
    pendingOrders: processingAndTransit,
    statusCounts: {
      completed: completedCount,
      inProgress: processingAndTransit,
      pending: 0,
      cancelled: Number(row.cancelled_count ?? 0),
    },
    paymentCounts: {
      paid: Number(row.paid_count ?? 0),
      pending: Number(row.pending_payment_count ?? 0),
      partial: Number(row.partial_count ?? 0),
      refunded: Number(row.refunded_count ?? 0),
    },
  };
}

export interface DashboardOrderSummaryDb {
  activeOrderCount: number;
  orderStatusCounts: Array<{ status: string; count: number }>;
  topItems: Array<{
    productId: string;
    name: string;
    category: string | null;
    unit: string | null;
    quantity: number;
  }>;
}

export async function getDashboardOrderSummaryDb(): Promise<DashboardOrderSummaryDb | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH status_counts AS (
      SELECT order_status AS status, COUNT(*)::int AS count
      FROM orders WHERE deleted_at IS NULL GROUP BY order_status
    ), item_totals AS (
      SELECT item.value->>'productId' AS product_id,
        (ARRAY_AGG(item.value->>'name' ORDER BY o.order_no COLLATE "C"))[1] AS name,
        SUM((item.value->>'quantity')::int)::int AS quantity
      FROM orders o
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item(value)
      WHERE o.deleted_at IS NULL AND o.order_status <> 'cancelled'
      GROUP BY item.value->>'productId'
    ), top_items AS (
      SELECT it.product_id, it.name, p.category, p.unit, it.quantity
      FROM item_totals it
      LEFT JOIN products p ON p.id::text = it.product_id AND p.deleted_at IS NULL
      ORDER BY it.quantity DESC, it.product_id COLLATE "C" ASC
      LIMIT 4
    )
    SELECT
      (SELECT COUNT(*) FILTER (WHERE order_status NOT IN ('delivered', 'cancelled'))::int FROM orders WHERE deleted_at IS NULL) AS active_order_count,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('status', status, 'count', count) ORDER BY status COLLATE "C") FROM status_counts), '[]'::jsonb) AS order_status_counts,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('productId', product_id, 'name', name, 'category', category, 'unit', unit, 'quantity', quantity) ORDER BY quantity DESC, product_id COLLATE "C") FROM top_items), '[]'::jsonb) AS top_items
  `);
  const row = rows[0];
  if (!row) return null;
  const parseJsonArray = (value: unknown): Record<string, unknown>[] => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : [];
  };
  return {
    activeOrderCount: Number(row.active_order_count ?? 0),
    orderStatusCounts: parseJsonArray(row.order_status_counts).map((status) => ({
      status: String(status.status), count: Number(status.count ?? 0),
    })),
    topItems: parseJsonArray(row.top_items).map((item) => ({
      productId: String(item.productId), name: String(item.name ?? ''),
      category: item.category == null ? null : String(item.category),
      unit: item.unit == null ? null : String(item.unit),
      quantity: Number(item.quantity ?? 0),
    })),
  };
}

export async function listOrdersPageDb(input: {
  limit: number;
  status: string;
  search: string;
  fromDate: string | null;
  toDate: string | null;
  cursorCreatedAt: string | null;
  cursorId: string | null;
}): Promise<OrdersDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH filtered_orders AS MATERIALIZED (
      SELECT * FROM orders o
      WHERE o.deleted_at IS NULL
        AND ($1::text = 'all'
          OR ($1 = 'packed' AND o.order_status = 'processing')
          OR ($1 = 'out_for_delivery' AND o.order_status = 'in_transit')
          OR ($1 = 'completed' AND o.order_status = 'delivered')
          OR ($1 = 'cancelled' AND o.order_status = 'cancelled'))
        AND ($2::text = '' OR POSITION(LOWER($2) IN LOWER(COALESCE(o.customer_name, ''))) > 0
          OR POSITION(LOWER($2) IN LOWER(COALESCE(o.order_no, ''))) > 0
          OR POSITION(LOWER($2) IN LOWER(o.id::text)) > 0
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS items(item)
            WHERE POSITION(LOWER($2) IN LOWER(COALESCE(items.item ->> 'name', items.item ->> 'productName', ''))) > 0
          ))
        AND ($3::date IS NULL OR o.delivery_date >= $3::date)
        AND ($4::date IS NULL OR o.delivery_date <= $4::date)
    ), summary AS (
      SELECT COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE order_status = 'pending')::int AS pending_count,
        COUNT(*) FILTER (WHERE order_status IN ('processing', 'in_transit'))::int AS in_progress_count,
        COUNT(*) FILTER (WHERE order_status = 'delivered')::int AS completed_count
      FROM filtered_orders
    ), page_rows AS (
      SELECT * FROM filtered_orders
      WHERE $5::timestamptz IS NULL
        OR created_at < $5::timestamptz
        OR (created_at = $5::timestamptz AND id::text < $6::text)
      ORDER BY created_at DESC, id::text DESC
      LIMIT $7
    )
    SELECT summary.total_count, summary.pending_count, summary.in_progress_count, summary.completed_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.created_at DESC, page_rows.id::text DESC) FROM page_rows), '[]'::jsonb) AS page_orders
    FROM summary
  `, [input.status, input.search, input.fromDate, input.toDate, input.cursorCreatedAt, input.cursorId, input.limit + 1]);
  const row = rows[0];
  if (!row) return null;
  const rawOrders = (typeof row.page_orders === 'string' ? JSON.parse(row.page_orders) : row.page_orders ?? []) as Record<string, unknown>[];
  const visibleRows = rawOrders.slice(0, input.limit);
  const hasMore = rawOrders.length > input.limit;
  const lastVisible = visibleRows[visibleRows.length - 1];
  return {
    orders: visibleRows.map(rowToOrder),
    totalCount: Number(row.total_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    inProgressCount: Number(row.in_progress_count ?? 0),
    completedCount: Number(row.completed_count ?? 0),
    hasMore,
    nextCursor: hasMore && lastVisible ? { createdAt: String(lastVisible.created_at), id: String(lastVisible.id) } : null,
  };
}

export interface DailySalesDbPage {
  orderCount: number;
  cancelledOrderCount: number;
  grossSales: number;
  collectedAmount: number;
  refundsAmount: number;
  netCollectedAmount: number;
  totalCount: number;
  hasMore: boolean;
  orders: Order[];
}

export async function listDailySalesPageDb(input: {
  date: string;
  limit: number;
  status: string;
  search: string;
  cursorReferenceNumber: string | null;
  cursorId: string | null;
}): Promise<DailySalesDbPage | null> {
  const pool = getPool();
  if (!pool) return null;

  const start = new Date(`${input.date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const { rows } = await pool.query(`
    WITH daily_orders AS MATERIALIZED (
      SELECT * FROM orders
      WHERE deleted_at IS NULL
        AND created_at >= $1::timestamptz
        AND created_at < $2::timestamptz
    ), summary AS (
      SELECT
        COUNT(*) FILTER (WHERE order_status <> 'cancelled')::int AS order_count,
        COUNT(*) FILTER (WHERE order_status = 'cancelled')::int AS cancelled_order_count,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status <> 'cancelled'), 0) AS gross_sales,
        COALESCE(SUM(paid_amount), 0) AS net_collected_amount,
        COALESCE(SUM(refunded_amount), 0) AS refunds_amount
      FROM daily_orders
    ), filtered_orders AS (
      SELECT o.* FROM daily_orders o
      WHERE ($3::text = 'all' OR o.order_status = $3)
        AND (
          $4::text = ''
          OR POSITION(LOWER($4) IN LOWER(COALESCE(o.order_no, ''))) > 0
          OR POSITION(LOWER($4) IN LOWER(COALESCE(o.customer_name, ''))) > 0
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item
            WHERE POSITION(LOWER($4) IN LOWER(COALESCE(item.value ->> 'name', ''))) > 0
          )
        )
    ), filtered_count AS (
      SELECT COUNT(*)::int AS total_count FROM filtered_orders
    ), page_rows AS (
      SELECT o.* FROM filtered_orders o
      WHERE $5::text IS NULL
        OR o.order_no > $5
        OR (o.order_no = $5 AND o.id > $6)
      ORDER BY o.order_no ASC, o.id ASC
      LIMIT $7
    )
    SELECT
      summary.order_count,
      summary.cancelled_order_count,
      summary.gross_sales,
      summary.net_collected_amount,
      summary.refunds_amount,
      filtered_count.total_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.order_no, page_rows.id) FROM page_rows), '[]'::jsonb) AS page_orders
    FROM summary CROSS JOIN filtered_count
  `, [
    start.toISOString(),
    end.toISOString(),
    input.status,
    input.search,
    input.cursorReferenceNumber,
    input.cursorId,
    input.limit + 1,
  ]);

  const row = rows[0];
  if (!row) return null;
  const rawOrders = (typeof row.page_orders === 'string' ? JSON.parse(row.page_orders) : row.page_orders ?? []) as Record<string, unknown>[];
  const hasMore = rawOrders.length > input.limit;
  const orders = rawOrders.slice(0, input.limit).map(rowToOrder);
  const netCollectedAmount = Number(row.net_collected_amount ?? 0);
  const refundsAmount = Number(row.refunds_amount ?? 0);
  return {
    orderCount: Number(row.order_count ?? 0),
    cancelledOrderCount: Number(row.cancelled_order_count ?? 0),
    grossSales: Number(row.gross_sales ?? 0),
    collectedAmount: netCollectedAmount + refundsAmount,
    refundsAmount,
    netCollectedAmount,
    totalCount: Number(row.total_count ?? 0),
    hasMore,
    orders,
  };
}

export async function findOrderByIdDb(id: string): Promise<Order | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function findOrderByReferenceDb(ref: string): Promise<Order | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE UPPER(order_no) = $1 AND deleted_at IS NULL',
    [ref.trim().toUpperCase()]
  );
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function createOrderDb(input: OrderCreateInput & { id?: string }): Promise<Order> {
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');

  const id = input.id ?? `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
  let referenceNumber = input.referenceNumber?.trim().toUpperCase();
  if (!referenceNumber) {
    const year = new Date().getUTCFullYear();
    const { rows } = await pool.query('SELECT count(*)::int as count FROM orders');
    const seq = (rows[0]?.count ?? 0) + 1;
    referenceNumber = `SS-${year}-${String(seq).padStart(5, '0')}`;
  }

  const items = input.items.map((item) => ({
    productId: item.productId.trim(),
    name: item.name.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal;
  const paidAmount = input.paidAmount ?? 0;
  const paymentStatus: PaymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= total ? 'paid' : 'partial';

  const { rows } = await pool.query(`
    INSERT INTO orders (
      id, order_no, customer_name, customer_phone, delivery_address, delivery_date,
      items, subtotal, total_amount, paid_amount, payment_status, order_status,
      refunded_amount, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'processing', 0, NOW(), NOW())
    RETURNING *
  `, [
    id,
    referenceNumber,
    input.customerName.trim(),
    input.customerPhone.trim(),
    input.deliveryAddress.trim(),
    input.deliveryDate,
    JSON.stringify(items),
    subtotal,
    total,
    paidAmount,
    paymentStatus,
  ]);

  return rowToOrder(rows[0]);
}

export async function createOrderWithInventoryDb(
  input: OrderCreateInput & { id?: string },
): Promise<{ order: Order; products: Product[]; movements: StockMovement[] }> {
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const client = await pool.connect();
  const id = input.id ?? `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;

  try {
    await client.query('BEGIN');
    let referenceNumber = input.referenceNumber?.trim().toUpperCase();
    if (!referenceNumber) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('smartstock-order-reference'))");
      const year = new Date().getUTCFullYear();
      const { rows } = await client.query(
        'SELECT count(*)::int AS count FROM orders WHERE order_no LIKE $1',
        [`SS-${year}-%`],
      );
      referenceNumber = `SS-${year}-${String(Number(rows[0]?.count ?? 0) + 1).padStart(5, '0')}`;
    }

    const items: Order['items'] = [];
    const updatedProducts = new Map<string, Product>();
    const movements: StockMovement[] = [];
    for (const [index, item] of input.items.entries()) {
      const { rows: productRows } = await client.query(
        'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
        [item.productId.trim()],
      );
      if (!productRows[0]) throw new Error(`Product not found: ${item.productId}`);
      const product = rowToProduct(productRows[0]);
      if (product.stock < item.quantity) throw new Error(`insufficient stock for ${product.name}`);
      const { rows: updatedRows } = await client.query(
        'UPDATE products SET stock = stock - $2, updated_at = NOW() WHERE id = $1 AND stock >= $2 RETURNING *',
        [product.id, item.quantity],
      );
      if (!updatedRows[0]) throw new Error(`insufficient stock for ${product.name}`);
      const updatedProduct = rowToProduct(updatedRows[0]);
      updatedProducts.set(updatedProduct.id, updatedProduct);
      items.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal: item.quantity * product.price,
      });
      const movement: StockMovement = {
        id: randomUUID(),
        productId: product.id,
        type: 'outbound',
        quantity: item.quantity,
        referenceNo: `ORDER-${referenceNumber}-${index + 1}`.toUpperCase(),
        occurredAt: new Date().toISOString(),
        createdBy: 'order',
      };
      await client.query(`
        INSERT INTO stock_movements (id, product_id, type, movement_type, quantity, reference_no, occurred_at, created_by)
        VALUES ($1, $2, 'outbound', 'outbound', $3, $4, $5, $6)
      `, [movement.id, movement.productId, movement.quantity, movement.referenceNo, movement.occurredAt, movement.createdBy]);
      movements.push(movement);
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const paidAmount = input.paidAmount ?? 0;
    if (paidAmount > subtotal) throw new Error('paidAmount cannot exceed order total');
    const paymentStatus: PaymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= subtotal ? 'paid' : 'partial';
    const { rows: orderRows } = await client.query(`
      INSERT INTO orders (
        id, order_no, customer_name, customer_phone, delivery_address, delivery_date,
        items, subtotal, total_amount, paid_amount, payment_status, order_status,
        refunded_amount, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, 'processing', 0, NOW(), NOW())
      RETURNING *
    `, [
      id, referenceNumber, input.customerName.trim(), input.customerPhone.trim(),
      input.deliveryAddress.trim(), input.deliveryDate, JSON.stringify(items), subtotal,
      paidAmount, paymentStatus,
    ]);
    await client.query('COMMIT');
    return {
      order: rowToOrder(orderRows[0]),
      products: [...updatedProducts.values()],
      movements,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderDb(id: string, input: OrderUpdateInput): Promise<Order | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findOrderByIdDb(id);
  if (!current) return null;

  const nextName = input.customerName === undefined ? current.customerName : input.customerName.trim();
  const nextPhone = input.customerPhone === undefined ? current.customerPhone : input.customerPhone.trim();
  const nextAddress = input.deliveryAddress === undefined ? current.deliveryAddress : input.deliveryAddress.trim();
  const nextDate = input.deliveryDate ?? current.deliveryDate;
  const nextStatus = input.orderStatus ?? current.orderStatus;

  const { rows } = await pool.query(`
    UPDATE orders
    SET customer_name = $2, customer_phone = $3, delivery_address = $4,
        delivery_date = $5, order_status = $6, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `, [id, nextName, nextPhone, nextAddress, nextDate, nextStatus]);

  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function cancelOrderDb(id: string): Promise<{ order: Order; products: Product[]; movements: StockMovement[] } | null> {
  const pool = getPool();
  if (!pool) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [id],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    const current = rowToOrder(rows[0]);
    if (current.orderStatus === 'cancelled') {
      await client.query('COMMIT');
      return { order: current, products: [], movements: [] };
    }

    const products: Product[] = [];
    const movements: StockMovement[] = [];
    for (const [index, item] of current.items.entries()) {
      const productRows = await client.query(
        'UPDATE products SET stock = stock + $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
        [item.productId, item.quantity],
      );
      if (!productRows.rows[0]) throw new Error(`Product not found while restoring stock for ${item.name}`);
      const movement: StockMovement = {
        id: randomUUID(),
        productId: item.productId,
        type: 'inbound',
        quantity: item.quantity,
        referenceNo: `CANCEL-${current.referenceNumber}-${index + 1}`.toUpperCase(),
        occurredAt: new Date().toISOString(),
        createdBy: 'order_cancel',
      };
      await client.query(`
        INSERT INTO stock_movements (id, product_id, type, movement_type, quantity, reference_no, occurred_at, created_by)
        VALUES ($1, $2, 'inbound', 'inbound', $3, $4, NOW(), 'order_cancel')
      `, [movement.id, item.productId, item.quantity, movement.referenceNo]);
      products.push(rowToProduct(productRows.rows[0]));
      movements.push(movement);
    }

    const refundedAmount = current.refundedAmount + current.paidAmount;
    const paymentStatus: PaymentStatus = current.paidAmount > 0 || refundedAmount > 0 ? 'refunded' : 'unpaid';
    const { rows: updatedRows } = await client.query(`
      UPDATE orders
      SET order_status = 'cancelled', paid_amount = 0, refunded_amount = $2,
          refund_reason = 'Order cancellation', refund_type = 'full',
          payment_status = $3, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, [id, refundedAmount, paymentStatus]);
    await client.query('COMMIT');
    return updatedRows[0] ? { order: rowToOrder(updatedRows[0]), products, movements } : null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function applyPaymentDb(id: string, amount: number): Promise<Order | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findOrderByIdDb(id);
  if (!current) return null;

  const paidAmount = Math.min(current.total, current.paidAmount + amount);
  const paymentStatus: PaymentStatus = paidAmount <= 0 ? 'unpaid' : paidAmount >= current.total ? 'paid' : 'partial';

  const { rows } = await pool.query(`
    UPDATE orders
    SET paid_amount = $2, payment_status = $3, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `, [id, paidAmount, paymentStatus]);

  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function applyRefundDb(id: string, amount: number, reason: string, type: RefundType): Promise<Order | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findOrderByIdDb(id);
  if (!current) return null;

  const paidAmount = Math.max(0, current.paidAmount - amount);
  const refundedAmount = current.refundedAmount + amount;
  const paymentStatus: PaymentStatus = paidAmount === 0 ? 'refunded' : paidAmount >= current.total ? 'paid' : 'partial';

  const { rows } = await pool.query(`
    UPDATE orders
    SET paid_amount = $2, refunded_amount = $3, refund_reason = $4, refund_type = $5,
        payment_status = $6, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `, [id, paidAmount, refundedAmount, reason.trim(), type, paymentStatus]);

  return rows[0] ? rowToOrder(rows[0]) : null;
}

// ── DELIVERIES ──────────────────────────────────────────────────────

function rowToDelivery(row: Record<string, unknown>): Delivery {
  const rawLoc = typeof row.current_location === 'string' ? JSON.parse(row.current_location) : row.current_location || { x: 0, y: 0 };
  return {
    id: String(row.id),
    orderId: String(row.order_id ?? row.orderId ?? ''),
    driver: String(row.driver ?? ''),
    truckNumber: String(row.truck_number ?? row.truckNumber ?? ''),
    destination: String(row.destination ?? ''),
    status: (row.status as Delivery['status']) || 'pending',
    location: row.location ? String(row.location) : undefined,
    currentStep: Number(row.current_step ?? row.currentStep ?? 0),
    currentLocation: rawLoc,
    trafficLevel: (row.traffic_level ?? row.trafficLevel ?? 'low') as Delivery['trafficLevel'],
    predictedDelay: Boolean(row.predicted_delay ?? row.predictedDelay ?? false),
    routeEfficiencyScore: Number(row.route_efficiency_score ?? row.routeEfficiencyScore ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export async function listDeliveriesDb(): Promise<Delivery[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM deliveries ORDER BY id ASC');
  return rows.map(rowToDelivery);
}

export interface DeliveriesDbPageItem extends Delivery {
  customerName: string;
  customerPhone: string;
  referenceNumber: string;
  createdAt: string;
}

export interface DeliveriesDbPage {
  items: DeliveriesDbPageItem[];
  totalCount: number;
  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;
  hasMore: boolean;
  nextCursor: { createdAt: string; orderId: string } | null;
}

export async function listDeliveriesPageDb(input: {
  limit: number;
  status: 'all' | 'pending' | 'in_transit' | 'delivered';
  cursorCreatedAt: string | null;
  cursorOrderId: string | null;
}): Promise<DeliveriesDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH candidates AS MATERIALIZED (
      SELECT o.id AS order_id, o.order_no AS reference_number, o.customer_name, o.customer_phone,
        o.delivery_address AS destination, o.created_at,
        CASE o.order_status WHEN 'processing' THEN 'pending' WHEN 'in_transit' THEN 'in_transit' WHEN 'delivered' THEN 'delivered' END AS delivery_status,
        CASE o.order_status WHEN 'processing' THEN 0 WHEN 'in_transit' THEN 1 WHEN 'delivered' THEN 2 END AS page_current_step,
        d.id AS delivery_id, d.driver, d.truck_number, d.location, d.current_location,
        d.traffic_level, d.predicted_delay, d.route_efficiency_score, d.notes
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT * FROM deliveries WHERE order_id = o.id ORDER BY updated_at DESC, id DESC LIMIT 1
      ) d ON TRUE
      WHERE o.deleted_at IS NULL
        AND o.order_status IN ('processing', 'in_transit', 'delivered')
        AND LOWER(BTRIM(COALESCE(o.delivery_address, ''))) <> 'pickup'
    ), filtered AS (
      SELECT * FROM candidates WHERE $1::text = 'all' OR delivery_status = $1::text
    ), summary AS (
      SELECT COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE delivery_status = 'pending')::int AS pending_count,
        COUNT(*) FILTER (WHERE delivery_status = 'in_transit')::int AS in_transit_count,
        COUNT(*) FILTER (WHERE delivery_status = 'delivered')::int AS delivered_count
      FROM candidates
    ), page_rows AS (
      SELECT * FROM filtered
      WHERE $2::timestamptz IS NULL
        OR created_at < $2::timestamptz
        OR (created_at = $2::timestamptz AND order_id::text < $3::text)
      ORDER BY created_at DESC, order_id::text DESC
      LIMIT $4
    )
    SELECT summary.total_count, summary.pending_count, summary.in_transit_count, summary.delivered_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.created_at DESC, page_rows.order_id::text DESC) FROM page_rows), '[]'::jsonb) AS page_items
    FROM summary
  `, [input.status, input.cursorCreatedAt, input.cursorOrderId, input.limit + 1]);
  const row = rows[0];
  if (!row) return null;
  const rawItems = (typeof row.page_items === 'string' ? JSON.parse(row.page_items) : row.page_items ?? []) as Record<string, unknown>[];
  const visibleRows = rawItems.slice(0, input.limit);
  const hasMore = rawItems.length > input.limit;
  const lastVisible = visibleRows[visibleRows.length - 1];
  const items = visibleRows.map((item): DeliveriesDbPageItem => {
    const currentLocation = typeof item.current_location === 'string' ? JSON.parse(item.current_location) : item.current_location ?? null;
    const traffic = item.traffic_level;
    return {
      id: String(item.delivery_id ?? item.order_id),
      orderId: String(item.order_id),
      driver: item.driver == null ? null : String(item.driver),
      truckNumber: item.truck_number == null ? null : String(item.truck_number),
      destination: item.destination == null ? null : String(item.destination),
      status: String(item.delivery_status) as Delivery['status'],
      location: item.location == null ? null : String(item.location),
      currentStep: Number(item.page_current_step),
      currentLocation: currentLocation as Delivery['currentLocation'],
      trafficLevel: traffic === 'low' || traffic === 'medium' || traffic === 'high' ? traffic : null,
      predictedDelay: item.predicted_delay == null ? null : Boolean(item.predicted_delay),
      routeEfficiencyScore: item.route_efficiency_score == null ? null : Number(item.route_efficiency_score),
      notes: item.notes == null ? null : String(item.notes),
      customerName: String(item.customer_name ?? ''),
      customerPhone: String(item.customer_phone ?? ''),
      referenceNumber: String(item.reference_number ?? ''),
      createdAt: String(item.created_at),
    };
  });
  return {
    items,
    totalCount: Number(row.total_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    inTransitCount: Number(row.in_transit_count ?? 0),
    deliveredCount: Number(row.delivered_count ?? 0),
    hasMore,
    nextCursor: hasMore && lastVisible ? { createdAt: String(lastVisible.created_at), orderId: String(lastVisible.order_id) } : null,
  };
}

export async function findDeliveryByIdDb(id: string): Promise<Delivery | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
  return rows[0] ? rowToDelivery(rows[0]) : null;
}

export async function createDeliveryDb(input: DeliveryCreateInput & { id?: string }): Promise<Delivery> {
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const id = input.id ?? `DEL-${randomUUID().slice(0, 8).toUpperCase()}`;

  const { rows } = await pool.query(`
    INSERT INTO deliveries (
      id, order_id, driver, truck_number, destination, location, current_step,
      current_location, traffic_level, predicted_delay, route_efficiency_score, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    id,
    input.orderId.trim(),
    input.driver.trim(),
    input.truckNumber.trim(),
    input.destination.trim(),
    input.location?.trim() || null,
    input.currentStep ?? 0,
    JSON.stringify(input.currentLocation ?? { x: 0, y: 0 }),
    input.trafficLevel ?? 'low',
    input.predictedDelay ?? false,
    input.routeEfficiencyScore ?? 0,
    input.status ?? 'pending',
    input.notes?.trim() || null,
  ]);
  return rowToDelivery(rows[0]);
}

export async function updateDeliveryDb(id: string, input: DeliveryUpdateInput): Promise<Delivery | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findDeliveryByIdDb(id);
  if (!current) return null;

  const nextDriver = input.driver === undefined ? current.driver : input.driver.trim();
  const nextTruck = input.truckNumber === undefined ? current.truckNumber : input.truckNumber.trim();
  const nextDest = input.destination === undefined ? current.destination : input.destination.trim();
  const nextStatus = input.status ?? current.status;
  const nextLoc = input.location === undefined ? current.location : input.location.trim() || null;
  const nextStep = input.currentStep ?? current.currentStep;
  const nextCoords = input.currentLocation ?? current.currentLocation;
  const nextTraffic = input.trafficLevel ?? current.trafficLevel;
  const nextDelay = input.predictedDelay ?? current.predictedDelay;
  const nextScore = input.routeEfficiencyScore ?? current.routeEfficiencyScore;
  const nextNotes = input.notes === undefined ? current.notes : input.notes.trim() || null;

  const { rows } = await pool.query(`
    UPDATE deliveries
    SET driver = $2, truck_number = $3, destination = $4, status = $5, location = $6,
        current_step = $7, current_location = $8, traffic_level = $9, predicted_delay = $10,
        route_efficiency_score = $11, notes = $12, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [
    id, nextDriver, nextTruck, nextDest, nextStatus, nextLoc,
    nextStep, JSON.stringify(nextCoords), nextTraffic, nextDelay, nextScore, nextNotes
  ]);
  return rows[0] ? rowToDelivery(rows[0]) : null;
}

export async function deleteDeliveryDb(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const { rowCount } = await pool.query('DELETE FROM deliveries WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

// ── USERS ───────────────────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email).toLowerCase(),
    name: String(row.full_name ?? row.name),
    passwordHash: String(row.password_hash ?? row.passwordHash),
    role: (row.role as Role) || 'staff',
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function findUserByEmailDb(email: string): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
    [email]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserByIdDb(id: string): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function listStaffUsersDb(): Promise<UserRecord[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query("SELECT * FROM users WHERE role = 'staff' AND deleted_at IS NULL ORDER BY created_at ASC");
  return rows.map(rowToUser);
}

export interface StaffUsersDbPage {
  users: UserRecord[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: { createdAt: string; id: string } | null;
}

export async function listStaffUsersPageDb(input: {
  limit: number;
  cursorCreatedAt: string | null;
  cursorId: string | null;
}): Promise<StaffUsersDbPage | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query(`
    WITH staff AS MATERIALIZED (
      SELECT * FROM users WHERE role = 'staff' AND deleted_at IS NULL
    ), total AS (
      SELECT COUNT(*)::int AS total_count FROM staff
    ), page_rows AS (
      SELECT * FROM staff
      WHERE $1::timestamptz IS NULL
        OR created_at < $1
        OR (created_at = $1 AND id::text < $2::text)
      ORDER BY created_at DESC, id::text DESC
      LIMIT $3
    )
    SELECT total.total_count,
      COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.created_at DESC, page_rows.id::text DESC) FROM page_rows), '[]'::jsonb) AS staff
    FROM total
  `, [input.cursorCreatedAt, input.cursorId, input.limit + 1]);
  const row = rows[0];
  if (!row) return null;
  const rawUsers = (typeof row.staff === 'string' ? JSON.parse(row.staff) : row.staff ?? []) as Record<string, unknown>[];
  const visibleRows = rawUsers.slice(0, input.limit);
  const hasMore = rawUsers.length > input.limit;
  const lastVisible = visibleRows[visibleRows.length - 1];
  return {
    users: visibleRows.map(rowToUser),
    totalCount: Number(row.total_count ?? 0),
    hasMore,
    nextCursor: hasMore && lastVisible
      ? { createdAt: String(lastVisible.created_at), id: String(lastVisible.id) }
      : null,
  };
}

export async function createUserDb(input: {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}): Promise<UserRecord> {
  const pool = getPool();
  if (!pool) throw new Error('Database unavailable');
  const id = randomUUID();
  const username = input.email.split('@')[0];

  const { rows } = await pool.query(`
    INSERT INTO users (id, username, email, full_name, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    id,
    username,
    input.email.toLowerCase(),
    input.name.trim(),
    input.passwordHash,
    input.role,
  ]);
  return rowToUser(rows[0]);
}

export async function updateUserDb(
  id: string,
  updates: { email?: string; name?: string; passwordHash?: string }
): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findUserByIdDb(id);
  if (!current) return null;

  const nextEmail = updates.email !== undefined ? updates.email.trim().toLowerCase() : current.email;
  const nextUsername = updates.email !== undefined ? nextEmail.split('@')[0] : current.email.split('@')[0];
  const nextName = updates.name !== undefined ? updates.name.trim() : current.name;
  const nextHash = updates.passwordHash !== undefined ? updates.passwordHash : current.passwordHash;

  const { rows } = await pool.query(`
    UPDATE users SET email = $2, username = $3, full_name = $4, password_hash = $5, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL AND role = 'staff'
    RETURNING *
  `, [id, nextEmail, nextUsername, nextName, nextHash]);

  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function deleteUserDb(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;
  const { rowCount } = await pool.query("UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND role = 'staff' AND deleted_at IS NULL", [id]);
  return (rowCount ?? 0) > 0;
}
