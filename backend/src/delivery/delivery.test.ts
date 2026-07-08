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
import { _resetDeliveryStore } from './store.js';

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

describe('delivery routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetDeliveryStore();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('lists seeded deliveries for authenticated staff', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/deliveries', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ orderId: string; status: string; currentStep: number }>;
    expect(json.length).toBeGreaterThan(0);
    expect(json[0]).toHaveProperty('orderId');
    expect(json[0]).toHaveProperty('currentStep');
  });

  it('filters deliveries by status and traffic level', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/deliveries?status=in_transit&trafficLevel=medium', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ status: string; trafficLevel: string }>;
    expect(json.length).toBeGreaterThan(0);
    expect(json.every((item) => item.status === 'in_transit' && item.trafficLevel === 'medium')).toBe(true);
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
