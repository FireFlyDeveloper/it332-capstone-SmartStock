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
import { _resetOrderStore, listOrders } from './store.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  app.route('/orders', orderRoutes);
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

  it('blocks anonymous access and staff mutations', async () => {
    const anonymous = await app.request('/orders');
    expect(anonymous.status).toBe(401);

    const token = await login(app, STAFF);
    const res = await app.request('/orders', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify(validOrderPayload),
    });
    expect(res.status).toBe(403);
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
