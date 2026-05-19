import 'server-only'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import { ok } from '~/hono/_lib/response'
import { badRequest, notFound, serverError } from '~/hono/_lib/errors'

const app = new Hono()

app.get('/image-blob', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const imageUrl = searchParams.get('imageUrl')
    if (imageUrl) {
      const blob = await fetch(imageUrl).then(res => res.blob())
      return new Response(blob)
    }
    throw badRequest('Missing imageUrl parameter')
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to get image blob', e)
  }
})

app.get('/image-by-id', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)
    const id = searchParams.get('id')
    const data = await fetchImageByIdAndAuth(String(id))
    if (data) {
      return ok(c, data)
    } else {
      throw notFound('The image does not exist or is not publicly displayed')
    }
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to get image', e)
  }
})

export default app
