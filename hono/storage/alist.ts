import 'server-only'
import { fetchConfigsByKeys } from '~/server/db/query'

import { Hono } from 'hono'

const app = new Hono()

app.get('/info', async (c) => {
  const data = await fetchConfigsByKeys([
    'alist_url',
    'alist_token'
  ]);
  return c.json(data)
})

app.get('/storages', async (c) => {
  const findConfig = await fetchConfigsByKeys([
    'alist_url',
    'alist_token'
  ])
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