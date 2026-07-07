/**
 * Inventory routes — protected stock management API.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-07
 */

import { Hono } from 'hono';
import { requireAuth, requireRole } from '../auth/middleware.js';
import {
  createInventoryController,
  deleteInventoryController,
  getInventoryController,
  listInventoryController,
  updateInventoryController,
} from './controller.js';

export const inventoryRoutes = new Hono();

inventoryRoutes.use('*', requireAuth);
inventoryRoutes.get('/', listInventoryController);
inventoryRoutes.get('/:id', getInventoryController);
inventoryRoutes.post('/', requireRole('admin'), createInventoryController);
inventoryRoutes.patch('/:id', requireRole('admin'), updateInventoryController);
inventoryRoutes.delete('/:id', requireRole('admin'), deleteInventoryController);
