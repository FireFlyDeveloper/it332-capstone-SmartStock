/**
 * PostgreSQL Database Store for SmartStock
 * Full persistence implementation for Glassram Glass & Aluminum Supply
 */

import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { getPool } from './client.js';
import { hasDatabaseUrl } from './config.js';
import { setDbSyncActive } from './syncState.js';

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
