/**
 * Delivery integration tests — routes, service validation, RBAC.
 *
 * Author: Hazel
 * Last touched: 2026-07-08
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { deliveryRoutes } from './routes.js';
import { _resetDeliveryStore, createDelivery } from './store.js';
import { _resetOrderStore, createOrder, updateOrder } from '../orders/store.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  app.route('/deliveries', deliveryRoutes);
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
const ADMIN = 'admin' + AT + 'smartstock.local';
const STAFF = 'staff' + AT + 'smartstock.local';

function seedOrder(address = '101 Test Street, Manila') {
  return createOrder({
    customerName: 'Test Customer',
    customerPhone: '09170000000',
    deliveryAddress: address,
    deliveryDate: '2026-10-30',
    items: [{ productId: 'PRD-TEST', name: 'Test Item', quantity: 1, unitPrice: 100 }],
  });
}

describe('delivery routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetDeliveryStore(false);
    _resetOrderStore(false);
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('projects pending delivery orders even when no delivery row exists', async () => {
    const order = seedOrder();
    const token = await login(app, STAFF);
    const res = await app.request('/deliveries', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ id: string; orderId: string; status: string; currentStep: number; driver: string | null }>;
    expect(json).toEqual([
      expect.objectContaining({
        id: order.id,
        orderId: order.id,
        status: 'pending',
        currentStep: 0,
        driver: null,
      }),
    ]);
  });

  it('maps backend order states to pending, in-transit, and delivered', async () => {
    const pending = seedOrder();
    const inTransit = seedOrder();
    const delivered = seedOrder();
    const pickup = seedOrder('Pickup');
    const cancelled = seedOrder();
    updateOrder(inTransit.id, { orderStatus: 'in_transit' });
    updateOrder(delivered.id, { orderStatus: 'delivered' });
    updateOrder(cancelled.id, { orderStatus: 'cancelled' });

    const token = await login(app, STAFF);
    const res = await app.request('/deliveries', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ orderId: string; status: string }>;
    expect(json.map(({ orderId, status }) => [orderId, status])).toEqual([
      [pending.id, 'pending'],
      [inTransit.id, 'in_transit'],
      [delivered.id, 'delivered'],
    ]);
    expect(json.some((item) => item.orderId === pickup.id || item.orderId === cancelled.id)).toBe(false);

    const get = await app.request('/deliveries/' + inTransit.id, {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual(expect.objectContaining({ orderId: inTransit.id, status: 'in_transit' }));
  });

  it('serves cursor-paginated, filtered order-backed delivery pages', async () => {
    const pending = seedOrder();
    const inTransit = seedOrder();
    const delivered = seedOrder();
    seedOrder('Pickup');
    const cancelled = seedOrder();
    updateOrder(inTransit.id, { orderStatus: 'in_transit' });
    updateOrder(delivered.id, { orderStatus: 'delivered' });
    updateOrder(cancelled.id, { orderStatus: 'cancelled' });

    const token = await login(app, STAFF);
    const headers = { authorization: 'Bearer ' + token };
    const first = await app.request('/deliveries?mode=page&limit=1&status=all', { headers });
    expect(first.status, await first.clone().text()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.page).toMatchObject({ limit: 1, totalCount: 3, hasMore: true });
    expect(firstBody.summary).toEqual({ totalCount: 3, pendingCount: 1, inTransitCount: 1, deliveredCount: 1 });
    expect(firstBody.items).toHaveLength(1);

    const second = await app.request(`/deliveries?mode=page&limit=1&status=all&cursor=${encodeURIComponent(firstBody.page.nextCursor)}`, { headers });
    expect(second.status).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.items[0].orderId).not.toBe(firstBody.items[0].orderId);

    const transit = await app.request('/deliveries?mode=page&status=in_transit', { headers });
    expect(transit.status).toBe(200);
    const transitBody = await transit.json();
    expect(transitBody.page.totalCount).toBe(1);
    expect(transitBody.items[0]).toMatchObject({ orderId: inTransit.id, status: 'in_transit', customerName: 'Test Customer' });
    expect([pending.id, inTransit.id, delivered.id]).toContain(firstBody.items[0].orderId);

    expect((await app.request('/deliveries?mode=page&limit=101', { headers })).status).toBe(400);
    expect((await app.request('/deliveries?mode=page&status=failed', { headers })).status).toBe(400);
    expect((await app.request('/deliveries?mode=page&cursor=invalid', { headers })).status).toBe(400);
  });

  it('filters deliveries by status and traffic level', async () => {
    const order = seedOrder();
    updateOrder(order.id, { orderStatus: 'in_transit' });
    await createDelivery({
      orderId: order.id,
      driver: 'Test Driver',
      truckNumber: 'Truck-1',
      destination: order.deliveryAddress,
      status: 'in_transit',
      currentStep: 3,
      trafficLevel: 'medium',
      predictedDelay: false,
      routeEfficiencyScore: 90,
    });
    const token = await login(app, STAFF);
    const res = await app.request('/deliveries?status=in_transit&trafficLevel=medium', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ status: string; trafficLevel: string | null; currentStep: number }>;
    expect(json.length).toBeGreaterThan(0);
    expect(json.every((item) => item.status === 'in_transit' && item.trafficLevel === 'medium' && item.currentStep === 1)).toBe(true);
  });

  it('blocks anonymous delivery access', async () => {
    const res = await app.request('/deliveries');
    expect(res.status).toBe(401);
  });

  it('allows admin to create, advance, fail, and delete deliveries', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/deliveries', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-900',
        driver: 'Nina Ramos',
        truckNumber: 'Truck-900',
        destination: 'Glassram Warehouse, Batangas',
        status: 'pending',
        currentStep: 0,
        currentLocation: { x: 0, y: 0 },
        trafficLevel: 'low',
        predictedDelay: false,
        routeEfficiencyScore: 91,
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { id: string; status: string; currentStep: number };
    expect(created.status).toBe('pending');

    const update = await app.request('/deliveries/' + created.id, {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', currentStep: 1 }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as { status: string; currentStep: number };
    expect(updated.status).toBe('assigned');
    expect(updated.currentStep).toBe(1);

    const fail = await app.request('/deliveries/' + created.id, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'failed', currentStep: -1 }),
    });
    expect(fail.status).toBe(200);
    const failed = (await fail.json()) as { status: string; currentStep: number };
    expect(failed.status).toBe('failed');
    expect(failed.currentStep).toBe(-1);

    const remove = await app.request('/deliveries/' + created.id, {
      method: 'DELETE',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(remove.status).toBe(200);
    expect(await remove.json()).toEqual({ ok: true });
  });

  it('blocks staff from mutating deliveries', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/deliveries', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: 'ORD-X', driver: 'x', truckNumber: 'x', destination: 'x' }),
    });
    expect(res.status).toBe(403);
  });

  it('rejects invalid payloads and illegal status jumps', async () => {
    const token = await login(app, ADMIN);
    const invalid = await app.request('/deliveries', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: '', driver: '', truckNumber: '', destination: '' }),
    });
    expect(invalid.status).toBe(400);

    const pendingOrder = seedOrder();
    await createDelivery({
      orderId: pendingOrder.id,
      driver: 'Test Driver',
      truckNumber: 'Truck-2',
      destination: pendingOrder.deliveryAddress,
      status: 'pending',
    });
    const list = await app.request('/deliveries?status=pending', {
      headers: { authorization: 'Bearer ' + token },
    });
    const pending = ((await list.json()) as Array<{ id: string }>)[0];
    const jump = await app.request('/deliveries/' + pending.id, {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'delivered', currentStep: 5 }),
    });
    expect(jump.status).toBe(409);
  });
});
