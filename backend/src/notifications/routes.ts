import { Hono } from 'hono';
import { requireAuth } from '../auth/middleware.js';
import { listProducts } from '../inventory/store.js';
import { listOrders } from '../orders/store.js';
import { buildNotificationFeed } from './feed.js';

export const notificationRoutes = new Hono();
notificationRoutes.use('*', requireAuth);
notificationRoutes.get('/', (c) => c.json(buildNotificationFeed(listProducts(), listOrders())));
