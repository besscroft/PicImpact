import 'server-only'

import { Hono } from 'hono'
import { fetchClientCameraAndLensList } from '~/server/db/query/images'
import { fetchDailyCameraAndLensList } from '~/server/db/query/daily'
import { fetchConfigValue } from '~/server/db/query/configs'
import { filterStringArray } from '~/lib/utils/array'
import { ok } from '~/hono/_lib/response'
import { serverError } from '~/hono/_lib/errors'

const app = new Hono()

// Returns the camera/lens models surfaced on the public-facing gallery.
// Filtered to images visible to anonymous visitors:
//   * No album / album = '/' & daily mode enabled  -> daily_images pool only.
//   * No album / album = '/' & daily mode disabled -> images with show=0 AND
//     show_on_mainpage=0 (i.e. eligible for the home grid).
//   * Specific album -> joins albums table and requires albums.show=0
//     (album publicly visible) in addition to image.show=0.
// The unfiltered admin variant lives at GET /api/v1/images/camera-lens-list
// and must not be exposed here.
app.get('/', async (c) => {
  try {
    const album = c.req.query('album') || undefined
    const dailyEnabled = await fetchConfigValue('daily_enabled', 'false')

    let cameras: string[], lenses: string[]
    if (dailyEnabled === 'true' && (!album || album === '/')) {
      ({ cameras, lenses } = await fetchDailyCameraAndLensList())
    } else {
      ({ cameras, lenses } = await fetchClientCameraAndLensList(album))
    }

    return ok(c, {
      cameras: filterStringArray(cameras),
      lenses: filterStringArray(lenses),
    })
  } catch (e) {
    console.error('Failed to fetch camera and lens list:', e)
    throw serverError('Failed to fetch camera and lens list', e)
  }
})

export default app
