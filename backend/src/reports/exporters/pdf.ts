/**
 * PDF report exporter — renders SmartStock report DTOs as paginated tables.
 *
 * Author: FireFlyDeveloper
 */

import PDFDocument from 'pdfkit';
import type { ReportDto } from '../service.js';

export interface PdfTableSection {
  title: string;
  columns: string[];
  rows: string[][];
}

const CURRENCY_FIELD = /(?:price|cost|spend|sales|revenue|inventoryvalue|amount|value)$/i;
const PERCENT_FIELD = /(?:percent|percentage|share)/i;
const HIDDEN_FIELD = /^(?:id|productid)$/i;
const STATUS_LABELS: Record<string, string> = {
  above_reorder_point: 'Above restock level',
  at_or_below_reorder_point: 'At/below restock level',
  below_reorder_point: 'Below restock level',
  below_forecast: 'May run low',
  healthy: 'Healthy',
  low_stock: 'Low stock',
};

function titleFor(report: ReportDto): string {
  return report.report
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function labelFor(key: string): string {
  const labels: Record<string, string> = {
    totalCost: 'Recorded Cost',
    totalSpend: 'Recorded Spend',
    unitPrice: 'Listed Price',
    costPrice: 'Unit Cost',
    inventoryValue: 'Inventory Value',
    grossSales: 'Gross Sales',
    transactionCount: 'Transactions',
    unpricedReceiptCount: 'Unpriced Receipts',
    unpricedQuantity: 'Unpriced Quantity',
    timeWeightedAverageOnHand: 'Average On Hand',
    daysAtOrBelowReorderPoint: 'Days At/Below Restock Level',
    percentTimeAtOrBelowReorderPoint: 'Time At/Below Level',
    outOfStockDays: 'Out-of-Stock Days',
    currentReorderPoint: 'Current Restock Level',
    reorderPoint: 'Restock Level',
    forecastQuantity: 'Estimated Quantity',
    recommendedOrderQuantity: 'Suggested Restock',
  };
  if (labels[key]) return labels[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\bsku\b/gi, 'SKU')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\b(\w)/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number, minimumFractionDigits = 0): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits, maximumFractionDigits: 2 }).format(value);
}

function formatValue(value: unknown, field = ''): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    if (PERCENT_FIELD.test(field)) return `${formatNumber(value)}%`;
    if (CURRENCY_FIELD.test(field)) return `${value < 0 ? '-' : ''}PHP ${formatNumber(Math.abs(value), 2)}`;
    return formatNumber(value);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((entry) => formatValue(entry)).join('; ');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => `${labelFor(key)}: ${formatValue(nested, key)}`)
      .join('; ');
  }
  if (typeof value === 'string') {
    if (field === 'history') {
      try {
        const history: unknown = JSON.parse(value);
        if (Array.isArray(history)) {
          return history.map((entry) => {
            if (entry && typeof entry === 'object') {
              const row = entry as Record<string, unknown>;
              return `${String(row.month ?? '')}: ${formatValue(row.quantity, 'quantity')}`;
            }
            return formatValue(entry);
          }).join('; ');
        }
      } catch {
        // Keep the original field value when it is not JSON.
      }
    }
    if (STATUS_LABELS[value]) return STATUS_LABELS[value];
    if (/^\d{4}-\d{2}-\d{2}T/.test(value) && field === 'generatedAt') {
      return value.replace('T', ' ').replace(/\.\d+Z$/, ' UTC').replace(/Z$/, ' UTC');
    }
    if (/^(?:\d{4}-\d{2}-\d{2})T/.test(value) && /(?:At|Date)$/i.test(field)) return value.slice(0, 10);
  }
  return String(value);
}

function objectRows(report: ReportDto): Array<Record<string, unknown>> {
  return report.rows as unknown as Array<Record<string, unknown>>;
}

function detailTable(title: string, rows: Array<Record<string, unknown>>, omit: Set<string> = new Set()): PdfTableSection {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((key) => !HIDDEN_FIELD.test(key) && !omit.has(key));
  return {
    title,
    columns: columns.map(labelFor),
    rows: rows.map((row) => columns.map((key) => formatValue(row[key], key))),
  };
}

