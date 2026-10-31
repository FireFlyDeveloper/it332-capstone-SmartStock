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
import { buildInventoryInsightSummary } from './service.js';

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

  it('summarizes listed-price category values and active-only alert severities', () => {
    const products = [
      { id: '1', name: 'Empty', sku: 'S1', category: 'glass' as const, unit: 'sheet', stock: 0, price: 20, threshold: 10, status: 'active' as const },
      { id: '2', name: 'Critical', sku: 'S2', category: 'glass' as const, unit: 'sheet', stock: 5, price: 10, threshold: 10, status: 'active' as const },
      { id: '3', name: 'Low', sku: 'S3', category: 'aluminum' as const, unit: 'length', stock: 8, price: 5, threshold: 10, status: 'active' as const },
      { id: '4', name: 'Inactive Empty', sku: 'S4', category: 'aluminum' as const, unit: 'length', stock: 0, price: 99, threshold: 10, status: 'discontinued' as const },
    ];
    expect(buildInventoryInsightSummary(products)).toMatchObject({
      productCount: 4, totalInventoryValue: 90, glassInventoryValue: 50, aluminumInventoryValue: 40,
      categoryValues: [{ category: 'glass', listedPriceValue: 50 }, { category: 'aluminum', listedPriceValue: 40 }],
      outOfStockCount: 2, criticalStockCount: 1, lowStockStatusCount: 1,
      activeLowStockCount: 3, activeLowAlertCount: 1,
      activeAlertCounts: { outOfStock: 1, critical: 1, low: 1 },
    });
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

  it('serves cursor-paginated inventory pages with server filters and summaries', async () => {
    const token = await login(app, STAFF);
    const headers = { authorization: 'Bearer ' + token };
    const first = await app.request('/products?mode=page&limit=1', { headers });
    expect(first.status).toBe(200);
    const firstBody = await first.json() as {
      items: Array<{ id: string; name: string }>;
      page: { totalCount: number; hasMore: boolean; nextCursor: string | null };
      summary: {
        totalProducts: number; glassCount: number; aluminumCount: number; lowStockCount: number; outOfStockCount: number;
        totalInventoryValue: number; glassInventoryValue: number; aluminumInventoryValue: number; activeProductCount: number;
        activeGlassCount: number; activeAluminumCount: number; activeLowStockCount: number; healthyStockCount: number;
        lowStockStatusCount: number; criticalStockCount: number; stockAlertProducts: { outOfStock: { id: string; name: string; stock: number; unit: string; threshold: number } | null; critical: { id: string; name: string; stock: number; unit: string; threshold: number } | null; low: { id: string; name: string; stock: number; unit: string; threshold: number } | null };
      };
    };
    expect(firstBody.page).toMatchObject({ totalCount: 3, hasMore: true });
    expect(firstBody.summary).toEqual({
      totalProducts: 3, glassCount: 2, aluminumCount: 1, lowStockCount: 2, outOfStockCount: 1,
      totalInventoryValue: 36300, glassInventoryValue: 30000, aluminumInventoryValue: 6300,
      activeProductCount: 3, activeGlassCount: 2, activeAluminumCount: 1, activeLowStockCount: 2,
      healthyStockCount: 1, lowStockStatusCount: 1, criticalStockCount: 0,
      stockAlertProducts: {
        outOfStock: { id: 'PRD-003', name: 'Tempered Glass 10mm', stock: 0, unit: 'sheet', threshold: 6 },
        critical: null,
        low: { id: 'PRD-002', name: 'Black Aluminum Frame', stock: 7, unit: 'length', threshold: 10 },
      },
    });
    expect(firstBody.items).toHaveLength(1);

    const second = await app.request(`/products?mode=page&limit=1&cursor=${encodeURIComponent(firstBody.page.nextCursor!)}`, { headers });
    expect(second.status).toBe(200);
    const secondBody = await second.json() as { items: Array<{ id: string; name: string }> };
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.items[0].id).not.toBe(firstBody.items[0].id);

    const matching = await app.request('/products?mode=page&q=PRD-001%20SHEET&category=glass', { headers });
    const matchingBody = await matching.json() as { items: Array<{ id: string; name: string }>; page: { totalCount: number } };
    expect(matching.status).toBe(200);
    expect(matchingBody.page.totalCount).toBe(1);
    expect(matchingBody.items[0]).toMatchObject({ id: 'PRD-001', name: 'Clear Glass 6mm' });

    const lowStock = await app.request('/products?mode=page&stock=low', { headers });
    expect((await lowStock.json() as { page: { totalCount: number } }).page.totalCount).toBe(2);
    expect((await app.request('/products?mode=page&limit=101', { headers })).status).toBe(400);
    expect((await app.request('/products?mode=page&category=wood', { headers })).status).toBe(400);
    expect((await app.request('/products?mode=page&stock=critical', { headers })).status).toBe(400);
    expect((await app.request('/products?mode=page&cursor=invalid', { headers })).status).toBe(400);
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

  it('accepts an empty optional description when creating a product', async () => {
    const token = await login(app, ADMIN);
    const res = await app.request('/products', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({
        sku: 'ALU-EMPTY-DESC',
        name: 'Aluminum',
        category: 'aluminum',
        unit: 'sqm',
        stock: 0,
        price: 100,
        threshold: 10,
        status: 'active',
        description: '',
      }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string; sku: string; description?: string };
    expect(created).toMatchObject({ sku: 'ALU-EMPTY-DESC' });
    expect(created.description).toBeUndefined();

    const setDescription = await app.request('/products/' + created.id, {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Temporary description' }),
    });
    expect(setDescription.status).toBe(200);

    const clearDescription = await app.request('/products/' + created.id, {
      method: 'PUT',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ description: '' }),
    });
    expect(clearDescription.status).toBe(200);
    const cleared = (await clearDescription.json()) as { description?: string };
    expect(cleared.description).toBeUndefined();
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

  it('records inbound stock and exposes the created movement', async () => {
    const token = await login(app, ADMIN);
    const products = (await (await app.request('/products', {
      headers: { authorization: 'Bearer ' + token },
    })).json()) as Array<{ id: string; stock: number }>;
    const product = products[0];

    const inbound = await app.request('/products/' + product.id + '/stock/inbound', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 4, referenceNo: 'PO-1001', supplier: 'Acme Glass' }),
    });

    expect(inbound.status).toBe(201);
    const updated = (await inbound.json()) as { product: { stock: number }; movement: { type: string; quantity: number; referenceNo: string; supplier: string; createdBy: string } };
    expect(updated.product.stock).toBe(product.stock + 4);
    expect(updated.movement).toMatchObject({ type: 'inbound', quantity: 4, referenceNo: 'PO-1001', supplier: 'Acme Glass', createdBy: ADMIN });

    const list = await app.request('/products/' + product.id + '/movements', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(list.status).toBe(200);
    const movements = (await list.json()) as Array<{ referenceNo: string }>;
    expect(movements.map((movement) => movement.referenceNo)).toContain('PO-1001');
  });

  it('records outbound stock and rejects insufficient stock', async () => {
    const token = await login(app, ADMIN);
    const products = (await (await app.request('/products', {
      headers: { authorization: 'Bearer ' + token },
    })).json()) as Array<{ id: string; stock: number }>;
    const product = products.find((item) => item.stock > 0)!;

    const outbound = await app.request('/products/' + product.id + '/stock/outbound', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 3, referenceNo: 'SO-2001' }),
    });
    expect(outbound.status).toBe(201);
    const updated = (await outbound.json()) as { product: { stock: number }; movement: { type: string; quantity: number; referenceNo: string } };
    expect(updated.product.stock).toBe(product.stock - 3);
    expect(updated.movement).toMatchObject({ type: 'outbound', quantity: 3, referenceNo: 'SO-2001' });

    const rejected = await app.request('/products/' + product.id + '/stock/outbound', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 9999, referenceNo: 'SO-2002' }),
    });
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toEqual({ error: 'insufficient stock' });
  });

  it('rejects duplicate stock movement references', async () => {
    const token = await login(app, ADMIN);
    const products = (await (await app.request('/products', {
      headers: { authorization: 'Bearer ' + token },
    })).json()) as Array<{ id: string }>;
    const product = products[0];

    const first = await app.request('/products/' + product.id + '/stock/inbound', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 1, referenceNo: 'DUP-REF-1', supplier: 'Supplier A' }),
    });
    expect(first.status).toBe(201);

    const duplicate = await app.request('/products/' + product.id + '/stock/inbound', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: 1, referenceNo: 'DUP-REF-1', supplier: 'Supplier B' }),
    });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ error: 'referenceNo already exists' });
  });

  it('lists low-stock products using stock less than or equal to threshold', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/inventory/low-stock', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const products = (await res.json()) as Array<{ sku: string; stock: number; threshold: number }>;
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.stock <= product.threshold)).toBe(true);
    expect(products.map((product) => product.sku)).toContain('ALU-FRM-BLK');
  });
});
