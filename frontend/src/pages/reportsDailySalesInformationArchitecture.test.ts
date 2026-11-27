import { describe, expect, it } from 'vitest';
import reports from './Reports.tsx?raw';
import dailySales from './DailySales.tsx?raw';

function sectionPosition(source: string, heading: string): number {
  const position = source.indexOf(heading);
  expect(position, `expected section heading: ${heading}`).toBeGreaterThanOrEqual(0);
  return position;
}

describe('Reports and Daily Sales information architecture', () => {
  it('keeps report-range status summaries beside the report headline totals', () => {
    expect(sectionPosition(reports, 'Report Status Breakdowns')).toBeLessThan(
      sectionPosition(reports, 'Annual procurement spending'),
    );
    expect(reports).toContain('Orders in the selected delivery-date range');
    expect(reports).toContain('Order Status Breakdown');
    expect(reports).toContain('Payment Status Breakdown');
  });

  it('keeps Daily Sales breakdowns scoped to the selected UTC creation date', () => {
    expect(dailySales).toContain('Daily totals by order creation date (UTC)');
    expect(dailySales).toContain('Order date (UTC)');
    expect(dailySales).toContain("Breakdown title=\"Order status\"");
    expect(dailySales).toContain("Breakdown title=\"Payment status\"");
    expect(dailySales).toContain('summary totals do not change with list filters');
  });
});
