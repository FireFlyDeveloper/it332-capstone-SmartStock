import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { createProductDb, listProductsPageDb, updateProductDb } from './postgresStore.js';

const product = (id: string, name: string) => ({
  id,
  sku: id.toUpperCase(),
  name,
  category: 'glass',
  unit: 'sheet',
  stock: 10,
  unit_price: 125,
  cost_price: 75,
  threshold: 5,
  status: 'active',
  description: 'clear panel',
});

describe('PostgreSQL product cursor query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('writes and reads the supplier cost price separately from the selling price', async () => {
    const createdRow = { ...product('cost-product', 'Cost item'), unit_price: '120', cost_price: '75', stock: 4, threshold: 2 };
    database.query.mockResolvedValueOnce({ rows: [createdRow] });

    const created = await createProductDb({
      id: 'cost-product',
      sku: 'cost-product',
      name: 'Cost item',
      category: 'glass',
      unit: 'sheet',
      stock: 4,
      price: 120,
      costPrice: 75,
      threshold: 2,
      status: 'active',
    });
    expect(created).toMatchObject({ price: 120, costPrice: 75 });
    const [insertSql, insertValues] = database.query.mock.calls[0] as [string, unknown[]];
    expect(insertSql).toContain('unit_price, cost_price, status');
    expect(insertValues).toEqual(['cost-product', 'COST-PRODUCT', 'Cost item', 'glass', 'sheet', 4, 2, 120, 75, 'active', null]);

    const currentRow = { ...createdRow, cost_price: '75' };
    const updatedRow = { ...createdRow, cost_price: '95' };
    database.query.mockResolvedValueOnce({ rows: [currentRow] }).mockResolvedValueOnce({ rows: [updatedRow] });
    const updated = await updateProductDb('cost-product', { costPrice: 95 });
    expect(updated).toMatchObject({ price: 120, costPrice: 95 });
    const [updateSql, updateValues] = database.query.mock.calls[2] as [string, unknown[]];
    expect(updateSql).toContain('unit_price = $7, cost_price = $8');
    expect(updateValues).toEqual(['cost-product', 'COST-PRODUCT', 'Cost item', 'glass', 'sheet', 4, 120, 95, 2, 'active', 'clear panel']);
  });

  it('filters, summarizes and keyset-pages inventory products', async () => {
    database.query.mockResolvedValue({ rows: [{
      filtered_count: 3,
      total_products: 5,
      glass_count: 2,
      aluminum_count: 2,
      low_stock_count: 1,
      out_of_stock_count: 0,
      total_inventory_value: '37500',
      glass_inventory_value: '30000',
      aluminum_inventory_value: '6300',
      accessory_inventory_value: '1200',
      active_product_count: 3,
      active_glass_count: 2,
      active_aluminum_count: 1,
      active_low_stock_count: 1,
      healthy_stock_count: 2,
      low_stock_status_count: 1,
      critical_stock_count: 0,
      stock_alert_out_of_stock: { id: 'p-03', name: 'Empty', stock: 0, unit: 'sheet', threshold: 5 },
      stock_alert_critical: null,
      stock_alert_low: { id: 'p-02', name: 'Low', stock: 3, unit: 'sheet', threshold: 5 },
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
      totalProducts: 5,
      glassCount: 2,
      aluminumCount: 2,
      lowStockCount: 1,
      outOfStockCount: 0,
      totalInventoryValue: 37500,
      glassInventoryValue: 30000,
      aluminumInventoryValue: 6300,
      accessoryInventoryValue: 1200,
      activeProductCount: 3,
      activeGlassCount: 2,
      activeAluminumCount: 1,
      activeLowStockCount: 1,
      healthyStockCount: 2,
      lowStockStatusCount: 1,
      criticalStockCount: 0,
      stockAlertProducts: {
        outOfStock: { id: 'p-03', name: 'Empty', stock: 0, unit: 'sheet', threshold: 5 },
        critical: null,
        low: { id: 'p-02', name: 'Low', stock: 3, unit: 'sheet', threshold: 5 },
      },
      hasMore: true,
      nextCursor: { name: 'Aluminum?', id: 'p-01' },
      items: [{ id: 'p-01', name: 'Aluminum?', price: 125, costPrice: 75, threshold: 5 }],
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM unnest($3::text[]) AS tokens(term)');
    expect(sql).toContain('POSITION(term IN LOWER(CONCAT_WS');
    expect(sql).toContain('name COLLATE "C" > $4::text COLLATE "C"');
    expect(sql).toContain('ORDER BY page_rows.name COLLATE "C" ASC');
    expect(sql).toContain("SUM(stock * unit_price) FILTER (WHERE category = 'accessory')");
    expect(sql).toContain('LIMIT $6');
    expect(values).toEqual(['glass', 'low', ['clear', 'sheet'], 'Before', 'p-00', 2]);
  });

  it('reads and filters accessory-category products', async () => {
    database.query.mockResolvedValueOnce({ rows: [{
      filtered_count: 1,
      total_products: 1,
      accessory_inventory_value: '1200',
      page_items: [{ ...product('accessory-01', 'Accessory item'), category: 'accessory' }],
    }] });

    const result = await listProductsPageDb({
      limit: 10,
      category: 'accessory',
      stock: 'all',
      searchTokens: [],
      cursorName: null,
      cursorId: null,
    });

    expect(result?.items).toMatchObject([{ category: 'accessory', sku: 'ACCESSORY-01' }]);
    expect(result?.accessoryInventoryValue).toBe(1200);
    const [query, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(query).toContain("$1::text = 'all' OR p.category = $1::text");
    expect(values[0]).toBe('accessory');
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
