import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listDailySalesPageDb } from './postgresStore.js';

const orderRow = (id: string, orderNo: string) => ({
  id,
  order_no: orderNo,
  customer_name: 'Sample Customer',
  customer_phone: '',
  delivery_address: '',
  delivery_date: '2026-10-30',
  items: [{ productId: 'p1', name: 'Glass', quantity: 1, unitPrice: 100, lineTotal: 100 }],
  subtotal: '100',
  total_amount: '100',
  paid_amount: '50',
  payment_status: 'partial',
  order_status: 'processing',
  refunded_amount: '0',
  created_at: '2026-10-30T09:00:00.000Z',
  updated_at: '2026-10-30T09:00:00.000Z',
});

describe('PostgreSQL Daily Sales cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('queries date/filter/cursor in SQL and maps summary plus lookahead page', async () => {
    database.query.mockResolvedValue({ rows: [{
      order_count: 3,
      cancelled_order_count: 1,
      gross_sales: '420',
      net_collected_amount: '100',
      refunds_amount: '50',
      total_count: 2,
      page_orders: [orderRow('order-1', 'SS-1'), orderRow('order-2', 'SS-2')],
    }] });

    const result = await listDailySalesPageDb({
      date: '2026-10-30',
      limit: 1,
      status: 'all',
      search: 'glass',
      cursorReferenceNumber: 'SS-0',
      cursorId: 'cursor-id',
    });

    expect(result).toMatchObject({
      orderCount: 3,
      cancelledOrderCount: 1,
      grossSales: 420,
      collectedAmount: 150,
      refundsAmount: 50,
      netCollectedAmount: 100,
      totalCount: 2,
      hasMore: true,
      orders: [{ id: 'order-1', referenceNumber: 'SS-1', items: [{ name: 'Glass' }] }],
    });
    expect(database.query).toHaveBeenCalledOnce();
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('created_at >= $1::timestamptz');
    expect(sql).toContain('jsonb_array_elements');
    expect(sql).toContain('ORDER BY o.order_no ASC, o.id ASC');
    expect(sql).toContain('LIMIT $7');
    expect(values).toEqual([
      '2026-10-30T00:00:00.000Z',
      '2026-10-31T00:00:00.000Z',
      'all',
      'glass',
      'SS-0',
      'cursor-id',
      2,
    ]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    const result = await listDailySalesPageDb({
      date: '2026-10-30', limit: 25, status: 'all', search: '',
      cursorReferenceNumber: null, cursorId: null,
    });
    expect(result).toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
