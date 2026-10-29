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
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { _resetInventoryStore, createProduct, recordInboundStock, recordOutboundStock, updateProduct, listInventoryPolicyHistory, hydrateInventoryPolicyHistory, resetInventoryPolicyHistory } from '../inventory/store.js';
import { buildPolicyPerformanceReport } from './service.js';
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

async function seedReportInventory() {
  const aluminum = await createProduct({ sku: 'ALU-RP-01', name: 'Report Aluminum', category: 'aluminum', unit: 'length', stock: 1, price: 50, threshold: 5 });
  const glass = await createProduct({ sku: 'GLS-RP-01', name: 'Report Glass', category: 'glass', unit: 'sheet', stock: 0, price: 100, threshold: 5 });

  recordInboundStock(glass.id, { quantity: 10, unitCost: 100, referenceNo: 'PO-RP-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  recordInboundStock(glass.id, { quantity: 4, unitCost: 100, referenceNo: 'PO-RP-002', supplier: 'Supplier B', occurredAt: '2026-03-10T00:00:00.000Z' });
  recordInboundStock(aluminum.id, { quantity: 6, unitCost: 50, referenceNo: 'PO-RP-003', supplier: 'Supplier A', occurredAt: '2026-01-12T00:00:00.000Z' });
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
    await seedReportInventory();
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
      totals: { groups: 3, transactionCount: 3, totalQuantity: 20, totalCost: 1700, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      rows: [
        { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400, unpricedReceiptCount: 0, unpricedQuantity: 0 },
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
      totals: { groups: 3, totalSpend: 1700, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      rows: [
        { materialType: 'aluminum', supplier: 'Supplier A', totalSpend: 300, shareOfSpend: 17.65, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier A', totalSpend: 1000, shareOfSpend: 58.82, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier B', totalSpend: 400, shareOfSpend: 23.53, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      ],
    });
  });

  it('exports a forecast/current-policy report as PDF and XLSX for admins', async () => {
    const pdf = await authedRequest(app, '/reports/export?type=forecast&format=pdf', ADMIN);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('content-disposition')).toBe('attachment; filename="smartstock-forecast-report.pdf"');
    const pdfBytes = Buffer.from(await pdf.arrayBuffer());
    expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');

    const xlsx = await authedRequest(app, '/reports/export?type=forecast&format=xlsx', ADMIN);
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers.get('content-disposition')).toBe('attachment; filename="smartstock-forecast-report.xlsx"');
    expect(Buffer.from(await xlsx.arrayBuffer()).subarray(0, 2).toString()).toBe('PK');
  });

  it('exports PDF reports for admin with download headers and a PDF signature', async () => {
    const res = await authedRequest(app, '/reports/export?type=sales&format=pdf', ADMIN);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="smartstock-sales-report.pdf"');

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(100);
    expect(Buffer.from(bytes.subarray(0, 4)).toString('utf8')).toBe('%PDF');
  });

  it('exports XLSX reports for admin with download headers and a non-empty workbook', async () => {
    const res = await authedRequest(app, '/reports/export?type=inventory&format=xlsx', ADMIN);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="smartstock-inventory-report.xlsx"');

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(100);
    expect(Buffer.from(bytes.subarray(0, 2)).toString('utf8')).toBe('PK');
  });

  it('records baseline and observed stock/reorder-point transitions in memory mode', async () => {
    const product = await createProduct({ sku: 'POLICY-EVENT', name: 'Policy Event', category: 'glass', unit: 'sheet', stock: 4, price: 10, threshold: 2 });
    const baseline = listInventoryPolicyHistory().find((event) => event.productId === product.id);
    expect(baseline?.eventType).toBe('baseline');
    recordInboundStock(product.id, { quantity: 1, referenceNo: 'POLICY-IN' });
    recordOutboundStock(product.id, { quantity: 5, referenceNo: 'POLICY-OUT' });
    updateProduct(product.id, { threshold: 3 });
    updateProduct(product.id, { stock: 1, threshold: 2 });
    const changed = listInventoryPolicyHistory().filter((event) => event.productId === product.id);
    expect(changed.map((event) => event.eventType)).toEqual([
      'baseline', 'stock_changed', 'stock_changed', 'threshold_changed', 'stock_and_threshold_changed',
    ]);
  });

  it('reports time-weighted stock, threshold changes and stockout intervals from snapshots', async () => {
    const product = await createProduct({ sku: 'POLICY-REPORT', name: 'Policy Report', category: 'glass', unit: 'sheet', stock: 4, price: 10, threshold: 2 });
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    hydrateInventoryPolicyHistory([
      { id: 1, productId: product.id, recordedAt: new Date(start).toISOString(), eventType: 'baseline', stockBefore: null, stockAfter: 2, thresholdBefore: null, thresholdAfter: 2 },
      { id: 2, productId: product.id, recordedAt: new Date(start + 86400000).toISOString(), eventType: 'stock_and_threshold_changed', stockBefore: 2, stockAfter: 0, thresholdBefore: 2, thresholdAfter: 3 },
      { id: 3, productId: product.id, recordedAt: new Date(start + 2 * 86400000).toISOString(), eventType: 'stock_and_threshold_changed', stockBefore: 0, stockAfter: 4, thresholdBefore: 3, thresholdAfter: 1 },
    ]);
    const report = await buildPolicyPerformanceReport(new Date(start + 3 * 86400000));
    const row = report.rows.find((item) => item.productId === product.id)!;
    expect(row.trackingDays).toBe(3);
    expect(row.timeWeightedAverageOnHand).toBe(2);
    expect(row.daysAtOrBelowReorderPoint).toBe(2);
    expect(row.percentTimeAtOrBelowReorderPoint).toBe(66.6667);
    expect(row.outOfStockDays).toBe(1);
    expect(row.reorderPointChanges).toBe(2);
    expect(report.assumption).toContain('does not infer causal effects');
  });

  it('keeps the migration additive, idempotent and forward-only', () => {
    const sql = readFileSync(resolve(process.cwd(), '../db/migrations/20261029_inventory_policy_history.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS inventory_policy_history');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION record_inventory_policy_history()');
    expect(sql).toContain('DROP TRIGGER IF EXISTS products_inventory_policy_history');
    expect(sql).toContain('AFTER INSERT OR UPDATE OF stock, threshold ON products');
    expect(sql).toContain('WHERE NOT EXISTS');
    expect(sql).toContain('IS DISTINCT FROM');
    expect(sql).toContain('no pre-activation history');
  });

  it('returns no fabricated duration for empty history and requires authentication', async () => {
    resetInventoryPolicyHistory();
    const product = await createProduct({ sku: 'POLICY-EMPTY', name: 'Policy Empty', category: 'glass', unit: 'sheet', stock: 0, price: 10, threshold: 3 });
    resetInventoryPolicyHistory();
    const anon = await app.request('/reports/policy-performance');
    expect(anon.status).toBe(401);
    const response = await authedRequest(app, '/reports/policy-performance');
    expect(response.status).toBe(200);
    const report = await response.json() as { trackingStart: string | null; rows: Array<Record<string, unknown>> };
    const row = report.rows.find((item) => item.productId === product.id)!;
    expect(report.trackingStart).toBeNull();
    expect(report).toMatchObject({
      method: expect.any(String),
      assumption: expect.stringContaining('No pre-activation history'),
      totals: {
        products: expect.any(Number),
        productsWithHistory: expect.any(Number),
        trackingDays: 0,
        outOfStockProductCount: expect.any(Number),
        reorderPointChanges: expect.any(Number),
      },
    });
    expect(row).toMatchObject({
      unit: 'sheet',
      currentStock: 0,
      currentReorderPoint: 3,
      trackingStartedAt: null,
      trackingDays: 0,
      timeWeightedAverageOnHand: null,
      daysAtOrBelowReorderPoint: 0,
      percentTimeAtOrBelowReorderPoint: null,
      outOfStockDays: 0,
      status: 'at_or_below_reorder_point',
    });
  });

  it('exports observed policy performance as PDF/XLSX only for admins', async () => {
    const staff = await authedRequest(app, '/reports/export?type=policy-performance&format=pdf', STAFF);
    expect(staff.status).toBe(403);
    const pdf = await authedRequest(app, '/reports/export?type=policy-performance&format=pdf', ADMIN);
    expect(pdf.status).toBe(200);
    expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString()).toBe('%PDF');
    const xlsx = await authedRequest(app, '/reports/export?type=policy-performance&format=xlsx', ADMIN);
    expect(xlsx.status).toBe(200);
    expect(Buffer.from(await xlsx.arrayBuffer()).subarray(0, 2).toString()).toBe('PK');
  });
});
