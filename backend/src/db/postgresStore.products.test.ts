import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listProductsPageDb } from './postgresStore.js';

const product = (id: string, name: string) => ({
  id,
  sku: id.toUpperCase(),
  name,
  category: 'glass',
  unit: 'sheet',
  stock: 10,
  unit_price: 125,
  threshold: 5,
  status: 'active',
  description: 'clear panel',
});

describe('PostgreSQL product cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('filters, summarizes and keyset-pages inventory products', async () => {
    database.query.mockResolvedValue({ rows: [{
      filtered_count: 3,
      total_products: 4,
      glass_count: 2,
      aluminum_count: 2,
      low_stock_count: 1,
      out_of_stock_count: 0,
      page_items: [product('p-01', 'Aluminum?'), product('p-02', 'Clear Glass')],
    }] });

    const result = await listProductsPageDb({
      limit: 1,
      category: 'glass',
      stock: 'low',
      searchTokens: ['clear', 'sheet'],
      cursorName: 'Before',
      cursorId: 'p-00',
    });

    expect(result).toMatchObject({
      totalCount: 3,
      totalProducts: 4,
      glassCount: 2,
      aluminumCount: 2,
      lowStockCount: 1,
      outOfStockCount: 0,
      hasMore: true,
      nextCursor: { name: 'Aluminum?', id: 'p-01' },
      items: [{ id: 'p-01', name: 'Aluminum?', price: 125, threshold: 5 }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM unnest($3::text[]) AS tokens(term)');
    expect(sql).toContain('POSITION(term IN LOWER(CONCAT_WS');
    expect(sql).toContain('name COLLATE "C" > $4::text COLLATE "C"');
    expect(sql).toContain('ORDER BY page_rows.name COLLATE "C" ASC');
    expect(sql).toContain('LIMIT $6');
    expect(values).toEqual(['glass', 'low', ['clear', 'sheet'], 'Before', 'p-00', 2]);
  });

  it('returns null if the PostgreSQL pool is unavailable', async () => {
    database.available = false;
    await expect(listProductsPageDb({
      limit: 25,
      category: 'all',
      stock: 'all',
      searchTokens: [],
      cursorName: null,
      cursorId: null,
    })).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
