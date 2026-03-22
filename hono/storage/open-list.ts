import 'server-only'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { Config } from '~/types'

const app = new Hono()

app.get('/info', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'open_list_url',
      'open_list_token'
    ])
    return c.json({ code: 200, message: 'Success', data })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to fetch open list info', cause: e })
  }
})

app.get('/storages', async (c) => {
  try {
    const findConfig = await fetchConfigsByKeys([
      'open_list_url',
      'open_list_token'
    ])
    const openListToken = findConfig.find((item: Config) => item.config_key === 'open_list_token')?.config_value || ''
    const openListUrl = findConfig.find((item: Config) => item.config_key === 'open_list_url')?.config_value || ''

    if (!openListUrl || !openListToken) {
      throw new HTTPException(400, { message: 'Open List URL and token must be configured' })
    }

    const data = await fetch(`${openListUrl}/api/admin/storage/list`, {
      method: 'get',
      headers: {
        'Authorization': openListToken.toString(),
      },
    }).then(res => res.json())
    return c.json({ code: 200, message: 'Success', data })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to fetch storages', cause: e })
  }
})

export default app
