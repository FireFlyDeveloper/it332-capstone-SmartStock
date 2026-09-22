/**
 * Public tracking integration tests — unauthenticated reference lookup.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { trackingRoutes } from './routes.js';
import { _resetOrderStore, createOrder } from '../orders/store.js';

function buildApp() {
  const app = new Hono();
  app.route('/tracking', trackingRoutes);
  return app;
}

describe('public tracking routes', () => {
  let app: Hono;

  beforeEach(() => {
    _resetOrderStore(false);
    app = buildApp();
  });

  it('returns public order and delivery status for a valid reference without auth', async () => {
    const order = createOrder({
      referenceNumber: 'SS-2026-00999',
      customerName: 'Maria Santos',
      customerPhone: '+639171234567',
      deliveryAddress: 'Unit 4, Glassram Building, Batangas City, Batangas, Philippines',
      deliveryDate: '2026-08-15',
      paidAmount: 1000,
      items: [
        { productId: 'PRD-001', name: 'Tempered Glass Panel', quantity: 2, unitPrice: 1250 },
        { productId: 'PRD-002', name: 'Aluminum Frame', quantity: 1, unitPrice: 900 },
      ],
    });

    const res = await app.request('/tracking/' + order.referenceNumber);

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      referenceNumber: string;
      customerName: string;
      deliveryAddress: string;
      deliveryDate: string;
      orderStatus: string;
      paymentStatus: string;
      total: number;
      paidAmount: number;
      items: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
    };
    expect(json).toMatchObject({
      referenceNumber: 'SS-2026-00999',
      deliveryDate: '2026-08-15',
      orderStatus: 'processing',
      paymentStatus: 'partial',
      total: 3400,
      paidAmount: 1000,
      items: [
        { name: 'Tempered Glass Panel', quantity: 2, unitPrice: 1250, lineTotal: 2500 },
        { name: 'Aluminum Frame', quantity: 1, unitPrice: 900, lineTotal: 900 },
      ],
    });
    expect(json.customerName).toBe('Maria S.');
    expect(json.deliveryAddress).toBe('Batangas, Philippines');
  });

  it('returns clean JSON 404 for an invalid reference', async () => {
    const res = await app.request('/tracking/SS-2026-40404');

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'tracking reference not found' });
  });

  it('excludes phone, full address, internal ids, timestamps, and refund fields', async () => {
    const order = createOrder({
      referenceNumber: 'SS-2026-00123',
      customerName: 'Juan Dela Cruz',
      customerPhone: '+639991112222',
      deliveryAddress: '123 Private Street, Barangay Secret, Manila, Philippines',
      deliveryDate: '2026-08-20',
      paidAmount: 0,
      items: [{ productId: 'PRD-777', name: 'Mirror Panel', quantity: 1, unitPrice: 500 }],
    });

    const res = await app.request('/tracking/' + order.referenceNumber.toLowerCase());

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).not.toHaveProperty('id');
    expect(json).not.toHaveProperty('customerPhone');
    expect(json).not.toHaveProperty('createdAt');
    expect(json).not.toHaveProperty('updatedAt');
    expect(json).not.toHaveProperty('refundedAmount');
    expect(json).not.toHaveProperty('refundReason');
    expect(json).not.toHaveProperty('refundType');
    expect(JSON.stringify(json)).not.toContain(order.id);
    expect(JSON.stringify(json)).not.toContain('+639991112222');
    expect(JSON.stringify(json)).not.toContain('123 Private Street');
    expect(JSON.stringify(json)).not.toContain('Barangay Secret');
    expect(JSON.stringify(json)).not.toContain('PRD-777');
    expect(json.customerName).toBe('Juan D. C.');
    expect(json.deliveryAddress).toBe('Manila, Philippines');
  });
});
