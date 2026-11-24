import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { Config } from '~/types'
import { buildOriginalPresignedUrl } from '~/server/lib/original-presign'
import { ok } from '~/hono/_lib/response'
import { badRequest, notFound, serverError } from '~/hono/_lib/errors'

const app = new Hono()

type DownloadFlags = {
  s3DirectDownload: boolean
  r2DirectDownload: boolean
}

async function readDirectDownloadFlags(): Promise<DownloadFlags> {
  const configs = await fetchConfigsByKeys(['s3_direct_download', 'r2_direct_download'])
  return {
    s3DirectDownload: configs.find((item: Config) => item.config_key === 's3_direct_download')?.config_value === 'true',
    r2DirectDownload: configs.find((item: Config) => item.config_key === 'r2_direct_download')?.config_value === 'true',
  }
}

function deriveFilename(imageName: string | null | undefined, imageUrl: string): string {
  if (imageName) return imageName
  const tail = imageUrl.split('/').pop() || 'download.jpg'
  try {
    return decodeURIComponent(tail)
  } catch {
    return tail
  }
}

function buildContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename)
  return `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`
}

async function loadImageOrThrow(id: string) {
  const imageData = await fetchImageByIdAndAuth(id)
  if (!imageData) {
    throw notFound('Image not found')
  }
  const imageUrl = imageData.url
  if (!imageUrl) {
    throw notFound('Image URL not found')
  }
  return { imageData, imageUrl }
}

/**
 * GET /api/public/download/config
 *
 * Exposes the per-storage direct-download flags so the frontend can pick
 * the correct download endpoint deterministically (binary vs presigned)
 * without inferring from response shape.
 */
app.get('/config', async (c) => {
  try {
    const flags = await readDirectDownloadFlags()
    c.header('Cache-Control', 'private, max-age=60')
    return ok(c, flags)
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to read download config', e)
  }
})

/**
 * GET /api/public/download/:id/presigned?storage=s3|r2
 *
 * Always returns the standard envelope:
 *   { code: 200, message: 'Success', data: { url, filename } }
 *
 * Intended for the "direct download" code path where the browser fetches
 * the presigned URL itself. Use `/api/public/download/:id` when direct
 * download is disabled and the server must proxy the bytes.
 */
app.get('/:id/presigned', async (c) => {
  const id = c.req.param('id')
  const storage = c.req.query('storage')

  if (!storage) {
    throw badRequest('Missing storage parameter')
  }

  try {
    const { imageData, imageUrl } = await loadImageOrThrow(id)
    const filename = deriveFilename(imageData.image_name, imageUrl)
    const url = await buildOriginalPresignedUrl(storage, imageUrl)
    c.header('Cache-Control', 'private, max-age=60')
    return ok(c, { url, filename: encodeURIComponent(filename) })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to build presigned download URL', e)
  }
})

/**
 * GET /api/public/download/:id?storage=s3|r2
 *
 * Always returns the image bytes with an `attachment` Content-Disposition.
 * Use `/api/public/download/:id/presigned` when direct download is enabled
 * for the storage and the client should fetch from object storage itself.
 */
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const storage = c.req.query('storage')

  if (!storage) {
    throw badRequest('Missing storage parameter')
  }

  try {
    const { imageData, imageUrl } = await loadImageOrThrow(id)
    const filename = deriveFilename(imageData.image_name, imageUrl)

    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw serverError('Failed to fetch image from storage')
    }
    const blob = await response.blob()

    return new Response(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': buildContentDisposition(filename),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to process download', e)
  }
})

export default app
