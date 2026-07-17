/**
 * Tracking routes — unauthenticated public reference lookup.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { getTrackingByReferenceController } from './controller.js';

export const trackingRoutes = new Hono();

trackingRoutes.get('/:referenceNumber', getTrackingByReferenceController);
