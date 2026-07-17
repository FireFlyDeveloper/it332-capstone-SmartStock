/**
 * Reports routes — authenticated JSON-only operational summaries.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth } from '../auth/middleware.js';
import {
  buildAnnualPurchasesReport,
  buildInventoryEvaluationReport,
  buildMonthlySalesReport,
  buildSpendingReport,
} from './service.js';

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
