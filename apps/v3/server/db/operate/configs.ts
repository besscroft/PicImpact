// 配置表

'use server'

import { db } from '~/server/lib/db'
import { revalidateConfigCache } from '~/server/lib/cache'
import { normalizeDefaultTheme } from '~/lib/utils/theme'
import type { CustomInfo, R2Info, S3Info, OpenListInfo, VariantStorageInfo } from '~/types'

// The configs table stores everything as text, so boolean values coming from
// the API layer (real `boolean`) need to be serialised back to 'true' / 'false'
// before they hit the raw SQL UPDATE statements below. `toBoolString` accepts
// both real booleans (the new API contract) and pre-serialised strings (any
// remaining legacy call sites) to keep the layer permissive during migration.
const toBoolString = (value: boolean | string | undefined | null): string => {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === 'true' || value === 'false') return value
  return 'false'
}

/**
 * 更新 S3 配置
 * @param configs S3 配置（camelCase, see {@link S3Info}）
 */
export async function updateS3Config(configs: S3Info) {
  const forcePathStyle = toBoolString(configs.forcePathStyle)
  const s3Cdn = toBoolString(configs.s3Cdn)
  const s3DirectDownload = toBoolString(configs.s3DirectDownload)
  const result = await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'accesskey_id' THEN ${configs.accesskeyId}
       WHEN config_key = 'accesskey_secret' THEN ${configs.accesskeySecret}
       WHEN config_key = 'region' THEN ${configs.region}
       WHEN config_key = 'endpoint' THEN ${configs.endpoint}
       WHEN config_key = 'bucket' THEN ${configs.bucket}
       WHEN config_key = 'storage_folder' THEN ${configs.storageFolder}
       WHEN config_key = 'force_path_style' THEN ${forcePathStyle}
       WHEN config_key = 's3_cdn' THEN ${s3Cdn}
       WHEN config_key = 's3_cdn_url' THEN ${configs.s3CdnUrl}
       WHEN config_key = 's3_direct_download' THEN ${s3DirectDownload}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder', 'force_path_style', 's3_cdn', 's3_cdn_url', 's3_direct_download');
  `
  revalidateConfigCache()
  return result
}

/**
 * 更新 R2 配置
 * @param configs R2 配置（camelCase, see {@link R2Info}）
 */
export async function updateR2Config(configs: R2Info) {
  const r2DirectDownload = toBoolString(configs.r2DirectDownload)
  const result = await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'r2_accesskey_id' THEN ${configs.r2AccesskeyId}
       WHEN config_key = 'r2_accesskey_secret' THEN ${configs.r2AccesskeySecret}
       WHEN config_key = 'r2_account_id' THEN ${configs.r2AccountId}
       WHEN config_key = 'r2_bucket' THEN ${configs.r2Bucket}
       WHEN config_key = 'r2_storage_folder' THEN ${configs.r2StorageFolder}
       WHEN config_key = 'r2_public_domain' THEN ${configs.r2PublicDomain}
       WHEN config_key = 'r2_direct_download' THEN ${r2DirectDownload}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('r2_accesskey_id', 'r2_accesskey_secret', 'r2_account_id', 'r2_bucket', 'r2_storage_folder', 'r2_public_domain', 'r2_direct_download');
  `
  revalidateConfigCache()
  return result
}

/**
 * 更新 Open List 配置
 * @param configs Open List 配置（camelCase, see {@link OpenListInfo}）
 */
export async function updateOpenListConfig(configs: OpenListInfo) {
  const result = await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'open_list_url' THEN ${configs.openListUrl}
       WHEN config_key = 'open_list_token' THEN ${configs.openListToken}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('open_list_url', 'open_list_token');
  `
  revalidateConfigCache()
  return result
}

/**
 * 更新变体存储后端配置（预处理管线上传变体的目标：'' | 's3' | 'r2'）。
 * upsert 以兼容尚未重新 seed 出 `variant_storage` 行的旧实例。
 */
export async function updateVariantStorageConfig(payload: VariantStorageInfo) {
  const value = payload.variantStorage === 's3' || payload.variantStorage === 'r2' ? payload.variantStorage : ''
  const result = await db.configs.upsert({
    where: { config_key: 'variant_storage' },
    update: { config_value: value, updatedAt: new Date() },
    create: { config_key: 'variant_storage', config_value: value },
  })
  revalidateConfigCache()
  return result
}

/**
 * 更新自定义信息
 * @param payload 自定义信息（camelCase API shape, see {@link CustomInfo}）
 */
export async function updateCustomInfo(payload: CustomInfo) {
  const {
    customTitle,
    customFaviconUrl,
    customAuthor,
    rssFeedId,
    rssUserId,
    customIndexStyle,
    customIndexDownloadEnable,
    previewMaxWidthLimitSwitch,
    previewMaxWidthLimit,
    previewQuality,
    umamiHost,
    umamiAnalytics,
    maxUploadFiles,
    customIndexOriginEnable,
    adminImagesPerPage,
    defaultTheme,
  } = payload
  const normalizedDefaultTheme = normalizeDefaultTheme(defaultTheme)

  const updates = [
    db.configs.update({ where: { config_key: 'custom_title' }, data: { config_value: customTitle, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'custom_favicon_url' }, data: { config_value: customFaviconUrl, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'custom_author' }, data: { config_value: customAuthor, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'rss_feed_id' }, data: { config_value: rssFeedId, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'rss_user_id' }, data: { config_value: rssUserId, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'umami_host' }, data: { config_value: umamiHost, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'umami_analytics' }, data: { config_value: umamiAnalytics, updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'custom_index_style' }, data: { config_value: customIndexStyle.toString(), updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'custom_index_download_enable' }, data: { config_value: customIndexDownloadEnable ? 'true' : 'false', updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'preview_max_width_limit_switch' }, data: { config_value: previewMaxWidthLimitSwitch ? '1' : '0', updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'max_upload_files' }, data: { config_value: maxUploadFiles.toString(), updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'custom_index_origin_enable' }, data: { config_value: customIndexOriginEnable ? 'true' : 'false', updatedAt: new Date() } }),
    db.configs.update({ where: { config_key: 'admin_images_per_page' }, data: { config_value: adminImagesPerPage.toString(), updatedAt: new Date() } }),
    db.configs.upsert({
      where: { config_key: 'default_theme' },
      update: { config_value: normalizedDefaultTheme, updatedAt: new Date() },
      create: {
        config_key: 'default_theme',
        config_value: normalizedDefaultTheme,
        detail: 'Default theme for users without a saved preference.',
      },
    }),
  ]

  if (previewMaxWidthLimit > 0) {
    updates.push(db.configs.update({ where: { config_key: 'preview_max_width_limit' }, data: { config_value: previewMaxWidthLimit.toString(), updatedAt: new Date() } }))
  }

  if (previewQuality > 0) {
    updates.push(db.configs.update({ where: { config_key: 'preview_quality' }, data: { config_value: previewQuality.toString(), updatedAt: new Date() } }))
  }

  const result = await db.$transaction(updates)
  revalidateConfigCache()
  return result
}

