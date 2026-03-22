import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { fetchAlbumsWithDailyWeight } from '~/server/db/query/daily'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { updateDailyConfig, updateAlbumsDailyWeight, refreshDailyImages } from '~/server/db/operate/daily'

const app = new Hono()

app.get('/config', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'daily_enabled',
      'daily_refresh_interval',
      'daily_total_count',
      'daily_last_refresh'
    ])
    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    console.error('Error fetching daily config:', error)
    throw new HTTPException(500, { message: 'Failed to fetch daily config', cause: error })
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
    throw new HTTPException(400, { message: 'Invalid dailyRefreshInterval, must be one of: 6, 12, 24, 168' })
  }
  if (typeof body.dailyTotalCount !== 'number' || body.dailyTotalCount < 1 || body.dailyTotalCount > 1000) {
    throw new HTTPException(400, { message: 'Invalid dailyTotalCount, must be between 1 and 1000' })
  }
  if (typeof body.dailyEnabled !== 'boolean') {
    throw new HTTPException(400, { message: 'Invalid dailyEnabled, must be a boolean' })
  }
  try {
    await updateDailyConfig(body)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.get('/albums', async (c) => {
  try {
    const data = await fetchAlbumsWithDailyWeight()
    return c.json({ code: 200, message: 'Success', data })
  } catch (error) {
    console.error('Error fetching albums with daily weight:', error)
    throw new HTTPException(500, { message: 'Failed to fetch albums with daily weight', cause: error })
  }
})

app.put('/albums', async (c) => {
  const body = await c.req.json() satisfies Array<{
    id: string
    dailyWeight: number
  }>
  if (!Array.isArray(body)) {
    throw new HTTPException(400, { message: 'Request body must be an array' })
  }
  for (const item of body) {
    if (typeof item.id !== 'string' || !item.id) {
      throw new HTTPException(400, { message: 'Each item must have a non-empty string id' })
    }
    if (typeof item.dailyWeight !== 'number' || item.dailyWeight < 0 || item.dailyWeight > 10) {
      throw new HTTPException(400, { message: 'Each item must have a dailyWeight between 0 and 10' })
    }
  }
  try {
    await updateAlbumsDailyWeight(body)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.post('/refresh', async (c) => {
  try {
    await refreshDailyImages()
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app
