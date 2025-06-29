// 配置表

'use server'

import { db } from '~/server/lib/db'

/**
 * 更新 S3 配置
 * @param configs 配置信息
 */
export async function updateS3Config(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'accesskey_id' THEN ${configs.accesskeyId}
       WHEN config_key = 'accesskey_secret' THEN ${configs.accesskeySecret}
       WHEN config_key = 'region' THEN ${configs.region}
       WHEN config_key = 'endpoint' THEN ${configs.endpoint}
       WHEN config_key = 'bucket' THEN ${configs.bucket}
       WHEN config_key = 'storage_folder' THEN ${configs.storageFolder}
       WHEN config_key = 'force_path_style' THEN ${configs.forcePathStyle}
       WHEN config_key = 's3_cdn' THEN ${configs.s3Cdn}
       WHEN config_key = 's3_cdn_url' THEN ${configs.s3CdnUrl}
       WHEN config_key = 's3_direct_download' THEN ${configs.s3DirectDownload}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder', 'force_path_style', 's3_cdn', 's3_cdn_url', 's3_direct_download');
  `
}

/**
 * 更新 R2 配置
 * @param configs 配置信息
 */
export async function updateR2Config(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'r2_accesskey_id' THEN ${configs.r2AccesskeyId}
       WHEN config_key = 'r2_accesskey_secret' THEN ${configs.r2AccesskeySecret}
       WHEN config_key = 'r2_account_id' THEN ${configs.r2AccountId}
       WHEN config_key = 'r2_bucket' THEN ${configs.r2Bucket}
       WHEN config_key = 'r2_storage_folder' THEN ${configs.r2StorageFolder}
       WHEN config_key = 'r2_public_domain' THEN ${configs.r2PublicDomain}
       WHEN config_key = 'r2_direct_download' THEN ${configs.r2DirectDownload}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('r2_accesskey_id', 'r2_accesskey_secret', 'r2_account_id', 'r2_bucket', 'r2_storage_folder', 'r2_public_domain', 'r2_direct_download');
  `
}

/**
 * 更新 AList 配置
 * @param configs 配置信息
 */
export async function updateAListConfig(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'alist_url' THEN ${configs.alistUrl}
       WHEN config_key = 'alist_token' THEN ${configs.alistToken}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('alist_url', 'alist_token');
  `
}

/**
 * 更新自定义信息
 * @param payload 自定义信息
 */
export async function updateCustomInfo(payload: {
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
}) {
  try {
    const {
      title,
      customFaviconUrl,
      customAuthor,
      feedId,
      userId,
      customIndexStyle,
      customIndexDownloadEnable,
      enablePreviewImageMaxWidthLimit,
      previewImageMaxWidth,
      previewQuality,
      umamiHost,
      umamiAnalytics,
      maxUploadFiles,
      customIndexOriginEnable,
      adminImagesPerPage,
    } = payload

    await db.$transaction(async (tx) => {
      await tx.configs.update({
        where: {
          config_key: 'custom_title'
        },
        data: {
          config_value: title,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'custom_favicon_url'
        },
        data: {
          config_value: customFaviconUrl,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'custom_author'
        },
        data: {
          config_value: customAuthor,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'rss_feed_id'
        },
        data: {
          config_value: feedId,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'rss_user_id'
        },
        data: {
          config_value: userId,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'umami_host'
        },
        data: {
          config_value: umamiHost,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'umami_analytics'
        },
        data: {
          config_value: umamiAnalytics,
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'custom_index_style'
        },
        data: {
          config_value: customIndexStyle.toString(),
          updatedAt: new Date()
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'custom_index_download_enable'
        },
        data: {
          config_value: customIndexDownloadEnable ? 'true' : 'false',
          updatedAt: new Date(),
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'preview_max_width_limit_switch'
        },
        data: {
          config_value: enablePreviewImageMaxWidthLimit ? '1' : '0',
          updatedAt: new Date(),
        }
      })
      if (previewImageMaxWidth > 0) {
        await tx.configs.update({
          where: {
            config_key: 'preview_max_width_limit'
          },
          data: {
            config_value: previewImageMaxWidth.toString(),
            updatedAt: new Date(),
          }
        })
      }
      if (previewQuality > 0) {
        await tx.configs.update({
          where: {
            config_key: 'preview_quality'
          },
          data: {
            config_value: previewQuality.toString(),
            updatedAt: new Date(),
          }
        })
      }
      await tx.configs.update({
        where: {
          config_key: 'max_upload_files'
        },
        data: {
          config_value: maxUploadFiles.toString(),
          updatedAt: new Date(),
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'custom_index_origin_enable'
        },
        data: {
          config_value: customIndexOriginEnable ? 'true' : 'false',
          updatedAt: new Date(),
        }
      })
      await tx.configs.update({
        where: {
          config_key: 'admin_images_per_page'
        },
        data: {
          config_value: adminImagesPerPage.toString(),
          updatedAt: new Date(),
        }
      })
    })
  } catch (error) {
    console.error('Error updating custom info:', error)
    throw error
  }
}
