import 'server-only'
import {
  deleteCopyright,
  insertCopyright,
  updateCopyright,
  updateCopyrightShow
} from '~/server/db/operate'
import { fetchCopyrightList } from '~/server/db/query'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get', async (c) => {
  const data = await fetchCopyrightList()
  if (Array.isArray(data)) {
    const result = data.map((item) => ({ label: item.name, value: item.id }))
    return c.json(result)
  }
  return c.json([])
})

app.post('/add', async (c) => {
  const copyright = await c.req.json()
  try {
    await insertCopyright(copyright);
    return c.json({ code: 200, message: '新增成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '新增失败！' })
  }
})

app.delete('/delete/:id', async (c) => {
  const { id } = c.req.param()
  const data = await deleteCopyright(id);
  return c.json(data)
})

app.put('/update', async (c) => {
  const copyright = await c.req.json()
  try {
    await updateCopyright(copyright);
    return c.json({ code: 200, message: '更新成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '更新失败！' })
  }
})

app.put('/update-show', async (c) => {
  const copyright = await c.req.json()
  const data = await updateCopyrightShow(copyright.id, copyright.show);
  return c.json(data)
})

export default app
