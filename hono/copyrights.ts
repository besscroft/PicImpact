import 'server-only'
import {
  deleteCopyright,
  insertCopyright,
  updateCopyright,
  updateCopyrightShow
} from '~/server/db/operate'
import { fetchCopyrightList } from '~/server/db/query'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

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
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
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
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update-show', async (c) => {
  const copyright = await c.req.json()
  const data = await updateCopyrightShow(copyright.id, copyright.show);
  return c.json(data)
})

export default app
