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
  buildOrderSummaryReport,
  buildSpendingReport,
  buildDemandForecastReport,
  buildPolicyPerformanceReport,
  buildPolicyPerformancePage,
  type PolicyPerformanceCursor,
  type ReportDto,
} from './service.js';
import { exportReportPdf } from './exporters/pdf.js';
import { exportReportXlsx } from './exporters/xlsx.js';

export const reportsRoutes = new Hono();

reportsRoutes.use('*', requireAuth);

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

reportsRoutes.get('/orders/summary', (c) => {
  const fromDate = c.req.query('fromDate') || undefined;
  const toDate = c.req.query('toDate') || undefined;
  if ((fromDate && !isDateOnly(fromDate)) || (toDate && !isDateOnly(toDate))) {
    return c.json({ error: 'fromDate and toDate must be valid YYYY-MM-DD dates' }, 400);
  }
  if (fromDate && toDate && fromDate > toDate) {
    return c.json({ error: 'fromDate must be on or before toDate' }, 400);
  }
  return c.json(buildOrderSummaryReport(fromDate, toDate));
});

function parseYear(rawYear: string | undefined): { ok: true; year: number | undefined } | { ok: false; error: string } {
  if (rawYear === undefined) return { ok: true, year: undefined };
  const year = Number(rawYear);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return { ok: false, error: 'year must be an integer between 1900 and 3000' };
  }
  return { ok: true, year };
}

type ExportType = 'sales' | 'purchases' | 'inventory' | 'spending' | 'forecast' | 'policy-performance';
type ExportFormat = 'pdf' | 'xlsx';

function filenameFor(type: ExportType, format: ExportFormat): string {
  return `smartstock-${type}-report.${format}`;
}

function buildReportForType(type: ExportType): ReportDto | Promise<ReportDto> {
  switch (type) {
    case 'sales': return buildMonthlySalesReport();
    case 'purchases': return buildAnnualPurchasesReport();
    case 'inventory': return buildInventoryEvaluationReport();
    case 'spending': return buildSpendingReport();
    case 'forecast': return buildDemandForecastReport();
    case 'policy-performance': return buildPolicyPerformanceReport();
  }
}

reportsRoutes.get('/export', requireRole('admin'), async (c) => {
  const type = c.req.query('type');
  const format = c.req.query('format');
  if (type !== 'sales' && type !== 'purchases' && type !== 'inventory' && type !== 'spending' && type !== 'forecast' && type !== 'policy-performance') {
    return c.json({ error: 'type must be one of sales, purchases, inventory, spending, forecast, policy-performance' }, 400);
  }
  if (format !== 'pdf' && format !== 'xlsx') return c.json({ error: 'format must be pdf or xlsx' }, 400);

  const buffer = format === 'pdf'
    ? await exportReportPdf(await buildReportForType(type))
    : await exportReportXlsx(await buildReportForType(type));
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

reportsRoutes.get('/policy-performance/page', async (c) => {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  }

  let cursor: PolicyPerformanceCursor | null = null;
  const rawCursor = c.req.query('cursor');
  if (rawCursor !== undefined) {
    try {
      if (!/^[A-Za-z0-9_-]+$/.test(rawCursor)) throw new Error('invalid');
      const decoded = Buffer.from(rawCursor, 'base64url').toString('utf8');
      if (Buffer.from(decoded, 'utf8').toString('base64url') !== rawCursor) throw new Error('invalid');
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      if (typeof parsed.name !== 'string' || parsed.name.length > 200 || typeof parsed.productId !== 'string' || parsed.productId.length < 1 || parsed.productId.length > 64) throw new Error('invalid');
      cursor = { name: parsed.name, productId: parsed.productId };
    } catch {
      return c.json({ error: 'cursor is invalid' }, 400);
    }
  }

  return c.json(await buildPolicyPerformancePage(new Date(), limit, cursor));
});

reportsRoutes.get('/policy-performance', async (c) => c.json(await buildPolicyPerformanceReport()));

reportsRoutes.get('/spending', (c) => {
  const parsed = parseYear(c.req.query('year'));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  return c.json(buildSpendingReport(parsed.year));
});
