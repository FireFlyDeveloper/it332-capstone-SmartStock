/**
 * Reports routes — authenticated JSON-only operational summaries.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth, requireRole } from '../auth/middleware.js';
import {
  buildAnnualPurchasesReport,
  buildInventoryEvaluationReport,
  buildMonthlySalesReport,
  buildSpendingReport,
  type ReportDto,
} from './service.js';
import { exportReportPdf } from './exporters/pdf.js';
import { exportReportXlsx } from './exporters/xlsx.js';

export const reportsRoutes = new Hono();

reportsRoutes.use('*', requireAuth);

function parseYear(rawYear: string | undefined): { ok: true; year: number | undefined } | { ok: false; error: string } {
  if (rawYear === undefined) return { ok: true, year: undefined };
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return { ok: false, error: 'year must be an integer between 1900 and 3000' };
  }
  return { ok: true, year };
}

type ExportType = 'sales' | 'purchases' | 'inventory' | 'spending';
type ExportFormat = 'pdf' | 'xlsx';

function filenameFor(type: ExportType, format: ExportFormat): string {
  return `smartstock-${type}-report.${format}`;
}

function buildReportForType(type: ExportType): ReportDto {
  switch (type) {
    case 'sales': return buildMonthlySalesReport();
    case 'purchases': return buildAnnualPurchasesReport();
    case 'inventory': return buildInventoryEvaluationReport();
    case 'spending': return buildSpendingReport();
  }
}

reportsRoutes.get('/export', requireRole('admin'), async (c) => {
  const type = c.req.query('type');
  const format = c.req.query('format');
  if (type !== 'sales' && type !== 'purchases' && type !== 'inventory' && type !== 'spending') {
    return c.json({ error: 'type must be one of sales, purchases, inventory, spending' }, 400);
  }
  if (format !== 'pdf' && format !== 'xlsx') return c.json({ error: 'format must be pdf or xlsx' }, 400);

  const buffer = format === 'pdf'
    ? await exportReportPdf(buildReportForType(type))
    : await exportReportXlsx(buildReportForType(type));
  const contentType = format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${filenameFor(type, format)}"`,
    },
  });
});

reportsRoutes.get('/sales/monthly', (c) => c.json(buildMonthlySalesReport()));

reportsRoutes.get('/purchases/annual', (c) => {
  const parsed = parseYear(c.req.query('year'));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  return c.json(buildAnnualPurchasesReport(parsed.year));
});

reportsRoutes.get('/inventory/evaluation', (c) => c.json(buildInventoryEvaluationReport()));

reportsRoutes.get('/spending', (c) => {
  const parsed = parseYear(c.req.query('year'));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  return c.json(buildSpendingReport(parsed.year));
});
