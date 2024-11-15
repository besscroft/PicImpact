import 'server-only'
import { Hono } from 'hono'
import { fetchImageByIdAndAuth, queryAuthStatus } from '~/server/db/query'

const app = new Hono()

app.get('/get-auth-status', async (c) => {
  try {
    const data = await queryAuthStatus();

    return c.json({
      code: 200,
      message: '获取双因素状态成功！',
      data: {
        auth_enable: data?.config_value
      }
    })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '获取双因素状态失败！' })
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
    return c.json({ code: 200, message: '图片数据获取成功！', data: data })
  } else {
    return c.json({ code: 500, message: '图片不存在或未公开展示！' })
  }
})

export default app
