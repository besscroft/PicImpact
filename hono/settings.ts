import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import type { Config } from '~/types'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { updateOpenListConfig, updateCustomInfo, updateR2Config, updateS3Config } from '~/server/db/operate/configs'

const app = new Hono()

app.get('/get-custom-info', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'custom_title',
      'custom_favicon_url',
      'custom_author',
      'rss_feed_id',
      'rss_user_id',
      'custom_index_style',
      'custom_index_download_enable',
      'preview_max_width_limit',
      'preview_max_width_limit_switch',
      'preview_quality',
      'umami_host',
      'umami_analytics',
      'max_upload_files',
      'custom_index_origin_enable',
      'admin_images_per_page'
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching custom info:', error)
    throw new HTTPException(500, { message: 'Failed to fetch custom info', cause: error })
  }
})

app.get('/r2-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'r2_accesskey_id',
    'r2_accesskey_secret',
    'r2_account_id',
    'r2_bucket',
    'r2_storage_folder',
    'r2_public_domain',
    'r2_direct_download'
  ])
  return c.json(data)
})

app.get('/s3-info', async (c) => {
  const data = await fetchConfigsByKeys([
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
  return c.json(data)
})

app.get('/get-admin-config', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'admin_images_per_page'
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching admin config:', error)
    throw new HTTPException(500, { message: 'Failed to fetch admin config', cause: error })
  }
})

app.put('/update-open-list-info', async (c) => {
  const query = await c.req.json()

  const openListUrl = query?.find((item: Config) => item.config_key === 'open_list_url').config_value
  const openListToken = query?.find((item: Config) => item.config_key === 'open_list_token').config_value

  const data = await updateOpenListConfig({ openListUrl, openListToken })
  return c.json(data)
})

app.put('/update-r2-info', async (c) => {
  const query = await c.req.json()

  const r2AccesskeyId = query?.find((item: Config) => item.config_key === 'r2_accesskey_id').config_value
  const r2AccesskeySecret = query?.find((item: Config) => item.config_key === 'r2_accesskey_secret').config_value
  const r2AccountId = query?.find((item: Config) => item.config_key === 'r2_account_id').config_value
  const r2Bucket = query?.find((item: Config) => item.config_key === 'r2_bucket').config_value
  const r2StorageFolder = query?.find((item: Config) => item.config_key === 'r2_storage_folder').config_value
  const r2PublicDomain = query?.find((item: Config) => item.config_key === 'r2_public_domain').config_value
  const r2DirectDownload = query?.find((item: Config) => item.config_key === 'r2_direct_download').config_value

  const data = await updateR2Config({ r2AccesskeyId, r2AccesskeySecret, r2AccountId, r2Bucket, r2StorageFolder, r2PublicDomain, r2DirectDownload })
  return c.json(data)
})

app.put('/update-s3-info', async (c) => {
  const query = await c.req.json()

  const accesskeyId = query?.find((item: Config) => item.config_key === 'accesskey_id').config_value
  const accesskeySecret = query?.find((item: Config) => item.config_key === 'accesskey_secret').config_value
  const region = query?.find((item: Config) => item.config_key === 'region').config_value
  const endpoint = query?.find((item: Config) => item.config_key === 'endpoint').config_value
  const bucket = query?.find((item: Config) => item.config_key === 'bucket').config_value
  const storageFolder = query?.find((item: Config) => item.config_key === 'storage_folder').config_value
  const forcePathStyle = query?.find((item: Config) => item.config_key === 'force_path_style').config_value
  const s3Cdn = query?.find((item: Config) => item.config_key === 's3_cdn').config_value
  const s3CdnUrl = query?.find((item: Config) => item.config_key === 's3_cdn_url').config_value
  const s3DirectDownload = query?.find((item: Config) => item.config_key === 's3_direct_download').config_value

  const data = await updateS3Config({ accesskeyId, accesskeySecret, region, endpoint, bucket, storageFolder, forcePathStyle, s3Cdn, s3CdnUrl, s3DirectDownload })
  return c.json(data)
})

app.put('/update-custom-info', async (c) => {
  const query = await c.req.json() satisfies {
    title: string
    customFaviconUrl: string
    customAuthor: string
    feedId: string
    userId: string
    customIndexStyle: number
    customIndexDownloadEnable: boolean
    enablePreviewImageMaxWidthLimit: boolean
    previewImageMaxWidth: number
    previewQuality: number
    umamiHost: string
    umamiAnalytics: string
    maxUploadFiles: number
    customIndexOriginEnable: boolean
    adminImagesPerPage: number
  }
  try {
    await updateCustomInfo(query)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app
