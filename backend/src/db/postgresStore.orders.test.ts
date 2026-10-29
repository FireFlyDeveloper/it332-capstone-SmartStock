import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listOrdersPageDb } from './postgresStore.js';

const order = (id: string, createdAt: string) => ({
  id,
  order_no: `SS-2026-${id.slice(-5)}`,
  customer_name: `Customer ${id}`,
  customer_phone: '',
  delivery_address: 'Pickup',
  delivery_date: '2026-10-30',
  items: [{ productId: 'p1', name: 'Glass', quantity: 1, unitPrice: 100, lineTotal: 100 }],
  subtotal: '100',
  total_amount: '100',
  paid_amount: '50',
  payment_status: 'partial',
  order_status: 'processing',
  refunded_amount: '0',
  created_at: createdAt,
  updated_at: createdAt,
});

describe('PostgreSQL Orders cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('queries filtered orders and counts in SQL, preserving timestamp cursor precision', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 3,
      pending_count: 0,
      in_progress_count: 2,
      completed_count: 1,
      page_orders: [
        order('123e4567-e89b-42d3-a456-426614174001', '2026-10-30T09:00:00.123456+00:00'),
        order('123e4567-e89b-42d3-a456-426614174002', '2026-10-30T09:00:00.000000+00:00'),
      ],
    }] });

    const result = await listOrdersPageDb({
      limit: 1,
      status: 'packed',
      search: 'customer',
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
      cursorCreatedAt: '2026-10-29T00:00:00.000Z',
      cursorId: '123e4567-e89b-42d3-a456-426614174000',
    });

    expect(result).toMatchObject({
      totalCount: 3,
      pendingCount: 0,
      inProgressCount: 2,
      completedCount: 1,
      hasMore: true,
      nextCursor: { createdAt: '2026-10-30T09:00:00.123456+00:00', id: '123e4567-e89b-42d3-a456-426614174001' },
      orders: [{ id: '123e4567-e89b-42d3-a456-426614174001', referenceNumber: 'SS-2026-74001' }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("o.order_status = 'processing'");
    expect(sql).toContain('o.delivery_date >= $3::date');
    expect(sql).toContain('POSITION(LOWER($2)');
    expect(sql).toContain('ORDER BY created_at DESC, id::text DESC');
    expect(sql).toContain('LIMIT $7');
    expect(values).toEqual(['packed', 'customer', '2026-10-01', '2026-10-31', '2026-10-29T00:00:00.000Z', '123e4567-e89b-42d3-a456-426614174000', 2]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listOrdersPageDb({
      limit: 25, status: 'all', search: '', fromDate: null, toDate: null, cursorCreatedAt: null, cursorId: null,
    })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
