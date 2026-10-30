import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listAnnualPurchasesPageDb } from './postgresStore.js';

const group = (material_type: string, supplier: string, total_cost: number) => ({
  material_type,
  supplier,
  transaction_count: '1',
  total_quantity: '2',
  total_cost: String(total_cost),
  unpriced_receipt_count: '0',
  unpriced_quantity: '0',
});

describe('PostgreSQL annual purchase cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('returns bounded groups and full-year totals with a stable composite cursor', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 3,
      total_spend: '1700.00',
      unpriced_receipt_count: 0,
      unpriced_quantity: '0',
      priced_receipt_count: 3,
      page_items: [
        group('aluminum', 'Supplier A', 300),
        group('glass', 'Supplier A', 1000),
        group('glass', 'Supplier B', 400),
      ],
    }] });

    const result = await listAnnualPurchasesPageDb({ year: 2026, limit: 2, cursor: null });

    expect(result).toEqual({
      groups: [
        { materialType: 'aluminum', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 2, totalCost: 300, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier A', transactionCount: 1, totalQuantity: 2, totalCost: 1000, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      ],
      totalSpend: 1700,
      unpricedReceiptCount: 0,
      unpricedQuantity: 0,
      pricedReceiptCount: 3,
      page: { limit: 2, totalCount: 3, hasMore: true, nextCursor: { materialType: 'glass', supplier: 'Supplier A' } },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM stock_movements m');
    expect(sql).toContain('m.occurred_at >= $1 AND m.occurred_at < $2');
    expect(sql).toContain('GROUP BY 1, 2');
    expect(sql).toContain('ORDER BY material_type COLLATE "C" ASC, supplier COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $5');
    expect(values).toEqual([new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.000Z'), null, null, 3]);
  });

  it('uses the composite cursor and marks the final page', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 3,
      total_spend: '1700.00',
      unpriced_receipt_count: 0,
      unpriced_quantity: '0',
      priced_receipt_count: 3,
      page_items: [group('glass', 'Supplier B', 400)],
    }] });

    const result = await listAnnualPurchasesPageDb({
      year: 2026,
      limit: 2,
      cursor: { materialType: 'glass', supplier: 'Supplier A' },
    });

    expect(result?.page).toEqual({ limit: 2, totalCount: 3, hasMore: false, nextCursor: null });
    expect(result?.groups.map(({ materialType, supplier }) => [materialType, supplier])).toEqual([['glass', 'Supplier B']]);
    const [, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual([new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.000Z'), 'glass', 'Supplier A', 3]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listAnnualPurchasesPageDb({ year: 2026, limit: 25, cursor: null })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
