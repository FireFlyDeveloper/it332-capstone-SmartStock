import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { authRoutes } from './auth/routes.js'
import { inventoryRoutes } from './inventory/routes.js'
import { deliveryRoutes } from './delivery/routes.js'
import { orderRoutes } from './orders/routes.js'
import { trackingRoutes } from './tracking/routes.js'
import { analyticsRoutes } from './analytics/routes.js'
import { reportsRoutes } from './reports/routes.js'
import { getDatabaseHealth } from './db/health.js'

export const app = new Hono()

app.get('/', (c) => c.json({ message: 'SmartStock API', status: 'ok' }))
app.get('/health/db', async (c) => c.json(await getDatabaseHealth()))

app.route('/auth', authRoutes)
app.route('/products', inventoryRoutes)
app.route('/inventory', inventoryRoutes)
app.route('/deliveries', deliveryRoutes)
app.route('/orders', orderRoutes)
app.route('/tracking', trackingRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/reports', reportsRoutes)

const port = Number(process.env.PORT) || 3000
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
