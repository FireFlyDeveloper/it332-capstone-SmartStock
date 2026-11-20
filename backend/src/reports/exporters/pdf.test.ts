import { describe, expect, it } from 'vitest';
import { buildPdfTableSections, exportReportPdf } from './pdf.js';
import type { ReportDto } from '../service.js';

const purchaseReport = {
  report: 'annual_purchases',
  year: 2026,
  totals: { groups: 1, transactionCount: 1, totalQuantity: 2, totalCost: 125.5, unpricedReceiptCount: 0, unpricedQuantity: 0 },
  rows: [{
    materialType: 'glass', supplier: 'Supplier A', productId: 'internal-id', productName: 'Clear Glass', sku: 'GLS-1', unit: 'sheet',
    transactionCount: 1, totalQuantity: 2, totalCost: 125.5, unpricedReceiptCount: 0, unpricedQuantity: 0,
  }],
} satisfies ReportDto;

const policyReport = {
  report: 'policy_performance',
  trackingStart: '2026-01-01T00:00:00.000Z',
  generatedAt: '2026-02-01T00:00:00.000Z',
  method: 'Observed snapshots',
  assumption: 'No history before activation.',
  totals: { products: 1, productsWithHistory: 1, trackingDays: 31, outOfStockProductCount: 0, reorderPointChanges: 1 },
  rows: [{
    productId: 'internal-id', sku: 'GLS-1', name: 'Clear Glass', unit: 'sheet', trackingStartedAt: '2026-01-01T00:00:00.000Z',
    policyPeriods: [{
      startedAt: '2026-01-01T00:00:00.000Z', endedAt: null, reorderPoint: 4, trackingDays: 31,
      timeWeightedAverageOnHand: 5.25, daysAtOrBelowReorderPoint: 2, percentTimeAtOrBelowReorderPoint: 6.45, outOfStockDays: 0,
    }],
    trackingDays: 31, timeWeightedAverageOnHand: 5.25, daysAtOrBelowReorderPoint: 2,
    percentTimeAtOrBelowReorderPoint: 6.45, outOfStockDays: 0, reorderPointChanges: 1,
    currentStock: 5, currentReorderPoint: 4, status: 'above_reorder_point',
  }],
} satisfies ReportDto;

describe('PDF report tables', () => {
  it('formats purchase rows as a labeled table and omits internal product IDs', () => {
    const [table] = buildPdfTableSections(purchaseReport);
    expect(table.columns).toContain('Product Name');
    expect(table.columns).toContain('Recorded Cost');
    expect(table.columns).not.toContain('Product Id');
    expect(table.rows[0]).toContain('Clear Glass');
    expect(table.rows[0]).toContain('PHP 125.50');
    expect(table.rows[0]).not.toContain('PHP 0.00');
  });

  it('places nested policy periods into a separate readable table', () => {
    const tables = buildPdfTableSections(policyReport);
    expect(tables).toHaveLength(2);
    expect(tables[1].title).toBe('Restock-Level History');
    expect(tables[1].columns).toContain('Restock Level');
    expect(tables[0].rows[0]).toContain('Above restock level');
    expect(tables[0].rows[0]).toContain('2026-01-01');
    expect(tables[1].rows[0]).toContain('Current');
    expect(tables[1].rows[0]).not.toContain('[object Object]');
  });

  it('generates a valid PDF containing the summary and table sections', async () => {
    const pdf = await exportReportPdf(purchaseReport);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});
