import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listDeliveriesPageDb } from './postgresStore.js';

const item = (orderId: string, createdAt: string, status = 'pending') => ({
  order_id: orderId,
  reference_number: `SS-2026-${orderId.slice(-5)}`,
  customer_name: `Customer ${orderId}`,
  customer_phone: '',
  destination: '1 Test Street',
  created_at: createdAt,
  delivery_status: status,
  page_current_step: status === 'pending' ? 0 : status === 'in_transit' ? 1 : 2,
  delivery_id: null,
  driver: null,
  truck_number: null,
  location: null,
  current_location: null,
  traffic_level: null,
  predicted_delay: null,
  route_efficiency_score: null,
  notes: null,
});

describe('PostgreSQL Deliveries cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('pages qualifying order-backed deliveries and preserves cursor timestamp precision', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 3,
      pending_count: 1,
      in_transit_count: 1,
      delivered_count: 1,
      page_items: [
        item('123e4567-e89b-42d3-a456-426614174001', '2026-10-30T09:00:00.123456+00:00'),
        item('123e4567-e89b-42d3-a456-426614174002', '2026-10-30T09:00:00.000000+00:00'),
      ],
    }] });

    const result = await listDeliveriesPageDb({
      limit: 1,
      status: 'all',
      cursorCreatedAt: '2026-10-29T00:00:00.000Z',
      cursorOrderId: '123e4567-e89b-42d3-a456-426614174000',
    });

    expect(result).toMatchObject({
      totalCount: 3,
      pendingCount: 1,
      inTransitCount: 1,
      deliveredCount: 1,
      hasMore: true,
      nextCursor: { createdAt: '2026-10-30T09:00:00.123456+00:00', orderId: '123e4567-e89b-42d3-a456-426614174001' },
      items: [{
        id: '123e4567-e89b-42d3-a456-426614174001',
        orderId: '123e4567-e89b-42d3-a456-426614174001',
        status: 'pending',
        customerName: 'Customer 123e4567-e89b-42d3-a456-426614174001',
        referenceNumber: 'SS-2026-74001',
        trafficLevel: null,
        currentLocation: null,
      }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("o.order_status IN ('processing', 'in_transit', 'delivered')");
    expect(sql).toContain("LOWER(BTRIM(COALESCE(o.delivery_address, ''))) <> 'pickup'");
    expect(sql).toContain('LEFT JOIN LATERAL');
    expect(sql).toContain('ORDER BY created_at DESC, order_id::text DESC');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual(['all', '2026-10-29T00:00:00.000Z', '123e4567-e89b-42d3-a456-426614174000', 2]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listDeliveriesPageDb({
      limit: 25,
      status: 'all',
      cursorCreatedAt: null,
      cursorOrderId: null,
    })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
