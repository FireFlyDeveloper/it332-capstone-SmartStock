import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
}));

vi.mock('./client.js', () => ({
  getPool: () => ({ connect: database.connect }),
}));

import { cancelOrderDb, recordInboundStockDb, recordOutboundStockDb } from './postgresStore.js';

const productRow = {
  id: 'product-1',
  sku: 'GLS-1',
  name: 'Test Glass',
  category: 'glass',
  unit: 'sheet',
  stock: '12',
  threshold: '4',
  min_stock: '4',
  unit_price: '100',
  status: 'active',
  description: null,
};

const movementInput = {
  quantity: 2,
  referenceNo: 'PO-1',
  supplier: 'Verified Supplier',
  createdBy: 'admin@example.test',
  occurredAt: '2026-10-30T00:00:00.000Z',
};

describe('inventory PostgreSQL movement transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.connect.mockResolvedValue({ query: database.query, release: database.release });
  });

  it('uses one checked-out client and returns inbound stock only after commit', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...productRow, stock: '14' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const saved = await recordInboundStockDb('product-1', { ...movementInput, id: 'movement-1' });

    expect(saved?.product.stock).toBe(14);
    expect(saved?.movement).toMatchObject({
      id: 'movement-1',
      productId: 'product-1',
      type: 'inbound',
      quantity: 2,
      referenceNo: 'PO-1',
      supplier: 'Verified Supplier',
    });
    expect(database.connect).toHaveBeenCalledOnce();
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'UPDATE', 'INSERT', 'COMMIT',
    ]);
    expect(database.release).toHaveBeenCalledOnce();
  });

  it('rolls back an inbound stock change if movement insertion fails', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...productRow, stock: '14' }] })
      .mockRejectedValueOnce(new Error('movement insert failed'))
      .mockResolvedValueOnce({ rows: [] });

    await expect(recordInboundStockDb('product-1', movementInput)).rejects.toThrow('movement insert failed');
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'UPDATE', 'INSERT', 'ROLLBACK',
    ]);
    expect(database.release).toHaveBeenCalledOnce();
  });

  it('locks outbound stock before decrementing and records the movement in the same transaction', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ stock: '12' }] })
      .mockResolvedValueOnce({ rows: [{ ...productRow, stock: '10' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const saved = await recordOutboundStockDb('product-1', { ...movementInput, id: 'movement-2' });

    expect(saved?.product.stock).toBe(10);
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'SELECT', 'UPDATE', 'INSERT', 'COMMIT',
    ]);
    expect(String(database.query.mock.calls[1][0])).toContain('FOR UPDATE');
    expect(database.release).toHaveBeenCalledOnce();
  });

  it('rejects insufficient outbound stock without decrementing it', async () => {
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ stock: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(recordOutboundStockDb('product-1', movementInput)).rejects.toThrow('insufficient stock');
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'SELECT', 'ROLLBACK',
    ]);
    expect(database.release).toHaveBeenCalledOnce();
  });

  it('cancels and refunds an order atomically with inventory restoration', async () => {
    const orderRow = {
      id: 'order-1', order_no: 'SS-1', customer_name: 'Customer', customer_phone: '',
      delivery_address: '', delivery_date: '2026-10-30',
      items: JSON.stringify([{ productId: 'product-1', name: 'Test Glass', quantity: 2, unitPrice: 100, lineTotal: 200 }]),
      subtotal: '200', total_amount: '200', paid_amount: '80', payment_status: 'partial',
      order_status: 'processing', refunded_amount: '10', created_at: '2026-10-30T00:00:00.000Z',
      updated_at: '2026-10-30T00:00:00.000Z',
    };
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [orderRow] })
      .mockResolvedValueOnce({ rows: [{ ...productRow, stock: '14' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...orderRow, paid_amount: '0', refunded_amount: '90', payment_status: 'refunded', order_status: 'cancelled' }] })
      .mockResolvedValueOnce({ rows: [] });

    const cancelled = await cancelOrderDb('order-1');

    expect(cancelled?.order).toMatchObject({ orderStatus: 'cancelled', paidAmount: 0, refundedAmount: 90, paymentStatus: 'refunded' });
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'SELECT', 'UPDATE', 'INSERT', 'UPDATE', 'COMMIT',
    ]);
    expect(String(database.query.mock.calls[1][0])).toContain('FOR UPDATE');
    expect(database.release).toHaveBeenCalledOnce();
  });

  it('rolls back cancellation when an order product cannot be restored', async () => {
    const orderRow = {
      id: 'order-1', order_no: 'SS-1', customer_name: 'Customer', customer_phone: '',
      delivery_address: '', delivery_date: '2026-10-30',
      items: JSON.stringify([{ productId: 'product-1', name: 'Test Glass', quantity: 2, unitPrice: 100, lineTotal: 200 }]),
      subtotal: '200', total_amount: '200', paid_amount: '80', payment_status: 'partial',
      order_status: 'processing', refunded_amount: '0', created_at: '2026-10-30T00:00:00.000Z',
      updated_at: '2026-10-30T00:00:00.000Z',
    };
    database.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [orderRow] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(cancelOrderDb('order-1')).rejects.toThrow('Product not found while restoring stock');
    expect(database.query.mock.calls.map(([sql]) => String(sql).trim().split(/\s+/)[0])).toEqual([
      'BEGIN', 'SELECT', 'UPDATE', 'ROLLBACK',
    ]);
    expect(database.release).toHaveBeenCalledOnce();
  });
});