export function buildPdfTableSections(report: ReportDto): PdfTableSection[] {
  const rows = objectRows(report);
  if (report.report !== 'policy_performance') {
    const title = report.report === 'annual_purchases' ? 'Purchase Details'
      : report.report === 'monthly_sales' ? 'Monthly Sales'
        : report.report === 'inventory_evaluation' ? 'Inventory Evaluation'
          : report.report === 'spending' ? 'Spending Breakdown'
            : report.report === 'forecast' ? 'Forecast Details' : 'Report Details';
    return [detailTable(title, rows)];
  }

  const summaryRows = rows.map(({ policyPeriods: _policyPeriods, ...row }) => row);
  const periodRows = rows.flatMap((row) => {
    const periods = Array.isArray(row.policyPeriods) ? row.policyPeriods : [];
    return periods.map((period) => {
      const values = period as Record<string, unknown>;
      return {
        name: row.name,
        sku: row.sku,
        reorderPoint: values.reorderPoint,
        startedAt: values.startedAt,
        endedAt: values.endedAt ?? 'Current',
        trackingDays: values.trackingDays,
        timeWeightedAverageOnHand: values.timeWeightedAverageOnHand,
        daysAtOrBelowReorderPoint: values.daysAtOrBelowReorderPoint,
        percentTimeAtOrBelowReorderPoint: values.percentTimeAtOrBelowReorderPoint,
        outOfStockDays: values.outOfStockDays,
      };
    });
  });
  return [
    detailTable('Observed Policy Performance', summaryRows, new Set(['policyPeriods'])),
    detailTable('Restock-Level History', periodRows),
  ];
}

function rowHeight(doc: PDFKit.PDFDocument, values: string[], widths: number[], fontSize: number): number {
  const heights = values.map((value, index) => {
    doc.font('Helvetica').fontSize(fontSize);
    return doc.heightOfString(value || '—', { width: Math.max(12, widths[index] - 10), lineGap: 1 });
  });
  return Math.max(22, Math.max(...heights, 0) + 8);
}

function columnWidths(columns: string[], totalWidth: number): number[] {
  if (columns.length === 0) return [];
  if (columns[0] === 'Measure' && columns[1] === 'Value' && columns.length === 2) {
    return [totalWidth * 0.68, totalWidth * 0.32];
  }
  const minimum = Math.min(52, totalWidth / columns.length);
  const remaining = totalWidth - minimum * columns.length;
  const weights = columns.map((column) => {
    if (/product|name|assumption|history/i.test(column)) return 2.1;
    if (/supplier|category|material|status/i.test(column)) return 1.35;
    if (/date|started|ended/i.test(column)) return 1.25;
    return 1;
  });
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  return weights.map((weight) => minimum + remaining * weight / weightTotal);
}

function isNumericCell(value: string): boolean {
  return /^(?:-?PHP\s*)?-?[\d,]+(?:\.\d+)?%?$/.test(value);
}

