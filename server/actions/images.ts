'use server'

import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import type { ImageType } from '~/types'
import type { Config } from '~/types'

export async function getImagesData(pageNum: number, album: string, camera?: string, lens?: string): Promise<ImageType[]> {
  return fetchClientImagesListByAlbum(pageNum, album, camera, lens)
}

export async function getImagesPageTotal(album: string, camera?: string, lens?: string): Promise<number> {
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
