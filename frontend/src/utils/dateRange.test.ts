import { describe, expect, it } from 'vitest';
import { getDateRangeForPreset } from './dateRange';

describe('getDateRangeForPreset', () => {
  const anchorDate = new Date(2026, 0, 30, 12, 0, 0);

  it('returns a 30-day inclusive range ending on the anchor date', () => {
    expect(getDateRangeForPreset('30d', anchorDate)).toEqual({
      fromDate: '2026-01-01',
      toDate: '2026-01-30',
      days: 30,
    });
  });

  it('returns a 7-day inclusive range ending on the anchor date', () => {
    expect(getDateRangeForPreset('7d', anchorDate)).toEqual({
      fromDate: '2026-01-24',
      toDate: '2026-01-30',
      days: 7,
    });
  });
});
