/**
 * Reports tests — authenticated operational report summaries for SmartStock.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { _resetOrderStore, createOrder } from '../orders/store.js';
import { _resetInventoryStore, createProduct, recordInboundStock, recordOutboundStock } from '../inventory/store.js';
import { reportsRoutes } from './routes.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
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
const ADMIN = 'reports-admin' + AT + 'smartstock.local';
const STAFF = 'reports-staff' + AT + 'smartstock.local';

function seedReportOrders() {
  const jan = createOrder({
    referenceNumber: 'SS-2026-01001',
    customerName: 'Jan Customer',
    customerPhone: '+639****1001',
    deliveryAddress: 'Batangas',
    deliveryDate: '2026-01-20',
    paidAmount: 100,
    items: [{ productId: 'GLS-1', name: 'Glass', quantity: 2, unitPrice: 100 }],
  });
  jan.createdAt = '2026-01-15T10:00:00.000Z';

  const feb = createOrder({
    referenceNumber: 'SS-2026-02001',
    customerName: 'Feb Customer',
    customerPhone: '+639****2001',
    deliveryAddress: 'Manila',
    deliveryDate: '2026-02-20',
    paidAmount: 300,
    items: [{ productId: 'ALU-1', name: 'Aluminum', quantity: 3, unitPrice: 100 }],
  });
  feb.createdAt = '2026-02-05T10:00:00.000Z';

  const cancelled = createOrder({
    referenceNumber: 'SS-2026-02002',
    customerName: 'Cancelled Customer',
    customerPhone: '+639****2002',
    deliveryAddress: 'Cavite',
    deliveryDate: '2026-02-21',
    paidAmount: 999,
    items: [{ productId: 'ALU-2', name: 'Aluminum Cancelled', quantity: 1, unitPrice: 999 }],
  });
  cancelled.createdAt = '2026-02-10T10:00:00.000Z';
  cancelled.orderStatus = 'cancelled';
}

function seedReportInventory() {
  const aluminum = createProduct({ sku: 'ALU-RP-01', name: 'Report Aluminum', category: 'aluminum', unit: 'length', stock: 1, price: 50, threshold: 5 });
  const glass = createProduct({ sku: 'GLS-RP-01', name: 'Report Glass', category: 'glass', unit: 'sheet', stock: 0, price: 100, threshold: 5 });

  recordInboundStock(glass.id, { quantity: 10, referenceNo: 'PO-RP-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  recordInboundStock(glass.id, { quantity: 4, referenceNo: 'PO-RP-002', supplier: 'Supplier B', occurredAt: '2026-03-10T00:00:00.000Z' });
  recordInboundStock(aluminum.id, { quantity: 6, referenceNo: 'PO-RP-003', supplier: 'Supplier A', occurredAt: '2026-01-12T00:00:00.000Z' });
  recordOutboundStock(glass.id, { quantity: 7, referenceNo: 'SO-RP-001', occurredAt: '2026-02-01T00:00:00.000Z' });
  recordOutboundStock(aluminum.id, { quantity: 2, referenceNo: 'SO-RP-002', occurredAt: '2026-02-03T00:00:00.000Z' });
}

async function authedRequest(app: Hono, path: string, email = STAFF) {
  const token = await login(app, email);
  return app.request(path, { headers: { authorization: 'Bearer ' + token } });
}

describe('reports routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    seedReportOrders();
    seedReportInventory();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('blocks anonymous report access and allows staff view-only JSON summaries', async () => {
    const anonymous = await app.request('/reports/sales/monthly');
    expect(anonymous.status).toBe(401);

    const staff = await authedRequest(app, '/reports/sales/monthly');
    expect(staff.status).toBe(200);
    expect(staff.headers.get('content-type')).toContain('application/json');
  });

  it('allows admin to access report JSON summaries', async () => {
    const admin = await authedRequest(app, '/reports/spending', ADMIN);
    expect(admin.status).toBe(200);
  });

  it('returns monthly sales report summaries with stable totals', async () => {
    const res = await authedRequest(app, '/reports/sales/monthly');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      report: 'monthly_sales',
      totals: { months: 2, transactionCount: 2, grossSales: 500 },
      rows: [
        { month: '2026-01', transactionCount: 1, grossSales: 200 },
        { month: '2026-02', transactionCount: 1, grossSales: 300 },
      ],
    });
  });

  it('returns annual purchases report summaries grouped by material and supplier', async () => {
    const res = await authedRequest(app, '/reports/purchases/annual?year=2026');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      report: 'annual_purchases',
      year: 2026,
      totals: { groups: 3, transactionCount: 3, totalQuantity: 20, totalCost: 1700 },
      rows: [
        { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300 },
        { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000 },
        { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400 },
      ],
    });
  });

  it('validates annual purchases report year query', async () => {
    const res = await authedRequest(app, '/reports/purchases/annual?year=bad');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'year must be an integer between 1900 and 3000' });
  });

  it('returns inventory evaluation report summaries sorted by product name', async () => {
    const res = await authedRequest(app, '/reports/inventory/evaluation');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      report: 'inventory_evaluation',
      totals: { products: 2, totalStock: 12, totalInventoryValue: 950, lowStockCount: 1 },
      rows: [
        { sku: 'ALU-RP-01', name: 'Report Aluminum', category: 'aluminum', stock: 5, unit: 'length', unitPrice: 50, inventoryValue: 250, threshold: 5, stockStatus: 'low_stock' },
        { sku: 'GLS-RP-01', name: 'Report Glass', category: 'glass', stock: 7, unit: 'sheet', unitPrice: 100, inventoryValue: 700, threshold: 5, stockStatus: 'healthy' },
      ],
    });
  });

  it('returns spending report summaries by material type and supplier', async () => {
    const res = await authedRequest(app, '/reports/spending?year=2026');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      report: 'spending',
      year: 2026,
      totals: { groups: 3, totalSpend: 1700 },
      rows: [
        { materialType: 'aluminum', supplier: 'Supplier A', totalSpend: 300, shareOfSpend: 17.65 },
        { materialType: 'glass', supplier: 'Supplier A', totalSpend: 1000, shareOfSpend: 58.82 },
        { materialType: 'glass', supplier: 'Supplier B', totalSpend: 400, shareOfSpend: 23.53 },
      ],
    });
  });
});
