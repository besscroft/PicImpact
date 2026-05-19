import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { Config } from '~/types'
import { generatePresignedUrl } from '~/server/lib/s3api'
import { badRequest, notFound, serverError } from '~/hono/_lib/errors'

const app = new Hono()

// NOTE: This endpoint intentionally returns a non-envelope response — either
// a binary blob (with Content-Disposition) or a `{ url, filename }` JSON
// payload. PR-01 in the API refactor plan splits this into two endpoints
// with single contracts. Until then, the frontend
// (components/album/preview-image.tsx) discriminates by Content-Type.
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const storage = c.req.query('storage')

  if (!storage) {
    throw badRequest('Missing storage parameter')
  }

  try {
    const imageData = await fetchImageByIdAndAuth(id)
    if (!imageData) {
      throw notFound('Image not found')
    }

    const imageUrl = imageData.url
    const imageName = imageData.image_name
    if (!imageUrl) {
      throw notFound('Image URL not found')
    }

    const downloadConfigs = await fetchConfigsByKeys([
      's3_direct_download',
      'r2_direct_download',
      'storage_folder',
      'r2_storage_folder'
    ])
    const s3DirectDownload = downloadConfigs.find((item: Config) => item.config_key === 's3_direct_download')?.config_value === 'true'
    const r2DirectDownload = downloadConfigs.find((item: Config) => item.config_key === 'r2_direct_download')?.config_value === 'true'

    if ((storage === 's3' && !s3DirectDownload) || (storage === 'r2' && !r2DirectDownload)) {
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      const filename = imageName
        ? imageName
        : decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')

      return new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
        }
      })
    }

    let key: string
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const urlMatch = imageUrl.match(/^https?:\/\/[^\/]+(\/.*)$/)
      if (urlMatch) {
        key = urlMatch[1].slice(1)
      } else {
        key = imageUrl
      }
      if (storage === 's3') {
        const s3StorageFolder = downloadConfigs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''
        if (s3StorageFolder && key.startsWith(s3StorageFolder)) {
          key = key.slice(s3StorageFolder.length)
        }
      } else if (storage === 'r2') {
        const r2StorageFolder = downloadConfigs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''
        if (r2StorageFolder && key.startsWith(r2StorageFolder)) {
          key = key.slice(r2StorageFolder.length)
        }
      }
    } else {
      key = imageUrl
    }

    const filename = imageName
      ? imageName
      : decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')

    switch (storage) {
      case 's3': {
        const configs = await fetchConfigsByKeys([
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
          's3_cdn',
          's3_cdn_url',
          's3_direct_download'
        ])
        const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''

        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      case 'r2': {
        const configs = await fetchConfigsByKeys([
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_account_id',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain',
          'r2_direct_download'
        ])
        const bucket = configs.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''

        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        const client = getR2Client(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      default:
        throw badRequest('Unsupported storage type')
    }
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to process download', e)
  }
})

export default app
