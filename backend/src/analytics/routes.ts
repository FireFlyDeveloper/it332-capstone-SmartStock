/**
 * Analytics routes — authenticated reporting metrics API.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth } from '../auth/middleware.js';
import { getAnalyticsInsight } from '../ai/insights.js';
import {
  getAnnualPurchases,
  getForecast,
  getMovementClassification,
  getRecentActivity,
  getSalesTrends,
  getDemandForecast,
} from './service.js';
import type { DashboardSalesRange } from './analytics.js';

export const analyticsRoutes = new Hono();

analyticsRoutes.use('*', requireAuth);

analyticsRoutes.get('/demand-forecast', (c) => {
  const raw = c.req.query('historyMonths');
  const historyMonths = raw === undefined ? 12 : Number(raw);
  if (!Number.isInteger(historyMonths) || historyMonths < 1 || historyMonths > 60) {
    return c.json({ error: 'historyMonths must be an integer between 1 and 60' }, 400);
  }
  return c.json(getDemandForecast(historyMonths));
});

analyticsRoutes.get('/sales-trends', (c) => {
  const rawRange = c.req.query('range');
  const validRanges: DashboardSalesRange[] = ['6M', '1Y', 'ALL'];
  if (rawRange !== undefined && !validRanges.includes(rawRange as DashboardSalesRange)) {
    return c.json({ error: 'range must be 6M, 1Y, or ALL' }, 400);
  }
  return c.json(getSalesTrends(rawRange as DashboardSalesRange | undefined));
});

analyticsRoutes.get('/recent-activity', (c) => {
  const rawLimit = c.req.query('limit');
  const limit = rawLimit === undefined ? 6 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return c.json({ error: 'limit must be an integer between 1 and 20' }, 400);
  }
  return c.json(getRecentActivity(limit));
});

analyticsRoutes.get('/purchases', (c) => {
  const rawYear = c.req.query('year');
  const year = rawYear === undefined ? undefined : Number(rawYear);
  if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 3000)) {
    return c.json({ error: 'year must be an integer between 1900 and 3000' }, 400);
  }
  return c.json(getAnnualPurchases(year));
});

analyticsRoutes.get('/movement', (c) => {
  const rawThreshold = c.req.query('threshold');
  const threshold = rawThreshold === undefined ? undefined : Number(rawThreshold);
  if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0)) {
    return c.json({ error: 'threshold must be a non-negative number' }, 400);
  }
  return c.json(getMovementClassification(threshold));
});

analyticsRoutes.get('/insights', async (c) => {
  const rawYear = c.req.query('year');
  const rawThreshold = c.req.query('threshold');
  const year = rawYear === undefined ? undefined : Number(rawYear);
  const threshold = rawThreshold === undefined ? undefined : Number(rawThreshold);
  if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 3000)) {
    return c.json({ error: 'year must be an integer between 1900 and 3000' }, 400);
  }
  if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0)) {
    return c.json({ error: 'threshold must be a non-negative number' }, 400);
  }
  return c.json(await getAnalyticsInsight({ year, threshold }));
});

analyticsRoutes.post('/forecast', async (c) => {
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
