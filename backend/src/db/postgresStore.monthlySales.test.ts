import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listMonthlySalesTrendDb } from './postgresStore.js';

describe('PostgreSQL monthly sales trend query', () => {
  beforeEach(() => {
    database.available = true;
    vi.clearAllMocks();
  });

  it('maps grouped months and applies the selected range and fixed clock', async () => {
    const now = new Date('2026-03-15T12:00:00.000Z');
    database.query.mockResolvedValue({ rows: [
      { month: '2025-10', transaction_count: 0, gross_sales: 0 },
      { month: '2025-11', transaction_count: 2, gross_sales: '250.5' },
      { month: '2025-12', transaction_count: 0, gross_sales: 0 },
      { month: '2026-03', transaction_count: 1, gross_sales: '100' },
    ] });

    await expect(listMonthlySalesTrendDb('6M', now)).resolves.toEqual([
      { month: '2025-10', transactionCount: 0, grossSales: 0 },
      { month: '2025-11', transactionCount: 2, grossSales: 250.5 },
      { month: '2025-12', transactionCount: 0, grossSales: 0 },
      { month: '2026-03', transactionCount: 1, grossSales: 100 },
    ]);
    const [sql, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("date_trunc('month', (o.created_at AT TIME ZONE 'UTC'))");
    expect(sql).toContain("o.order_status <> 'cancelled'");
    expect(sql).toContain("WHEN '6M' THEN current_month - INTERVAL '5 months'");
    expect(sql).toContain("WHEN '1Y' THEN current_month - INTERVAL '11 months'");
    expect(sql).toContain('generate_series(');
    expect(values).toEqual(['6M', now]);
  });

  it('passes null range for the unpadded all-observed-months report', async () => {
    database.query.mockResolvedValue({ rows: [] });
    await expect(listMonthlySalesTrendDb(undefined, new Date('2026-03-15T12:00:00.000Z'))).resolves.toEqual([]);
    const [, values] = database.query.mock.calls[0] as [string, unknown[]];
    expect(values).toEqual([null, new Date('2026-03-15T12:00:00.000Z')]);
  });

  it('returns null when PostgreSQL is unavailable', async () => {
    database.available = false;
    await expect(listMonthlySalesTrendDb('ALL', new Date())).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
