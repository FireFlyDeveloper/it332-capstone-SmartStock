/**
 * Analytics tests — deterministic reporting metrics for SmartStock.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { _resetOrderStore, createOrder, listOrders } from '../orders/store.js';
import { _resetInventoryStore, createProduct, recordInboundStock, recordOutboundStock } from '../inventory/store.js';
import { analyticsRoutes } from './routes.js';
import {
  buildAnnualPurchaseSummary,
  buildDashboardOrderSummary,
  buildMonthlySalesTrend,
  buildDemandForecast,
  paginateDemandForecast,
  classifyMovement,
  simpleExponentialSmoothingForecast,
} from './analytics.js';

function buildApp() {
  const app = new Hono();
  app.route('/auth', authRoutes);
  app.route('/analytics', analyticsRoutes);
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
const ADMIN = 'analytics-admin' + AT + 'smartstock.local';
const STAFF = 'analytics-staff' + AT + 'smartstock.local';

function seedDeterministicOrders() {
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

  const febCancelled = createOrder({
    referenceNumber: 'SS-2026-02002',
    customerName: 'Cancelled Customer',
    customerPhone: '+639****2002',
    deliveryAddress: 'Cavite',
    deliveryDate: '2026-02-21',
    paidAmount: 999,
    items: [{ productId: 'ALU-2', name: 'Aluminum Cancelled', quantity: 1, unitPrice: 999 }],
  });
  febCancelled.createdAt = '2026-02-10T10:00:00.000Z';
  febCancelled.orderStatus = 'cancelled';
}

async function seedDeterministicInventory() {
  const glass = await createProduct({ sku: 'GLS-AN-01', name: 'Analytics Glass', category: 'glass', unit: 'sheet', stock: 0, price: 100, threshold: 5 });
  const aluminum = await createProduct({ sku: 'ALU-AN-01', name: 'Analytics Aluminum', category: 'aluminum', unit: 'length', stock: 0, price: 50, threshold: 5 });

  await recordInboundStock(glass.id, { quantity: 10, unitCost: 100, referenceNo: 'PO-AN-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  await recordInboundStock(glass.id, { quantity: 4, unitCost: 100, referenceNo: 'PO-AN-002', supplier: 'Supplier B', occurredAt: '2026-03-10T00:00:00.000Z' });
  await recordInboundStock(aluminum.id, { quantity: 6, unitCost: 50, referenceNo: 'PO-AN-003', supplier: 'Supplier A', occurredAt: '2026-01-12T00:00:00.000Z' });
  await recordOutboundStock(glass.id, { quantity: 7, referenceNo: 'SO-AN-001', occurredAt: '2026-02-01T00:00:00.000Z' });
  await recordOutboundStock(aluminum.id, { quantity: 2, referenceNo: 'SO-AN-002', occurredAt: '2026-02-03T00:00:00.000Z' });
}

describe('analytics pure functions', () => {
  it('groups monthly sales trend by UTC month with transaction counts and gross sales', () => {
    _resetOrderStore(false);
    seedDeterministicOrders();

    expect(buildMonthlySalesTrend(listOrders())).toEqual([
      { month: '2026-01', transactionCount: 1, grossSales: 200 },
      { month: '2026-02', transactionCount: 1, grossSales: 300 },
    ]);
  });

  it('builds compact Dashboard order metrics from backend orders', () => {
    _resetOrderStore(false);
    seedDeterministicOrders();

    expect(buildDashboardOrderSummary(listOrders(), [])).toEqual({
      activeOrderCount: 2,
      orderStatusCounts: [
        { status: 'cancelled', count: 1 },
        { status: 'processing', count: 2 },
      ],
      topItems: [
        { productId: 'ALU-1', name: 'Aluminum', category: null, unit: null, quantity: 3 },
        { productId: 'GLS-1', name: 'Glass', category: null, unit: null, quantity: 2 },
      ],
    });
  });

  it('zero-fills a selected calendar range and includes the current month', () => {
    _resetOrderStore(false);
    seedDeterministicOrders();
    const now = new Date('2026-03-15T12:00:00.000Z');

    expect(buildMonthlySalesTrend(listOrders(), '6M', now)).toEqual([
      { month: '2025-10', transactionCount: 0, grossSales: 0 },
      { month: '2025-11', transactionCount: 0, grossSales: 0 },
      { month: '2025-12', transactionCount: 0, grossSales: 0 },
      { month: '2026-01', transactionCount: 1, grossSales: 200 },
      { month: '2026-02', transactionCount: 1, grossSales: 300 },
      { month: '2026-03', transactionCount: 0, grossSales: 0 },
    ]);
    expect(buildMonthlySalesTrend(listOrders(), 'ALL', now)).toEqual([
      { month: '2026-01', transactionCount: 1, grossSales: 200 },
      { month: '2026-02', transactionCount: 1, grossSales: 300 },
      { month: '2026-03', transactionCount: 0, grossSales: 0 },
    ]);
  });

  it('groups annual purchases by material type and supplier with stable totals', () => {
    const products = [
      { id: 'glass-1', name: 'Glass', category: 'glass' as const, unit: 'sheet', stock: 0, price: 100, threshold: 5, status: 'active' as const, sku: 'G-1' },
      { id: 'alum-1', name: 'Aluminum', category: 'aluminum' as const, unit: 'length', stock: 0, price: 50, threshold: 5, status: 'active' as const, sku: 'A-1' },
    ];
    const movements = [
      { id: 'm1', productId: 'glass-1', type: 'inbound' as const, quantity: 10, unitCost: 100, referenceNo: 'PO-1', supplier: 'Supplier A', occurredAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm2', productId: 'glass-1', type: 'inbound' as const, quantity: 4, unitCost: 100, referenceNo: 'PO-2', supplier: 'Supplier B', occurredAt: '2026-02-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm3', productId: 'alum-1', type: 'inbound' as const, quantity: 6, unitCost: 50, referenceNo: 'PO-3', supplier: 'Supplier A', occurredAt: '2026-03-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm4', productId: 'glass-1', type: 'outbound' as const, quantity: 9, referenceNo: 'SO-1', occurredAt: '2026-03-01T00:00:00.000Z', createdBy: 'system' },
    ];

    expect(buildAnnualPurchaseSummary(movements, products, 2026)).toEqual([
      { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400, unpricedReceiptCount: 0, unpricedQuantity: 0 },
    ]);
  });

  it('reports receipt costs only when unit cost was recorded', () => {
    const products = [{ id: 'p', name: 'Item', category: 'glass' as const, unit: 'sheet', stock: 0, price: 999, threshold: 1, status: 'active' as const, sku: 'P' }];
    const rows = buildAnnualPurchaseSummary([{ id: 'u', productId: 'p', type: 'inbound', quantity: 3, referenceNo: 'PO-U', supplier: 'S', occurredAt: '2026-01-01T00:00:00.000Z', createdBy: 'test' }], products, 2026);
    expect(rows[0]).toMatchObject({ totalCost: 0, unpricedReceiptCount: 1, unpricedQuantity: 3 });
  });

  it('classifies monthly movement as fast or slow with deterministic threshold logic', () => {
    expect(classifyMovement([
      { month: '2026-01', quantity: 12 },
      { month: '2026-02', quantity: 8 },
    ], 10)).toEqual([
      { month: '2026-01', quantity: 12, classification: 'fast_moving' },
      { month: '2026-02', quantity: 8, classification: 'slow_moving' },
    ]);
  });

  it('builds UTC-complete-month demand, excludes non-delivered orders, and assesses current policy', () => {
    _resetOrderStore(false);
    const product = { id: 'P1', sku: 'S-1', name: 'Part', category: 'glass' as const, unit: 'sheet', stock: 4, price: 99, threshold: 5, status: 'active' as const };
    const makeSale = (referenceNumber: string, createdAt: string, orderStatus: 'delivered' | 'processing' | 'in_transit' | 'cancelled', quantity: number) => {
      const order = createOrder({ referenceNumber, customerName: 'Customer', customerPhone: '1', deliveryAddress: 'x', deliveryDate: createdAt.slice(0, 10), items: [{ productId: 'P1', name: 'Part', quantity, unitPrice: 1 }] });
      order.createdAt = createdAt;
      order.orderStatus = orderStatus;
    };
    makeSale('F-0', '2026-04-10T00:00:00.000Z', 'delivered', 2);
    makeSale('F-1', '2026-04-30T23:30:00-02:00', 'delivered', 2); // UTC May
    makeSale('F-2', '2026-05-10T00:00:00.000Z', 'delivered', 3);
    makeSale('F-3', '2026-06-10T00:00:00.000Z', 'delivered', 4);
    makeSale('F-4', '2026-06-12T00:00:00.000Z', 'cancelled', 20);
    makeSale('F-5', '2026-06-13T00:00:00.000Z', 'processing', 20);
    makeSale('F-6', '2026-06-14T00:00:00.000Z', 'in_transit', 20);
    const result = buildDemandForecast(listOrders(), [product], 3, new Date('2026-07-01T00:00:00.000Z'));
    const forecast = result.products[0];
    expect(forecast.history).toEqual([{ month: '2026-04', quantity: 2 }, { month: '2026-05', quantity: 5 }, { month: '2026-06', quantity: 4 }]);
    expect(forecast.forecastQuantity).toBe(3.23);
    expect(forecast.policyAssessment).toBe('below_reorder_point');
    expect(forecast.recommendedOrderQuantity).toBe(5);
  });

  it('leaves forecasts unknown when fewer than three positive months exist', () => {
    const product = { id: 'sparse', sku: 'S', name: 'Sparse', category: 'glass' as const, unit: 'sheet', stock: 1, price: 50, threshold: 2, status: 'active' as const };
    const result = buildDemandForecast([], [product], 12, new Date('2026-07-01T00:00:00.000Z'));
    expect(result.products[0]).toMatchObject({ positiveMonths: 0, forecastQuantity: null, status: 'insufficient_history', recommendedOrderQuantity: null, policyAssessment: 'insufficient_history' });
    expect(result.products[0].history).toHaveLength(12);
  });

  it('paginates only forecast rows with sufficient history using a stable name/id cursor', () => {
    const products = [
      { id: 'P2', sku: 'S-2', name: 'Alpha', category: 'glass' as const, unit: 'sheet', stock: 5, price: 10, threshold: 1, status: 'active' as const },
      { id: 'P1', sku: 'S-1', name: 'Alpha', category: 'glass' as const, unit: 'sheet', stock: 5, price: 10, threshold: 1, status: 'active' as const },
      { id: 'P3', sku: 'S-3', name: 'Zulu', category: 'glass' as const, unit: 'sheet', stock: 5, price: 10, threshold: 1, status: 'active' as const },
    ];
    const report = buildDemandForecast([], products, 3, new Date('2026-07-01T00:00:00.000Z'));
    const withAvailableRows = {
      ...report,
      products: report.products.map((product) => product.productId === 'P3'
        ? product
        : { ...product, forecastQuantity: 1, status: 'available' as const }),
    };

    const first = paginateDemandForecast(withAvailableRows, 1);
    expect(first.products.map((product) => product.productId)).toEqual(['P1']);
    expect(first.page).toMatchObject({ totalCount: 2, hasMore: true, nextCursor: { name: 'Alpha', productId: 'P1' } });
    const second = paginateDemandForecast(withAvailableRows, 1, first.page.nextCursor);
    expect(second.products.map((product) => product.productId)).toEqual(['P2']);
    expect(second.page).toMatchObject({ totalCount: 2, hasMore: false, nextCursor: null });
    expect(() => paginateDemandForecast(withAvailableRows, 0)).toThrow('limit must be an integer between 1 and 100');
  });

  it('forecasts the next quantity using simple exponential smoothing and validates alpha', () => {
    expect(simpleExponentialSmoothingForecast([10, 20, 30], 0.5)).toEqual({ alpha: 0.5, forecast: 22.5 });
    expect(simpleExponentialSmoothingForecast([10, 20, 30])).toEqual({ alpha: 0.3, forecast: 18.1 });
    expect(() => simpleExponentialSmoothingForecast([1, 2, 3], 0)).toThrow('alpha must be greater than 0 and less than or equal to 1');
  });
});

describe('analytics routes', () => {
  let app: Hono;

  beforeEach(async () => {
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    seedDeterministicOrders();
    await seedDeterministicInventory();
    app = buildApp();
    await seedUser(ADMIN, 'admin');
    await seedUser(STAFF, 'staff');
  });

  it('blocks anonymous access and lets authenticated staff read analytics', async () => {
    const anonymous = await app.request('/analytics/sales-trends');
    expect(anonymous.status).toBe(401);

    const token = await login(app, STAFF);
    const staff = await app.request('/analytics/sales-trends', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(staff.status).toBe(200);
  });

  it('serves compact order summary metrics from the authenticated analytics endpoint', async () => {
    const anonymous = await app.request('/analytics/dashboard-order-summary');
    expect(anonymous.status).toBe(401);

    const token = await login(app, STAFF);
    const res = await app.request('/analytics/dashboard-order-summary', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      activeOrderCount: 2,
      orderStatusCounts: [
        { status: 'cancelled', count: 1 },
        { status: 'processing', count: 2 },
      ],
      topItems: [
        { productId: 'ALU-1', quantity: 3 },
        { productId: 'GLS-1', quantity: 2 },
      ],
    });
  });

  it('returns deterministic sales trends from in-memory orders', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/sales-trends', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { month: '2026-01', transactionCount: 1, grossSales: 200 },
      { month: '2026-02', transactionCount: 1, grossSales: 300 },
    ]);
  });

  it('serves recent activity from real order and stock-movement records', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/recent-activity?limit=20', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    const records = await res.json() as Array<{
      kind: string; occurredAt: string; referenceNumber: string; customerName?: string;
    }>;
    expect(records).toHaveLength(8);
    expect(records[0].referenceNumber).toBe('PO-AN-002');
    expect(records.some((record) => record.kind === 'order_recorded' && record.referenceNumber === 'SS-2026-01001')).toBe(true);
    expect(records.some((record) => record.kind === 'stock_movement' && record.referenceNumber === 'PO-AN-001')).toBe(true);
    expect(records.every((record) => Number.isFinite(Date.parse(record.occurredAt)))).toBe(true);
    expect(records.some((record) => record.customerName === 'John Construction')).toBe(false);
    expect((await app.request('/analytics/recent-activity?limit=0', {
      headers: { authorization: 'Bearer ' + token },
    })).status).toBe(400);
  });

  it('validates sales-trend range filters', async () => {
    const token = await login(app, STAFF);
    const invalid = await app.request('/analytics/sales-trends?range=5Y', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(invalid.status).toBe(400);
    const valid = await app.request('/analytics/sales-trends?range=6M', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(valid.status).toBe(200);
    expect(await valid.json()).toHaveLength(6);
  });

  it('returns annual purchase totals grouped by material and supplier', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/purchases?year=2026', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400, unpricedReceiptCount: 0, unpricedQuantity: 0 },
    ]);
  });

  it('returns cursor-paginated annual purchase groups with full-year totals', async () => {
    const token = await login(app, STAFF);
    const first = await app.request('/analytics/purchases/page?year=2026&limit=2', { headers: { authorization: 'Bearer ' + token } });
    expect(first.status).toBe(200);
    const firstPage = await first.json() as { year: number; groups: Array<{ materialType: string; supplier: string }>; totalSpend: number; pricedReceiptCount: number; page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null } };
    expect(firstPage).toMatchObject({ year: 2026, totalSpend: 1700, pricedReceiptCount: 3 });
    expect(firstPage.page).toMatchObject({ limit: 2, totalCount: 3, hasMore: true });
    expect(firstPage.groups.map(({ materialType, supplier }) => [materialType, supplier])).toEqual([
      ['aluminum', 'Supplier A'], ['glass', 'Supplier A'],
    ]);
    expect(firstPage.page.nextCursor).toEqual(expect.any(String));

    const second = await app.request(`/analytics/purchases/page?year=2026&limit=2&cursor=${encodeURIComponent(firstPage.page.nextCursor!)}`, { headers: { authorization: 'Bearer ' + token } });
    expect(second.status).toBe(200);
    const secondPage = await second.json() as typeof firstPage;
    expect(secondPage.page).toMatchObject({ limit: 2, totalCount: 3, hasMore: false, nextCursor: null });
    expect(secondPage.groups.map(({ materialType, supplier }) => [materialType, supplier])).toEqual([['glass', 'Supplier B']]);

    expect((await app.request('/analytics/purchases/page?limit=101', { headers: { authorization: 'Bearer ' + token } })).status).toBe(400);
    expect((await app.request('/analytics/purchases/page?cursor=invalid!', { headers: { authorization: 'Bearer ' + token } })).status).toBe(400);
  });

  it('returns stable fast and slow movement classification', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/movement?threshold=5', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { month: '2026-02', quantity: 9, classification: 'fast_moving' },
    ]);
  });

  it('returns authenticated demand forecasts with complete response metadata', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/demand-forecast?historyMonths=3', { headers: { authorization: 'Bearer ' + token } });
    expect(res.status).toBe(200);
    const body = await res.json() as { method: string; historyMonths: number; products: Array<{ history: unknown[]; status: string }> };
    expect(body).toMatchObject({ method: 'simple_exponential_smoothing', alpha: 0.3, horizonMonths: 1, minimumPositiveMonths: 3, historyMonths: 3 });
    expect(body.products.every((product) => product.history.length === 3)).toBe(true);

    const paged = await app.request('/analytics/demand-forecast/page?historyMonths=3&limit=1', { headers: { authorization: 'Bearer ' + token } });
    expect(paged.status).toBe(200);
    const pagedBody = await paged.json() as { products: Array<{ forecastQuantity: number | null }>; page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null } };
    expect(pagedBody.page.limit).toBe(1);
    expect(pagedBody.products.every((product) => product.forecastQuantity !== null)).toBe(true);
    expect((await app.request('/analytics/demand-forecast/page?limit=0', { headers: { authorization: 'Bearer ' + token } })).status).toBe(400);
    expect((await app.request('/analytics/demand-forecast/page?cursor=not-a-cursor', { headers: { authorization: 'Bearer ' + token } })).status).toBe(400);
    expect((await app.request('/analytics/demand-forecast?historyMonths=61', { headers: { authorization: 'Bearer ' + token } })).status).toBe(400);
  });

  it('returns SES forecast for a known series', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/forecast', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantities: [10, 20, 30], alpha: 0.5 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ alpha: 0.5, forecast: 22.5 });
  });
});

