import 'server-only'

import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { Hono } from 'hono'
import { updateOpenListConfig, updateCustomInfo, updateR2Config, updateS3Config, updateVariantStorageConfig } from '~/server/db/operate/configs'
import { normalizeDefaultTheme } from '~/lib/utils/theme'
import {
  toAdminConfig,
  toCustomInfo,
  toR2Info,
  toS3Info,
  toVariantStorageInfo,
} from '~/server/lib/config-transform'
import type { CustomInfo, OpenListInfo, R2Info, S3Info, VariantStorageInfo } from '~/types'
import { ok, okEmpty } from '~/hono/_lib/response'
import { serverError } from '~/hono/_lib/errors'

const app = new Hono()

const CUSTOM_INFO_KEYS = [
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
  'admin_images_per_page',
  'default_theme',
]

const R2_INFO_KEYS = [
  'r2_accesskey_id',
  'r2_accesskey_secret',
  'r2_account_id',
  'r2_bucket',
  'r2_storage_folder',
  'r2_public_domain',
  'r2_direct_download',
]

const S3_INFO_KEYS = [
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
]

app.get('/custom-info', async (c) => {
  try {
    const rows = await fetchConfigsByKeys(CUSTOM_INFO_KEYS)
    return ok(c, toCustomInfo(rows))
  } catch (error) {
    throw serverError('Failed to fetch custom info', error)
  }
})

app.get('/r2-info', async (c) => {
  try {
    const rows = await fetchConfigsByKeys(R2_INFO_KEYS)
    return ok(c, toR2Info(rows))
  } catch (error) {
    throw serverError('Failed to fetch R2 info', error)
  }
})

app.get('/s3-info', async (c) => {
  try {
    const rows = await fetchConfigsByKeys(S3_INFO_KEYS)
    return ok(c, toS3Info(rows))
  } catch (error) {
    throw serverError('Failed to fetch S3 info', error)
  }
})

app.get('/admin-config', async (c) => {
  try {
    const rows = await fetchConfigsByKeys(['admin_images_per_page'])
    return ok(c, toAdminConfig(rows))
  } catch (error) {
    throw serverError('Failed to fetch admin config', error)
  }
})

app.get('/variant-storage', async (c) => {
  try {
    const rows = await fetchConfigsByKeys(['variant_storage'])
    return ok(c, toVariantStorageInfo(rows))
  } catch (error) {
    throw serverError('Failed to fetch variant storage info', error)
  }
})

app.put('/variant-storage', async (c) => {
  try {
    const body = await c.req.json<VariantStorageInfo>()
    await updateVariantStorageConfig(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/open-list-info', async (c) => {
  try {
    const body = await c.req.json<OpenListInfo>()
    await updateOpenListConfig({
      openListUrl: body.openListUrl ?? '',
      openListToken: body.openListToken ?? '',
    })
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/r2-info', async (c) => {
  try {
    const body = await c.req.json<R2Info>()
    await updateR2Config(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/s3-info', async (c) => {
  try {
    const body = await c.req.json<S3Info>()
    await updateS3Config(body)
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

app.put('/custom-info', async (c) => {
  try {
    const body = await c.req.json<CustomInfo>()
    await updateCustomInfo({
      ...body,
      defaultTheme: normalizeDefaultTheme(body.defaultTheme),
    })
    return okEmpty(c)
  } catch (e) {
    throw serverError('Failed', e)
  }
})

export default app
