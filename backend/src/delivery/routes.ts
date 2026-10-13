/**
 * Delivery routes — protected delivery tracking API.
 *
 * Author: Hazel
 * Last touched: 2026-07-08
 */

import { Hono } from 'hono';
import { requireAuth, requireRole, requireStaffOrAdmin } from '../auth/middleware.js';
import {
  createDeliveryController,
  deleteDeliveryController,
  getDeliveryController,
  listDeliveriesController,
  updateDeliveryController,
} from './controller.js';

export const deliveryRoutes = new Hono();

deliveryRoutes.use('*', requireAuth);
deliveryRoutes.get('/', listDeliveriesController);
deliveryRoutes.get('/:id', getDeliveryController);
deliveryRoutes.post('/', requireRole('admin'), createDeliveryController);
deliveryRoutes.put('/:id', requireStaffOrAdmin, updateDeliveryController);
deliveryRoutes.patch('/:id', requireStaffOrAdmin, updateDeliveryController);
deliveryRoutes.delete('/:id', requireRole('admin'), deleteDeliveryController);
