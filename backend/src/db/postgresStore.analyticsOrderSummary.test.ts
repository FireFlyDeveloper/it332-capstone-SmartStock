import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { getAnalyticsOrderSummaryDb } from './postgresStore.js';

describe('PostgreSQL Analytics order summary query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps compact database aggregates and applies date filters before aggregation', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_order_count: 3,
      average_order_value: '250',
      top_selling_items: [{ productId: 'ALU-1', name: 'Aluminum', quantity: 3, category: 'aluminum' }],
      most_ordered_items: [{ name: 'Aluminum', category: 'aluminum', stock: 8, unitsOrdered: 3, status: 'healthy' }],
      least_ordered_items: [{ name: 'Glass', category: 'glass', stock: 2, unitsOrdered: 2, status: 'critical' }],
      ordered_quantities: { 'ALU-1': 3 },
      sales_trend_data: [{ month: 'Jan 26', sales: 200, orders: 1 }],
    }] });

    await expect(getAnalyticsOrderSummaryDb('2026-01-01', '2026-01-31')).resolves.toEqual({
      totalOrderCount: 3,
      averageOrderValue: 250,
      topSellingItems: [{ productId: 'ALU-1', name: 'Aluminum', quantity: 3, category: 'aluminum' }],
      mostOrderedItems: [{ name: 'Aluminum', category: 'aluminum', stock: 8, unitsOrdered: 3, status: 'healthy' }],
      leastOrderedItems: [{ name: 'Glass', category: 'glass', stock: 2, unitsOrdered: 2, status: 'critical' }],
      orderedQuantities: { 'ALU-1': 3 },
      salesTrendData: [{ month: 'Jan 26', sales: 200, orders: 1 }],
    });

    const [sql, parameters] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WITH filtered_orders AS MATERIALIZED');
    expect(sql).toContain('o.delivery_date >= $1::date');
    expect(sql).toContain('o.delivery_date <= $2::date');
    expect(sql).toContain("o.order_status <> 'cancelled'");
    expect(sql).toContain('jsonb_array_elements(COALESCE(o.items');
    expect(sql).toContain('LIMIT 5');
    expect(parameters).toEqual(['2026-01-01', '2026-01-31']);
    expect(database.query).toHaveBeenCalledOnce();
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(getAnalyticsOrderSummaryDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
