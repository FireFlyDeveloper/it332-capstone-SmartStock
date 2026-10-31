import { beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ query: vi.fn(), available: true }));

vi.mock('./client.js', () => ({
  getPool: () => database.available ? { query: database.query } : null,
}));

import { listInsightMovementSummaryDb, listInsightPurchaseSummaryDb } from './postgresStore.js';

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

  it('returns null for both summaries if PostgreSQL is not configured', async () => {
    database.available = false;
    await expect(listInsightMovementSummaryDb()).resolves.toBeNull();
    await expect(listInsightPurchaseSummaryDb()).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });
});
