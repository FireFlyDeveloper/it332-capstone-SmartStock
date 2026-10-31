import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listInsightMovementSummaryDb, listInsightPurchaseSummaryDb, listInsightYtdPurchaseSummaryDb, listInsightInventorySummaryDb } from './postgresStore.js';

describe('PostgreSQL AI insight aggregate queries', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('aggregates selected movement by unit and direction using half-open UTC bounds', async () => {
    const startAt = new Date('2026-02-10T00:00:00.000Z');
    const endAt = new Date('2026-02-16T00:00:00.000Z');
    database.query.mockResolvedValue({ rows: [
      { unit: 'pcs', inbound_quantity: '12', outbound_quantity: '4', inbound_count: 2, outbound_count: 1 },
      { unit: 'sqm', inbound_quantity: '3.5', outbound_quantity: '8', inbound_count: 1, outbound_count: 1 },
    ] });

    await expect(listInsightMovementSummaryDb(startAt, endAt)).resolves.toEqual([
      { unit: 'pcs', inboundQuantity: 12, outboundQuantity: 4, inboundCount: 2, outboundCount: 1 },
      { unit: 'sqm', inboundQuantity: 3.5, outboundQuantity: 8, inboundCount: 1, outboundCount: 1 },
    ]);
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("m.type IN ('inbound', 'outbound')");
    expect(sql).toContain('m.occurred_at >= $1');
    expect(sql).toContain('m.occurred_at < $2');
    expect(sql).toContain('GROUP BY COALESCE(NULLIF(BTRIM(p.unit), \'\'), \'unknown\')');
    expect(sql).toContain('ORDER BY COALESCE(NULLIF(BTRIM(p.unit), \'\'), \'unknown\') COLLATE "C"');
    expect(values).toEqual([startAt, endAt]);
  });

  it('aggregates recorded and missing inbound costs and permits all-history null bounds', async () => {
    database.query.mockResolvedValue({ rows: [{ recorded_cost: '125.5', priced_receipts: 2, unpriced_receipts: 1 }] });

    await expect(listInsightPurchaseSummaryDb()).resolves.toEqual({ recordedCost: 125.5, pricedReceipts: 2, unpricedReceipts: 1 });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('SUM(m.quantity * m.unit_cost)');
    expect(sql).toContain("m.type = 'inbound'");
    expect(sql).toContain('m.occurred_at >= $1');
    expect(sql).toContain('m.occurred_at < $2');
    expect(values).toEqual([null, null]);
  });

  it('aggregates inbound purchase totals by category and category-unit with priced coverage', async () => {
    database.query.mockResolvedValue({ rows: [
      { category: 'glass', unit: 'sheet', transaction_count: 2, total_quantity: '5', total_cost: '20', priced_receipts: 1, unpriced_receipts: 1, priced_quantity: '2', unpriced_quantity: '3' },
    ] });
    const now = new Date('2026-06-15T12:30:00.000Z');
    await expect(listInsightYtdPurchaseSummaryDb(2026, now)).resolves.toEqual({
      year: 2026,
      categories: [{ category: 'glass', transactionCount: 2, totalQuantity: 5, totalCost: 20, pricedReceipts: 1, unpricedReceipts: 1, pricedQuantity: 2, unpricedQuantity: 3 }],
      categoryUnits: [{ category: 'glass', unit: 'sheet', transactionCount: 2, totalQuantity: 5, totalCost: 20, pricedReceipts: 1, unpricedReceipts: 1, pricedQuantity: 2, unpricedQuantity: 3 }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("m.type = 'inbound'");
    expect(sql).toContain('WITH inbound_materials AS');
    expect(sql).toContain('m.occurred_at >= $1::timestamptz');
    expect(sql).toContain('GROUP BY category, unit');
    expect(sql).not.toContain('supplier');
    expect(values).toEqual([new Date('2026-01-01T00:00:00.000Z'), now]);
  });

  it('aggregates listed-price inventory value by category and active-only alert severity counts', async () => {
    database.query.mockResolvedValue({ rows: [{
      product_count: 4, active_product_count: 3, total_inventory_value: '90', healthy_stock_count: 1, low_stock_status_count: 1,
      critical_stock_count: 1, out_of_stock_count: 1, low_stock_count: 3, active_low_stock_count: 2, active_threshold_stock_count: 2,
      category_values: [{ category: 'glass', listedPriceValue: '40' }],
      active_out_of_stock_count: 1, active_critical_count: 1, active_low_count: 1,
    }] });
    await expect(listInsightInventorySummaryDb()).resolves.toEqual({
      productCount: 4, activeProductCount: 3, totalInventoryValue: 90, categoryValues: [{ category: 'glass', listedPriceValue: 40 }],
      healthyStockCount: 1, lowStockStatusCount: 1, criticalStockCount: 1, outOfStockCount: 1, lowStockCount: 3, activeLowStockCount: 2, activeThresholdStockCount: 2,
      activeAlertCounts: { outOfStock: 1, critical: 1, low: 1 },
    });
    const [sql] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('stock * unit_price');
    expect(sql).toContain("COUNT(*) FILTER (WHERE status = 'active' AND stock <= threshold)::int AS active_low_stock_count");
    expect(sql).toContain('stock > 0');
  });

  it('returns null for both summaries if PostgreSQL is not configured', async () => {
    database.available = false;
    await expect(listInsightMovementSummaryDb()).resolves.toBeNull();
    await expect(listInsightPurchaseSummaryDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
