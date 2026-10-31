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
  buildAnalyticsOrderSummary,
  buildInsightProductRankings,
  buildDeliveryDateMonthlySeries,
  buildYtdInboundPurchaseSummary,
  buildDashboardOrderSummary,
  buildMonthlySalesTrend,
  buildMonthlyStockMovementByUnit,
  buildDemandForecast,
  paginateDemandForecast,
  classifyMovement,
  buildMonthlyItemMovementClassification,
  paginateMonthlyItemMovement,
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

  it('builds a capped delivery-date monthly series with omitted-window metadata and cancelled-inclusive counts', () => {
    const products = [
      { id: 'a', name: 'A', category: 'glass' as const, unit: 'sheet', stock: 4, price: 20, threshold: 5, status: 'active' as const, sku: 'A-1' },
      { id: 'b', name: 'B', category: 'aluminum' as const, unit: 'length', stock: 8, price: 30, threshold: 5, status: 'active' as const, sku: 'B-1' },
    ];
    const result = buildDeliveryDateMonthlySeries([
      ...Array.from({ length: 14 }, (_, index) => ({ deliveryDate: new Date(Date.UTC(2025, index, 15)).toISOString().slice(0, 10), orderStatus: index === 13 ? 'cancelled' as const : 'delivered' as const, total: 100, items: [] })),
    ] as unknown as Parameters<typeof buildDeliveryDateMonthlySeries>[0], '2025-01-01', '2026-12-31');
    expect(result.months).toHaveLength(12);
    expect(result).toMatchObject({ omittedMonthCount: 12, omittedBefore: '2025-01', omittedAfter: null });
    expect(result.months.at(-1)).toMatchObject({ month: '2026-12', orderCount: 0, grossSales: 0 });
  });

  it('zero-fills selected delivery months with no orders', () => {
    const result = buildDeliveryDateMonthlySeries([
      { deliveryDate: '2026-02-10', orderStatus: 'delivered', total: 42, items: [] },
    ] as unknown as Parameters<typeof buildDeliveryDateMonthlySeries>[0], '2026-01-10', '2026-03-31', new Date('2026-03-31T12:00:00.000Z'));
    expect(result.months).toEqual([
      { month: '2026-01', orderCount: 0, grossSales: 0 },
      { month: '2026-02', orderCount: 1, grossSales: 42 },
      { month: '2026-03', orderCount: 0, grossSales: 0 },
    ]);
    expect(result.omittedMonthCount).toBe(0);
  });

  it('groups AI product rankings by unit, bounds groups/items, reports omitted units, and never ranks units by incomparable quantities', () => {
    const products = Array.from({ length: 36 }, (_, index) => ({
      id: `product-${index}`, name: `Item ${index}`, sku: `SKU-${index}`, category: 'glass' as const,
      unit: `unit-${Math.floor(index / 6)}`, stock: 10, price: 10, threshold: 5, status: 'active' as const,
    }));
    const orders = products.map((product, index) => ({
      deliveryDate: '2026-03-01', orderStatus: 'delivered' as const,
      items: [{ productId: product.id, name: product.name, quantity: (index + 1) * (index < 6 ? 100 : 1) }],
    }));
    const result = buildInsightProductRankings(orders as unknown as Parameters<typeof buildInsightProductRankings>[0], products);
    const ranked = result.allTime;
    expect(ranked.map((group) => group.unit)).toEqual(['unit-0', 'unit-1', 'unit-2', 'unit-3', 'unit-4']);
    expect(result.omittedUnitGroups).toEqual({ allTime: 1, allTimeFewest: 1, selectedRange: 1 });
    expect(ranked).toHaveLength(5);
    expect(ranked.every((group) => group.items.length <= 5)).toBe(true);
    expect(JSON.stringify(ranked)).not.toMatch(/product-|SKU-/);
    expect(ranked.find((group) => group.unit === 'unit-4')?.items[0]).toMatchObject({ name: 'Item 29', quantity: 30 });
  });

  it('aggregates current UTC YTD inbound purchases by category and category-unit with cost coverage', () => {
    const products = [
      { id: 'g', name: 'Glass', category: 'glass' as const, unit: 'sheet', stock: 0, price: 10, threshold: 5, status: 'active' as const, sku: 'G' },
      { id: 'a', name: 'Aluminum', category: 'aluminum' as const, unit: 'length', stock: 0, price: 20, threshold: 5, status: 'active' as const, sku: 'A' },
    ];
    const movements = [
      { id: 'm1', productId: 'g', type: 'inbound' as const, quantity: 2, unitCost: 10, occurredAt: '2026-01-01T00:00:00Z' },
      { id: 'm2', productId: 'g', type: 'inbound' as const, quantity: 3, occurredAt: '2026-05-01T00:00:00Z' },
      { id: 'm-now-plus-one-ms', productId: 'g', type: 'inbound' as const, quantity: 99, unitCost: 10, occurredAt: '2026-06-01T00:00:00.001Z' },
      { id: 'm3', productId: 'a', type: 'inbound' as const, quantity: 1, unitCost: 50, occurredAt: '2025-12-31T23:59:59Z' },
    ];
    expect(buildYtdInboundPurchaseSummary(movements as unknown as Parameters<typeof buildYtdInboundPurchaseSummary>[0], products, new Date('2026-06-01T00:00:00Z'))).toEqual({
      year: 2026,
      categories: [{ category: 'glass', transactionCount: 2, totalQuantity: 5, totalCost: 20, pricedReceipts: 1, unpricedReceipts: 1, pricedQuantity: 2, unpricedQuantity: 3 }],
      categoryUnits: [{ category: 'glass', unit: 'sheet', transactionCount: 2, totalQuantity: 5, totalCost: 20, pricedReceipts: 1, unpricedReceipts: 1, pricedQuantity: 2, unpricedQuantity: 3 }],
    });
  });

  it('builds compact Analytics order metrics and honors delivery-date filters', () => {
    _resetOrderStore(false);
    seedDeterministicOrders();

    const all = buildAnalyticsOrderSummary(listOrders(), []);
    expect(all).toMatchObject({
      totalOrderCount: 3,
      averageOrderValue: 250,
      topSellingItems: [
        { productId: 'ALU-1', name: 'Aluminum', quantity: 3, category: 'Unclassified' },
        { productId: 'GLS-1', name: 'Glass', quantity: 2, category: 'Unclassified' },
      ],
      orderedQuantities: { 'ALU-1': 3, 'GLS-1': 2 },
      salesTrendData: [{ sales: 200, orders: 1 }, { sales: 300, orders: 2 }],
      mostOrderedItems: [],
      leastOrderedItems: [],
    });

    expect(buildAnalyticsOrderSummary(listOrders(), [], '2026-01-20', '2026-01-20')).toMatchObject({
      totalOrderCount: 1,
      averageOrderValue: 200,
      salesTrendData: [{ sales: 200, orders: 1 }],
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

  it('classifies monthly movement by product, includes zero-activity items, and ignores inbound receipts', () => {
    const products = [
      { id: 'P1', sku: 'S-1', name: 'Glass', category: 'glass' as const, unit: 'sheet', stock: 10, price: 100, threshold: 2, status: 'active' as const },
      { id: 'P2', sku: 'S-2', name: 'Aluminum', category: 'aluminum' as const, unit: 'length', stock: 10, price: 100, threshold: 2, status: 'active' as const },
      { id: 'P3', sku: 'S-3', name: 'Unused', category: 'glass' as const, unit: 'sheet', stock: 10, price: 100, threshold: 2, status: 'discontinued' as const },
    ];
    const movements = [
      { id: 'M1', productId: 'P1', type: 'outbound' as const, quantity: 6, referenceNo: 'SO-1', occurredAt: '2026-03-01T00:30:00+02:00', createdBy: 'test' },
      { id: 'M2', productId: 'P1', type: 'outbound' as const, quantity: 1, referenceNo: 'SO-2', occurredAt: '2026-02-10T00:00:00.000Z', createdBy: 'test' },
      { id: 'M3', productId: 'P1', type: 'inbound' as const, quantity: 99, referenceNo: 'PO-1', occurredAt: '2026-02-11T00:00:00.000Z', createdBy: 'test' },
      { id: 'M4', productId: 'P2', type: 'outbound' as const, quantity: 4, referenceNo: 'SO-3', occurredAt: '2026-03-01T00:00:00.000Z', createdBy: 'test' },
    ];

    expect(buildMonthlyItemMovementClassification(movements, products, '2026-02', 5)).toEqual([
      { month: '2026-02', productId: 'P2', name: 'Aluminum', sku: 'S-2', category: 'aluminum', unit: 'length', status: 'active', quantity: 0, threshold: 5, classification: 'slow_moving' },
      { month: '2026-02', productId: 'P1', name: 'Glass', sku: 'S-1', category: 'glass', unit: 'sheet', status: 'active', quantity: 7, threshold: 5, classification: 'fast_moving' },
      { month: '2026-02', productId: 'P3', name: 'Unused', sku: 'S-3', category: 'glass', unit: 'sheet', status: 'discontinued', quantity: 0, threshold: 5, classification: 'slow_moving' },
    ]);
  });

  it('groups monthly inbound and outbound stock movement by product unit', () => {
    const products = [
      { id: 'pcs', sku: 'P1', name: 'Piece', category: 'aluminum' as const, unit: 'pcs', stock: 2, price: 1, threshold: 1, status: 'active' as const },
      { id: 'sqm', sku: 'P2', name: 'Glass', category: 'glass' as const, unit: 'sqm', stock: 2, price: 1, threshold: 1, status: 'active' as const },
    ];
    const movements = [
      { id: 'before', productId: 'pcs', type: 'outbound' as const, quantity: 99, referenceNo: 'SO-BEFORE', occurredAt: '2025-12-31T23:59:59.999Z', createdBy: 'test' },
      { id: 'in-pcs', productId: 'pcs', type: 'inbound' as const, quantity: 10, referenceNo: 'PO-PCS', occurredAt: '2026-01-15T12:00:00.000Z', createdBy: 'test' },
      { id: 'out-pcs', productId: 'pcs', type: 'outbound' as const, quantity: 3, referenceNo: 'SO-PCS', occurredAt: '2026-02-15T12:00:00.000Z', createdBy: 'test' },
      { id: 'in-sqm', productId: 'sqm', type: 'inbound' as const, quantity: 5, referenceNo: 'PO-SQM', occurredAt: '2026-02-20T12:00:00.000Z', createdBy: 'test' },
      { id: 'out-sqm', productId: 'sqm', type: 'outbound' as const, quantity: 7, referenceNo: 'SO-SQM', occurredAt: '2026-02-21T12:00:00.000Z', createdBy: 'test' },
      { id: 'after', productId: 'pcs', type: 'inbound' as const, quantity: 99, referenceNo: 'PO-AFTER', occurredAt: '2026-04-01T00:00:00.000Z', createdBy: 'test' },
    ];

    expect(buildMonthlyStockMovementByUnit(movements, products, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-04-01T00:00:00.000Z'))).toEqual({
      period: { startMonth: '2026-01', endMonth: '2026-03', months: 3 },
      months: ['2026-01', '2026-02', '2026-03'],
      units: ['pcs', 'sqm'],
      rows: [
        { month: '2026-01', unit: 'pcs', inboundQuantity: 10, outboundQuantity: 0, inboundMovementCount: 1, outboundMovementCount: 0 },
        { month: '2026-01', unit: 'sqm', inboundQuantity: 0, outboundQuantity: 0, inboundMovementCount: 0, outboundMovementCount: 0 },
        { month: '2026-02', unit: 'pcs', inboundQuantity: 0, outboundQuantity: 3, inboundMovementCount: 0, outboundMovementCount: 1 },
        { month: '2026-02', unit: 'sqm', inboundQuantity: 5, outboundQuantity: 7, inboundMovementCount: 1, outboundMovementCount: 1 },
        { month: '2026-03', unit: 'pcs', inboundQuantity: 0, outboundQuantity: 0, inboundMovementCount: 0, outboundMovementCount: 0 },
        { month: '2026-03', unit: 'sqm', inboundQuantity: 0, outboundQuantity: 0, inboundMovementCount: 0, outboundMovementCount: 0 },
      ],
    });
  });

  it('clips a current-month movement window at now and excludes future-dated movement rows', () => {
    const now = new Date('2026-02-15T12:00:00.000Z');
    const startAt = new Date('2026-01-01T00:00:00.000Z');
    const endAt = new Date(now.getTime() + 2);
    const products = [{ id: 'P', sku: 'S', name: 'Piece', category: 'aluminum' as const, unit: 'pcs', stock: 1, price: 1, threshold: 1, status: 'active' as const }];
    const movements = [
      { id: 'jan', productId: 'P', type: 'inbound' as const, quantity: 1, referenceNo: 'PO-1', occurredAt: '2026-01-15T00:00:00.000Z', createdBy: 'test' },
      { id: 'now', productId: 'P', type: 'outbound' as const, quantity: 2, referenceNo: 'SO-1', occurredAt: now.toISOString(), createdBy: 'test' },
      { id: 'future', productId: 'P', type: 'outbound' as const, quantity: 99, referenceNo: 'SO-2', occurredAt: '2026-02-15T12:00:00.001Z', createdBy: 'test' },
    ];
    const report = buildMonthlyStockMovementByUnit(movements, products, startAt, endAt, now);
    expect(report.period).toEqual({ startMonth: '2026-01', endMonth: '2026-02', months: 2 });
    expect(report.rows).toEqual([
      { month: '2026-01', unit: 'pcs', inboundQuantity: 1, outboundQuantity: 0, inboundMovementCount: 1, outboundMovementCount: 0 },
      { month: '2026-02', unit: 'pcs', inboundQuantity: 0, outboundQuantity: 2, inboundMovementCount: 0, outboundMovementCount: 1 },
    ]);
  });

  it('paginates monthly product movement with full-set classification totals', () => {
    const rows = [
      { month: '2026-02', productId: 'P1', name: 'Alpha', sku: 'A', category: 'glass' as const, unit: 'sheet', status: 'active' as const, quantity: 8, threshold: 5, classification: 'fast_moving' as const },
      { month: '2026-02', productId: 'P2', name: 'Beta', sku: 'B', category: 'aluminum' as const, unit: 'length', status: 'active' as const, quantity: 0, threshold: 5, classification: 'slow_moving' as const },
      { month: '2026-02', productId: 'P3', name: 'Gamma', sku: 'C', category: 'glass' as const, unit: 'sheet', status: 'active' as const, quantity: 2, threshold: 5, classification: 'slow_moving' as const },
    ];
    const first = paginateMonthlyItemMovement(rows, 2, null);
    expect(first.rows.map((row) => row.productId)).toEqual(['P1', 'P2']);
    expect(first.summary).toEqual({ productCount: 3, fastMovingCount: 1, slowMovingCount: 2, outboundByUnit: [{ unit: 'sheet', quantity: 10 }] });
    expect(first.page).toMatchObject({ totalCount: 3, hasMore: true, nextCursor: { name: 'Beta', productId: 'P2' } });
    const second = paginateMonthlyItemMovement(rows, 2, first.page.nextCursor);
    expect(second.rows.map((row) => row.productId)).toEqual(['P3']);
    expect(second.page).toMatchObject({ totalCount: 3, hasMore: false, nextCursor: null });
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

  it('restricts Analytics page endpoints to admins while preserving staff Dashboard access', async () => {
    expect((await app.request('/analytics/orders/summary')).status).toBe(401);

    const staffToken = await login(app, STAFF);
    const staffHeaders = { authorization: 'Bearer ' + staffToken };
    const adminToken = await login(app, ADMIN);
    const adminOnlyEndpoints: Array<{ path: string; method?: string }> = [
      { path: '/analytics/orders/summary' },
      { path: '/analytics/demand-forecast/page' },
      { path: '/analytics/demand-forecast' },
      { path: '/analytics/purchases/page' },
      { path: '/analytics/purchases' },
      { path: '/analytics/movement' },
      { path: '/analytics/movement/monthly' },
      { path: '/analytics/movement/items' },
      { path: '/analytics/insights' },
      { path: '/analytics/forecast', method: 'POST' },
    ];
    for (const endpoint of adminOnlyEndpoints) {
      const response = await app.request(endpoint.path, { method: endpoint.method, headers: staffHeaders });
      expect(response.status, `${endpoint.method ?? 'GET'} ${endpoint.path}`).toBe(403);
    }

    const admin = await app.request('/analytics/orders/summary', {
      headers: { authorization: 'Bearer ' + adminToken },
    });
    expect(admin.status).toBe(200);

    const dashboardEndpoints = ['/analytics/dashboard-order-summary', '/analytics/sales-trends', '/analytics/recent-activity'];
    for (const path of dashboardEndpoints) {
      const response = await app.request(path, { headers: staffHeaders });
      expect(response.status, `staff Dashboard GET ${path}`).toBe(200);
    }
  });

  it('serves compact, date-filtered Analytics metrics from the authenticated endpoint', async () => {
    const anonymous = await app.request('/analytics/orders/summary');
    expect(anonymous.status).toBe(401);

    const token = await login(app, ADMIN);
    const headers = { authorization: 'Bearer ' + token };
    const res = await app.request('/analytics/orders/summary?fromDate=2026-01-20&toDate=2026-01-20', { headers });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      totalOrderCount: 1,
      averageOrderValue: 200,
      orderedQuantities: { 'GLS-1': 2 },
      salesTrendData: [{ sales: 200, orders: 1 }],
    });

    expect((await app.request('/analytics/orders/summary?fromDate=2026-02-31', { headers })).status).toBe(400);
    expect((await app.request('/analytics/orders/summary?fromDate=2026-02-20&toDate=2026-01-20', { headers })).status).toBe(400);
  });

  it('serves compact order summary metrics from the authenticated analytics endpoint', async () => {
    const anonymous = await app.request('/analytics/dashboard-order-summary');
    expect(anonymous.status).toBe(401);

    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
    const res = await app.request('/analytics/movement?threshold=5', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { month: '2026-02', quantity: 9, classification: 'fast_moving' },
    ]);
  });

  it('returns monthly inflows and outflows from stock movements grouped by unit', async () => {
    expect((await app.request('/analytics/movement/monthly?months=60')).status).toBe(401);
    const token = await login(app, ADMIN);
    const headers = { authorization: 'Bearer ' + token };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const response = await app.request('/analytics/movement/monthly?months=60', { headers });
    expect(response.status).toBe(200);
    const body = await response.json() as {
      period: { startMonth: string; endMonth: string; months: number };
      months: string[];
      units: string[];
      rows: Array<{ month: string; unit: string; inboundQuantity: number; outboundQuantity: number }>;
    };
    expect(body.period.months).toBe(60);
    expect(body.period.endMonth).toBe(currentMonth);
    expect(body.months).toHaveLength(60);
    expect(body.units).toEqual(['length', 'sheet']);
    expect(body.rows.find((row) => row.month === '2026-01' && row.unit === 'length'))
      .toMatchObject({ inboundQuantity: 6, outboundQuantity: 0 });
    expect(body.rows.find((row) => row.month === '2026-02' && row.unit === 'length'))
      .toMatchObject({ inboundQuantity: 0, outboundQuantity: 2 });
    expect(body.rows.find((row) => row.month === '2026-01' && row.unit === 'sheet'))
      .toMatchObject({ inboundQuantity: 10, outboundQuantity: 0 });
    expect(body.rows.find((row) => row.month === '2026-02' && row.unit === 'sheet'))
      .toMatchObject({ inboundQuantity: 0, outboundQuantity: 7 });
    expect((await app.request('/analytics/movement/monthly?months=0', { headers })).status).toBe(400);
    expect((await app.request('/analytics/movement/monthly?months=61', { headers })).status).toBe(400);
  });

  it('returns paginated per-product movement classification for a selected month', async () => {
    const token = await login(app, ADMIN);
    const headers = { authorization: 'Bearer ' + token };
    const first = await app.request('/analytics/movement/items?month=2026-02&threshold=5&limit=1', { headers });
    expect(first.status).toBe(200);
    const firstPage = await first.json() as {
      rows: Array<{ name: string; productId: string; quantity: number; classification: string }>;
      summary: { productCount: number; fastMovingCount: number; slowMovingCount: number; outboundByUnit: Array<{ unit: string; quantity: number }> };
      page: { totalCount: number; hasMore: boolean; nextCursor: string | null };
    };
    expect(firstPage.rows).toMatchObject([{ name: 'Analytics Aluminum', quantity: 2, classification: 'slow_moving' }]);
    expect(firstPage.summary).toEqual({ productCount: 2, fastMovingCount: 1, slowMovingCount: 1, outboundByUnit: [{ unit: 'length', quantity: 2 }, { unit: 'sheet', quantity: 7 }] });
    expect(firstPage.page).toMatchObject({ totalCount: 2, hasMore: true });
    expect(firstPage.page.nextCursor).toEqual(expect.any(String));

    const second = await app.request(`/analytics/movement/items?month=2026-02&threshold=5&limit=1&cursor=${encodeURIComponent(firstPage.page.nextCursor!)}`, { headers });
    expect(second.status).toBe(200);
    const secondPage = await second.json() as typeof firstPage;
    expect(secondPage.rows).toMatchObject([{ name: 'Analytics Glass', quantity: 7, classification: 'fast_moving' }]);
    expect(secondPage.summary).toEqual(firstPage.summary);
    expect(secondPage.page).toMatchObject({ totalCount: 2, hasMore: false, nextCursor: null });

    expect((await app.request('/analytics/movement/items?month=2026-13', { headers })).status).toBe(400);
    expect((await app.request('/analytics/movement/items?threshold=-1', { headers })).status).toBe(400);
    expect((await app.request('/analytics/movement/items?limit=101', { headers })).status).toBe(400);
    expect((await app.request('/analytics/movement/items?cursor=invalid!', { headers })).status).toBe(400);
  });

  it('returns authenticated demand forecasts with complete response metadata', async () => {
    const token = await login(app, ADMIN);
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
    const token = await login(app, ADMIN);
    const res = await app.request('/analytics/forecast', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ quantities: [10, 20, 30], alpha: 0.5 }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ alpha: 0.5, forecast: 22.5 });
  });
});

