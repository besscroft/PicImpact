import 'server-only'

import { Hono } from 'hono'
import { openListUpload } from '~/server/lib/file-upload'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import type { Config } from '~/types'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { generatePresignedUrl } from '~/server/lib/s3api'
import { ok } from '~/hono/_lib/response'
import { badRequest, serverError } from '~/hono/_lib/errors'
import {
  validateFilename,
  validateFileSize,
  validateMimeType,
} from '~/server/lib/upload-validation'
import { HTTPException } from 'hono/http-exception'

interface S3StorageConfig {
  configs: Config[]
  bucket: string
  storageFolder: string
  client: ReturnType<typeof getClient>
}

interface R2StorageConfig {
  configs: Config[]
  bucket: string
  storageFolder: string
  r2PublicDomain: string
  client: ReturnType<typeof getR2Client>
}

async function getS3Config(): Promise<S3StorageConfig> {
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
  const client = getClient(configs)
  return { configs, bucket, storageFolder, client }
}

async function getR2Config(): Promise<R2StorageConfig> {
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
  const r2PublicDomain = configs.find((item: Config) => item.config_key === 'r2_public_domain')?.config_value || ''
  const client = getR2Client(configs)
  return { configs, bucket, storageFolder, r2PublicDomain, client }
}

function buildStoragePath(storageFolder: string, type: string, filename: string): string {
  if (storageFolder && storageFolder !== '/') {
    return type && type !== '/'
      ? `${storageFolder}${type}/${filename}`
      : `${storageFolder}/${filename}`
  }
  return type && type !== '/'
    ? `${type.slice(1)}/${filename}`
    : `${filename}`
}

const app = new Hono()

// 生成预签名 URL
app.post('/presigned-url', async (c) => {
  try {
    const { filename, contentType, type = '/', storage } = await c.req.json()
    if (!storage) {
      throw badRequest('Storage type is required')
    }
    const safeFilename = validateFilename(filename)
    validateMimeType(contentType)

    switch (storage) {
      case 's3': {
        const { bucket, storageFolder, client } = await getS3Config()
        const filePath = buildStoragePath(storageFolder, type, safeFilename)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return ok(c, { presignedUrl, key: filePath })
      }

      case 'r2': {
        const { bucket, storageFolder, client } = await getR2Config()
        const filePath = buildStoragePath(storageFolder, type, safeFilename)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return ok(c, { presignedUrl, key: filePath })
      }

      default:
        throw badRequest('Unsupported storage type')
    }
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to generate presigned URL', e)
  }
})

app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData()

    const file = formData.get('file')
    const storage = formData.get('storage')
    const type = formData.get('type')
    const mountPath = formData.get('mountPath') || ''

    if (storage) {
      switch (storage.toString()) {
        case 'openList': {
          if (!file || !(file instanceof File)) {
            throw badRequest('File is required')
          }
          validateFilename(file.name)
          validateMimeType(file.type)
          validateFileSize(file.size)
          const result = await openListUpload(file, type, mountPath)
          return ok(c, result)
        }
        default:
          throw badRequest('Unsupported storage type')
      }
    }
    throw badRequest('Storage type is required')
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to upload file', e)
  }
})

app.post('/object-url', async (c) => {
  try {
    const { storage, key } = await c.req.json()

    switch (storage) {
      case 's3': {
        const { configs, bucket } = await getS3Config()

        const s3Cdn = configs.find((item: Config) => item.config_key === 's3_cdn')?.config_value || ''
        const s3CdnUrl = configs.find((item: Config) => item.config_key === 's3_cdn_url')?.config_value || ''
        const forcePathStyle = configs.find((item: Config) => item.config_key === 'force_path_style')?.config_value || ''
        const endpoint = configs.find((item: Config) => item.config_key === 'endpoint')?.config_value || ''

        const cleanEndpoint = endpoint.replace(/^https?:\/\//, '')
        const cleanS3CdnUrl = s3CdnUrl.replace(/^https?:\/\//, '')

        if (s3Cdn && s3Cdn === 'true') {
          return ok(c, `https://${cleanS3CdnUrl}/${key}`)
        } else {
          if (forcePathStyle && forcePathStyle === 'true') {
            return ok(c, `https://${cleanEndpoint}/${bucket}/${key}`)
          }
        }
        return ok(c, `https://${bucket}.${cleanEndpoint}/${key}`)
      }

      case 'r2': {
        const { r2PublicDomain } = await getR2Config()

        return ok(c, `${r2PublicDomain}/${key}`)
      }

      default:
        throw badRequest('Unsupported storage type')
    }
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw serverError('Failed to get object URL', e)
  }
})

export default app
