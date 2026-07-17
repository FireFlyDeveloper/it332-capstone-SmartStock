/**
 * XLSX report exporter — renders stable SmartStock report DTOs to an Excel workbook buffer.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import ExcelJS from 'exceljs';
import type { ReportDto } from '../service.js';

function titleFor(report: ReportDto): string {
  return report.report
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function stringifyValue(value: unknown): string | number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export async function exportReportXlsx(report: ReportDto): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartStock';
  workbook.created = new Date('2026-01-01T00:00:00.000Z');
  workbook.modified = new Date('2026-01-01T00:00:00.000Z');

  const worksheet = workbook.addWorksheet('Report');
  worksheet.addRow(['SMARTSTOCK']);
  worksheet.addRow([titleFor(report)]);
  if ('year' in report) worksheet.addRow(['Year', report.year]);
  worksheet.addRow([]);
  worksheet.addRow(['Totals']);
  for (const [key, value] of Object.entries(report.totals)) {
    worksheet.addRow([key, stringifyValue(value)]);
  }
  worksheet.addRow([]);

  if (report.rows.length > 0) {
    const headers = Object.keys(report.rows[0]);
    worksheet.addRow(headers);
    for (const row of report.rows) {
      worksheet.addRow(headers.map((header) => stringifyValue((row as Record<string, unknown>)[header])));
    }
  } else {
    worksheet.addRow(['No rows available']);
  }

  worksheet.columns.forEach((column) => {
    column.width = 22;
  });
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(5).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
