/**
 * Inventory routes — protected product management API.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import { Hono } from 'hono';
import { requireAuth, requireRole } from '../auth/middleware.js';
import {
  createProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  updateProductController,
} from './controller.js';

export const inventoryRoutes = new Hono();

inventoryRoutes.use('*', requireAuth);
inventoryRoutes.get('/', listProductsController);
inventoryRoutes.get('/:id', getProductController);
inventoryRoutes.post('/', requireRole('admin'), createProductController);
inventoryRoutes.put('/:id', requireRole('admin'), updateProductController);
inventoryRoutes.patch('/:id', requireRole('admin'), updateProductController);
inventoryRoutes.delete('/:id', requireRole('admin'), deleteProductController);
