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
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { okEmpty } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'

dayjs.extend(customParseFormat)

const app = new Hono()

app.post('/', async (c) => {
  const body = await c.req.json()
  if (!body) {
    throw badRequest('Missing body')
  }

  if (!body.url) {
    throw badRequest('Image link cannot be empty')
  }
  if (!body.height || body.height <= 0) {
    throw badRequest('Image height cannot be empty and must be greater than 0')
  }
  if (!body.width || body.width <= 0) {
    throw badRequest('Image width cannot be empty and must be greater than 0')
  }

  try {
    if (body?.exif?.data_time && !dayjs(body?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss', true).isValid()) {
      body.exif.data_time = ''
    }
    await insertImage(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const data = await c.req.json()
    await deleteBatchImage(data)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/', async (c) => {
  const image = await c.req.json()
  if (!image.url) {
    throw badRequest('Image link cannot be empty')
  }
  if (!image.height || image.height <= 0) {
    throw badRequest('Image height cannot be empty and must be greater than 0')
  }
  if (!image.width || image.width <= 0) {
    throw badRequest('Image width cannot be empty and must be greater than 0')
  }
  try {
    await updateImage(image)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/update-show', async (c) => {
  try {
    const image = await c.req.json()
    await updateImageShow(image.id, image.show)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/update-album', async (c) => {
  const image = await c.req.json()
  try {
    await updateImageAlbum(image.imageId, image.albumId)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

export default app
