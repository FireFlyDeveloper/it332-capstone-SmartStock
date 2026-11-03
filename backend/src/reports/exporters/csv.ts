import type { ReportDto } from '../service.js';

function csvCell(value: unknown): string {
  let text = value === null || value === undefined
    ? ''
    : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function titleFor(report: ReportDto): string {
  return report.report.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function exportReportCsv(report: ReportDto): Buffer {
  const lines: string[] = [
    ['SMARTSTOCK', 'Glassram Glass and Aluminum Supply'].map(csvCell).join(','),
    ['Report', titleFor(report)].map(csvCell).join(','),
  ];
  if ('year' in report) lines.push(['Year', report.year].map(csvCell).join(','));
  if ('generatedAt' in report) lines.push(['Generated at', report.generatedAt].map(csvCell).join(','));
  if ('method' in report) lines.push(['Method', report.method].map(csvCell).join(','));
  if ('assumption' in report) lines.push(['Assumption', report.assumption].map(csvCell).join(','));
  lines.push('', ['Summary metric', 'Value'].map(csvCell).join(','));
  for (const [key, value] of Object.entries(report.totals)) lines.push([key, value].map(csvCell).join(','));
  lines.push('', 'Details');

  if (report.report === 'policy_performance') {
    const headers = ['Product', 'SKU', 'Unit', 'Tracking days', 'Average on hand', 'Days at/below reorder point', 'Percent at/below reorder point', 'Out-of-stock days', 'Restock-level changes', 'Policy periods'];
    lines.push(headers.map(csvCell).join(','));
    for (const row of report.rows) lines.push([
      row.name, row.sku, row.unit, row.trackingDays, row.timeWeightedAverageOnHand,
      row.daysAtOrBelowReorderPoint, row.percentTimeAtOrBelowReorderPoint, row.outOfStockDays,
      row.reorderPointChanges, row.policyPeriods,
    ].map(csvCell).join(','));
  } else if (report.rows.length > 0) {
    const headers = [...new Set(report.rows.flatMap((row) => Object.keys(row)))];
    lines.push(headers.map(csvCell).join(','));
    for (const row of report.rows) lines.push(headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(','));
  } else {
    lines.push('"No rows available"');
  }

  return Buffer.from(`\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
}
