import 'server-only'
import { Hono } from 'hono'
import { fetchImageByIdAndAuth, queryAuthStatus } from '~/server/db/query'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.get('/get-auth-status', async (c) => {
  try {
    const data = await queryAuthStatus();

    return c.json({
      code: 200,
      message: 'Successfully retrieved two-factor status',
      data: {
        auth_enable: data?.config_value
      }
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to retrieve two-factor status', cause: e })
  }
})

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
  const data = await fetchImageByIdAndAuth(String(id));
  if (data && data?.length > 0) {
    return c.json({ code: 200, message: 'Image data retrieved successfully', data: data })
  } else {
    throw new HTTPException(500, { message: 'The image does not exist or is not publicly displayed' })
  }
})

export default app
