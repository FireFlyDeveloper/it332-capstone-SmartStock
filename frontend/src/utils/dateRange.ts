import { formatDateInput } from './helpers';

export type QuickDateRangePreset = '7d' | '30d';
export type DateRangePreset = QuickDateRangePreset | 'custom';

export function getDateRangeForPreset(preset: QuickDateRangePreset, anchorDate = new Date()) {
  const days = preset === '7d' ? 7 : 30;
  const to = new Date(anchorDate);
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));

  return {
    fromDate: formatDateInput(from),
    toDate: formatDateInput(to),
    days,
  };
}
