import 'server-only'
import { fetchAlbumsList } from '~/server/db/query/albums'
import { deleteAlbum, insertAlbums, updateAlbum, updateAlbumShow } from '~/server/db/operate/albums'
import { Hono } from 'hono'
import { ok, okEmpty } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const data = await fetchAlbumsList()
    return ok(c, data)
  } catch (e) {
    throw serverError('Failed to fetch albums', e)
  }
})

app.post('/', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    throw badRequest('The route must start with /')
  }
  try {
    await insertAlbums(album)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    throw badRequest('The route must start with /')
  }
  try {
    await updateAlbum(album)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteAlbum(id)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/update-show', async (c) => {
  try {
    const album = await c.req.json()
    await updateAlbumShow(album.id, album.show)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

export default app
