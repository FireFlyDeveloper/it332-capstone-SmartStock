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
import { _resetInventoryStore, createProduct, listProducts, recordInboundStock, recordOutboundStock } from '../inventory/store.js';
import { analyticsRoutes } from '../analytics/routes.js';
import { generateFallbackInsight, getAnalyticsInsight, buildSafeInsightPayload } from './insights.js';
import { INSIGHT_SECTION_KEYS, type SafeInsightPayload } from './types.js';
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
  const glass = await createProduct({ sku: 'AI-GLASS', name: 'AI Glass', category: 'glass', unit: 'sqm', stock: 3, price: 100, threshold: 5 });
  await recordInboundStock(glass.id, { quantity: 20, referenceNo: 'AI-PO-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  await recordOutboundStock(glass.id, { quantity: 8, referenceNo: 'AI-SO-001', occurredAt: '2026-02-10T00:00:00.000Z' });
  await createProduct({ sku: 'AI-GLASS-NO-HISTORY', name: 'AI Glass Without History', category: 'glass', unit: 'sqm', stock: 2, price: 100, threshold: 5 });
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
const TEST_NOW = new Date('2026-10-31T12:00:00.000Z');
const AT = String.fromCharCode(64);
const ADMIN = 'ai-admin' + AT + 'smartstock.local';
const STAFF = 'ai-staff' + AT + 'smartstock.local';
const VALID_INTERPRETATIONS = Object.fromEntries(INSIGHT_SECTION_KEYS.map((key) => [key, `Plain-language interpretation for ${key}.`])) as Record<(typeof INSIGHT_SECTION_KEYS)[number], string>;

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
    const first = await getAnalyticsInsight({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 5 }, TEST_NOW);
    const second = await getAnalyticsInsight({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 5 }, TEST_NOW);

    expect(first).toEqual(second);
    expect(first.source).toBe('fallback');
    expect(first.summary).toContain('gross sales');
    expect(first.summary).toContain('2026-02');
    expect(first.summary).toContain('at least 5 units sent out');
    expect(first.summary).toContain('1 of 3 products met the fast-moving cutoff');
    expect(first.summary).toContain('next-month estimates total');
    expect(first.recommendations).toHaveLength(3);
    expect(first.risks).toHaveLength(2);
    expect(Object.keys(first.interpretations)).toEqual(INSIGHT_SECTION_KEYS);
    expect(Object.values(first.interpretations).every((text) => text.trim().length > 0 && text.length <= 500)).toBe(true);
    expect(first.interpretations.monthlyGrossOrderValue).toContain('cancelled');
    expect(first.interpretations.annualPurchasedMaterials).toContain('unpriced');
    expect(first.interpretations.fewestOrderedProducts).toContain('zero');
    expect(first.risks[0]).toContain('Recorded purchase costs total 0 across 0 receipts with a cost; 1 receipt has no cost recorded.');
    expect(first.risks[1]).toContain('Current inventory:');
    expect(first.risks[1]).toContain('20 sqm received and 8 sqm sent out');
    expect(first.risks[1]).toContain('0 pcs received and 5 pcs sent out');
    expect(first.interpretations.stockAlerts).toContain('1 low');
    expect(first.confidence).toBe('medium');
    const output = [first.summary, ...first.recommendations, ...first.risks].join(' ');
    expect(output).not.toMatch(/simple_exponential_smoothing|alpha|horizon|coverage|category\/unit groups/i);
    expect(output).toContain('different units');
  });

  it('rejects incomplete AI responses with missing required fields', () => {
    expect(validateAiInsightResponse({ summary: 'Only summary' })).toBeNull();
    expect(validateAiInsightResponse({
      summary: 'Sales improved in February.',
      interpretations: VALID_INTERPRETATIONS,
      recommendations: ['Review fast-moving items.'],
      risks: ['Low stock can delay fulfillment.'],
      confidence: 'high',
    })).toEqual({
      summary: 'Sales improved in February.',
      interpretations: VALID_INTERPRETATIONS,
      recommendations: ['Review fast-moving items.'],
      risks: ['Low stock can delay fulfillment.'],
      confidence: 'high',
    });
    const { stockAlerts: _stockAlerts, ...missingInterpretation } = VALID_INTERPRETATIONS;
    expect(validateAiInsightResponse({
      summary: 'Sales improved in February.', interpretations: missingInterpretation,
      recommendations: ['Review fast-moving items.'], risks: ['Low stock can delay fulfillment.'], confidence: 'high',
    })).toBeNull();
    expect(validateAiInsightResponse({
      summary: 'Sales improved in February.', interpretations: { ...VALID_INTERPRETATIONS, extra: 'unexpected' },
      recommendations: ['Review fast-moving items.'], risks: ['Low stock can delay fulfillment.'], confidence: 'high',
    })).toBeNull();
    expect(validateAiInsightResponse({
      summary: 'Sales improved in February.', interpretations: { ...VALID_INTERPRETATIONS, stockAlerts: 'x'.repeat(501) },
      recommendations: ['Review fast-moving items.'], risks: ['Low stock can delay fulfillment.'], confidence: 'high',
    })).toBeNull();
  });

  it('sends only final aggregate computations with explicit coverage, costs, and units', async () => {
    const payload = await buildSafeInsightPayload({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 5 }, TEST_NOW);
    const serialized = JSON.stringify(payload);

    expect(payload.sales.trend).toHaveProperty('changePercent');
    expect(payload.sales.orderCount).toBe(3);
    expect(payload.sales.grossSales).toBe(900);
    expect(payload.sales.averageOrderValue).toBe(300);
    expect(payload.sales.bucketsWithSales).toBe(3);
    expect(payload.movement.classification).toMatchObject({ fromDate: '2026-02-01', toDate: '2026-02-28', threshold: 5, productCount: 3, fastMovingCount: 1, slowMovingCount: 2 });
    expect(payload.inventory).toMatchObject({ productCount: 3, activeProductCount: 3, activeLowStockCount: 2, activeLowAlertCount: 1, activeCriticalStockCount: 1, totalInventoryValue: expect.any(Number) });
    expect(payload.inventory).toHaveProperty('glassInventoryValue');
    expect(payload.inventory).toHaveProperty('aluminumInventoryValue');
    expect(payload.inventory).toHaveProperty('activeOutOfStockCount');
    expect(payload.inventory).toHaveProperty('activeCriticalStockCount');
    expect(payload.inventory).toHaveProperty('activeLowStockCount');
    expect(payload.forecast).toMatchObject({
      targetPeriod: 'next month', productsWithEstimate: 1, totalProducts: 3, productsWithoutEstimate: 2,
      estimatesByUnit: [{ unit: 'sqm', quantity: expect.any(Number) }],
    });
    expect(payload.purchases).toMatchObject({ recordedCost: 0, pricedReceipts: 0, unpricedReceipts: 1 });
    expect(payload.monthlySales.byMonth.length).toBeLessThanOrEqual(12);
    expect(payload.monthlySales.byMonth).toEqual([
      { month: '2026-01', orderRecords: 1, grossOrderValue: 200 },
      { month: '2026-02', orderRecords: 1, grossOrderValue: 400 },
      { month: '2026-03', orderRecords: 1, grossOrderValue: 300 },
    ]);
    expect(payload.monthlySales.rangeTotals).toMatchObject({ orderRecords: 3, grossOrderValue: 900 });
    expect(payload.annualMaterials.periodBasis).toBe('occurredAt_utc_calendar_year_to_date');
    expect(payload.orderRankings.omittedUnitGroups).toEqual({ selectedRangeTop: 0, allTimeMost: 0, allTimeFewest: 0 });
    const omittedFallback = generateFallbackInsight({ ...payload, orderRankings: { ...payload.orderRankings,
      omittedUnitGroups: { selectedRangeTop: 2, allTimeMost: 1, allTimeFewest: 3 } } });
    expect(omittedFallback.interpretations.topOrderedProducts).toContain('2 additional unit groups omitted');
    expect(omittedFallback.interpretations.mostOrderedProducts).toContain('1 additional unit group omitted');
    expect(omittedFallback.interpretations.fewestOrderedProducts).toContain('3 additional unit groups omitted');
    for (const ranking of [payload.orderRankings.selectedRangeTopByUnit, payload.orderRankings.allTimeMostByUnit, payload.orderRankings.allTimeFewestByUnit]) {
      expect(ranking.length).toBeLessThanOrEqual(5);
      expect(ranking.every((group) => group.items.length <= 5)).toBe(true);
    }
    expect(payload.movement.selectedTotalsByUnit).toEqual([
      { unit: 'pcs', inbound: 0, outbound: 5, inboundCount: 0, outboundCount: 1 },
      { unit: 'sqm', inbound: 20, outbound: 8, inboundCount: 1, outboundCount: 1 },
    ]);
    expect(payload.movement.monthlyWindow.months).toHaveLength(12);
    const january = payload.movement.monthlyWindow.months.find((entry) => entry.month === '2026-01');
    const february = payload.movement.monthlyWindow.months.find((entry) => entry.month === '2026-02');
    const march = payload.movement.monthlyWindow.months.find((entry) => entry.month === '2026-03');
    expect(january?.byUnit).toEqual(expect.arrayContaining([
      { unit: 'pcs', inbound: 0, outbound: 0 }, { unit: 'sqm', inbound: 20, outbound: 0 },
    ]));
    expect(february?.byUnit).toEqual(expect.arrayContaining([
      { unit: 'pcs', inbound: 0, outbound: 0 }, { unit: 'sqm', inbound: 0, outbound: 8 },
    ]));
    expect(march?.byUnit).toEqual(expect.arrayContaining([
      { unit: 'pcs', inbound: 0, outbound: 5 }, { unit: 'sqm', inbound: 0, outbound: 0 },
    ]));

    expect(serialized).not.toContain('Private Customer');
    expect(serialized).not.toContain('secret-phone');
    expect(serialized).not.toContain('secret-address');
    expect(serialized).toContain('AI Glass'); // bounded display label in the requested product ranking
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
    expect(serialized).not.toContain('"referenceNo":');
    expect(serialized).not.toContain('"orderedQuantities":');
    expect(serialized).not.toContain('"productId":');
    expect(serialized).not.toContain('"supplier":');
    expect(serialized).toContain('AI Glass'); // bounded display label in the requested product ranking
    expect(payload).not.toHaveProperty('movement.rows');
  });

  it('applies inclusive delivery dates and movement dates with the selected cutoff', async () => {
    const glass = listProducts().find((product) => product.sku === 'AI-GLASS');
    if (!glass) throw new Error('AI test glass product was not seeded');
    await recordInboundStock(glass.id, { quantity: 3, unitCost: 25, referenceNo: 'AI-PO-RANGE-END', supplier: 'Supplier A', occurredAt: '2026-02-15T23:59:59.999Z' });
    await recordInboundStock(glass.id, { quantity: 7, unitCost: 50, referenceNo: 'AI-PO-AFTER-RANGE', supplier: 'Supplier A', occurredAt: '2026-02-16T00:00:00.000Z' });
    const selected = await buildSafeInsightPayload({ fromDate: '2026-02-10', toDate: '2026-02-15', threshold: 5 }, TEST_NOW);
    expect(selected.sales.orderCount).toBe(1);
    expect(selected.sales.grossSales).toBe(400);
    expect(selected.purchases).toMatchObject({ recordedCost: 75, pricedReceipts: 1, unpricedReceipts: 0 });
    expect(selected.movement.selectedTotalsByUnit).toEqual([
      { unit: 'sqm', inbound: 3, outbound: 8, inboundCount: 1, outboundCount: 1 },
    ]);
    expect(selected.movement.classification).toMatchObject({ fromDate: '2026-02-10', toDate: '2026-02-15', fastMovingCount: 1, slowMovingCount: 2 });
    const februaryChart = selected.movement.monthlyWindow.months.find((entry) => entry.month === '2026-02');
    expect(februaryChart?.byUnit).toEqual(expect.arrayContaining([
      { unit: 'sqm', inbound: 10, outbound: 8 },
    ]));
    const boundary = await buildSafeInsightPayload({ fromDate: '2026-02-01', toDate: '2026-02-09', threshold: 5 }, TEST_NOW);
    expect(boundary.sales.orderCount).toBe(0);
    expect(boundary.movement.selectedTotalsByUnit).toEqual([]);
    expect(boundary.movement.classification).toMatchObject({ fromDate: '2026-02-01', toDate: '2026-02-09', fastMovingCount: 0, slowMovingCount: 3 });
    const higherThreshold = await buildSafeInsightPayload({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 10 }, TEST_NOW);
    expect(selected.movement.classification.fastMovingCount).toBe(1);
    expect(higherThreshold.movement.classification.fastMovingCount).toBe(0);
    expect(higherThreshold.movement.classification.slowMovingCount).toBe(3);
  });

  it('calls the configured Hermes profile with only aggregate JSON and validates its response', async () => {
    process.env.HERMES_API_KEY = 'test-hermes-api-key';
    process.env.HERMES_API_BASE_URL = 'http://172.29.0.1:8643/v1';
    process.env.HERMES_MODEL = 'smartstockanalytics';
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      summary: 'Gross sales in the latest chart interval are lower than the previous interval.',
      interpretations: VALID_INTERPRETATIONS,
      recommendations: ['Check each product’s current stock before ordering.'],
      risks: ['Some products lack enough recent sales history for estimates.'],
      confidence: 'medium',
    }) } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAnalyticsInsight({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 5 }, TEST_NOW);

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
    expect(requestBody.messages[1].content).toContain('aggregate computations only');
    expect(requestBody.messages[1].content).toContain('delivery-date range');
    expect(requestBody.messages[1].content).toContain('occurr');
    expect(requestBody.messages[1].content).toContain('threshold');
    for (const key of INSIGHT_SECTION_KEYS) expect(requestBody.messages[1].content).toContain(key);
    const sentPayload = JSON.parse(requestBody.messages[1].content.split('\n').at(-1)!) as SafeInsightPayload;
    expect(sentPayload.movement.classification).toMatchObject({ fromDate: '2026-02-01', toDate: '2026-02-28', threshold: 5 });
    const februaryChart = sentPayload.movement.monthlyWindow.months.find((entry) => entry.month === '2026-02');
    expect(februaryChart?.byUnit).toEqual(expect.arrayContaining([
      { unit: 'pcs', inbound: 0, outbound: 0 },
      { unit: 'sqm', inbound: 0, outbound: 8 },
    ]));
    expect(sentPayload.sales.period).toEqual({ fromDate: null, toDate: null });
    expect(requestBody.messages[1].content).not.toContain('Report its method, alpha, horizon, and coverage accurately');
    expect(requestBody.messages[1].content).not.toContain('"history":');
    expect(requestBody.messages[1].content).not.toContain('"productId":');
    expect(requestBody.messages[1].content).not.toContain('Private Customer');
    expect(requestBody.messages[1].content).not.toContain('secret-phone');
    expect(requestBody.messages[1].content).not.toContain('secret-address');
    expect(result.source).toBe('hermes');
    expect(result.summary).toContain('latest chart interval');
  });

  it('falls back after an Hermes request or response validation failure', async () => {
    process.env.HERMES_API_KEY = 'test-hermes-api-key';
    process.env.HERMES_API_BASE_URL = 'https://hermes.example/v1';
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"missing fields"}' } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAnalyticsInsight({ movementFromDate: '2026-02-01', movementToDate: '2026-02-28', threshold: 5 }, TEST_NOW);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('fallback');
    expect(result.summary).toContain('at least 5 units sent out');
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

    const anonymous = await app.request('/analytics/insights?fromDate=2026-02-01&toDate=2026-02-28&threshold=5');
    expect(anonymous.status).toBe(401);

    const staffToken = await login(app, STAFF);
    const staff = await app.request('/analytics/insights?fromDate=2026-02-01&toDate=2026-02-28&threshold=5', {
      headers: { authorization: 'Bearer ' + staffToken },
    });
    expect(staff.status).toBe(403);

    const adminToken = await login(app, ADMIN);
    const res = await app.request('/analytics/insights?fromDate=2026-02-01&toDate=2026-02-28&threshold=5', {
      headers: { authorization: 'Bearer ' + adminToken },
    });
    expect(res.status).toBe(200);
    const json = await res.json() as ReturnType<typeof generateFallbackInsight> & { source: string };
    expect(json.source).toBe('fallback');
    expect(json.recommendations.length).toBeGreaterThan(0);
    for (const query of [
      'fromDate=2026-02-30',
      'fromDate=2026-03-01&toDate=2026-02-01',
      'movementMonth=2026-13',
      'threshold=-1',
    ]) {
      const invalid = await app.request(`/analytics/insights?${query}`, { headers: { authorization: 'Bearer ' + adminToken } });
      expect(invalid.status).toBe(400);
    }
  });
});
