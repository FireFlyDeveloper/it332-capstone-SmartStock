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

import { _resetInventoryStore, createProduct, deleteProduct, listProductMovements, listProducts, recordInboundStock, recordOutboundStock, updateProduct, type Product, type ProductCreateInput, type StockMovement } from './store.js';
import { addInboundStockRecord, addProductRecord, editProductRecord, removeProductRecord } from './service.js';

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

  it('does not expose inbound stock before PostgreSQL commits the movement', async () => {
    const product = await createProduct(PRODUCT);
    let resolveMovement!: (value: { product: Product; movement: StockMovement } | null) => void;
    persistence.recordInboundStockDb.mockImplementation(
      () => new Promise((resolve) => { resolveMovement = resolve; }),
    );
    sync.isDbSyncActive.mockReturnValue(true);

    const movement: StockMovement = {
      id: 'MOV-PERSISTED-1',
      productId: product.id,
      type: 'inbound',
      quantity: 3,
      referenceNo: 'PO-PERSISTED-1',
      supplier: 'Verified Supplier',
      occurredAt: '2026-10-30T00:00:00.000Z',
      createdBy: 'admin@example.test',
    };
    const persistedProduct = { ...product, stock: 3 };
    const pending = Promise.resolve(recordInboundStock(product.id, {
      quantity: 3,
      referenceNo: movement.referenceNo,
      supplier: movement.supplier,
      createdBy: movement.createdBy,
      occurredAt: movement.occurredAt,
    }));

    expect(listProducts().find((item) => item.id === product.id)?.stock).toBe(0);
    expect(listProductMovements(product.id)).toEqual([]);

    resolveMovement({ product: persistedProduct, movement });
    await expect(pending).resolves.toEqual({ product: persistedProduct, movement });
    expect(listProducts().find((item) => item.id === product.id)).toEqual(persistedProduct);
    expect(listProductMovements(product.id)).toEqual([movement]);
  });

  it('applies product updates from PostgreSQL only after the write resolves', async () => {
    const product = await createProduct(PRODUCT);
    const persisted = { ...product, name: 'Persisted name' };
    let resolveUpdate!: (value: Product | null) => void;
    persistence.updateProductDb.mockImplementation(
      () => new Promise((resolve) => { resolveUpdate = resolve; }),
    );
    sync.isDbSyncActive.mockReturnValue(true);

    const pending = updateProduct(product.id, { name: 'Persisted name' });
    expect(listProducts()).toEqual([product]);

    resolveUpdate(persisted);
    await expect(pending).resolves.toEqual(persisted);
    expect(listProducts()).toEqual([persisted]);
  });

  it('preserves inventory cache when PostgreSQL update, delete or outbound writes fail', async () => {
    const product = await createProduct(PRODUCT);
    sync.isDbSyncActive.mockReturnValue(true);

    persistence.updateProductDb.mockRejectedValueOnce(new Error('database write failed'));
    await expect(updateProduct(product.id, { name: 'Unsaved name' })).rejects.toThrow('database write failed');
    expect(listProducts()).toEqual([product]);

    persistence.deleteProductDb.mockRejectedValueOnce(new Error('database write failed'));
    await expect(deleteProduct(product.id)).rejects.toThrow('database write failed');
    expect(listProducts()).toEqual([product]);

    persistence.recordOutboundStockDb.mockRejectedValueOnce(new Error('database write failed'));
    await expect(recordOutboundStock(product.id, { quantity: 1, referenceNo: 'SO-FAIL' }))
      .rejects.toThrow('database write failed');
    expect(listProducts()).toEqual([product]);
    expect(listProductMovements(product.id)).toEqual([]);
  });

  it('returns service errors instead of success when product writes fail', async () => {
    const product = await createProduct(PRODUCT);
    sync.isDbSyncActive.mockReturnValue(true);
    persistence.updateProductDb.mockRejectedValueOnce(new Error('database unavailable'));
    persistence.deleteProductDb.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(editProductRecord(product.id, { name: 'Unsaved' })).resolves.toMatchObject({ ok: false, status: 503 });
    await expect(removeProductRecord(product.id)).resolves.toMatchObject({ ok: false, status: 503 });
    expect(listProducts()).toEqual([product]);
  });

  it('returns an error and preserves cache when inbound PostgreSQL write fails', async () => {
    const product = await createProduct(PRODUCT);
    persistence.recordInboundStockDb.mockRejectedValueOnce(new Error('database unavailable'));
    sync.isDbSyncActive.mockReturnValue(true);

    await expect(addInboundStockRecord(product.id, {
      quantity: 2,
      referenceNo: 'PO-FAIL',
      supplier: 'Verified Supplier',
    })).resolves.toMatchObject({ ok: false, status: 503 });
    expect(listProducts()).toEqual([product]);
    expect(listProductMovements(product.id)).toEqual([]);
  });
});
