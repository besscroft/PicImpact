import 'server-only'
import { fetchAlbumsList } from '~/server/db/query'
import { deleteAlbum, insertAlbums, updateAlbum, updateAlbumShow } from '~/server/db/operate'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get', async (c) => {
  const data = await fetchAlbumsList();
  return c.json(data)
})

app.post('/add', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    return c.json({
      code: 500,
      message: '路由必须以 / 开头！'
    })
  }
  try {
    await insertAlbums(album);
    return c.json({ code: 200, message: '新增成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '新增失败！' })
  }
})

app.put('/update', async (c) => {
  const album = await c.req.json()
  if (album.album_value && album.album_value.charAt(0) !== '/') {
    return c.json({
      code: 500,
      message: '路由必须以 / 开头！'
    })
  }
  try {
    await updateAlbum(album);
    return c.json({ code: 200, message: '更新成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '更新失败！' })
  }
})

app.delete('/delete/:id', async (c) => {
  const { id } = c.req.param()
  const data = await deleteAlbum(id);
  return c.json(data)
})

app.put('/update-show', async (c) => {
  const album = await c.req.json()
  const data = await updateAlbumShow(album.id, album.show);
  return c.json(data)
})

export default app