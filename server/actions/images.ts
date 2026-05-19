'use server'

import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import { fetchConfigsByKeys, fetchConfigValue } from '~/server/db/query/configs'
import { fetchDailyImagesList, fetchDailyImagesPageTotal } from '~/server/db/query/daily'
import { checkAndRefreshDailyImages } from '~/server/db/operate/daily'
import type { GalleryDisplayConfig, ImageType } from '~/types'

export async function getImagesData(pageNum: number, album: string, camera?: string, lens?: string): Promise<ImageType[]> {
  if (album === '/') {
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return fetchDailyImagesList(pageNum, camera, lens)
    }
  }
  return fetchClientImagesListByAlbum(pageNum, album, camera, lens)
}

export async function getImagesPageTotal(album: string, camera?: string, lens?: string): Promise<number> {
  if (album === '/') {
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return fetchDailyImagesPageTotal(camera, lens)
    }
  }
  return fetchClientImagesPageTotalByAlbum(album, camera, lens)
}

export async function getDisplayConfig(): Promise<GalleryDisplayConfig> {
  const rows = await fetchConfigsByKeys([
    'custom_index_download_enable',
    'custom_index_origin_enable',
    'custom_title',
  ])
  const get = (key: string) => rows.find((item) => item.config_key === key)?.config_value
  return {
    customTitle: get('custom_title') ?? undefined,
    customIndexDownloadEnable: get('custom_index_download_enable') === 'true',
    customIndexOriginEnable: get('custom_index_origin_enable') === 'true',
  }
}

export async function getAlbumDisplayConfig(): Promise<GalleryDisplayConfig> {
  const rows = await fetchConfigsByKeys(['custom_index_download_enable'])
  const get = (key: string) => rows.find((item) => item.config_key === key)?.config_value
  return {
    customIndexDownloadEnable: get('custom_index_download_enable') === 'true',
    customIndexOriginEnable: false,
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
