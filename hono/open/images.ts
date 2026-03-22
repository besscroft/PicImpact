import 'server-only'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'

const app = new Hono()

app.get('/image-blob', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const imageUrl = searchParams.get('imageUrl')
    if (imageUrl) {
      const blob = await fetch(imageUrl).then(res => res.blob())
      return new Response(blob)
    }
    throw new HTTPException(400, { message: 'Missing imageUrl parameter' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to get image blob', cause: e })
  }
})

app.get('/image-by-id', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const id = searchParams.get('id')
    const data = await fetchImageByIdAndAuth(String(id))
    if (data) {
      return c.json({ code: 200, data })
    } else {
      throw new HTTPException(404, { message: 'The image does not exist or is not publicly displayed' })
    }
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to get image', cause: e })
  }
})

export default app
