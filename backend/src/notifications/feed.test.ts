import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../auth/routes.js';
import { createUser, _resetUserStore } from '../auth/users.js';
import { hashPassword } from '../auth/hash.js';
import { _resetOrderStore, createOrder, updateOrder } from '../orders/store.js';
import { _resetInventoryStore, createProduct } from '../inventory/store.js';
import { notificationRoutes } from './routes.js';

const app = new Hono();
app.route('/auth', authRoutes);
app.route('/notifications', notificationRoutes);
const email = 'notifications-test@smartstock.local';

async function login(): Promise<string> {
  const response = await app.request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'pass1234' }),
  });
  return (await response.json() as { token: string }).token;
}

describe('notification feed route', () => {
  beforeEach(async () => {
    _resetUserStore();
    _resetOrderStore(false);
    _resetInventoryStore(false);
    await createUser({ email, name: 'Notification Test', passwordHash: await hashPassword('pass1234'), role: 'staff' });
    createProduct({ name: 'Low Glass', category: 'glass', unit: 'piece', stock: 2, price: 100, threshold: 5, status: 'active', sku: 'NOTIF-GLASS' });
    const processing = createOrder({
      referenceNumber: 'SS-NOTIF-1', customerName: 'Processing Customer', customerPhone: '000', deliveryAddress: 'Batangas',
      deliveryDate: '2026-10-30', paidAmount: 0, items: [{ productId: 'NOTIF-GLASS', name: 'Low Glass', quantity: 1, unitPrice: 100 }],
    });
    const transit = createOrder({
      referenceNumber: 'SS-NOTIF-2', customerName: 'Transit Customer', customerPhone: '000', deliveryAddress: 'Manila',
      deliveryDate: '2026-10-30', paidAmount: 50, items: [{ productId: 'NOTIF-GLASS', name: 'Low Glass', quantity: 1, unitPrice: 100 }],
    });
    updateOrder(transit.id, { orderStatus: 'in_transit' });
    expect(processing.orderStatus).toBe('processing');
  });

  it('requires authentication and returns alerts derived from current backend records', async () => {
    expect((await app.request('/notifications')).status).toBe(401);
    const token = await login();
    const response = await app.request('/notifications', { headers: { authorization: `Bearer ${token}` } });
    expect(response.status).toBe(200);
    const notifications = await response.json() as Array<{ id: string; type: string; severity: string; title: string }>;
    expect(notifications.map(({ type, severity, title }) => ({ type, severity, title }))).toEqual([
      { type: 'stock', severity: 'critical', title: 'Critical Stock: Low Glass' },
      { type: 'order', severity: 'info', title: 'Processing Order: SS-NOTIF-1' },
      { type: 'order', severity: 'warning', title: 'Payment Partial: SS-NOTIF-2' },
      { type: 'delivery', severity: 'info', title: 'Out for Delivery: SS-NOTIF-2' },
    ]);
    expect(notifications.map(({ id }) => id)).toEqual([
      expect.stringMatching(/^stock-/),
      expect.stringMatching(/^order-pending-/),
      expect.stringMatching(/^order-payment-/),
      expect.stringMatching(/^delivery-transit-/),
    ]);
  });

  it('paginates notifications and reports global read and dismissal counts', async () => {
    const token = await login();
    const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
    const requestPage = (body: object) => app.request('/notifications/page', { method: 'POST', headers, body: JSON.stringify(body) });
    const firstResponse = await requestPage({ limit: 2 });
    expect(firstResponse.status).toBe(200);
    const first = await firstResponse.json() as {
      items: Array<{ id: string; title: string }>;
      page: { totalCount: number; hasMore: boolean; nextCursor: string | null };
      summary: { totalCount: number; unreadCount: number };
    };
    expect(first.items.map(({ title }) => title)).toEqual([
      'Critical Stock: Low Glass',
      'Payment Partial: SS-NOTIF-2',
    ]);
    expect(first.page).toMatchObject({ totalCount: 4, hasMore: true });
    expect(first.summary).toEqual({ totalCount: 4, unreadCount: 4 });

    const secondResponse = await requestPage({ limit: 2, cursor: first.page.nextCursor });
    const second = await secondResponse.json() as typeof first;
    expect(second.items.map(({ title }) => title)).toEqual([
      'Processing Order: SS-NOTIF-1',
      'Out for Delivery: SS-NOTIF-2',
    ]);
    expect(second.page).toMatchObject({ totalCount: 4, hasMore: false, nextCursor: null });
    expect(new Set([...first.items, ...second.items].map(({ id }) => id)).size).toBe(4);

    const changesResponse = await app.request('/notifications/changes', {
      method: 'POST', headers, body: JSON.stringify({ knownIds: first.items.map(({ id }) => id), dismissedIds: [] }),
    });
    expect(changesResponse.status).toBe(200);
    expect((await changesResponse.json() as { items: Array<{ title: string }> }).items.map(({ title }) => title)).toEqual([
      'Processing Order: SS-NOTIF-1',
      'Out for Delivery: SS-NOTIF-2',
    ]);

    const unread = await requestPage({ limit: 10, readIds: [first.items[1].id], dismissedIds: [first.items[0].id], unreadOnly: true });
    expect(unread.status).toBe(200);
    expect(await unread.json()).toMatchObject({
      page: { totalCount: 2, hasMore: false },
      summary: { totalCount: 3, unreadCount: 2 },
    });
    const idsResponse = await app.request('/notifications/ids', {
      method: 'POST', headers, body: JSON.stringify({ dismissedIds: [first.items[0].id] }),
    });
    expect((await idsResponse.json() as { ids: string[] }).ids).toHaveLength(3);
    expect((await requestPage({ limit: 2, cursor: 'invalid' })).status).toBe(400);
  });
});
