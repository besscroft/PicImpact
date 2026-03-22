import 'server-only'
import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageAlbum
} from '~/server/db/operate/images'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import dayjs from 'dayjs'

const app = new Hono()

app.post('/', async (c) => {
  const body = await c.req.json()
  if (!body) {
    throw new HTTPException(400, { message: 'Missing body' })
  }

  // 验证基本图片信息
  if (!body.url) {
    throw new HTTPException(500, { message: 'Image link cannot be empty' })
  }
  if (!body.height || body.height <= 0) {
    throw new HTTPException(500, { message: 'Image height cannot be empty and must be greater than 0' })
  }
  if (!body.width || body.width <= 0) {
    throw new HTTPException(500, { message: 'Image width cannot be empty and must be greater than 0' })
  }

  try {
    // 验证可能存在的时间信息
    if (body?.exif?.data_time && !dayjs(body?.exif?.data_time).isValid()) {
      body.exif.data_time = ''
    }
    // 保存图片信息
    await insertImage(body)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const data = await c.req.json()
    await deleteBatchImage(data)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/', async (c) => {
  const image = await c.req.json()
  if (!image.url) {
    throw new HTTPException(500, { message: 'Image link cannot be empty' })
  }
  if (!image.height || image.height <= 0) {
    throw new HTTPException(500, { message: 'Image height cannot be empty and must be greater than 0' })
  }
  if (!image.width || image.width <= 0) {
    throw new HTTPException(500, { message: 'Image width cannot be empty and must be greater than 0' })
  }
  try {
    await updateImage(image)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update-show', async (c) => {
  try {
    const image = await c.req.json()
    await updateImageShow(image.id, image.show)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update-album', async (c) => {
  const image = await c.req.json()
  try {
    await updateImageAlbum(image.imageId, image.albumId)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app
