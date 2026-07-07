import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { authRoutes } from './auth/routes.js'
import { inventoryRoutes } from './inventory/routes.js'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'SmartStock API', status: 'ok' }))

app.route('/auth', authRoutes)
app.route('/products', inventoryRoutes)
app.route('/inventory', inventoryRoutes)

const port = Number(process.env.PORT) || 3000
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
