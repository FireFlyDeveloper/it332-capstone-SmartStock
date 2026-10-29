import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createUser, _resetUserStore } from '../auth/users.js';
import { signToken } from '../auth/jwt.js';

const records = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../orders/service.js', () => ({ listOrderRecords: records.list }));

import { dailySalesRoutes } from './routes.js';

function buildApp() {
  const app = new Hono();
  app.route('/daily-sales', dailySalesRoutes);
  return app;
}

function staffHeaders() {
  const user = createUser({ email: 'cashier@example.com', name: 'Cashier', passwordHash: 'unused', role: 'staff' });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { authorization: 'Bearer ' + token };
}

const sampleOrder = {
  id: 'order-1', referenceNumber: 'SS-1', customerName: 'Sample', customerPhone: '', deliveryAddress: '', deliveryDate: '2026-10-30',
  items: [{ productId: 'p1', name: 'Glass', quantity: 2, unitPrice: 50, lineTotal: 100 }], subtotal: 100, total: 100,
  paidAmount: 80, paymentStatus: 'partial' as const, orderStatus: 'delivered' as const, refundedAmount: 10,
  createdAt: '2026-10-30T09:00:00.000Z', updatedAt: '2026-10-30T09:00:00.000Z',
};

describe('Daily Sales API', () => {
  beforeEach(() => {
    _resetUserStore();
    vi.clearAllMocks();
    records.list.mockReturnValue([sampleOrder]);
  });

  it('requires authentication', async () => {
    expect((await buildApp().request('/daily-sales?date=2026-10-30')).status).toBe(401);
  });

  it('validates the requested business date', async () => {
    const response = await buildApp().request('/daily-sales?date=2026-02-30', { headers: staffHeaders() });
    expect(response.status).toBe(400);
  });

  it('returns backend-derived totals and matching order records for the selected date', async () => {
    const response = await buildApp().request('/daily-sales?date=2026-10-30', { headers: staffHeaders() });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      date: '2026-10-30', orderCount: 1, cancelledOrderCount: 0, grossSales: 100,
      collectedAmount: 90, refundsAmount: 10, netCollectedAmount: 80,
      orders: [{
        id: 'order-1', referenceNumber: 'SS-1', customerName: 'Sample',
        items: [{ productId: 'p1', name: 'Glass', quantity: 2, unitPrice: 50, lineTotal: 100 }],
        total: 100, paidAmount: 80, refundedAmount: 10, paymentStatus: 'partial', orderStatus: 'delivered',
        createdAt: '2026-10-30T09:00:00.000Z',
      }],
    });
  });
});