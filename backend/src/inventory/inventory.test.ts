/**
 * Inventory integration tests — routes, service validation, RBAC.
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

describe('inventory routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetInventoryStore();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('lists seeded inventory for authenticated staff', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/inventory', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { total: number; lowStock: number; outOfStock: number } };
    expect(json.data.total).toBe(3);
    expect(json.data.lowStock).toBe(1);
    expect(json.data.outOfStock).toBe(1);
  });

  it('filters inventory by query and status', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/inventory?q=glass&status=in_stock', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { total: number; items: Array<{ sku: string }> } };
    expect(json.data.total).toBe(1);
    expect(json.data.items[0].sku).toBe('GLS-CLR-6MM');
  });

  it('blocks anonymous inventory access', async () => {
    const res = await app.request('/inventory');
    expect(res.status).toBe(401);
  });

  it('allows admin to create, update, and delete inventory items', async () => {
    const token = await login(app, ADMIN);
    const create = await app.request('/inventory', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: 'acc-lock-01',
        name: 'Sliding Lock Set',
        category: 'Accessories',
        unit: 'set',
        quantity: 5,
        reorderLevel: 6,
        supplier: 'Glassram',
        location: 'Drawer D1',
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { item: { id: string; sku: string; status: string } };
    expect(created.item.sku).toBe('ACC-LOCK-01');
    expect(created.item.status).toBe('low_stock');

    const update = await app.request('/inventory/' + created.item.id, {
      method: 'PATCH',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 12 }),
    });
    expect(update.status).toBe(200);
    const updated = (await update.json()) as { item: { status: string; quantity: number } };
    expect(updated.item.quantity).toBe(12);
    expect(updated.item.status).toBe('in_stock');

    const remove = await app.request('/inventory/' + created.item.id, {
      method: 'DELETE',
      headers: { authorization: 'Bearer ' + token },
    });
    expect(remove.status).toBe(200);
  });

  it('blocks staff from mutating inventory', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/inventory', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: 'x', name: 'x', category: 'x', unit: 'pc', quantity: 1, reorderLevel: 1 }),
    });
    expect(res.status).toBe(403);
  });

  it('rejects duplicate SKU and invalid payloads', async () => {
    const token = await login(app, ADMIN);
    const duplicate = await app.request('/inventory', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: 'GLS-CLR-6MM', name: 'Duplicate', category: 'Glass', unit: 'sheet', quantity: 1, reorderLevel: 1 }),
    });
    expect(duplicate.status).toBe(409);

    const invalid = await app.request('/inventory', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ sku: '', quantity: -1 }),
    });
    expect(invalid.status).toBe(400);
  });
});
