'use server'

import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import { fetchConfigsByKeys, fetchConfigValue } from '~/server/db/query/configs'
import { fetchDailyImagesList, fetchDailyImagesPageTotal } from '~/server/db/query/daily'
import { checkAndRefreshDailyImages } from '~/server/db/operate/daily'
import type { ImageType } from '~/types'
import type { Config } from '~/types'

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

export async function getDisplayConfig(): Promise<Config[]> {
  return fetchConfigsByKeys([
    'custom_index_download_enable',
    'custom_index_origin_enable',
    'custom_title'
  ])
}

export async function getAlbumDisplayConfig(): Promise<Config[]> {
  return fetchConfigsByKeys([
    'custom_index_download_enable'
  ])
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
