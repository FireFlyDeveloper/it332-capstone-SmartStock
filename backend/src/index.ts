import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'SmartStock API', status: 'ok' }))

const port = Number(process.env.PORT) || 3000
console.log(`Server running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
