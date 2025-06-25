import 'server-only'
import { handle } from 'hono/vercel'
import { Hono } from 'hono'
import route from '~/hono'
import download from '~/hono/open/download'
import images from '~/hono/open/images'

const app = new Hono().basePath('/api')

app.route('/v1', route)
// 注意只有 /v1 开头是需要鉴权的
app.route('/public/download', download)
app.route('/public/images', images)
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
