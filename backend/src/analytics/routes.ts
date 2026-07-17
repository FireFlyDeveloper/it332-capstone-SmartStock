/**
 * Analytics routes — authenticated reporting metrics API.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth } from '../auth/middleware.js';
import {
  getAnnualPurchases,
  getForecast,
  getMovementClassification,
  getSalesTrends,
} from './service.js';

export const analyticsRoutes = new Hono();

analyticsRoutes.use('*', requireAuth);

analyticsRoutes.get('/sales-trends', (c) => c.json(getSalesTrends()));

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
