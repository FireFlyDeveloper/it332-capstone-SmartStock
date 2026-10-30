import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listMonthlyItemMovementPageDb, listMonthlyStockMovementAggregatesDb } from './postgresStore.js';

describe('PostgreSQL monthly stock movement queries', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps monthly inflow/outflow aggregates while keeping each unit separate', async () => {
    const startAt = new Date('2026-01-01T00:00:00.000Z');
    const endAt = new Date('2026-04-01T00:00:00.000Z');
    database.query.mockResolvedValue({ rows: [
      { month: '2026-01', unit: 'pcs', inbound_quantity: '10', outbound_quantity: 0, inbound_movement_count: 1, outbound_movement_count: 0 },
      { month: '2026-02', unit: 'sqm', inbound_quantity: '5.5', outbound_quantity: '7', inbound_movement_count: 1, outbound_movement_count: 1 },
    ] });

    await expect(listMonthlyStockMovementAggregatesDb(startAt, endAt)).resolves.toEqual([
      { month: '2026-01', unit: 'pcs', inboundQuantity: 10, outboundQuantity: 0, inboundMovementCount: 1, outboundMovementCount: 0 },
      { month: '2026-02', unit: 'sqm', inboundQuantity: 5.5, outboundQuantity: 7, inboundMovementCount: 1, outboundMovementCount: 1 },
    ]);
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("DATE_TRUNC('month', m.occurred_at AT TIME ZONE 'UTC')");
    expect(sql).toContain("m.type IN ('inbound', 'outbound')");
    expect(sql).toContain('GROUP BY 1, 2');
    expect(values).toEqual([startAt, endAt]);
  });

  it('keyset-pages product movement with full-dataset counts and per-unit totals', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 2,
      fast_moving_count: 1,
      slow_moving_count: 1,
      page_rows: [
        { month: '2026-02', productId: 'P1', name: 'Alpha', sku: 'A', category: 'glass', unit: 'sqm', status: 'active', quantity: 7, threshold: 5, classification: 'fast_moving' },
        { month: '2026-02', productId: 'P2', name: 'Beta', sku: 'B', category: 'aluminum', unit: 'pcs', status: 'active', quantity: 0, threshold: 5, classification: 'slow_moving' },
      ],
      outbound_by_unit: [{ unit: 'pcs', quantity: 3 }, { unit: 'sqm', quantity: 7 }],
    }] });

    await expect(listMonthlyItemMovementPageDb({ month: '2026-02', threshold: 5, limit: 1, cursor: null })).resolves.toEqual({
      rows: [{ month: '2026-02', productId: 'P1', name: 'Alpha', sku: 'A', category: 'glass', unit: 'sqm', status: 'active', quantity: 7, threshold: 5, classification: 'fast_moving' }],
      summary: { productCount: 2, fastMovingCount: 1, slowMovingCount: 1, outboundByUnit: [{ unit: 'pcs', quantity: 3 }, { unit: 'sqm', quantity: 7 }] },
      page: { limit: 1, totalCount: 2, hasMore: true, nextCursor: { name: 'Alpha', productId: 'P1' } },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('movement_totals AS MATERIALIZED');
    expect(sql).toContain('p.deleted_at IS NULL');
    expect(sql).toContain('ORDER BY name COLLATE "C", product_id COLLATE "C"');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual([
      new Date('2026-02-01T00:00:00.000Z'), new Date('2026-03-01T00:00:00.000Z'), 5, 2, null, null, '2026-02',
    ]);
  });

  it('returns null instead of using PostgreSQL when the pool is unavailable', async () => {
    database.available = false;
    await expect(listMonthlyStockMovementAggregatesDb(new Date(), new Date())).resolves.toBeNull();
    await expect(listMonthlyItemMovementPageDb({ month: '2026-02', threshold: 10, limit: 25, cursor: null })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
