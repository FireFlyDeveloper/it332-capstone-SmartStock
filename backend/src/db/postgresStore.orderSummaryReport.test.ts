import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { getOrderSummaryReportDb } from './postgresStore.js';

describe('PostgreSQL Reports order summary query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps full-set totals and forwards delivery-date boundaries', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_orders: 7,
      total_sales: '540.25',
      completed_count: 3,
      pending_orders: 2,
      cancelled_count: 1,
      paid_count: 2,
      pending_payment_count: 2,
      partial_count: 2,
      refunded_count: 1,
    }] });

    await expect(getOrderSummaryReportDb('2026-01-01', '2026-01-31')).resolves.toEqual({
      totalOrders: 7,
      totalSales: 540.25,
      completedCount: 3,
      pendingOrders: 2,
      statusCounts: { completed: 3, inProgress: 2, pending: 0, cancelled: 1 },
      paymentCounts: { paid: 2, pending: 2, partial: 2, refunded: 1 },
    });
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('WITH filtered_orders AS MATERIALIZED');
    expect(sql).toContain('SUM(total_amount) FILTER');
    expect(sql).toContain("order_status = 'delivered'");
    expect(sql).toContain("order_status = 'processing'");
    expect(sql).toContain("payment_status = 'refunded'");
    expect(values).toEqual(['2026-01-01', '2026-01-31']);
  });

  it('returns a zero-valued DTO for an empty date range', async () => {
    database.query.mockResolvedValue({ rows: [{
      total_orders: 0, total_sales: 0, completed_count: 0, pending_orders: 0,
      cancelled_count: 0, paid_count: 0, pending_payment_count: 0, partial_count: 0, refunded_count: 0,
    }] });
    await expect(getOrderSummaryReportDb('2026-02-01', '2026-02-28')).resolves.toEqual({
      totalOrders: 0,
      totalSales: 0,
      completedCount: 0,
      pendingOrders: 0,
      statusCounts: { completed: 0, inProgress: 0, pending: 0, cancelled: 0 },
      paymentCounts: { paid: 0, pending: 0, partial: 0, refunded: 0 },
    });
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(getOrderSummaryReportDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
