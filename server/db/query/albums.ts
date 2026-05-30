// 相册表

'use server'

import { db } from '~/server/lib/db'
import { toAlbum, toAlbumList } from '~/server/lib/model-transform'
import type { AlbumType } from '~/types'

/**
 * 获取所有相册列表
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsList(): Promise<AlbumType[]> {
  const rows = await db.albums.findMany({
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
  return toAlbumList(rows)
}

/**
 * 获取所有能显示的相册列表（除了首页路由外
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  const rows = await db.albums.findMany({
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
  return toAlbumList(rows)
}

/**
 * 获取对应路由的相册信息
 * @param router 相册路由
 */
export async function fetchAlbumByRouter(router: string): Promise<AlbumType | null> {
  const row = await db.albums.findFirst({
    where: {
      del: 0,
      show: 0,
      album_value: router
    },
  })
  return row ? toAlbum(row) : null
}
