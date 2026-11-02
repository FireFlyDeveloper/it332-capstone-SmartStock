import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listAnnualPurchasesPageDb } from './postgresStore.js';

const group = (material_type: string, supplier: string, product_id: string, total_cost: number) => ({
  material_type,
  supplier,
  product_id,
  product_name: `Product ${product_id}`,
  sku: `SKU-${product_id}`,
  unit: 'sheet',
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

  it('returns product-level groups and full-year totals with a stable composite cursor', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 4,
      total_spend: '1900.00',
      unpriced_receipt_count: 0,
      unpriced_quantity: '0',
      priced_receipt_count: 4,
      page_items: [
        group('aluminum', 'Supplier A', 'alum-1', 300),
        group('glass', 'Supplier A', 'glass-1', 1000),
        group('glass', 'Supplier A', 'glass-2', 200),
      ],
    }] });

    const result = await listAnnualPurchasesPageDb({ year: 2026, limit: 2, cursor: null });

    expect(result).toEqual({
      groups: [
        { materialType: 'aluminum', supplier: 'Supplier A', productId: 'alum-1', productName: 'Product alum-1', sku: 'SKU-alum-1', unit: 'sheet', transactionCount: 1, totalQuantity: 2, totalCost: 300, unpricedReceiptCount: 0, unpricedQuantity: 0 },
        { materialType: 'glass', supplier: 'Supplier A', productId: 'glass-1', productName: 'Product glass-1', sku: 'SKU-glass-1', unit: 'sheet', transactionCount: 1, totalQuantity: 2, totalCost: 1000, unpricedReceiptCount: 0, unpricedQuantity: 0 },
      ],
      totalSpend: 1900,
      unpricedReceiptCount: 0,
      unpricedQuantity: 0,
      pricedReceiptCount: 4,
      page: { limit: 2, totalCount: 4, hasMore: true, nextCursor: { materialType: 'glass', supplier: 'Supplier A', productId: 'glass-1' } },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM stock_movements m');
    expect(sql).toContain('m.occurred_at >= $1 AND m.occurred_at < $2');
    expect(sql).toContain('GROUP BY 1, 2, 3, 4, 5, 6');
    expect(sql).toContain('ORDER BY material_type COLLATE "C" ASC, supplier COLLATE "C" ASC, product_id COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $6');
    expect(values).toEqual([new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.000Z'), null, null, null, 3]);
  });

  it('uses the composite cursor and marks the final page', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_count: 4,
      total_spend: '1900.00',
      unpriced_receipt_count: 0,
      unpriced_quantity: '0',
      priced_receipt_count: 4,
      page_items: [group('glass', 'Supplier A', 'glass-2', 200), group('glass', 'Supplier B', 'glass-1', 400)],
    }] });

    const result = await listAnnualPurchasesPageDb({
      year: 2026,
      limit: 2,
      cursor: { materialType: 'glass', supplier: 'Supplier A', productId: 'glass-1' },
    });

    expect(result?.page).toEqual({ limit: 2, totalCount: 4, hasMore: false, nextCursor: null });
    expect(result?.groups.map(({ materialType, supplier, productId }) => [materialType, supplier, productId])).toEqual([
      ['glass', 'Supplier A', 'glass-2'], ['glass', 'Supplier B', 'glass-1'],
    ]);
    const [, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual([new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.000Z'), 'glass', 'Supplier A', 'glass-1', 3]);
  });

  it('returns null when the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listAnnualPurchasesPageDb({ year: 2026, limit: 25, cursor: null })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
