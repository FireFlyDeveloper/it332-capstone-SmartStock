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

function seedAiAnalyticsData() {
  const glass = createProduct({ sku: 'AI-GLASS', name: 'AI Glass', category: 'glass', unit: 'sheet', stock: 3, price: 100, threshold: 5 });
  recordInboundStock(glass.id, { quantity: 20, referenceNo: 'AI-PO-001', supplier: 'Supplier A', occurredAt: '2026-01-10T00:00:00.000Z' });
  recordOutboundStock(glass.id, { quantity: 8, referenceNo: 'AI-SO-001', occurredAt: '2026-02-10T00:00:00.000Z' });
  const order = createOrder({
    referenceNumber: 'SS-2026-99001',
    customerName: 'Private Customer',
    customerPhone: '+639171234567',
    deliveryAddress: '123 Full Secret Street, Barangay Hidden, Manila',
    deliveryDate: '2026-02-15',
    paidAmount: 400,
    items: [{ productId: glass.id, name: 'AI Glass', quantity: 4, unitPrice: 100 }],
  });
  order.createdAt = '2026-02-12T00:00:00.000Z';
}

const ORIGINAL_ENV = { ...process.env };
const AT = String.fromCharCode(64);
const STAFF = 'ai-staff' + AT + 'smartstock.local';

describe('AI insight fallback layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_ENDPOINT;
    delete process.env.DEEPSEEK_MODEL;
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    seedAiAnalyticsData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  it('returns a deterministic local insight when DEEPSEEK_API_KEY is missing', async () => {
    const first = await getAnalyticsInsight({ year: 2026, threshold: 5, forecastQuantities: [10, 20, 30] });
    const second = await getAnalyticsInsight({ year: 2026, threshold: 5, forecastQuantities: [10, 20, 30] });

    expect(first).toEqual(second);
    expect(first.source).toBe('fallback');
    expect(first.summary).toContain('SmartStock analytics');
    expect(first.recommendations.length).toBeGreaterThan(0);
    expect(first.risks.length).toBeGreaterThan(0);
    expect(first.confidence).toBe('medium');
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

  it('builds AI payloads from aggregate analytics without customer PII or secrets', () => {
    const payload = buildSafeInsightPayload({ year: 2026, threshold: 5, forecastQuantities: [10, 20, 30] });
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('Private Customer');
    expect(serialized).not.toContain('+639171234567');
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

    const result = await getAnalyticsInsight({ year: 2026, threshold: 5, forecastQuantities: [10, 20, 30] });

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

  it('exposes authenticated GET /analytics/insights using deterministic fallback without an API key', async () => {
    const app = buildApp();
    await seedUser(STAFF, 'staff');

    const anonymous = await app.request('/analytics/insights?year=2026&threshold=5');
    expect(anonymous.status).toBe(401);

    const token = await login(app, STAFF);
    const res = await app.request('/analytics/insights?year=2026&threshold=5', {
      headers: { authorization: 'Bearer ' + token },
    });

    expect(res.status).toBe(200);
    const json = await res.json() as ReturnType<typeof generateFallbackInsight> & { source: string };
    expect(json.source).toBe('fallback');
    expect(json.recommendations.length).toBeGreaterThan(0);
  });
});
