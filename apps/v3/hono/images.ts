import 'server-only'
import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageAlbum
} from '~/server/db/operate/images'
import { fetchCameraAndLensList } from '~/server/db/query/images'
import { Hono } from 'hono'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ok, okEmpty } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'
import { filterStringArray } from '~/lib/utils/array'

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
    if (body?.exif?.dateTime && !dayjs(body?.exif?.dateTime, 'YYYY:MM:DD HH:mm:ss', true).isValid()) {
      body.exif.dateTime = ''
    }
    // Reduce the preserved original filename to a bare basename (defense in
    // depth — `File.name` from the client is already a basename, but strip any
    // path separators so it stays safe as the download Content-Disposition
    // value). Empty/whitespace falls back to null → download derives the name
    // from the URL, i.e. the prior behaviour.
    if (typeof body.image_name === 'string') {
      body.image_name = body.image_name.split(/[\\/]/).pop()?.trim() || null
    }
    // New images are stored with variants_ready=false; the background
    // preprocess ticker (see instrumentation.ts) picks them up asynchronously
    // and generates variants via a tracked /admin/tasks run — no inline work
    // on the upload request.
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

// Admin-only camera/lens enumeration. Returns the full set across all images
// (unfiltered by album visibility), powering the admin list filter dropdowns.
// The public-facing counterpart lives at GET /api/public/camera-lens and
// applies album/image visibility filters — do not call this route from any
// unauthenticated context.
app.get('/camera-lens-list', async (c) => {
  try {
    const { cameras, lenses } = await fetchCameraAndLensList()
    return ok(c, {
      cameras: filterStringArray(cameras),
      lenses: filterStringArray(lenses),
    })
  } catch (e) {
    console.error('Failed to fetch camera and lens list:', e)
    throw serverError('Failed to fetch camera and lens list', e)
  }
})

export default app
