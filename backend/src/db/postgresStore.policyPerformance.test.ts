import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listPolicyPerformancePageDb } from './postgresStore.js';

const reportRow = (product_id: string, name: string, stock = 4) => ({
  product_id,
  sku: `SKU-${product_id}`,
  name,
  unit: 'sheet',
  tracking_started_at: '2026-01-01T00:00:00.000Z',
  tracking_days: '10.0000',
  time_weighted_average_on_hand: '3.5000',
  days_at_or_below_reorder_point: '5.0000',
  percent_time_at_or_below_reorder_point: '50.0000',
  out_of_stock_days: '1.0000',
  policy_periods: [{ started_at: '2026-01-01T00:00:00.000Z', ended_at: null, reorder_point: 5, tracking_days: '10', time_weighted_average_on_hand: '3.5', days_at_or_below_reorder_point: '5', percent_time_at_or_below_reorder_point: '50', out_of_stock_days: '1' }],
  reorder_point_changes: 2,
  current_stock: stock,
  current_reorder_point: 5,
  status: 'at_or_below_reorder_point',
});

describe('PostgreSQL observed policy-performance cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('aggregates history and returns a bounded first page with global totals', async () => {
    const now = new Date('2026-10-30T00:00:00.000Z');
    database.query.mockResolvedValue({ rows: [{
      products: 3,
      products_with_history: 2,
      tracking_days: '302.0000',
      out_of_stock_product_count: 1,
      reorder_point_changes: 5,
      tracking_start: '2026-01-01T00:00:00.000Z',
      total_count: 3,
      page_items: [reportRow('p-1', 'Alpha'), reportRow('p-2', 'Beta'), reportRow('p-3', 'Zulu')],
    }] });

    const result = await listPolicyPerformancePageDb({ now, limit: 2, cursor: null });

    expect(result).toMatchObject({
      trackingStart: '2026-01-01T00:00:00.000Z',
      totals: { products: 3, productsWithHistory: 2, trackingDays: 302, outOfStockProductCount: 1, reorderPointChanges: 5 },
      rows: [
        { productId: 'p-1', name: 'Alpha', trackingDays: 10, timeWeightedAverageOnHand: 3.5, status: 'at_or_below_reorder_point', policyPeriods: [{ startedAt: '2026-01-01T00:00:00.000Z', endedAt: null, reorderPoint: 5, trackingDays: 10, timeWeightedAverageOnHand: 3.5, daysAtOrBelowReorderPoint: 5, percentTimeAtOrBelowReorderPoint: 50, outOfStockDays: 1 }] },
        { productId: 'p-2', name: 'Beta', trackingDays: 10, timeWeightedAverageOnHand: 3.5, status: 'at_or_below_reorder_point' },
      ],
      page: { limit: 2, totalCount: 3, hasMore: true, nextCursor: { name: 'Beta', productId: 'p-2' } },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('LEAD(recorded_at) OVER (PARTITION BY product_id ORDER BY recorded_at, id)');
    expect(sql).toContain('FROM inventory_policy_history');
    expect(sql).toContain('AS policy_periods');
    expect(sql).toContain('period_number');
    expect(sql).toContain('CASE WHEN BOOL_OR(next_recorded_at IS NULL) THEN NULL ELSE MAX(next_recorded_at) END AS ended_at');
    expect(sql).toContain('MAX(CASE WHEN next_recorded_at IS NULL THEN $1::timestamptz ELSE next_recorded_at END)');
    expect(sql).toContain('ORDER BY name COLLATE "C" ASC, product_id COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $4');
    expect(values).toEqual([now, null, null, 3]);
  });

  it('advances the composite cursor and reports final-page metadata', async () => {
    const now = new Date('2026-10-30T00:00:00.000Z');
    database.query.mockResolvedValue({ rows: [{
      products: 3,
      products_with_history: 2,
      tracking_days: '302.0000',
      out_of_stock_product_count: 1,
      reorder_point_changes: 5,
      tracking_start: '2026-01-01T00:00:00.000Z',
      total_count: 3,
      page_items: [reportRow('p-3', 'Zulu')],
    }] });

    const result = await listPolicyPerformancePageDb({
      now,
      limit: 2,
      cursor: { name: 'Beta', productId: 'p-2' },
    });

    expect(result?.rows.map(({ productId }) => productId)).toEqual(['p-3']);
    expect(result?.page).toEqual({ limit: 2, totalCount: 3, hasMore: false, nextCursor: null });
    const [, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual([now, 'Beta', 'p-2', 3]);
  });

  it('returns complete zero totals for an empty catalog', async () => {
    database.query.mockResolvedValue({ rows: [{
      products: 0,
      products_with_history: 0,
      tracking_days: '0',
      out_of_stock_product_count: 0,
      reorder_point_changes: 0,
      tracking_start: null,
      total_count: 0,
      page_items: [],
    }] });
    const result = await listPolicyPerformancePageDb({ now: new Date('2026-10-30T00:00:00.000Z'), limit: 25, cursor: null });
    expect(result?.page).toEqual({ limit: 25, totalCount: 0, hasMore: false, nextCursor: null });
    expect(result?.totals).toEqual({ products: 0, productsWithHistory: 0, trackingDays: 0, outOfStockProductCount: 0, reorderPointChanges: 0 });
  });
});
