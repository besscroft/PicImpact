import 'server-only'
import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageAlbum
} from '~/server/db/operate'
import { Hono } from 'hono'

const app = new Hono()

app.post('/add', async (c) => {
  const image = await c.req.json()
  if (!image.url) {
    return c.json({
      code: 500,
      message: 'Image link cannot be empty'
    })
  }
  if (!image.height || image.height <= 0) {
    return c.json({
      code: 500,
      message: 'Image height cannot be empty and must be greater than 0'
    })
  }
  if (!image.width || image.width <= 0) {
    return c.json({
      code: 500,
      message: 'Image width cannot be empty and must be greater than 0'
    })
  }
  try {
    await insertImage(image);
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: 'Failed' })
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const data = await c.req.json()
    await deleteBatchImage(data);
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: 'Failed' })
  }
})

app.delete('/delete/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id);
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: 'Failed' })
  }
})

app.put('/update', async (c) => {
  const image = await c.req.json()
  if (!image.url) {
    return c.json({
      code: 500,
      message: 'Image link cannot be empty'
    })
  }
  if (!image.height || image.height <= 0) {
    return c.json({
      code: 500,
      message: 'Image height cannot be empty and must be greater than 0'
    })
  }
  if (!image.width || image.width <= 0) {
    return c.json({
      code: 500,
      message: 'Image width cannot be empty and must be greater than 0'
    })
  }
  try {
    await updateImage(image);
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: 'Failed' })
  }
})

app.put('/update-show', async (c) => {
  const image = await c.req.json()
  const data = await updateImageShow(image.id, image.show);
  return c.json(data)
})

app.put('/update-Album', async (c) => {
  const image = await c.req.json()
  try {
    await updateImageAlbum(image.imageId, image.albumId);
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    console.log(e)
    return c.json({
      code: 500,
      message: 'Failed'
    })
  }
})

export default app