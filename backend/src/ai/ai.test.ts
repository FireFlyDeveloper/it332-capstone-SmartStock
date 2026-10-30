/**
 * AI insight tests — DeepSeek interpretation fallback layer.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore, type Role } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { _resetOrderStore, createOrder } from '../orders/store.js';
import { _resetInventoryStore, createProduct, recordInboundStock, recordOutboundStock } from '../inventory/store.js';
import { analyticsRoutes } from '../analytics/routes.js';
import { generateFallbackInsight, getAnalyticsInsight, buildSafeInsightPayload } from './insights.js';
import { validateAiInsightResponse } from './validator.js';
import { callDeepSeekInsight } from './deepseek.js';

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
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_ENDPOINT;
    delete process.env.DEEPSEEK_MODEL;
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    await seedAiAnalyticsData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns a deterministic local insight when DEEPSEEK_API_KEY is missing', async () => {
    const first = await getAnalyticsInsight({ year: 2026, threshold: 5 });
    const second = await getAnalyticsInsight({ year: 2026, threshold: 5 });

    expect(first).toEqual(second);
    expect(first.source).toBe('fallback');
    expect(first.summary).toContain('SmartStock analytics');
    expect(first.recommendations.length).toBeGreaterThan(0);
    expect(first.risks.length).toBeGreaterThan(0);
    expect(first.confidence).toBe('medium');
    expect(first.recommendations.some((item) => item.includes('simple_exponential_smoothing (alpha 0.3, 1-month horizon) covers 1 of 1 products and 1 of 1 category/unit groups.'))).toBe(true);
    expect(first.recommendations).toContain('Interpret the statistical forecast as a planning signal; do not describe it as an AI-generated prediction.');
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

  it('builds AI payloads from aggregate analytics without customer PII or secrets', async () => {
    const payload = await buildSafeInsightPayload({ year: 2026, threshold: 5 });
    const serialized = JSON.stringify(payload);

    expect(payload.forecast).toMatchObject({
      method: 'simple_exponential_smoothing', alpha: 0.3, horizonMonths: 1,
      coverage: { coveredProducts: 1, totalProducts: 1, coveredGroups: 1, totalGroups: 1 },
      groups: [{ category: 'glass', unit: 'sheet', history: expect.arrayContaining([
        { month: expect.any(String), quantity: 2 }, { month: expect.any(String), quantity: 4 }, { month: expect.any(String), quantity: 3 },
      ]), forecastQuantity: expect.any(Number), coveredProducts: 1, totalProducts: 1 }],
    });
    const historyQuantities = payload.forecast.groups[0].history.map((row) => row.quantity);
    const expectedForecast = historyQuantities.slice(1).reduce((forecast, quantity) => 0.3 * quantity + 0.7 * forecast, historyQuantities[0]);
    expect(payload.forecast.groups[0].forecastQuantity).toBe(Math.round(expectedForecast * 100) / 100);
    expect(serialized).not.toContain('Private Customer');
    expect(serialized).not.toContain('secret-phone');
    expect(serialized).not.toContain('secret-address');
    expect(serialized).not.toContain('AI Glass');
    expect(serialized).not.toContain('SS-2026-990');
    expect(serialized).not.toContain('+639****4567');
    expect(serialized).not.toContain('123 Full Secret Street');
    expect(serialized).not.toContain('Barangay Hidden');
    expect(serialized).not.toContain('Bearer ');
    expect(serialized).not.toContain('DEEPSEEK_API_KEY');
    expect(serialized).toContain('salesTrends');
    expect(serialized).toContain('movement');
  });

  it('uses HTTPS DeepSeek requests, retries once on failure, and falls back after an invalid AI response', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-key-not-secret';
    process.env.DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.example/chat/completions';
    process.env.DEEPSEEK_MODEL = 'deepseek-chat';
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"missing fields"}' } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAnalyticsInsight({ year: 2026, threshold: 5 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [endpoint, init] = fetchMock.mock.calls[0];
    expect(endpoint).toBe('https://api.deepseek.example/chat/completions');
    expect(init.headers.authorization).toBe('Bearer test-key-not-secret');
    expect(result.source).toBe('fallback');
    expect(result.summary).toContain('SmartStock analytics');
  });

  it('rejects non-HTTPS DeepSeek endpoints before making a network call', async () => {
    const fetchMock = vi.fn();
    await expect(callDeepSeekInsight({ summary: 'safe aggregate payload' }, {
      apiKey: 'test-key-not-secret',
      endpoint: 'http://api.deepseek.example/chat/completions',
      model: 'deepseek-chat',
    }, fetchMock)).rejects.toThrow('DeepSeek endpoint must use HTTPS');
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
