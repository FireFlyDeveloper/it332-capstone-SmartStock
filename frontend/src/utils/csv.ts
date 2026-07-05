/**
 * Shared CSV export utility. Used by the operational pages (Inventory,
 * Orders, Delivery) so the export format stays consistent — same quoting
 * rules, same RFC 4180 escaping, same trigger flow.
 *
 * Last touched: 2026-07-07
 */

export type CsvCell = string | number | boolean | null | undefined;

/** Escape a single cell value for CSV output. */
function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // RFC 4180: wrap in quotes if the value contains a comma, quote, or newline.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert an array of plain objects to a CSV string. */
export function toCSV<T extends object>(
  rows: readonly T[],
  columns: { key: keyof T; header: string }[],
): string {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((c) => {
      const value = (row as Record<string, unknown>)[c.key as string];
      return escapeCell(value as CsvCell);
    }).join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}

/** Trigger a browser download of the given CSV content. */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
