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
  buildMonthlySalesTrend,
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

function seedDeterministicInventory() {
  const glass = createProduct({ sku: 'GLS-AN-01', name: 'Analytics Glass', category: 'glass', unit: 'sheet', stock: 0, price: 100, threshold: 5 });
  const aluminum = createProduct({ sku: 'ALU-AN-01', name: 'Analytics Aluminum', category: 'aluminum', unit: 'length', stock: 0, price: 50, threshold: 5 });

  recordInboundStock(glass.id, { quantity: 10, referenceNo: 'PO-AN-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  recordInboundStock(glass.id, { quantity: 4, referenceNo: 'PO-AN-002', supplier: 'Supplier B', occurredAt: '2026-03-10T00:00:00.000Z' });
  recordInboundStock(aluminum.id, { quantity: 6, referenceNo: 'PO-AN-003', supplier: 'Supplier A', occurredAt: '2026-01-12T00:00:00.000Z' });
  recordOutboundStock(glass.id, { quantity: 7, referenceNo: 'SO-AN-001', occurredAt: '2026-02-01T00:00:00.000Z' });
  recordOutboundStock(aluminum.id, { quantity: 2, referenceNo: 'SO-AN-002', occurredAt: '2026-02-03T00:00:00.000Z' });
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

  it('groups annual purchases by material type and supplier with stable totals', () => {
    const products = [
      { id: 'glass-1', name: 'Glass', category: 'glass' as const, unit: 'sheet', stock: 0, price: 100, threshold: 5, status: 'active' as const, sku: 'G-1' },
      { id: 'alum-1', name: 'Aluminum', category: 'aluminum' as const, unit: 'length', stock: 0, price: 50, threshold: 5, status: 'active' as const, sku: 'A-1' },
    ];
    const movements = [
      { id: 'm1', productId: 'glass-1', type: 'inbound' as const, quantity: 10, referenceNo: 'PO-1', supplier: 'Supplier A', occurredAt: '2026-01-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm2', productId: 'glass-1', type: 'inbound' as const, quantity: 4, referenceNo: 'PO-2', supplier: 'Supplier B', occurredAt: '2026-02-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm3', productId: 'alum-1', type: 'inbound' as const, quantity: 6, referenceNo: 'PO-3', supplier: 'Supplier A', occurredAt: '2026-03-01T00:00:00.000Z', createdBy: 'system' },
      { id: 'm4', productId: 'glass-1', type: 'outbound' as const, quantity: 9, referenceNo: 'SO-1', occurredAt: '2026-03-01T00:00:00.000Z', createdBy: 'system' },
    ];

    expect(buildAnnualPurchaseSummary(movements, products, 2026)).toEqual([
      { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300 },
      { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000 },
      { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400 },
    ]);
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
    seedDeterministicInventory();
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

  it('returns annual purchase totals grouped by material and supplier', async () => {
    const token = await login(app, STAFF);
    const res = await app.request('/analytics/purchases?year=2026', {
      headers: { authorization: 'Bearer ' + token },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 6, totalCost: 300 },
      { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 10, totalCost: 1000 },
      { materialType: 'glass', supplier: 'Supplier B', transactionCount: 1, totalQuantity: 4, totalCost: 400 },
    ]);
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

