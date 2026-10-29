/**
 * PostgreSQL Database Store for SmartStock
 * Full persistence implementation for Glassram Glass & Aluminum Supply
 */

import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { getPool } from './client.js';
import { hasDatabaseUrl } from './config.js';
import { setDbSyncActive } from './syncState.js';

import type { Product, ProductCreateInput, ProductUpdateInput, StockMovement, StockMovementInput } from '../inventory/store.js';
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

  const [{ rows: prodRows }, { rows: orderRows }, { rows: delivRows }, { rows: movRows }, { rows: userRows }] = await Promise.all([
    pool.query('SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name ASC'),
    pool.query('SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY order_no ASC'),
    pool.query('SELECT * FROM deliveries ORDER BY id ASC'),
    pool.query('SELECT * FROM stock_movements ORDER BY occurred_at DESC'),
    pool.query('SELECT * FROM users WHERE deleted_at IS NULL'),
  ]);
  const [inventoryStore, orderStore, deliveryStore, usersStore] = await Promise.all([
    import('../inventory/store.js'),
    import('../orders/store.js'),
    import('../delivery/store.js'),
    import('../auth/users.js'),
  ]);
  inventoryStore._hydrateInventory(prodRows.map(rowToProduct));
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
  })));
  usersStore._hydrateUsers(userRows.map(rowToUser));
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
  const product = await findProductByIdDb(productId);
  if (!product) return null;

  const movementId = input.id ?? `MOV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = input.occurredAt ?? new Date().toISOString();

  await pool.query('BEGIN');
  try {
    const { rows: prodRows } = await pool.query(`
      UPDATE products SET stock = stock + $2, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [productId, input.quantity]);

    await pool.query(`
      INSERT INTO stock_movements (id, product_id, type, movement_type, quantity, reference_no, supplier, occurred_at, created_by)
      VALUES ($1, $2, 'inbound', 'inbound', $3, $4, $5, $6, $7)
    `, [
      movementId,
      productId,
      input.quantity,
      input.referenceNo.trim().toUpperCase(),
      input.supplier?.trim() || null,
      now,
      input.createdBy?.trim() || 'system',
    ]);

    await pool.query('COMMIT');
    const movement: StockMovement = {
      id: movementId,
      productId,
      type: 'inbound',
      quantity: input.quantity,
      referenceNo: input.referenceNo.trim().toUpperCase(),
      supplier: input.supplier?.trim() || undefined,
      occurredAt: now,
      createdBy: input.createdBy?.trim() || 'system',
    };
    return { product: rowToProduct(prodRows[0]), movement };
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

export async function recordOutboundStockDb(
  productId: string,
  input: StockMovementInput & { id?: string }
): Promise<{ product: Product; movement: StockMovement } | null> {
  const pool = getPool();
  if (!pool) return null;
  const product = await findProductByIdDb(productId);
  if (!product) return null;
  if (product.stock < input.quantity) throw new Error('insufficient stock');

  const movementId = input.id ?? `MOV-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = input.occurredAt ?? new Date().toISOString();

  await pool.query('BEGIN');
  try {
    const { rows: prodRows } = await pool.query(`
      UPDATE products SET stock = stock - $2, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [productId, input.quantity]);

    await pool.query(`
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

    await pool.query('COMMIT');
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
    await pool.query('ROLLBACK');
    throw err;
  }
}

export async function listProductMovementsDb(productId: string): Promise<StockMovement[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(`
    SELECT id, product_id as "productId", type, quantity, reference_no as "referenceNo",
           supplier, occurred_at as "occurredAt", created_by as "createdBy"
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
  }));
}

export async function listAllMovementsDb(): Promise<StockMovement[]> {
  const pool = getPool();
  if (!pool) return [];
  const { rows } = await pool.query(`
    SELECT id, product_id as "productId", type, quantity, reference_no as "referenceNo",
           supplier, occurred_at as "occurredAt", created_by as "createdBy"
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

export async function cancelOrderDb(id: string): Promise<Order | null> {
  return updateOrderDb(id, { orderStatus: 'cancelled' });
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
  updates: { name?: string; passwordHash?: string }
): Promise<UserRecord | null> {
  const pool = getPool();
  if (!pool) return null;
  const current = await findUserByIdDb(id);
  if (!current) return null;

  const nextName = updates.name !== undefined ? updates.name.trim() : current.name;
  const nextHash = updates.passwordHash !== undefined ? updates.passwordHash : current.passwordHash;

  const { rows } = await pool.query(`
    UPDATE users SET full_name = $2, password_hash = $3, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `, [id, nextName, nextHash]);

  return rows[0] ? rowToUser(rows[0]) : null;
}
