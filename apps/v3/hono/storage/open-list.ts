import 'server-only'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { toOpenListInfo } from '~/server/lib/config-transform'
import { ok } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'

const app = new Hono()

app.get('/info', async (c) => {
  try {
    const rows = await fetchConfigsByKeys([
      'open_list_url',
      'open_list_token'
    ])
    return ok(c, toOpenListInfo(rows))
  } catch (e) {
    throw serverError('Failed to fetch open list info', e)
  }
})

app.get('/storages', async (c) => {
  try {
    const rows = await fetchConfigsByKeys([
      'open_list_url',
      'open_list_token'
    ])
    const { openListUrl, openListToken } = toOpenListInfo(rows)

    if (!openListUrl || !openListToken) {
      throw badRequest('Open List URL and token must be configured')
    }

    const data = await fetch(`${openListUrl}/api/admin/storage/list`, {
      method: 'get',
      headers: {
        'Authorization': openListToken,
      },
    }).then(res => res.json())
    return ok(c, data)
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to fetch storages', e)
  }
})

export default app
