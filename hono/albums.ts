import 'server-only'
import { fetchAlbumsList } from '~/server/db/query/albums'
import { deleteAlbum, insertAlbums, updateAlbum, updateAlbumShow } from '~/server/db/operate/albums'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const data = await fetchAlbumsList()
    return c.json({ code: 200, message: 'Success', data })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to fetch albums', cause: e })
  }
})

app.post('/', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    throw new HTTPException(500, { message: 'The route must start with /' })
  }
  try {
    await insertAlbums(album)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    throw new HTTPException(500, { message: 'The route must start with /' })
  }
  try {
    await updateAlbum(album)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteAlbum(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update-show', async (c) => {
  try {
    const album = await c.req.json()
    await updateAlbumShow(album.id, album.show)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app
