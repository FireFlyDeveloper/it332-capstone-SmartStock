import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { authRoutes } from './auth/routes.js'
import { inventoryRoutes } from './inventory/routes.js'
import { deliveryRoutes } from './delivery/routes.js'
import { orderRoutes } from './orders/routes.js'
import { trackingRoutes } from './tracking/routes.js'
import { analyticsRoutes } from './analytics/routes.js'
import { reportsRoutes } from './reports/routes.js'
import { dailySalesRoutes } from './dailySales/routes.js'
import { getDatabaseHealth } from './db/health.js'
import { initDatabase } from './db/postgresStore.js'
import { assertAuthConfig } from './auth/config.js'

export const app = new Hono()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim()).filter(Boolean)

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return origin
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.get('/', (c) => c.json({ message: 'SmartStock API', status: 'ok' }))
app.get('/health/db', async (c) => {
  const health = await getDatabaseHealth()
  return c.json(health, health.ok ? 200 : 503)
})

app.route('/auth', authRoutes)
app.route('/products', inventoryRoutes)
app.route('/inventory', inventoryRoutes)
app.route('/deliveries', deliveryRoutes)
app.route('/orders', orderRoutes)
app.route('/tracking', trackingRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/reports', reportsRoutes)
app.route('/daily-sales', dailySalesRoutes)

async function startServer(): Promise<void> {
  try {
    assertAuthConfig()
    await initDatabase()
  } catch (err) {
    console.error('[db] Startup aborted: persistent database initialization failed.')
    console.error(err instanceof Error ? err.message : 'Unknown database initialization error')
    process.exitCode = 1
    return
  }

  const port = Number(process.env.PORT) || 3000
  console.log(`Server running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}

if (!process.env.VITEST) void startServer()
