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
    const now = new Date('2026-01-15T12:00:00.000Z');
    database.query.mockResolvedValue({ rows: [{
      total_order_count: 3,
      average_order_value: '250',
      top_selling_items: [{ productId: 'ALU-1', name: 'Aluminum', quantity: 3, category: 'aluminum' }],
      most_ordered_items: [{ name: 'Aluminum', category: 'aluminum', stock: 8, unitsOrdered: 3, status: 'healthy' }],
      least_ordered_items: [{ name: 'Glass', category: 'glass', stock: 2, unitsOrdered: 2, status: 'critical' }],
      ordered_quantities: { 'ALU-1': 3 },
      price_comparison_by_product: [{
        productId: 'ALU-1', name: 'Aluminum', category: 'aluminum', unit: 'length', quantitySold: '3',
        averageSellingUnitPrice: '80', actualSellingRevenue: '240', currentListedUnitPrice: '100',
        currentListedValue: '300', listedPriceDifference: '60',
      }, {
        productId: 'OLD-1', name: 'Old item', category: 'Unclassified', unit: 'unknown', quantitySold: 2,
        averageSellingUnitPrice: 45, actualSellingRevenue: 90, currentListedUnitPrice: null,
        currentListedValue: null, listedPriceDifference: null,
      }],
      sales_trend_data: [{ month: '2026-01', sales: 300, orders: 3, grossOrderValue: 300, grossSales: 200, cancelledOrders: 1, nonCancelledOrders: 2 }],
      delivery_monthly_series: [{ month: '2026-01', orderCount: 3, grossSales: '300' }],
      omitted_month_count: 4,
      omitted_before: '2025-09',
      omitted_after: null,
      ai_rankings_all_time: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }],
      ai_rankings_all_time_fewest: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }],
      ai_rankings_selected_range: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }],
      ai_omitted_unit_groups_all_time: 2,
      ai_omitted_unit_groups_all_time_fewest: 3,
      ai_omitted_unit_groups_selected_range: 1,
      }] });

    await expect(getAnalyticsOrderSummaryDb('2026-01-01', '2026-01-31', now)).resolves.toEqual({
      totalOrderCount: 3,
      averageOrderValue: 250,
      topSellingItems: [{ productId: 'ALU-1', name: 'Aluminum', quantity: 3, category: 'aluminum' }],
      mostOrderedItems: [{ name: 'Aluminum', category: 'aluminum', stock: 8, unitsOrdered: 3, status: 'healthy' }],
      leastOrderedItems: [{ name: 'Glass', category: 'glass', stock: 2, unitsOrdered: 2, status: 'critical' }],
      orderedQuantities: { 'ALU-1': 3 },
      priceComparisonByProduct: [{
        productId: 'ALU-1', name: 'Aluminum', category: 'aluminum', unit: 'length', quantitySold: 3,
        averageSellingUnitPrice: 80, actualSellingRevenue: 240, currentListedUnitPrice: 100,
        currentListedValue: 300, listedPriceDifference: 60,
      }, {
        productId: 'OLD-1', name: 'Old item', category: 'Unclassified', unit: 'unknown', quantitySold: 2,
        averageSellingUnitPrice: 45, actualSellingRevenue: 90, currentListedUnitPrice: null,
        currentListedValue: null, listedPriceDifference: null,
      }],
      salesTrendData: [{ month: '2026-01', sales: 300, orders: 3, grossOrderValue: 300, grossSales: 200, cancelledOrders: 1, nonCancelledOrders: 2 }],
      deliveryDateMonthlySeries: { months: [{ month: '2026-01', orderCount: 3, grossSales: 300 }], omittedMonthCount: 4, omittedBefore: '2025-09', omittedAfter: null },
      aiProductRankings: { allTime: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }], allTimeFewest: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }], selectedRange: [{ unit: 'sheet', items: [{ name: 'Clear Glass', category: 'glass', quantity: 3, stock: 5, unit: 'sheet', status: 'healthy' }] }], omittedUnitGroups: { allTime: 2, allTimeFewest: 3, selectedRange: 1 } },
    });

    const [sql, parameters] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WITH filtered_orders AS MATERIALIZED');
    expect(sql).toContain('o.delivery_date >= $1::date');
    expect(sql).toContain('o.delivery_date <= $2::date');
    expect(sql).toContain("o.order_status <> 'cancelled'");
    expect(sql).toContain("o.order_status = 'delivered'");
    expect(sql).toContain("item.value->>'unitPrice'");
    expect(sql).toContain('p.unit_price');
    expect(sql).toContain('price_comparison_by_product');
    expect(sql).toContain('jsonb_array_elements(COALESCE(o.items');
    expect(sql).toContain('LIMIT 5');
    expect(sql).toContain('generate_series(b.first_month, b.last_month, interval \'1 month\')');
    expect(sql).toContain('COUNT(*) FILTER (WHERE order_status = \'cancelled\')::int AS cancelled_order_count');
    expect(sql).toContain('COUNT(*) FILTER (WHERE order_status <> \'cancelled\')::int AS non_cancelled_order_count');
    expect(sql).toContain('SUM(total_amount) FILTER (WHERE order_status = \'delivered\')');
    expect(sql).toContain('date_trunc(\'month\', $3::timestamptz AT TIME ZONE \'UTC\')::date');
    expect(sql).not.toContain('use_day_buckets');
    expect(sql).toContain('ROW_NUMBER() OVER (PARTITION BY scope ORDER BY unit COLLATE "C")');
    expect(sql).toContain('ai_omitted_unit_groups_all_time');
    expect(sql).not.toContain('unit_quantity');
    expect(sql).toContain('FROM monthly_series ORDER BY month DESC LIMIT 12');
    expect(sql).toContain('item_rank <= 5');
    expect(sql).toContain('unit_rank <= 5');
    expect(parameters).toEqual(['2026-01-01', '2026-01-31', now]);
    expect(database.query).toHaveBeenCalledOnce();
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(getAnalyticsOrderSummaryDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
