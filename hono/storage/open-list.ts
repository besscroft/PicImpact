import 'server-only'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { Hono } from 'hono'
import type { Config } from '~/types'

const app = new Hono()

app.get('/info', async (c) => {
  const data = await fetchConfigsByKeys([
    'open_list_url',
    'open_list_token'
  ])
  return c.json(data)
})

app.get('/storages', async (c) => {
  const findConfig = await fetchConfigsByKeys([
    'open_list_url',
    'open_list_token'
  ])
  const openListToken = findConfig.find((item: Config) => item.config_key === 'open_list_token')?.config_value || ''
  const openListUrl = findConfig.find((item: Config) => item.config_key === 'open_list_url')?.config_value || ''

  const data = await fetch(`${openListUrl}/api/admin/storage/list`, {
    method: 'get',
    headers: {
      'Authorization': openListToken.toString(),
    },
  }).then(res => res.json())
  return c.json(data)
})

export default app