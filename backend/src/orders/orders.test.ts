/**
 * Orders integration tests — lifecycle, RBAC, payments, refunds.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { orderRoutes } from './routes.js';
import { dailySalesRoutes } from '../dailySales/routes.js';
import { inventoryRoutes } from '../inventory/routes.js';
import { analyticsRoutes } from '../analytics/routes.js';
import { reportsRoutes } from '../reports/routes.js';
import { _resetOrderStore, listOrders } from './store.js';
import { _resetInventoryStore, findProductById } from '../inventory/store.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  app.route('/orders', orderRoutes);
  app.route('/daily-sales', dailySalesRoutes);
  app.route('/products', inventoryRoutes);
  app.route('/analytics', analyticsRoutes);
  app.route('/reports', reportsRoutes);
  return app;
}

async function seedUser(email: string, role: Role) {
  const passwordHash = await hashPassword('pass1234');
  return createUser({ email, name: email.split('@')[0], passwordHash, role });
}

async function login(app: Hono, email: string) {
  const res = await app.request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'pass1234' }),
  });
  const json = (await res.json()) as { token: string };
  return json.token;
}

const AT = String.fromCharCode(64);
const ADMIN = 'orders-admin' + AT + 'smartstock.local';
const STAFF = 'orders-staff' + AT + 'smartstock.local';

const validOrderPayload = {
  customerName: 'Maria Santos',
  customerPhone: '+639171234567',
  deliveryAddress: 'Unit 4, Glassram Building, Batangas City',
  deliveryDate: '2026-08-15',
  items: [
    { productId: 'PRD-001', name: 'Tempered Glass Panel', quantity: 2, unitPrice: 1250 },
    { productId: 'PRD-002', name: 'Aluminum Frame', quantity: 1, unitPrice: 900 },
  ],
  paidAmount: 1000,
};

describe('order routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetOrderStore();
    _resetInventoryStore();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('lists seeded orders for authenticated staff', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/orders', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ id: string; referenceNumber: string; orderStatus: string }>;
    expect(json.length).toBeGreaterThanOrEqual(2);
    expect(json[0]).toHaveProperty('referenceNumber');
    expect(json[0].referenceNumber).toMatch(/^SS-\d{4}-\d{5}$/);
  });

  it('loads filtered order pages with cursor metadata and validates query input', async () => {
    const token = await login(app, STAFF);
    const headers = { authorization: 'Bearer ' + token };
    const expectedCount = listOrders().length;
    expect(expectedCount).toBeGreaterThanOrEqual(2);

    const first = await app.request('/orders/page?limit=1&status=all', { headers });
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.page).toMatchObject({ limit: 1, totalCount: expectedCount, hasMore: true });
    expect(firstBody.orders).toHaveLength(1);
    expect(firstBody.summary).toEqual(expect.objectContaining({ pendingCount: 0 }));

    const second = await app.request(`/orders/page?limit=1&status=all&cursor=${encodeURIComponent(firstBody.page.nextCursor)}`, { headers });
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.orders).toHaveLength(1);
    expect(secondBody.orders[0].id).not.toBe(firstBody.orders[0].id);

    const itemSearch = listOrders()[0].items[0].name;
    const itemSearchResponse = await app.request(`/orders/page?search=${encodeURIComponent(itemSearch)}`, { headers });
    expect(itemSearchResponse.status).toBe(200);
    expect((await itemSearchResponse.json()).page.totalCount).toBeGreaterThan(0);

    expect((await app.request('/orders/page?limit=0', { headers })).status).toBe(400);
    expect((await app.request('/orders/page?from=2026-02-30', { headers })).status).toBe(400);
    expect((await app.request('/orders/page?from=2026-11-01&to=2026-10-01', { headers })).status).toBe(400);
    expect((await app.request('/orders/page?cursor=not-a-cursor', { headers })).status).toBe(400);
  });

  it('gets an order by id and reference number for authenticated staff', async () => {
    const token = await login(app, STAFF);
    const [seeded] = listOrders();
    const byId = await app.request('/orders/' + seeded.id, {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(byId.status).toBe(200);
    const idJson = (await byId.json()) as { id: string; referenceNumber: string };
    expect(idJson.id).toBe(seeded.id);

    const byRef = await app.request('/orders/reference/' + seeded.referenceNumber, {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(byRef.status).toBe(200);
    const refJson = (await byRef.json()) as { id: string; referenceNumber: string };
    expect(refJson.id).toBe(seeded.id);
    expect(refJson.referenceNumber).toBe(seeded.referenceNumber);
  });

  it('allows admin to create, update, and cancel an order while preserving reference number', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify(validOrderPayload),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      id: string;
      referenceNumber: string;
      subtotal: number;
      total: number;
      paidAmount: number;
      orderStatus: string;
      paymentStatus: string;
    };
    expect(created.referenceNumber).toMatch(/^SS-\d{4}-\d{5}$/);
    expect(created.subtotal).toBe(3400);
    expect(created.total).toBe(3400);
    expect(created.paidAmount).toBe(1000);
    expect(created.orderStatus).toBe('processing');
    expect(created.paymentStatus).toBe('partial');
    expect(findProductById('PRD-001')?.stock).toBe(22);
    expect(findProductById('PRD-002')?.stock).toBe(6);

    const update = await app.request('/orders/' + created.id, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ orderStatus: 'in_transit', customerName: 'Maria Reyes', deliveryAddress: 'Updated Batangas Address' }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as { referenceNumber: string; orderStatus: string; customerName: string; deliveryAddress: string };
    expect(updated.referenceNumber).toBe(created.referenceNumber);
    expect(updated.orderStatus).toBe('in_transit');
    expect(updated.customerName).toBe('Maria Reyes');
    expect(updated.deliveryAddress).toBe('Updated Batangas Address');

    const remove = await app.request('/orders/' + created.id, {
      method: 'DELETE',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(remove.status).toBe(200);
    const cancelled = (await remove.json()) as { ok: boolean; order: { orderStatus: string; referenceNumber: string } };
    expect(cancelled.ok).toBe(true);
    expect(cancelled.order.orderStatus).toBe('cancelled');
    expect(cancelled.order.referenceNumber).toBe(created.referenceNumber);
  });

  it('blocks anonymous access and allows staff to create orders', async () => {
    const anonymous = await app.request('/orders');
    expect(anonymous.status).toBe(401);

    const token = await login(app, STAFF);
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify(validOrderPayload),
    });
    expect(res.status).toBe(201);
    expect(findProductById('PRD-001')?.stock).toBe(22);
  });

  it('processes payments through unpaid, partial, and paid status transitions', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ ...validOrderPayload, paidAmount: 0 }),
    });
    const order = (await create.json()) as { id: string; paymentStatus: string; total: number };
    expect(order.paymentStatus).toBe('unpaid');

    const partial = await app.request('/orders/' + order.id + '/payment', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 1200 }),
    });
    expect(partial.status).toBe(200);
    const partialJson = (await partial.json()) as { paidAmount: number; paymentStatus: string };
    expect(partialJson.paidAmount).toBe(1200);
    expect(partialJson.paymentStatus).toBe('partial');

    const paid = await app.request('/orders/' + order.id + '/payment', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 2200 }),
    });
    expect(paid.status).toBe(200);
    const paidJson = (await paid.json()) as { paidAmount: number; paymentStatus: string };
    expect(paidJson.paidAmount).toBe(3400);
    expect(paidJson.paymentStatus).toBe('paid');
  });

  it('cancels an order, refunds the remaining payment, restores stock, and is idempotent', async () => {
    const token = await login(app, STAFF);
    const order = listOrders().find((item) => item.paidAmount > 0)!;
    const beforeStock = findProductById(order.items[0].productId)!.stock;
    const response = await app.request(`/orders/${order.id}/cancel`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(response.status).toBe(200);
    const cancelled = await response.json() as { order: { orderStatus: string; paidAmount: number; refundedAmount: number } };
    expect(cancelled.order.orderStatus).toBe('cancelled');
    expect(cancelled.order.paidAmount).toBe(0);
    expect(cancelled.order.refundedAmount).toBe(order.paidAmount);
    expect(findProductById(order.items[0].productId)!.stock).toBe(beforeStock + order.items[0].quantity);

    const repeated = await app.request(`/orders/${order.id}/cancel`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(repeated.status).toBe(200);
    const repeatedResult = await repeated.json() as { order: { refundedAmount: number } };
    expect(repeatedResult.order.refundedAmount).toBe(order.paidAmount);
    expect(findProductById(order.items[0].productId)!.stock).toBe(beforeStock + order.items[0].quantity);
  });

  it('reflects cancellation refunds in Daily Sales and removes cancelled revenue while restoring product stock', async () => {
    _resetOrderStore(false);
    _resetInventoryStore();
    const token = await login(app, STAFF);
    const beforeStock = findProductById('PRD-001')!.stock;
    const beforeFrameStock = findProductById('PRD-002')!.stock;

    const createdResponse = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify(validOrderPayload),
    });
    expect(createdResponse.status).toBe(201);
    const created = await createdResponse.json() as { id: string; createdAt: string; paidAmount: number };
    expect(created.paidAmount).toBe(1000);
    expect(findProductById('PRD-001')!.stock).toBe(beforeStock - 2);

    const cancelResponse = await app.request(`/orders/${created.id}/cancel`, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(cancelResponse.status).toBe(200);

    const productsResponse = await app.request('/products', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(productsResponse.status).toBe(200);
    const products = await productsResponse.json() as Array<{ id: string; stock: number }>;
    expect(products.find((product) => product.id === 'PRD-001')?.stock).toBe(beforeStock);
    expect(products.find((product) => product.id === 'PRD-002')?.stock).toBe(beforeFrameStock);

    const ordersResponse = await app.request('/orders', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(ordersResponse.status).toBe(200);
    const orders = await ordersResponse.json() as Array<{ id: string; paidAmount: number; refundedAmount: number; orderStatus: string }>;
    expect(orders).toMatchObject([{ id: created.id, paidAmount: 0, refundedAmount: 1000, orderStatus: 'cancelled' }]);

    const salesResponse = await app.request(`/daily-sales?date=${created.createdAt.slice(0, 10)}`, {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(salesResponse.status).toBe(200);
    const sales = await salesResponse.json() as {
      orderCount: number; cancelledOrderCount: number; grossSales: number;
      collectedAmount: number; refundsAmount: number; netCollectedAmount: number;
      orders: Array<{ paidAmount: number; refundedAmount: number; paymentStatus: string; orderStatus: string }>;
    };
    expect(sales).toMatchObject({
      orderCount: 0,
      cancelledOrderCount: 1,
      grossSales: 0,
      collectedAmount: 1000,
      refundsAmount: 1000,
      netCollectedAmount: 0,
      orders: [{ paidAmount: 0, refundedAmount: 1000, paymentStatus: 'refunded', orderStatus: 'cancelled' }],
    });

    const reportToken = await login(app, ADMIN);
    const reportResponse = await app.request('/reports/sales/monthly', {
      headers: { authorization: 'Bearer ' + reportToken },
    });
    expect(reportResponse.status).toBe(200);
    const report = await reportResponse.json() as { totals: { transactionCount: number; grossSales: number } };
    expect(report.totals).toMatchObject({ transactionCount: 0, grossSales: 0 });
  });

  it('processes refunds and updates refund fields and payment status', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ ...validOrderPayload, paidAmount: 3400 }),
    });
    const order = (await create.json()) as { id: string; paymentStatus: string };
    expect(order.paymentStatus).toBe('paid');

    const refund = await app.request('/orders/' + order.id + '/refund', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 400, reason: 'Customer changed size', type: 'partial' }),
    });
    expect(refund.status).toBe(200);
    const refunded = (await refund.json()) as { paidAmount: number; refundedAmount: number; refundReason: string; refundType: string; paymentStatus: string };
    expect(refunded.paidAmount).toBe(3000);
    expect(refunded.refundedAmount).toBe(400);
    expect(refunded.refundReason).toBe('Customer changed size');
    expect(refunded.refundType).toBe('partial');
    expect(refunded.paymentStatus).toBe('partial');
  });

  it('rejects invalid payloads, invalid statuses, and generates unique references', async () => {
    const token = await login(app, ADMIN);
    const invalid = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ customerName: '', customerPhone: '', deliveryAddress: '', deliveryDate: 'bad', items: [] }),
    });
    expect(invalid.status).toBe(400);

    const create = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify(validOrderPayload),
    });
    const order = (await create.json()) as { id: string };
    const invalidStatus = await app.request('/orders/' + order.id, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ orderStatus: 'lost' }),
    });
    expect(invalidStatus.status).toBe(400);

    const references = listOrders().map((item) => item.referenceNumber);
    expect(new Set(references).size).toBe(references.length);
  });
});
