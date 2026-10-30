import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { getDashboardOrderSummaryDb } from './postgresStore.js';

describe('PostgreSQL Dashboard order summary query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps global status counts and the bounded top-item projection', async () => {
    database.query.mockResolvedValue({ rows: [{
      active_order_count: 2,
      order_status_counts: [
        { status: 'cancelled', count: 1 },
        { status: 'processing', count: 2 },
        { status: 'delivered', count: 1 },
      ],
      top_items: [
        { productId: 'ALU-1', name: 'Aluminum', category: 'aluminum', unit: 'length', quantity: 3 },
        { productId: 'GLS-1', name: 'Glass', category: null, unit: null, quantity: 2 },
      ],
    }] });

    await expect(getDashboardOrderSummaryDb()).resolves.toEqual({
      activeOrderCount: 2,
      orderStatusCounts: [
        { status: 'cancelled', count: 1 },
        { status: 'processing', count: 2 },
        { status: 'delivered', count: 1 },
      ],
      topItems: [
        { productId: 'ALU-1', name: 'Aluminum', category: 'aluminum', unit: 'length', quantity: 3 },
        { productId: 'GLS-1', name: 'Glass', category: null, unit: null, quantity: 2 },
      ],
    });

    const [sql] = database.query.mock.calls[0] as [string];
    expect(sql).toContain('FROM orders WHERE deleted_at IS NULL GROUP BY order_status');
    expect(sql).toContain("o.order_status <> 'cancelled'");
    expect(sql).toContain('jsonb_array_elements(COALESCE(o.items');
    expect(sql).toContain('ORDER BY it.quantity DESC, it.product_id COLLATE "C" ASC');
    expect(sql).toContain('LIMIT 4');
    expect(database.query).toHaveBeenCalledOnce();
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(getDashboardOrderSummaryDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
