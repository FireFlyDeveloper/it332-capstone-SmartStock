import { describe, expect, it } from 'vitest';
import { formatCalendarMonth, latestConsecutiveCompleteMonths } from './monthlyTrend';

describe('monthly calendar trend comparisons', () => {
  const now = new Date('2026-04-15T12:00:00.000Z');

  it('compares only adjacent calendar months and retains zero-order months', () => {
    const rows = [
      { month: '2026-01', value: 12 },
      { month: '2026-02', value: 0 },
      { month: '2026-03', value: 8 },
      { month: '2026-04', value: 2 },
    ];
    expect(latestConsecutiveCompleteMonths(rows, '', '', now)).toEqual({
      previous: rows[1],
      current: rows[2],
    });
  });

  it('does not compare across a missing calendar month', () => {
    const rows = [{ month: '2026-01' }, { month: '2026-03' }, { month: '2026-04' }];
    expect(latestConsecutiveCompleteMonths(rows, '', '', now)).toBeNull();
  });

  it('excludes the incomplete current month from comparisons', () => {
    const rows = [{ month: '2026-02', value: 40 }, { month: '2026-03', value: 10 }, { month: '2026-04', value: 1 }];
    expect(latestConsecutiveCompleteMonths(rows, '', '', now)).toEqual({
      previous: rows[0],
      current: rows[1],
    });
  });

  it('suppresses comparisons for partially selected calendar months', () => {
    const rows = [{ month: '2026-02' }, { month: '2026-03' }, { month: '2026-04' }];
    expect(latestConsecutiveCompleteMonths(rows, '2026-02-10', '2026-04-15', now)).toBeNull();
  });

  it('labels the current calendar month as month-to-date', () => {
    expect(formatCalendarMonth('2026-04', now)).toBe('Apr 2026 (MTD)');
    expect(formatCalendarMonth('2026-03', now)).toBe('Mar 2026');
  });
});
