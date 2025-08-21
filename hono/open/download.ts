import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { Config } from '~/types'
import { generatePresignedUrl } from '~/server/lib/s3api'

const app = new Hono()

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const storage = c.req.query('storage')

  if (!storage) {
    throw new HTTPException(400, { message: 'Missing storage parameter' })
  }

  try {
    // 从数据库获取图片信息
    const imageData = await fetchImageByIdAndAuth(id)
    if (!imageData) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    const imageUrl = imageData.url
    const imageName = imageData.image_name
    if (!imageUrl) {
      throw new HTTPException(404, { message: 'Image URL not found' })
    }

    // 如果没有开启直接下载，直接返回图片 URL
    const configs = await fetchConfigsByKeys([
      's3_direct_download',
      'r2_direct_download'
    ])
    const s3DirectDownload = configs.find((item: Config) => item.config_key === 's3_direct_download')?.config_value === 'true'
    const r2DirectDownload = configs.find((item: Config) => item.config_key === 'r2_direct_download')?.config_value === 'true'

    if ((storage === 's3' && !s3DirectDownload) || (storage === 'r2' && !r2DirectDownload)) {
      // 对于非直接下载，返回带有 Content-Disposition 的响应
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // 提取并解码文件名
      let filename: string
      // 如果有图片名
      if (imageName) {
        filename = imageName
      } else {
        filename = decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')
      }

      return new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
        }
      })
    }

    // 处理 URL 格式，提取 key
    let key: string
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // 从完整 URL 中提取路径部分，避免自动解码
      const urlMatch = imageUrl.match(/^https?:\/\/[^\/]+(\/.*)$/)
      if (urlMatch) {
        key = urlMatch[1].slice(1) // 移除开头的斜杠
      } else {
        key = imageUrl
      }
      // 如果路径以 storage_folder 开头，移除它
      if (storage === 's3') {
        const s3StorageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''
        if (s3StorageFolder && key.startsWith(s3StorageFolder)) {
          key = key.slice(s3StorageFolder.length)
        }
      } else if (storage === 'r2') {
        const r2StorageFolder = configs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''
        if (r2StorageFolder && key.startsWith(r2StorageFolder)) {
          key = key.slice(r2StorageFolder.length)
        }
      }
    } else {
      key = imageUrl
    }

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

        // 如果 key 已经包含了 storage_folder，就不再添加
        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        // 直接返回预签名 URL
        let filename: string
        if (imageName) {
          filename = imageName
        } else {
          filename = decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')
        }

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

        // 如果 key 已经包含了 storage_folder，就不再添加
        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        const client = getR2Client(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        // 直接返回预签名 URL
        let filename: string
        if (imageName) {
          filename = imageName
        } else {
          filename = decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')
        }

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      default:
        throw new HTTPException(400, { message: 'Unsupported storage type' })
    }
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to process download', cause: e })
  }
})

export default app
