import 'server-only'
import { fetchAListInfo } from '~/server/db/query'

import { Hono } from 'hono'

const app = new Hono()

app.get('/info', async (c) => {
  const data = await fetchAListInfo();
  return c.json(data)
})

app.get('/storages', async (c) => {
  const findConfig = await fetchAListInfo()
  const alistToken = findConfig.find((item: any) => item.config_key === 'alist_token')?.config_value || '';
  const alistUrl = findConfig.find((item: any) => item.config_key === 'alist_url')?.config_value || '';

  const data = await fetch(`${alistUrl}/api/admin/storage/list`, {
    method: 'get',
    headers: {
      'Authorization': alistToken.toString(),
    },
  }).then(res => res.json())
  return c.json(data)
})

export default app