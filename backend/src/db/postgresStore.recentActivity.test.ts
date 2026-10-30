import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listRecentActivityDb } from './postgresStore.js';

describe('PostgreSQL recent activity top-N query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps order and stock-movement events and bounds every source projection', async () => {
    database.query.mockResolvedValue({ rows: [
      {
        id: 'order:order-1', kind: 'order_recorded', occurred_at: '2026-10-30T12:00:00.123Z',
        reference_number: 'SS-2026-00001', order_status: 'processing', customer_name: 'Customer', order_total: '150.00',
        movement_type: null, product_id: null, product_name: null, unit: null, quantity: null,
      },
      {
        id: 'movement:move-1', kind: 'stock_movement', occurred_at: '2026-10-30T11:59:00.000Z',
        reference_number: 'PO-1', order_status: null, customer_name: null, order_total: null,
        movement_type: 'inbound', product_id: 'product-1', product_name: 'Glass', unit: 'sheet', quantity: 3,
      },
    ] });

    await expect(listRecentActivityDb(2)).resolves.toEqual([
      {
        id: 'order:order-1', kind: 'order_recorded', occurredAt: '2026-10-30T12:00:00.123Z',
        referenceNumber: 'SS-2026-00001', orderStatus: 'processing', customerName: 'Customer', orderTotal: 150,
      },
      {
        id: 'movement:move-1', kind: 'stock_movement', occurredAt: '2026-10-30T11:59:00.000Z',
        referenceNumber: 'PO-1', movementType: 'inbound', productId: 'product-1',
        productName: 'Glass', unit: 'sheet', quantity: 3,
      },
    ]);
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WITH order_activity AS MATERIALIZED');
    expect(sql).toContain('movement_activity AS MATERIALIZED');
    expect(sql).toContain("date_trunc('milliseconds', o.created_at)");
    expect(sql).toContain("date_trunc('milliseconds', m.occurred_at)");
    expect(sql.match(/LIMIT \$1/g)).toHaveLength(3);
    expect(values).toEqual([2]);
  });

  it('returns an empty array for an empty activity feed', async () => {
    database.query.mockResolvedValue({ rows: [] });
    await expect(listRecentActivityDb(6)).resolves.toEqual([]);
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(listRecentActivityDb(6)).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
