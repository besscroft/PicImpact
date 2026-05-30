import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { getClient } from '~/server/lib/s3'
import { getR2Client } from '~/server/lib/r2'
import { generatePresignedUrl } from '~/server/lib/s3api'
import { badRequest } from '~/hono/_lib/errors'
import type { Config } from '~/types'

/**
 * Build a presigned GET URL for an image's **original** object, using stored
 * storage credentials.
 *
 * Originals live in private buckets on many deployments, so a plain public
 * `fetch(image.url)` is rejected with 403. This derives the object key from the
 * stored `image.url` (strip scheme+host, handle the storage folder prefix) and
 * presigns a GET with the backend's credentials — the same approach the
 * "download original" route uses, extracted here so the download route and the
 * preprocessing pipeline share one proven implementation.
 *
 * `storage` selects the backend (`s3` | `r2`). Open List has no equivalent
 * credentialed presign and is unsupported.
 */
export async function buildOriginalPresignedUrl(storage: string, imageUrl: string): Promise<string> {
  let key: string
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const urlMatch = imageUrl.match(/^https?:\/\/[^/]+(\/.*)$/)
    key = urlMatch ? urlMatch[1].slice(1) : imageUrl
  } else {
    key = imageUrl
  }

  switch (storage) {
    case 's3': {
      const folderConfigs = await fetchConfigsByKeys(['storage_folder'])
      const s3StorageFolder = folderConfigs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''
      if (s3StorageFolder && key.startsWith(s3StorageFolder)) {
        key = key.slice(s3StorageFolder.length)
      }

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
        's3_direct_download',
      ])
      const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
      const storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''

      const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
      const client = getClient(configs)
      return await generatePresignedUrl(client, bucket, filePath, '')
    }
    case 'r2': {
      const folderConfigs = await fetchConfigsByKeys(['r2_storage_folder'])
      const r2StorageFolder = folderConfigs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''
      if (r2StorageFolder && key.startsWith(r2StorageFolder)) {
        key = key.slice(r2StorageFolder.length)
      }

      const configs = await fetchConfigsByKeys([
        'r2_accesskey_id',
        'r2_accesskey_secret',
        'r2_account_id',
        'r2_bucket',
        'r2_storage_folder',
        'r2_public_domain',
        'r2_direct_download',
      ])
      const bucket = configs.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''
      const storageFolder = configs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''

      const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
      const client = getR2Client(configs)
      return await generatePresignedUrl(client, bucket, filePath, '')
    }
    default:
      throw badRequest('Unsupported storage type')
  }
}