function drawTable(doc: PDFKit.PDFDocument, table: PdfTableSection): void {
  const { left, right, top, bottom } = doc.page.margins;
  const tableWidth = doc.page.width - left - right;
  const widths = columnWidths(table.columns.length ? table.columns : ['Details'], tableWidth);
  const columns = table.columns.length ? table.columns : ['Details'];
  const rows = table.rows;
  const fontSize = columns.length > 10 ? 6.5 : columns.length > 7 ? 7.1 : 8;
  const headerFontSize = columns.length > 10 ? 6.5 : 7.5;
  const maxY = doc.page.height - bottom - 26;

  const drawSectionTitle = (continued = false) => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#172554')
      .text(continued ? `${table.title} (continued)` : table.title, left, doc.y, { width: tableWidth });
    doc.moveDown(0.3);
  };

  const drawHeader = () => {
    const y = doc.y;
    const headerHeight = Math.max(28, rowHeight(doc, columns, widths, headerFontSize) + 6);
    let x = left;
    doc.save();
    for (let index = 0; index < columns.length; index += 1) {
      const width = widths[index];
      doc.fillColor('#243b75').strokeColor('#cbd5e1').lineWidth(0.5).rect(x, y, width, headerHeight).fillAndStroke();
      doc.font('Helvetica-Bold').fontSize(headerFontSize).fillColor('#ffffff')
        .text(columns[index], x + 5, y + 4, { width: Math.max(12, width - 10), height: headerHeight - 8 });
      x += width;
    }
    doc.restore();
    doc.y = y + headerHeight;
  };

  const beginContinuation = () => {
    doc.addPage();
    drawSectionTitle(true);
    drawHeader();
  };

  drawSectionTitle();
  drawHeader();
  if (rows.length === 0) {
    const empty = ['No rows available.'];
    const height = 24;
    doc.save().fillColor('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.5).rect(left, doc.y, tableWidth, height).fillAndStroke();
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#475569').text(empty[0], left + 5, doc.y + 7, { width: tableWidth - 10 });
    doc.restore();
    doc.y += height;
    doc.moveDown(0.7);
    return;
  }

  rows.forEach((row, rowIndex) => {
    const values = row.length ? row : [''];
    const height = rowHeight(doc, values, widths, fontSize);
    if (doc.y + height > maxY) beginContinuation();
    const y = doc.y;
    let x = left;
    doc.save();
    for (let index = 0; index < columns.length; index += 1) {
      const width = widths[index];
      const fill = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.fillColor(fill).strokeColor('#cbd5e1').lineWidth(0.45).rect(x, y, width, height).fillAndStroke();
      const value = values[index] ?? '—';
      doc.font('Helvetica').fontSize(fontSize).fillColor('#1e293b')
        .text(value, x + 5, y + 4, {
          width: Math.max(12, width - 10),
          height: height - 8,
          align: isNumericCell(value) ? 'right' : 'left',
          ellipsis: true,
        });
      x += width;
    }
    doc.restore();
    doc.y = y + height;
  });
  doc.moveDown(0.7);
}

function drawReportFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    const { left, right, bottom } = doc.page.margins;
    const y = doc.page.height - bottom - 16;
    doc.save();
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(left, y - 5).lineTo(doc.page.width - right, y - 5).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#64748b')
      .text('SmartStock · Generated report', left, y, { width: 250, lineBreak: false });
    doc.text(`Page ${index - range.start + 1} of ${range.count}`, doc.page.width - right - 100, y, { width: 100, align: 'right', lineBreak: false });
    doc.restore();
  }
}

export async function exportReportPdf(report: ReportDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.info.Title = `SmartStock ${titleFor(report)}`;
    doc.info.Author = 'SmartStock';
    doc.info.Subject = `${titleFor(report)} report`;

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const reportTitle = titleFor(report);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#52627a').text('SMARTSTOCK · GLASSRAM GLASS AND ALUMINUM SUPPLY');
    doc.moveDown(0.25);
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#172554').text(reportTitle);
    doc.moveDown(0.2);
    const period = 'year' in report ? `Reporting year: ${report.year}` : '';
    if (period) doc.font('Helvetica').fontSize(9).fillColor('#475569').text(period);
    if ('generatedAt' in report) {
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`Generated: ${formatValue(report.generatedAt, 'generatedAt')}`);
    }
    if ('trackingStart' in report) {
      const trackingStart = report.trackingStart ? formatValue(report.trackingStart, 'trackingStartedAt') : 'No history';
      doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`Tracking start: ${trackingStart}`);
    }
    if (report.report === 'forecast') {
      doc.moveDown(0.25);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155')
        .text(`Method: ${report.method}; alpha: ${report.alpha}; horizon months: ${report.horizonMonths}; history months: ${report.historyMonths}; minimum positive months: ${report.minimumPositiveMonths}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
      doc.font('Helvetica').fontSize(8).fillColor('#475569')
        .text(`Assumption: ${report.assumption}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
    } else if ('method' in report) {
      doc.moveDown(0.25);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155').text(`Method: ${report.method}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
      doc.font('Helvetica').fontSize(8).fillColor('#475569').text(`Assumption: ${report.assumption}`, { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
    }
    doc.moveDown(0.75);

    const totals = Object.entries(report.totals).map(([key, value]) => [labelFor(key), formatValue(value, key)]);
    drawTable(doc, { title: 'Summary', columns: ['Measure', 'Value'], rows: totals });
    for (const table of buildPdfTableSections(report)) drawTable(doc, table);

    drawReportFooter(doc);
    doc.end();
  });
}
