import 'server-only'
import { fetchTagsListAndNotDefault } from '~/server/db/query'
import { deleteTag, insertTag, updateTag, updateTagShow } from '~/server/db/operate'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get', async (c) => {
  const data = await fetchTagsListAndNotDefault();
  return c.json(data)
})

app.post('/add', async (c) => {
  const tag = await c.req.json()
  if (tag.tag_value && tag.tag_value.charAt(0) !== '/') {
    return c.json({
      code: 500,
      message: '路由必须以 / 开头！'
    })
  }
  try {
    await insertTag(tag);
    return c.json({ code: 200, message: '新增成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '新增失败！' })
  }
})

app.put('/update', async (c) => {
  const tag = await c.req.json()
  if (tag.tag_value && tag.tag_value.charAt(0) !== '/') {
    return c.json({
      code: 500,
      message: '路由必须以 / 开头！'
    })
  }
  try {
    await updateTag(tag);
    return c.json({ code: 200, message: '更新成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '更新失败！' })
  }
})

app.delete('/delete/:id', async (c) => {
  const { id } = c.req.param()
  const data = await deleteTag(Number(id));
  return c.json(data)
})

app.put('/update-show', async (c) => {
  const tag = await c.req.json()
  const data = await updateTagShow(tag.id, tag.show);
  return c.json(data)
})

export default app