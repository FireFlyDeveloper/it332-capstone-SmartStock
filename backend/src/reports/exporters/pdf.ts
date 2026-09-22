/**
 * PDF report exporter — renders stable SmartStock report DTOs to a PDF buffer.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import PDFDocument from 'pdfkit';
import type { ReportDto } from '../service.js';

function titleFor(report: ReportDto): string {
  return report.report
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (value === null || value === undefined) return '';
  return String(value);
}

export async function exportReportPdf(report: ReportDto): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: false });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('SMARTSTOCK', { align: 'center' });
    doc.moveDown(0.25);
    doc.fontSize(11).text('Glassram Glass and Aluminum Supply', { align: 'center' });
    doc.moveDown(1.25);
    doc.fontSize(16).text(titleFor(report));
    doc.moveDown(0.5);

    if ('year' in report) {
      doc.fontSize(10).text(`Year: ${report.year}`);
      doc.moveDown(0.5);
    }

    doc.fontSize(12).text('Totals', { underline: true });
    doc.moveDown(0.25);
    for (const [key, value] of Object.entries(report.totals)) {
      doc.fontSize(10).text(`${key}: ${stringifyValue(value)}`);
    }

    doc.moveDown(1);
    doc.fontSize(12).text('Rows', { underline: true });
    doc.moveDown(0.25);

    if (report.rows.length === 0) {
      doc.fontSize(10).text('No rows available.');
    } else {
      report.rows.forEach((row, index) => {
        const line = Object.entries(row)
          .map(([key, value]) => `${key}: ${stringifyValue(value)}`)
          .join(' | ');
        doc.fontSize(9).text(`${index + 1}. ${line}`, { width: 500 });
      });
    }

    doc.end();
  });
}
