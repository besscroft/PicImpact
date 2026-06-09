'use server'

import { fetchConfigValue } from '~/server/db/query/configs'
import { fetchAlbumNeighborWindow } from '~/server/db/query/images'
import { fetchDailyNeighborWindow } from '~/server/db/query/daily'
import { checkAndRefreshDailyImages } from '~/server/db/operate/daily'
import {
  cachedClientImagesListByAlbum,
  cachedClientImagesPageTotalByAlbum,
  cachedConfigsByKeys,
  cachedConfigValue,
  cachedDailyImagesList,
  cachedDailyImagesPageTotal,
  cachedVariantBaseUrl,
} from '~/server/lib/cache'
import type { AlbumNeighborWindow, GalleryDisplayConfig, ImageType } from '~/types'

export async function getImagesData(pageNum: number, album: string, camera?: string, lens?: string): Promise<ImageType[]> {
  if (album === '/') {
    const isDailyEnabled = await cachedConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return cachedDailyImagesList(pageNum, camera, lens)
    }
  }
  return cachedClientImagesListByAlbum(pageNum, album, camera, lens)
}

/**
 * Server action behind the photo detail page's prev/next navigation. Returns a
 * bounded window of the current gallery context's ordered images centered on
 * `imageId`. Mirrors `getImagesData`'s context resolution: `album === '/'` with
 * the daily view enabled walks the daily feed, otherwise the main-page feed;
 * any other value walks that concrete album. Used by both detail render paths
 * (intercepted modal + full page / deep link).
 */
export async function getAlbumNeighborWindow(
  imageId: string,
  album: string,
  radius: number = 10,
  camera?: string,
  lens?: string
): Promise<AlbumNeighborWindow> {
  if (album === '/') {
    const isDailyEnabled = await cachedConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return fetchDailyNeighborWindow(imageId, radius, camera, lens)
    }
  }
  return fetchAlbumNeighborWindow(imageId, album, radius, camera, lens)
}

export async function getImagesPageTotal(album: string, camera?: string, lens?: string): Promise<number> {
  if (album === '/') {
    const isDailyEnabled = await cachedConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return cachedDailyImagesPageTotal(camera, lens)
    }
  }
  return cachedClientImagesPageTotalByAlbum(album, camera, lens)
}

export async function getDisplayConfig(): Promise<GalleryDisplayConfig> {
  const rows = await cachedConfigsByKeys([
    'custom_index_download_enable',
    'custom_index_origin_enable',
    'custom_title',
  ])
  const get = (key: string) => rows.find((item) => item.config_key === key)?.config_value
  return {
    customTitle: get('custom_title') ?? undefined,
    customIndexDownloadEnable: get('custom_index_download_enable') === 'true',
    customIndexOriginEnable: get('custom_index_origin_enable') === 'true',
    variantBaseUrl: await cachedVariantBaseUrl(),
  }
}

export async function getAlbumDisplayConfig(): Promise<GalleryDisplayConfig> {
  const rows = await cachedConfigsByKeys(['custom_index_download_enable'])
  const get = (key: string) => rows.find((item) => item.config_key === key)?.config_value
  return {
    customIndexDownloadEnable: get('custom_index_download_enable') === 'true',
    customIndexOriginEnable: false,
    variantBaseUrl: await cachedVariantBaseUrl(),
  }
}

export async function initDailyIfNeeded(): Promise<void> {
  const dailyEnabled = await fetchConfigValue('daily_enabled', 'false')
  if (dailyEnabled === 'true') {
    try {
      await checkAndRefreshDailyImages()
    } catch (error) {
      console.error('Failed to refresh daily images:', error)
    }
  }
}
