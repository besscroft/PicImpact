import 'server-only'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'

const app = new Hono()

app.get('/get-image-blob', async (c) => {
  const { searchParams } = new URL(c.req.url)
  const imageUrl = searchParams.get('imageUrl')
  // @ts-ignore
  const blob = await fetch(imageUrl).then(res => res.blob())
  return new Response(blob)
})

app.get('/get-image-by-id', async (c) => {
  const { searchParams } = new URL(c.req.url)
  const id = searchParams.get('id')
  const data = await fetchImageByIdAndAuth(String(id))
  if (data) {
    return c.json({ code: 200, message: 'Image data retrieved successfully', data: data })
  } else {
    throw new HTTPException(500, { message: 'The image does not exist or is not publicly displayed' })
  }
})

export default app
