/**
 * Analytics routes — authenticated reporting metrics API.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { getAnalyticsInsight } from '../ai/insights.js';
import {
  getAnnualPurchases,
  getAnnualPurchasesPage,
  getAnalyticsOrderSummary,
  getDashboardOrderSummary,
  getForecast,
  getMovementClassification,
  getMonthlyItemMovementPage,
  getMonthlyStockMovementByUnit,
  getRecentActivity,
  getSalesTrends,
  getDemandForecast,
  getDemandForecastPage,
} from './service.js';
import type { AnnualPurchaseCursor, DashboardSalesRange, DemandForecastCursor, MonthlyItemMovementCursor } from './analytics.js';

export const analyticsRoutes = new Hono();

analyticsRoutes.use('*', requireAuth);

analyticsRoutes.get('/demand-forecast/page', requireRole('admin'), async (c) => {
  const rawHistoryMonths = c.req.query('historyMonths');
  const historyMonths = rawHistoryMonths === undefined ? 12 : Number(rawHistoryMonths);
  if (!Number.isInteger(historyMonths) || historyMonths < 1 || historyMonths > 60) {
    return c.json({ error: 'historyMonths must be an integer between 1 and 60' }, 400);
  }
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  }
  let cursor: DemandForecastCursor | null = null;
  const rawCursor = c.req.query('cursor');
  if (rawCursor) {
    if (rawCursor.length > 1024) return c.json({ error: 'cursor is invalid' }, 400);
    try {
      const parsed: unknown = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8'));
      if (typeof parsed !== 'object' || parsed === null) return c.json({ error: 'cursor is invalid' }, 400);
      const value = parsed as Record<string, unknown>;
      if (typeof value.name !== 'string' || value.name.length > 200
        || typeof value.productId !== 'string' || value.productId.length === 0 || value.productId.length > 64) {
        return c.json({ error: 'cursor is invalid' }, 400);
      }
      cursor = { name: value.name, productId: value.productId };
    } catch {
      return c.json({ error: 'cursor is invalid' }, 400);
    }
  }
  const result = await getDemandForecastPage(historyMonths, limit, cursor);
  const nextCursor = result.page.nextCursor
    ? Buffer.from(JSON.stringify(result.page.nextCursor)).toString('base64url')
    : null;
  return c.json({ ...result, page: { ...result.page, nextCursor } });
});

analyticsRoutes.get('/demand-forecast', requireRole('admin'), (c) => {
  const raw = c.req.query('historyMonths');
  const historyMonths = raw === undefined ? 12 : Number(raw);
  if (!Number.isInteger(historyMonths) || historyMonths < 1 || historyMonths > 60) {
    return c.json({ error: 'historyMonths must be an integer between 1 and 60' }, 400);
  }
  return c.json(getDemandForecast(historyMonths));
});

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

analyticsRoutes.get('/orders/summary', requireRole('admin'), async (c) => {
  const fromDate = c.req.query('fromDate') || undefined;
  const toDate = c.req.query('toDate') || undefined;
  if ((fromDate && !isDateOnly(fromDate)) || (toDate && !isDateOnly(toDate))) {
    return c.json({ error: 'fromDate and toDate must be valid YYYY-MM-DD dates' }, 400);
  }
  if (fromDate && toDate && fromDate > toDate) return c.json({ error: 'fromDate must be on or before toDate' }, 400);
  return c.json(await getAnalyticsOrderSummary(fromDate, toDate));
});

analyticsRoutes.get('/dashboard-order-summary', async (c) => c.json(await getDashboardOrderSummary()));

analyticsRoutes.get('/sales-trends', async (c) => {
  const rawRange = c.req.query('range');
  const validRanges: DashboardSalesRange[] = ['6M', '1Y', 'ALL'];
  if (rawRange !== undefined && !validRanges.includes(rawRange as DashboardSalesRange)) {
    return c.json({ error: 'range must be 6M, 1Y, or ALL' }, 400);
  }
  return c.json(await getSalesTrends(rawRange as DashboardSalesRange | undefined));
});

analyticsRoutes.get('/recent-activity', async (c) => {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 6 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return c.json({ error: 'limit must be an integer between 1 and 20' }, 400);
  }
  return c.json(await getRecentActivity(limit));
});

analyticsRoutes.get('/purchases/page', requireRole('admin'), async (c) => {
  const rawYear = c.req.query('year');
  const year = rawYear === undefined ? new Date().getUTCFullYear() : Number(rawYear);
  if (!Number.isInteger(year) || year < 1900 || year > 3000) {
    return c.json({ error: 'year must be an integer between 1900 and 3000' }, 400);
  }
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);
  }
  let cursor: AnnualPurchaseCursor | null = null;
  const rawCursor = c.req.query('cursor');
  if (rawCursor !== undefined) {
    if (rawCursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(rawCursor)) return c.json({ error: 'cursor is invalid' }, 400);
    try {
      const decoded = Buffer.from(rawCursor, 'base64url').toString('utf8');
      if (Buffer.from(decoded, 'utf8').toString('base64url') !== rawCursor) return c.json({ error: 'cursor is invalid' }, 400);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      if (typeof parsed.materialType !== 'string' || parsed.materialType.length > 100
        || typeof parsed.supplier !== 'string' || parsed.supplier.length > 200) return c.json({ error: 'cursor is invalid' }, 400);
      cursor = { materialType: parsed.materialType, supplier: parsed.supplier };
    } catch {
      return c.json({ error: 'cursor is invalid' }, 400);
    }
  }
  const result = await getAnnualPurchasesPage(year, limit, cursor);
  const nextCursor = result.page.nextCursor
    ? Buffer.from(JSON.stringify(result.page.nextCursor)).toString('base64url')
    : null;
  return c.json({ ...result, page: { ...result.page, nextCursor } });
});

analyticsRoutes.get('/purchases', requireRole('admin'), (c) => {
  const rawYear = c.req.query('year');
  const year = rawYear === undefined ? undefined : Number(rawYear);
  if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 3000)) {
    return c.json({ error: 'year must be an integer between 1900 and 3000' }, 400);
  }
  return c.json(getAnnualPurchases(year));
});

analyticsRoutes.get('/movement/monthly', requireRole('admin'), async (c) => {
  const rawMonths = c.req.query('months');
  const months = rawMonths === undefined ? 12 : Number(rawMonths);
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    return c.json({ error: 'months must be an integer between 1 and 60' }, 400);
  }
  return c.json(await getMonthlyStockMovementByUnit(months));
});

analyticsRoutes.get('/movement', requireRole('admin'), (c) => {
  const rawThreshold = c.req.query('threshold');
  const threshold = rawThreshold === undefined ? undefined : Number(rawThreshold);
  if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0)) {
    return c.json({ error: 'threshold must be a non-negative number' }, 400);
  }
  return c.json(getMovementClassification(threshold));
});

analyticsRoutes.get('/movement/items', requireRole('admin'), async (c) => {
  const rawMonth = c.req.query('month');
  const month = rawMonth ?? new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return c.json({ error: 'month must be YYYY-MM' }, 400);

  const rawThreshold = c.req.query('threshold');
  const threshold = rawThreshold === undefined ? 10 : Number(rawThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return c.json({ error: 'threshold must be a non-negative number' }, 400);

  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 25 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return c.json({ error: 'limit must be an integer between 1 and 100' }, 400);

  let cursor: MonthlyItemMovementCursor | null = null;
  const rawCursor = c.req.query('cursor');
  if (rawCursor !== undefined) {
    if (rawCursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(rawCursor)) return c.json({ error: 'cursor is invalid' }, 400);
    try {
      const decoded = Buffer.from(rawCursor, 'base64url').toString('utf8');
      if (Buffer.from(decoded, 'utf8').toString('base64url') !== rawCursor) return c.json({ error: 'cursor is invalid' }, 400);
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      if (typeof parsed.name !== 'string' || parsed.name.length > 200
        || typeof parsed.productId !== 'string' || parsed.productId.length < 1 || parsed.productId.length > 64) {
        return c.json({ error: 'cursor is invalid' }, 400);
      }
      cursor = { name: parsed.name, productId: parsed.productId };
    } catch {
      return c.json({ error: 'cursor is invalid' }, 400);
    }
  }

  const result = await getMonthlyItemMovementPage(month, threshold, limit, cursor);
  const nextCursor = result.page.nextCursor
    ? Buffer.from(JSON.stringify(result.page.nextCursor)).toString('base64url')
    : null;
  return c.json({ ...result, page: { ...result.page, nextCursor } });
});

analyticsRoutes.get('/insights', requireRole('admin'), async (c) => {
  const fromDate = c.req.query('fromDate') || undefined;
  const toDate = c.req.query('toDate') || undefined;
  const rawMonth = c.req.query('movementMonth');
  const movementMonth = rawMonth ?? new Date().toISOString().slice(0, 7);
  const rawThreshold = c.req.query('threshold');
  const threshold = rawThreshold === undefined ? 10 : Number(rawThreshold);
  if ((fromDate && !isDateOnly(fromDate)) || (toDate && !isDateOnly(toDate))) {
    return c.json({ error: 'fromDate and toDate must be valid YYYY-MM-DD dates' }, 400);
  }
  if (fromDate && toDate && fromDate > toDate) return c.json({ error: 'fromDate must be on or before toDate' }, 400);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(movementMonth)) return c.json({ error: 'movementMonth must be YYYY-MM' }, 400);
  if (!Number.isFinite(threshold) || threshold < 0) return c.json({ error: 'threshold must be a non-negative number' }, 400);
  return c.json(await getAnalyticsInsight({ fromDate, toDate, movementMonth, threshold }));
});

analyticsRoutes.post('/forecast', requireRole('admin'), async (c) => {
  const body = await c.req.json().catch(() => null) as { quantities?: unknown; alpha?: unknown } | null;
  if (!body || !Array.isArray(body.quantities)) {
    return c.json({ error: 'quantities must be an array of numbers' }, 400);
  }
  const quantities = body.quantities.map(Number);
  const alpha = body.alpha === undefined ? undefined : Number(body.alpha);
  try {
    return c.json(getForecast(quantities, alpha));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'invalid forecast input' }, 400);
  }
});
