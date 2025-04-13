// 相册表

'use server'

import { db } from '~/server/lib/db'
import type { AlbumType } from '~/types'

/**
 * 新增相册
 * @param album 相册数据
 */
export async function insertAlbums(album: AlbumType) {
  if (!album.sort || album.sort < 0) {
    album.sort = 0
  }
  return await db.albums.create({
    data: {
      name: album.name,
      album_value: album.album_value,
      detail: album.detail,
      sort: album.sort,
      show: album.show,
      license: album.license,
      del: 0,
      image_sorting: album.image_sorting,
      random_show: album.random_show,
    }
  })
}

/**
 * 逻辑删除相册
 * @param id 相册 ID
 */
export async function deleteAlbum(id: string) {
  return await db.albums.update({
    where: {
      id: id
    },
    data: {
      del: 1,
      updatedAt: new Date(),
    }
  })
}

/**
 * 更新相册
 * @param album 相册数据
 */
export async function updateAlbum(album: AlbumType) {
  if (!album.sort || album.sort < 0) {
    album.sort = 0
  }
  await db.$transaction(async (tx) => {
    const tagOld = await tx.albums.findFirst({
      where: {
        id: album.id
      }
    })
    if (!tagOld) {
      throw new Error('标签不存在！')
    }
    await tx.albums.update({
      where: {
        id: album.id
      },
      data: {
        name: album.name,
        album_value: album.album_value,
        detail: album.detail,
        sort: album.sort,
        show: album.show,
        license: album.license,
        updatedAt: new Date(),
        image_sorting: album.image_sorting,
        random_show: album.random_show,
      }
    })
    await tx.imagesAlbumsRelation.updateMany({
      where: {
        album_value: tagOld.album_value
      },
      data: {
        album_value: album.album_value
      }
    })
  })
}

/**
 * 更新相册是否显示
 * @param id 相册 ID
 * @param show 显示状态：0=显示，1=隐藏
 */
export async function updateAlbumShow(id: string, show: number) {
  return await db.albums.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}
