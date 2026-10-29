import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistence = vi.hoisted(() => ({
  createProductDb: vi.fn(),
  updateProductDb: vi.fn(),
  deleteProductDb: vi.fn(),
  recordInboundStockDb: vi.fn(),
  recordOutboundStockDb: vi.fn(),
  listInventoryPolicyHistoryDb: vi.fn(),
}));

const sync = vi.hoisted(() => ({
  isDbSyncActive: vi.fn(),
}));

vi.mock('../db/postgresStore.js', () => persistence);
vi.mock('../db/syncState.js', () => sync);

import { _resetInventoryStore, createProduct, listProducts, type ProductCreateInput } from './store.js';
import { addProductRecord } from './service.js';

const PRODUCT: ProductCreateInput = {
  sku: 'NEW-PRODUCT-01',
  name: 'New Product',
  category: 'glass',
  unit: 'sheet',
  stock: 0,
  price: 100,
  threshold: 4,
};

describe('inventory product persistence', () => {
  beforeEach(() => {
    sync.isDbSyncActive.mockReturnValue(false);
    _resetInventoryStore(false);
    vi.clearAllMocks();
  });

  it('waits for PostgreSQL to confirm a new product before exposing it in memory', async () => {
    let resolveInsert!: (product: Awaited<ReturnType<typeof createProduct>>) => void;
    persistence.createProductDb.mockImplementation(
      () => new Promise((resolve) => { resolveInsert = resolve; }),
    );
    sync.isDbSyncActive.mockReturnValue(true);

    const pending = createProduct(PRODUCT);
    expect(persistence.createProductDb).toHaveBeenCalledOnce();
    expect(listProducts()).toEqual([]);

    const persisted = { ...(persistence.createProductDb.mock.calls[0][0] as object), status: 'active' as const };
    resolveInsert(persisted as Awaited<ReturnType<typeof createProduct>>);
    await expect(pending).resolves.toEqual(persisted);
    expect(listProducts()).toEqual([persisted]);
  });

  it('returns a save error and does not cache a product when PostgreSQL rejects the insert', async () => {
    persistence.createProductDb.mockRejectedValue(new Error('database write failed'));
    sync.isDbSyncActive.mockReturnValue(true);

    await expect(addProductRecord(PRODUCT)).resolves.toMatchObject({
      ok: false,
      status: 503,
      error: 'product could not be saved; please try again',
    });
    expect(listProducts()).toEqual([]);
  });
});
