// 相册表

'use server'

import { db } from '~/server/lib/db'
import type { AlbumType } from '~/types'

/**
 * 获取所有相册列表
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsList(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: {
      del: 0
    },
    orderBy: [
      {
        sort: 'desc',
      },
      {
        createdAt: 'desc',
      },
      {
        updatedAt: 'desc'
      }
    ]
  })
}

/**
 * 获取所有能显示的相册列表（除了首页路由外
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: {
      del: 0,
      show: 0,
      album_value: {
        not: '/'
      }
    },
    orderBy: [
      {
        sort: 'desc'
      }
    ]
  })
}
