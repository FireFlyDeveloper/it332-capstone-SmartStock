/**
 * Inventory routes — protected product management API.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import { Hono } from 'hono';
import { requireAuth, requireRole, requireStaffOrAdmin } from '../auth/middleware.js';
import {
  createProductController,
  deleteProductController,
  getProductController,
  inboundStockController,
  listLowStockProductsController,
  listProductMovementsController,
  listProductsController,
  outboundStockController,
  updateProductController,
} from './controller.js';

export const inventoryRoutes = new Hono();

inventoryRoutes.use('*', requireAuth);
inventoryRoutes.get('/low-stock', listLowStockProductsController);
inventoryRoutes.get('/', listProductsController);
inventoryRoutes.get('/:id', getProductController);
inventoryRoutes.get('/:id/movements', listProductMovementsController);
inventoryRoutes.post('/', requireStaffOrAdmin, createProductController);
inventoryRoutes.post('/:id/stock/inbound', requireStaffOrAdmin, inboundStockController);
inventoryRoutes.post('/:id/stock/outbound', requireRole('admin'), outboundStockController);
inventoryRoutes.put('/:id', requireStaffOrAdmin, updateProductController);
inventoryRoutes.patch('/:id', requireStaffOrAdmin, updateProductController);
inventoryRoutes.delete('/:id', requireRole('admin'), deleteProductController);
