import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { fetchAlbumsWithDailyWeight } from '~/server/db/query/daily'
import { Hono } from 'hono'
import { updateDailyConfig, updateAlbumsDailyWeight, refreshDailyImages } from '~/server/db/operate/daily'
import { toDailyConfig } from '~/server/lib/config-transform'
import { ok, okEmpty } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'

const app = new Hono()

app.get('/config', async (c) => {
  try {
    const rows = await fetchConfigsByKeys([
      'daily_enabled',
      'daily_refresh_interval',
      'daily_total_count',
      'daily_last_refresh'
    ])
    return ok(c, toDailyConfig(rows))
  } catch (error) {
    console.error('Error fetching daily config:', error)
    throw serverError('Failed to fetch daily config', error)
  }
})

app.put('/config', async (c) => {
  const body = await c.req.json() satisfies {
    dailyEnabled: boolean
    dailyRefreshInterval: string
    dailyTotalCount: number
  }
  const validIntervals = ['6', '12', '24', '168']
  if (!validIntervals.includes(body.dailyRefreshInterval)) {
    throw badRequest('Invalid dailyRefreshInterval, must be one of: 6, 12, 24, 168')
  }
  if (typeof body.dailyTotalCount !== 'number' || body.dailyTotalCount < 1 || body.dailyTotalCount > 1000) {
    throw badRequest('Invalid dailyTotalCount, must be between 1 and 1000')
  }
  if (typeof body.dailyEnabled !== 'boolean') {
    throw badRequest('Invalid dailyEnabled, must be a boolean')
  }
  try {
    await updateDailyConfig(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.get('/albums', async (c) => {
  try {
    const data = await fetchAlbumsWithDailyWeight()
    return ok(c, data)
  } catch (error) {
    console.error('Error fetching albums with daily weight:', error)
    throw serverError('Failed to fetch albums with daily weight', error)
  }
})

app.put('/albums', async (c) => {
  const body = await c.req.json() satisfies Array<{
    id: string
    dailyWeight: number
  }>
  if (!Array.isArray(body)) {
    throw badRequest('Request body must be an array')
  }
  for (const item of body) {
    if (typeof item.id !== 'string' || !item.id) {
      throw badRequest('Each item must have a non-empty string id')
    }
    if (typeof item.dailyWeight !== 'number' || item.dailyWeight < 0 || item.dailyWeight > 10) {
      throw badRequest('Each item must have a dailyWeight between 0 and 10')
    }
  }
  try {
    await updateAlbumsDailyWeight(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.post('/refresh', async (c) => {
  try {
    await refreshDailyImages()
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

export default app
