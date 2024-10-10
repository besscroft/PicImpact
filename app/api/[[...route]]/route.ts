import 'server-only'
import { handle } from 'hono/vercel'
import { Hono } from 'hono'
import route from '~/hono'
import open from '~/hono/open/open'

const app = new Hono().basePath('/api')

app.route('/v1', route)
app.route('/open', open)
app.notFound((c) => {
  return c.text('not found', 404)
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default app
