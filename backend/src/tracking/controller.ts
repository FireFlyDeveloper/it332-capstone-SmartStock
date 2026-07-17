/**
 * Tracking controller — public order lookup by reference number.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import type { Context } from 'hono';
import { findOrderByReference } from '../orders/store.js';
import { toPublicTrackingOrder } from './privacy.js';

export function getTrackingByReferenceController(c: Context) {
  const referenceNumber = c.req.param('referenceNumber');
  if (!referenceNumber) return c.json({ error: 'reference number is required' }, 400);

  const order = findOrderByReference(referenceNumber);
  if (!order) return c.json({ error: 'tracking reference not found' }, 404);

  return c.json(toPublicTrackingOrder(order));
}
