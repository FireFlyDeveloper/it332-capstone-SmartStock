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
      page: { limit: 25, totalCount: 1, hasMore: false, nextCursor: null },
    });
  });

  it('returns stable cursor pages and applies search/status filters on the backend', async () => {
    const second = {
      ...sampleOrder,
      id: 'order-2',
      referenceNumber: 'SS-2',
      customerName: 'Frame Buyer',
      items: [{ productId: 'p2', name: 'Aluminum Frame', quantity: 1, unitPrice: 200, lineTotal: 200 }],
      total: 200,
      paidAmount: 0,
      paymentStatus: 'unpaid' as const,
      orderStatus: 'cancelled' as const,
      refundedAmount: 0,
    };
    const third = { ...sampleOrder, id: 'order-3', referenceNumber: 'SS-3', customerName: 'Glass Buyer' };
    records.list.mockReturnValue([third, second, sampleOrder]);
    const app = buildApp();
    const headers = staffHeaders();

    const firstResponse = await app.request('/daily-sales?date=2026-10-30&limit=1', { headers });
    expect(firstResponse.status).toBe(200);
    const first = await firstResponse.json() as { orders: Array<{ id: string }>; page: { hasMore: boolean; nextCursor: string | null; totalCount: number } };
    expect(first.orders.map((order) => order.id)).toEqual(['order-1']);
    expect(first.page).toMatchObject({ hasMore: true, totalCount: 3 });
    expect(first.page.nextCursor).toBeTruthy();

    const secondResponse = await app.request(`/daily-sales?date=2026-10-30&limit=1&cursor=${encodeURIComponent(first.page.nextCursor!)}`, { headers });
    const secondPage = await secondResponse.json() as { orders: Array<{ id: string }>; page: { hasMore: boolean; nextCursor: string | null } };
    expect(secondPage.orders.map((order) => order.id)).toEqual(['order-2']);
    expect(secondPage.page).toMatchObject({ hasMore: true });
    expect(secondPage.page.nextCursor).toBeTruthy();

    const thirdResponse = await app.request(`/daily-sales?date=2026-10-30&limit=1&cursor=${encodeURIComponent(secondPage.page.nextCursor!)}`, { headers });
    const thirdPage = await thirdResponse.json() as { orders: Array<{ id: string }>; page: { hasMore: boolean; nextCursor: string | null } };
    expect(thirdPage.orders.map((order) => order.id)).toEqual(['order-3']);
    expect(thirdPage.page).toMatchObject({ hasMore: false, nextCursor: null });

    const filteredResponse = await app.request('/daily-sales?date=2026-10-30&status=cancelled&q=frame', { headers });
    const filtered = await filteredResponse.json() as { orders: Array<{ id: string }>; page: { totalCount: number }; orderCount: number; cancelledOrderCount: number; grossSales: number };
    expect(filtered.orders.map((order) => order.id)).toEqual(['order-2']);
    expect(filtered.page.totalCount).toBe(1);
    expect(filtered).toMatchObject({ orderCount: 2, cancelledOrderCount: 1, grossSales: 200 });
  });

  it('rejects invalid pagination parameters', async () => {
    const headers = staffHeaders();
    expect((await buildApp().request('/daily-sales?date=2026-10-30&limit=101', { headers })).status).toBe(400);
    expect((await buildApp().request('/daily-sales?date=2026-10-30&cursor=not-a-cursor', { headers })).status).toBe(400);
    expect((await buildApp().request('/daily-sales?date=2026-10-30&status=unknown', { headers })).status).toBe(400);
  });
});