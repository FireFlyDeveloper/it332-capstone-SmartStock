/**
 * AI insight tests — Hermes-backed interpretation and local fallback.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { _resetOrderStore, createOrder } from '../orders/store.js';
import { _resetInventoryStore, createProduct, recordInboundStock, recordOutboundStock } from '../inventory/store.js';
import { analyticsRoutes } from '../analytics/routes.js';
import { generateFallbackInsight, getAnalyticsInsight, buildSafeInsightPayload } from './insights.js';
import { validateAiInsightResponse } from './validator.js';
import { callHermesInsight } from './hermes.js';

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

async function seedAiAnalyticsData() {
  const monthAt = (monthsAgo: number) => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 15)).toISOString();
  };
  const glass = await createProduct({ sku: 'AI-GLASS', name: 'AI Glass', category: 'glass', unit: 'sheet', stock: 3, price: 100, threshold: 5 });
  await recordInboundStock(glass.id, { quantity: 20, referenceNo: 'AI-PO-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  await recordOutboundStock(glass.id, { quantity: 8, referenceNo: 'AI-SO-001', occurredAt: '2026-02-10T00:00:00.000Z' });
  await createProduct({ sku: 'AI-GLASS-NO-HISTORY', name: 'AI Glass Without History', category: 'glass', unit: 'sheet', stock: 2, price: 100, threshold: 5 });
  const aluminum = await createProduct({ sku: 'AI-ALUMINUM', name: 'AI Aluminum', category: 'aluminum', unit: 'pcs', stock: 10, price: 100, threshold: 5 });
  await recordOutboundStock(aluminum.id, { quantity: 5, referenceNo: 'AI-SO-002', occurredAt: '2026-03-10T00:00:00.000Z' });
  const order = createOrder({
    referenceNumber: 'SS-2026-99001',
    customerName: 'Private Customer',
    customerPhone: '+639171234567',
    deliveryAddress: '123 Full Secret Street, Barangay Hidden, Manila',
    deliveryDate: '2026-02-15',
    paidAmount: 400,
    items: [{ productId: glass.id, name: 'AI Glass', quantity: 4, unitPrice: 100 }],
  });
  order.createdAt = monthAt(2);
  order.orderStatus = 'delivered';
  const januaryOrder = createOrder({
    referenceNumber: 'SS-2026-99002', customerName: 'Private Customer', customerPhone: 'secret-phone',
    deliveryAddress: 'secret-address', deliveryDate: '2026-01-20', paidAmount: 100,
    items: [{ productId: glass.id, name: 'AI Glass', quantity: 2, unitPrice: 100 }],
  });
  januaryOrder.createdAt = monthAt(3);
  januaryOrder.orderStatus = 'delivered';
  const marchOrder = createOrder({
    referenceNumber: 'SS-2026-99003', customerName: 'Private Customer', customerPhone: 'secret-phone',
    deliveryAddress: 'secret-address', deliveryDate: '2026-03-20', paidAmount: 300,
    items: [{ productId: glass.id, name: 'AI Glass', quantity: 3, unitPrice: 100 }],
  });
  marchOrder.createdAt = monthAt(1);
  marchOrder.orderStatus = 'delivered';
}

const ORIGINAL_ENV = { ...process.env };
const AT = String.fromCharCode(64);
const ADMIN = 'ai-admin' + AT + 'smartstock.local';
const STAFF = 'ai-staff' + AT + 'smartstock.local';

describe('AI insight fallback layer', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.HERMES_API_KEY;
    delete process.env.HERMES_API_BASE_URL;
    delete process.env.HERMES_MODEL;
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    await seedAiAnalyticsData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns a deterministic local insight when Hermes is not configured', async () => {
    const first = await getAnalyticsInsight({ year: 2026, threshold: 5 });
    const second = await getAnalyticsInsight({ year: 2026, threshold: 5 });

    expect(first).toEqual(second);
    expect(first.source).toBe('fallback');
    expect(first.summary).toContain('No sales were recorded in the earlier six-month period');
    expect(first.summary).toContain('Rough next-month estimates');
    expect(first.recommendations).toHaveLength(3);
    expect(first.risks).toHaveLength(2);
    expect(first.risks[1]).toContain('exclude 1 receipt');
    expect(first.risks[1]).toContain('5 pcs');
    expect(first.risks[1]).toContain('8 sheets');
    expect(first.confidence).toBe('medium');
    const output = [first.summary, ...first.recommendations, ...first.risks].join(' ');
    expect(output).not.toMatch(/simple_exponential_smoothing|alpha|horizon|coverage|category\/unit groups|fast-moving threshold/i);
    expect(output).toContain('different units');
  });

  it('rejects incomplete AI responses with missing required fields', () => {
    expect(validateAiInsightResponse({ summary: 'Only summary' })).toBeNull();
    expect(validateAiInsightResponse({
      summary: 'Sales improved in February.',
      recommendations: ['Review fast-moving items.'],
      risks: ['Low stock can delay fulfillment.'],
      confidence: 'high',
    })).toEqual({
      summary: 'Sales improved in February.',
      recommendations: ['Review fast-moving items.'],
      risks: ['Low stock can delay fulfillment.'],
      confidence: 'high',
    });
  });

  it('sends only final aggregate computations with explicit coverage, costs, and units', async () => {
    const payload = await buildSafeInsightPayload({ year: 2026, threshold: 5 });
    const serialized = JSON.stringify(payload);

    expect(payload).toHaveProperty('sales.comparison.changePercent');
    expect(payload.sales.orderCount).toBe(3);
    expect(payload.sales.grossSales).toBe(900);
    expect(payload.sales.monthsWithSales).toBe(3);
    expect(payload.sales.comparison.direction).toBe('new_activity');
    expect(payload.sales.comparison.recentGrossSales).toBe(900);
    expect(payload.sales.comparison.changePercent).toBeNull();
    expect(payload.sales.period.months).toBe(12);
    expect(payload.forecast).toMatchObject({
      targetPeriod: 'next month', productsWithEstimate: 1, totalProducts: 3, productsWithoutEstimate: 2,
      estimatesByUnit: [{ unit: 'sheet', quantity: expect.any(Number) }],
    });
    expect(payload.purchases).toMatchObject({ recordedCost: 0, pricedReceipts: 0, unpricedReceipts: 1 });
    expect(payload.movement.outboundByUnit).toEqual([
      { unit: 'pcs', quantity: 5, movementCount: 1 },
      { unit: 'sheet', quantity: 8, movementCount: 1 },
    ]);

    expect(serialized).not.toContain('Private Customer');
    expect(serialized).not.toContain('secret-phone');
    expect(serialized).not.toContain('secret-address');
    expect(serialized).not.toContain('AI Glass');
    expect(serialized).not.toContain('SS-2026-990');
    expect(serialized).not.toContain('+639****4567');
    expect(serialized).not.toContain('123 Full Secret Street');
    expect(serialized).not.toContain('Barangay Hidden');
    expect(serialized).not.toContain('Bearer ');
    expect(serialized).not.toContain('HERMES_API_KEY');
    expect(serialized).not.toContain('"history":');
    expect(serialized).not.toContain('"supplier":');
    expect(serialized).not.toContain('"productId":');
    expect(serialized).not.toContain('"sku":');
    expect(serialized).not.toContain('"category":');
    expect(serialized).not.toContain('"month":');
  });

  it('calls the configured Hermes profile with only aggregate JSON and validates its response', async () => {
    process.env.HERMES_API_KEY = 'test-hermes-api-key';
    process.env.HERMES_API_BASE_URL = 'http://172.29.0.1:8643/v1';
    process.env.HERMES_MODEL = 'smartstockanalytics';
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      summary: 'Gross sales are higher in the latest six months, with a rough estimate for one of three products.',
      recommendations: ['Check each product’s current stock before ordering.'],
      risks: ['Some products lack enough recent sales history for estimates.'],
      confidence: 'medium',
    }) } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAnalyticsInsight({ year: 2026, threshold: 5 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('http://172.29.0.1:8643/v1/chat/completions');
    expect(init.headers.authorization).toBe('Bearer test-hermes-api-key');
    const requestBody = JSON.parse(init.body);
    expect(init.headers['idempotency-key']).toBe(`smartstock-${createHash('sha256').update(JSON.stringify(requestBody)).digest('hex')}`);
    expect(requestBody.model).toBe('smartstockanalytics');
    expect(requestBody.tools).toEqual([]);
    expect(requestBody.tool_choice).toBe('none');
    expect(requestBody.messages[0].content).toContain('Speak plainly to a shop owner');
    expect(requestBody.messages[1].content).toContain('ordinary person can understand');
    expect(requestBody.messages[1].content).toContain('Use the supplied sales direction');
    expect(requestBody.messages[1].content).toContain('cost total is incomplete and excludes those receipts');
    expect(requestBody.messages[1].content).toContain('unit-specific movement');
    expect(requestBody.messages[1].content).not.toContain('Report its method, alpha, horizon, and coverage accurately');
    expect(requestBody.messages[1].content).not.toContain('"history":');
    expect(requestBody.messages[1].content).not.toContain('"productId":');
    expect(requestBody.messages[1].content).not.toContain('Private Customer');
    expect(requestBody.messages[1].content).not.toContain('secret-phone');
    expect(requestBody.messages[1].content).not.toContain('secret-address');
    expect(result.source).toBe('hermes');
    expect(result.summary).toContain('higher in the latest six months');
  });

  it('falls back after an Hermes request or response validation failure', async () => {
    process.env.HERMES_API_KEY = 'test-hermes-api-key';
    process.env.HERMES_API_BASE_URL = 'https://hermes.example/v1';
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"missing fields"}' } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAnalyticsInsight({ year: 2026, threshold: 5 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('fallback');
    expect(result.summary).toContain('No sales were recorded in the earlier six-month period');
  });

  it('rejects public plain-HTTP Hermes endpoints before making a network call', async () => {
    const fetchMock = vi.fn();
    await expect(callHermesInsight({ summary: 'safe aggregate payload' }, {
      apiKey: 'test-hermes-api-key',
      baseUrl: 'http://api.example/v1',
      model: 'smartstockanalytics',
    }, fetchMock)).rejects.toThrow('Hermes API must use HTTPS or a loopback/private HTTP address');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('restricts GET /analytics/insights to admins and returns deterministic fallback', async () => {
    const app = buildApp();
    await seedUser(STAFF, 'staff');
    await seedUser(ADMIN, 'admin');

    const anonymous = await app.request('/analytics/insights?year=2026&threshold=5');
    expect(anonymous.status).toBe(401);

    const staffToken = await login(app, STAFF);
    const staff = await app.request('/analytics/insights?year=2026&threshold=5', {
      headers: { authorization: 'Bearer ' + staffToken },
    });
    expect(staff.status).toBe(403);

    const adminToken = await login(app, ADMIN);
    const res = await app.request('/analytics/insights?year=2026&threshold=5', {
      headers: { authorization: 'Bearer ' + adminToken },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as ReturnType<typeof generateFallbackInsight> & { source: string };
    expect(json.source).toBe('fallback');
    expect(json.recommendations.length).toBeGreaterThan(0);
  });
});
