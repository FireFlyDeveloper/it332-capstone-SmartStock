/**
 * Inventory integration tests — products routes, service validation, RBAC.
 *
 * Author: Hazel
 * Last touched: 2026-07-07
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { inventoryRoutes } from './routes.js';
import { _resetInventoryStore } from './store.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  app.route('/products', inventoryRoutes);
  app.route('/inventory', inventoryRoutes);
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

describe('product inventory routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetInventoryStore();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('lists seeded products for authenticated staff', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/products', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ sku: string; stock: number; threshold: number; price: number }>;
    expect(json).toHaveLength(3);
    expect(json[0]).toHaveProperty('price');
    expect(json[0]).toHaveProperty('threshold');
    expect(json[0]).toHaveProperty('stock');
  });

  it('keeps /inventory as a compatibility alias', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/inventory', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ sku: string }>;
    expect(json.length).toBeGreaterThan(0);
  });

  it('filters products by query and category', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/products?q=glass&category=glass', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Array<{ sku: string; category: string }>;
    expect(json.length).toBeGreaterThan(0);
    expect(json.every((item) => item.category === 'glass')).toBe(true);
  });

  it('blocks anonymous product access', async () => {
    const res = await app.request('/products');
    expect(res.status).toBe(401);
  });

  it('allows admin to create, update, and delete products', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/products', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: 'acc-lock-01',
        name: 'Sliding Lock Set',
        category: 'aluminum',
        unit: 'set',
        stock: 5,
        price: 320,
        threshold: 6,
        status: 'active',
        description: 'Door lock accessory',
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { id: string; sku: string; stock: number };
    expect(created.sku).toBe('ACC-LOCK-01');
    expect(created.stock).toBe(5);

    const update = await app.request('/products/' + created.id, {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ stock: 12 }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as { stock: number };
    expect(updated.stock).toBe(12);

    const remove = await app.request('/products/' + created.id, {
      method: 'DELETE',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(remove.status).toBe(200);
    expect(await remove.json()).toEqual({ ok: true });
  });

  it('blocks staff from mutating products', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/products', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: 'x', name: 'x', category: 'glass', unit: 'pc', stock: 1, price: 1, threshold: 1 }),
    });
    expect(res.status).toBe(403);
  });

  it('rejects duplicate SKU and invalid payloads', async () => {
    const token = await login(app, ADMIN);
    const duplicate = await app.request('/products', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: 'GLS-CLR-6MM', name: 'Duplicate', category: 'glass', unit: 'sheet', stock: 1, price: 1, threshold: 1 }),
    });
    expect(duplicate.status).toBe(409);

    const invalid = await app.request('/products', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: '', category: 'wood', stock: -1 }),
    });
    expect(invalid.status).toBe(400);
  });
});
