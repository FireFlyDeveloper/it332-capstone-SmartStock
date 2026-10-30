import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { decodeNotificationCursor } from '../notifications/feed.js';
import { getNotificationPageDb } from './postgresStore.js';

describe('PostgreSQL Notifications cursor page', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps the bounded page, global unread counts, and next cursor', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 4,
      unread_count: 3,
      filtered_count: 3,
      page_items: [
        { id: 'stock-p1', type: 'stock', severity: 'critical', source: { name: 'Glass', stock: 0, threshold: 5 } },
        { id: 'order-payment-o1', type: 'order', severity: 'warning', source: { reference: 'SS-1', customer: 'Customer', total: 100, paidAmount: 25, paymentStatus: 'partial', createdAt: '2026-10-30T00:00:00.000Z' } },
        { id: 'order-pending-o2', type: 'order', severity: 'info', source: { reference: 'SS-2', customer: 'Customer', total: 200, createdAt: '2026-10-30T00:00:00.000Z' } },
      ],
    }] });

    const page = await getNotificationPageDb({ limit: 2, readIds: ['stock-p1'], dismissedIds: ['delivery-d1'], unreadOnly: true });
    expect(page).toMatchObject({
      items: [
        { id: 'stock-p1', title: 'Critical Stock: Glass', message: 'Item is completely out of stock! Restock urgently.', contextLabel: 'Urgent' },
        { id: 'order-payment-o1', title: 'Payment Partial: SS-1', message: expect.stringContaining('Customer has'), contextLabel: expect.stringContaining('Created') },
      ],
      page: { limit: 2, totalCount: 3, hasMore: true },
      summary: { totalCount: 4, unreadCount: 3 },
    });
    expect(decodeNotificationCursor(page!.page.nextCursor!)).toEqual({ type: 'order', id: 'order-payment-o1' });

    const [sql, parameters] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM products p');
    expect(sql).toContain("o.order_status = 'processing'");
    expect(sql).toContain('ORDER BY type_rank ASC, id COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $6::int');
    expect(parameters).toEqual([['stock-p1'], ['delivery-d1'], true, null, null, 3]);
    expect(database.query).toHaveBeenCalledOnce();
  });

  it('applies the composite type/id cursor in subsequent pages', async () => {
    database.query.mockResolvedValue({ rows: [{ total_count: 4, unread_count: 4, filtered_count: 4, page_items: [] }] });
    const cursor = Buffer.from(JSON.stringify({ type: 'order', id: 'order-pending-o1' })).toString('base64url');
    await getNotificationPageDb({ limit: 25, cursor });
    const [sql, parameters] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('type_rank > $4::int');
    expect(parameters.slice(3)).toEqual([1, 'order-pending-o1', 26]);
  });

  it('rejects invalid cursors before querying and handles an unavailable pool', async () => {
    await expect(getNotificationPageDb({ cursor: 'invalid' })).rejects.toThrow('cursor is invalid');
    expect(database.query).not.toHaveBeenCalled();
    database.available = false;
    await expect(getNotificationPageDb()).resolves.toBeNull();
  });
});
