import 'server-only'
import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageAlbum
} from '~/server/db/operate/images'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const app = new Hono()

// 生成预签名 URL
app.post('/presigned-url', async (c) => {
  try {
    const { filename, contentType, storage } = await c.req.json()
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
          's3_direct_upload'
        ])

        const directUpload = configs.find((item: any) => item.config_key === 's3_direct_upload')?.config_value === 'true'
        if (!directUpload) {
          throw new HTTPException(400, { message: 'S3 direct upload is not enabled' })
        }

        const bucket = configs.find((item: any) => item.config_key === 'bucket')?.config_value || ''
        const storageFolder = configs.find((item: any) => item.config_key === 'storage_folder')?.config_value || ''

        // 构建文件路径
        const filePath = storageFolder && storageFolder !== '/'
          ? `${storageFolder}/${filename}`
          : filename

        const client = getClient(configs)
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          ContentType: contentType || undefined
        })

        const presignedUrl = await getSignedUrl(client as any, command as any, { expiresIn: 3600 })

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
          'r2_endpoint',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain',
          'r2_direct_upload'
        ])

        const directUpload = configs.find((item: any) => item.config_key === 'r2_direct_upload')?.config_value === 'true'
        if (!directUpload) {
          throw new HTTPException(400, { message: 'R2 direct upload is not enabled' })
        }

        const bucket = configs.find((item: any) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: any) => item.config_key === 'r2_storage_folder')?.config_value || ''

        // 构建文件路径
        const filePath = storageFolder && storageFolder !== '/'
          ? `${storageFolder}/${filename}`
          : filename

        const client = getR2Client(configs)
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: filePath,
          ContentType: contentType || undefined
        })

        const presignedUrl = await getSignedUrl(client as any, command as any, { expiresIn: 3600 })

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

app.post('/add', async (c) => {
  const body = await c.req.json()
  if (!body) {
    throw new HTTPException(400, { message: 'Missing body' })
  }

  // 验证基本图片信息
  if (!body.url) {
    throw new HTTPException(500, { message: 'Image link cannot be empty' })
  }
  if (!body.height || body.height <= 0) {
    throw new HTTPException(500, { message: 'Image height cannot be empty and must be greater than 0' })
  }
  if (!body.width || body.width <= 0) {
    throw new HTTPException(500, { message: 'Image width cannot be empty and must be greater than 0' })
  }

  try {
    // 获取存储配置
    const configs = await fetchConfigsByKeys([
      's3_cdn',
      's3_cdn_url',
      's3_direct_upload',
      'r2_public_domain',
      'r2_direct_upload'
    ])

    // 检查是否是直传模式
    const s3DirectUpload = configs.find((item: any) => item.config_key === 's3_direct_upload')?.config_value === 'true'
    const r2DirectUpload = configs.find((item: any) => item.config_key === 'r2_direct_upload')?.config_value === 'true'

    // 如果是直传模式，需要处理文件
    if (s3DirectUpload || r2DirectUpload) {
      const url = body.url
      const previewUrl = body.preview_url
      if (!url) {
        throw new HTTPException(400, { message: 'Missing file URL' })
      }

      // 确保 URL 是完整的
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (s3DirectUpload) {
          const s3Cdn = configs.find((item: any) => item.config_key === 's3_cdn')?.config_value
          const s3CdnUrl = configs.find((item: any) => item.config_key === 's3_cdn_url')?.config_value || ''
          if (s3Cdn && s3Cdn === 'true') {
            body.url = `https://${s3CdnUrl.includes('https://') ? s3CdnUrl.split('//')[1] : s3CdnUrl}/${url}`
          }
        } else if (r2DirectUpload) {
          const publicDomain = configs.find((item: any) => item.config_key === 'r2_public_domain')?.config_value || ''
          if (publicDomain) {
            body.url = `https://${publicDomain}/${url}`
          }
        }
      }

      // 处理预览图片 URL
      if (previewUrl && !previewUrl.startsWith('http://') && !previewUrl.startsWith('https://')) {
        if (s3DirectUpload) {
          const s3Cdn = configs.find((item: any) => item.config_key === 's3_cdn')?.config_value
          const s3CdnUrl = configs.find((item: any) => item.config_key === 's3_cdn_url')?.config_value || ''
          if (s3Cdn && s3Cdn === 'true') {
            body.preview_url = `https://${s3CdnUrl.includes('https://') ? s3CdnUrl.split('//')[1] : s3CdnUrl}/${previewUrl}`
          }
        } else if (r2DirectUpload) {
          const publicDomain = configs.find((item: any) => item.config_key === 'r2_public_domain')?.config_value || ''
          if (publicDomain) {
            body.preview_url = `https://${publicDomain}/${previewUrl}`
          }
        }
      }
    }

    // 保存图片信息
    const res = await insertImage(body)
    return Response.json({
      code: 200,
      data: res
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const data = await c.req.json()
    await deleteBatchImage(data)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/delete/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update', async (c) => {
  const image = await c.req.json()
  if (!image.url) {
    throw new HTTPException(500, { message: 'Image link cannot be empty' })
  }
  if (!image.height || image.height <= 0) {
    throw new HTTPException(500, { message: 'Image height cannot be empty and must be greater than 0' })
  }
  if (!image.width || image.width <= 0) {
    throw new HTTPException(500, { message: 'Image width cannot be empty and must be greater than 0' })
  }
  try {
    await updateImage(image)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/update-show', async (c) => {
  const image = await c.req.json()
  const data = await updateImageShow(image.id, image.show)
  return c.json(data)
})

app.put('/update-Album', async (c) => {
  const image = await c.req.json()
  try {
    await updateImageAlbum(image.imageId, image.albumId)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app