import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { openListUpload } from '~/server/lib/file-upload'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import type { Config } from '~/types'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { generatePresignedUrl } from '~/server/lib/s3api'

const app = new Hono()

// 生成预签名 URL
app.post('/presigned-url', async (c) => {
  try {
    const { filename, contentType, type = '/', storage } = await c.req.json()
    if (!filename) {
      throw new HTTPException(400, { message: 'Filename is required' })
    }
    if (!storage) {
      throw new HTTPException(400, { message: 'Storage type is required' })
    }

    switch (storage) {
      case 's3': {
        // 获取 S3 配置
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
        ])

        const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''

        // 构建文件路径
        const filePath = storageFolder && storageFolder !== '/'
          ? type && type !== '/' ? `${storageFolder}${type}/${filename}` : `${storageFolder}/${filename}`
          : type && type !== '/' ? `${type.slice(1)}/${filename}` : `${filename}`

        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath
          }
        })
      }

      case 'r2': {
        // 获取 R2 配置
        const configs = await fetchConfigsByKeys([
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_account_id',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain',
        ])

        const bucket = configs.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''

        // 构建文件路径
        const filePath = storageFolder && storageFolder !== '/'
          ? type && type !== '/' ? `${storageFolder}${type}/${filename}` : `${storageFolder}/${filename}`
          : type && type !== '/' ? `${type.slice(1)}/${filename}` : `${filename}`

        const client = getR2Client(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath
          }
        })
      }

      default:
        throw new HTTPException(400, { message: 'Unsupported storage type' })
    }
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to generate presigned URL', cause: e })
  }
})

app.post('/upload', async (c) => {
  const formData = await c.req.formData()

  const file = formData.get('file')
  const storage = formData.get('storage')
  const type = formData.get('type')
  const mountPath = formData.get('mountPath') || ''

  if (storage) {
    switch (storage.toString()) {
      case 'openList':
        return await openListUpload(file, type, mountPath)
          .then((result: string | undefined) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      default:
        throw new HTTPException(500, { message: 'storage not support' })
    }
  }
})

app.post('/getObjectUrl', async (c) => {
  const { storage, key } = await c.req.json()

  switch (storage) {
    case 's3': {
      // 获取 S3 配置
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
      ])

      const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
      const s3Cdn = configs.find((item: Config) => item.config_key === 's3_cdn')?.config_value || ''
      const s3CdnUrl = configs.find((item: Config) => item.config_key === 's3_cdn_url')?.config_value || ''
      const forcePathStyle = configs.find((item: Config) => item.config_key === 'force_path_style')?.config_value || ''
      const endpoint = configs.find((item: Config) => item.config_key === 'endpoint')?.config_value || ''

      if (s3Cdn && s3Cdn === 'true') {
        return Response.json({
          code: 200, data: `https://${
            s3CdnUrl.includes('https://') ? s3CdnUrl.split('//')[1] : s3CdnUrl
          }/${key}`
        })
      } else {
        if (forcePathStyle && forcePathStyle === 'true') {
          return Response.json({
            code: 200, data: `https://${
              endpoint.includes('https://') ? endpoint.split('//')[1] : endpoint
            }/${bucket}/${key}`
          })
        }
      }
      return Response.json({
        code: 200, data: `https://${bucket}.${
          endpoint.includes('https://') ? endpoint.split('//')[1] : endpoint
        }/${key}`
      })
    }

    case 'r2': {
      // 获取 R2 配置
      const configs = await fetchConfigsByKeys([
        'r2_accesskey_id',
        'r2_accesskey_secret',
        'r2_account_id',
        'r2_bucket',
        'r2_storage_folder',
        'r2_public_domain',
      ])

      const r2PublicDomain = configs.find((item: Config) => item.config_key === 'r2_public_domain')?.config_value || ''

      return Response.json({
        code: 200, data: `${r2PublicDomain}/${key}`
      })
    }
  }
})

export default app