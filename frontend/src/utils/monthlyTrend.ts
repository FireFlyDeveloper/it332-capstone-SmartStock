export interface CalendarMonthPoint {
  month: string;
}

function monthOrdinal(month: string): number | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]) - 1;
}

function monthStart(month: string): string {
  return `${month}-01`;
}

function monthEnd(month: string): string {
  const ordinal = monthOrdinal(month);
  if (ordinal === null) return '';
  const year = Math.floor(ordinal / 12);
  const monthIndex = ordinal % 12;
  return new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10);
}

/**
 * Return the latest pair of adjacent, fully selected, completed calendar months.
 * The current month is intentionally excluded because its totals are MTD.
 */
export function latestConsecutiveCompleteMonths<T extends CalendarMonthPoint>(
  rows: T[],
  fromDate = '',
  toDate = '',
  now = new Date(),
): { previous: T; current: T } | null {
  const currentMonth = now.toISOString().slice(0, 7);
  const fullMonths = rows
    .filter((row) => {
      const ordinal = monthOrdinal(row.month);
      if (ordinal === null || row.month >= currentMonth) return false;
      return (!fromDate || fromDate <= monthStart(row.month))
        && (!toDate || toDate >= monthEnd(row.month));
    })
    .slice()
    .sort((left, right) => left.month.localeCompare(right.month));

  for (let index = fullMonths.length - 1; index > 0; index -= 1) {
    const previous = fullMonths[index - 1];
    const current = fullMonths[index];
    const previousOrdinal = monthOrdinal(previous.month);
    const currentOrdinal = monthOrdinal(current.month);
    if (previousOrdinal !== null && currentOrdinal === previousOrdinal + 1) {
      return { previous, current };
    }
  }
  return null;
}

export function formatCalendarMonth(month: string, now = new Date()): string {
  const ordinal = monthOrdinal(month);
  if (ordinal === null) return month;
  const date = new Date(Date.UTC(Math.floor(ordinal / 12), ordinal % 12, 1));
  const label = date.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return month === now.toISOString().slice(0, 7) ? `${label} (MTD)` : label;
}
