/**
 * Orders routes — protected order lifecycle API.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { Hono } from 'hono';
import { requireAuth, requireRole, requireStaffOrAdmin } from '../auth/middleware.js';
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
orderRoutes.post('/', requireStaffOrAdmin, createOrderController);
orderRoutes.put('/:id', requireStaffOrAdmin, updateOrderController);
orderRoutes.patch('/:id', requireStaffOrAdmin, updateOrderController);
orderRoutes.post('/:id/cancel', requireStaffOrAdmin, deleteOrderController);
orderRoutes.delete('/:id', requireRole('admin'), deleteOrderController);
orderRoutes.post('/:id/payment', requireStaffOrAdmin, processPaymentController);
orderRoutes.post('/:id/refund', requireStaffOrAdmin, processRefundController);
