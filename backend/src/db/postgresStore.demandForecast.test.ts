import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listDemandForecastPageDb } from './postgresStore.js';

const forecastRow = (product_id: string, name: string, forecast_quantity: number) => ({
  product_id,
  sku: `SKU-${product_id}`,
  name,
  category: 'glass',
  unit: 'sheet',
  stock: 8,
  threshold: 5,
  history: [
    { month: '2025-01', quantity: 2 }, { month: '2025-02', quantity: 0 },
    { month: '2025-03', quantity: 4 }, { month: '2025-04', quantity: 1 },
  ],
  positive_months: 3,
  forecast_quantity,
  status: 'available',
  stock_coverage_days: 40,
  recommended_order_quantity: 0,
  policy_assessment: 'adequate',
});

describe('PostgreSQL demand forecast cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('returns only the requested eligible page and full forecast totals', async () => {
    const now = new Date('2025-05-15T12:00:00.000Z');
    database.query.mockResolvedValue({ rows: [{
      product_count: 3,
      available_forecasts: 3,
      insufficient_history: 0,
      below_reorder_point: 1,
      recommended_order_quantity: 12,
      total_count: 3,
      page_items: [forecastRow('p-1', 'Alpha', 2), forecastRow('p-2', 'Beta', 3)],
    }] });

    const result = await listDemandForecastPageDb({ now, historyMonths: 4, limit: 1, cursor: null });

    expect(result).toMatchObject({
      products: [{
        productId: 'p-1', name: 'Alpha', currentStock: 8, reorderPoint: 5,
        history: [{ month: '2025-01', quantity: 2 }, { month: '2025-02', quantity: 0 }, { month: '2025-03', quantity: 4 }, { month: '2025-04', quantity: 1 }],
        positiveMonths: 3, forecastQuantity: 2, status: 'available', stockCoverageDays: 40,
        recommendedOrderQuantity: 0, policyAssessment: 'adequate',
      }],
      summary: { productCount: 3, availableForecasts: 3, insufficientHistory: 0, belowReorderPoint: 1, recommendedOrderQuantity: 12 },
      page: { limit: 1, totalCount: 3, hasMore: true, nextCursor: { name: 'Alpha', productId: 'p-1' } },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('jsonb_array_elements(COALESCE(o.items');
    expect(sql).toContain("o.order_status = 'delivered'");
    expect(sql).toContain('WITH RECURSIVE bounds');
    expect(sql).toContain('ORDER BY name COLLATE "C" ASC, product_id COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $5');
    expect(values).toEqual([now, 4, null, null, 2]);
  });

  it('advances the composite cursor and preserves global summary on the last page', async () => {
    const now = new Date('2025-05-15T12:00:00.000Z');
    database.query.mockResolvedValue({ rows: [{
      product_count: 3,
      available_forecasts: 3,
      insufficient_history: 0,
      below_reorder_point: 1,
      recommended_order_quantity: 12,
      total_count: 3,
      page_items: [forecastRow('p-3', 'Zulu', 1)],
    }] });

    const result = await listDemandForecastPageDb({ now, historyMonths: 4, limit: 1, cursor: { name: 'Beta', productId: 'p-2' } });

    expect(result?.products.map(({ productId }) => productId)).toEqual(['p-3']);
    expect(result?.summary).toEqual({ productCount: 3, availableForecasts: 3, insufficientHistory: 0, belowReorderPoint: 1, recommendedOrderQuantity: 12 });
    expect(result?.page).toEqual({ limit: 1, totalCount: 3, hasMore: false, nextCursor: null });
    const [, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual([now, 4, 'Beta', 'p-2', 2]);
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(listDemandForecastPageDb({ now: new Date(), historyMonths: 12, limit: 25, cursor: null })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
