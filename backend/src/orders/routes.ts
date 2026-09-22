/**
 * Orders routes — protected order lifecycle API.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth, requireRole } from '../auth/middleware.js';
import {
  createOrderController,
  deleteOrderController,
  getOrderByReferenceController,
  getOrderController,
  listOrdersController,
  processPaymentController,
  processRefundController,
  updateOrderController,
} from './controller.js';

export const orderRoutes = new Hono();

orderRoutes.use('*', requireAuth);
orderRoutes.get('/', listOrdersController);
orderRoutes.get('/reference/:referenceNumber', getOrderByReferenceController);
orderRoutes.get('/:id', getOrderController);
orderRoutes.post('/', requireRole('admin'), createOrderController);
orderRoutes.put('/:id', requireRole('admin'), updateOrderController);
orderRoutes.patch('/:id', requireRole('admin'), updateOrderController);
orderRoutes.delete('/:id', requireRole('admin'), deleteOrderController);
orderRoutes.post('/:id/payment', requireRole('admin'), processPaymentController);
orderRoutes.post('/:id/refund', requireRole('admin'), processRefundController);
