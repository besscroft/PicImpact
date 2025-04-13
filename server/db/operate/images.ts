// 图片表

'use server'

import { db } from '~/server/lib/db'
import type { ImageType } from '~/types'

/**
 * 新增图片
 * @param image 图片数据
 */
export async function insertImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  await db.$transaction(async (tx) => {
    const resultRow = await tx.images.create({
      data: {
        url: image.url,
        title: image.title,
        preview_url: image.preview_url,
        video_url: image.video_url,
        exif: image.exif,
        labels: image.labels,
        width: image.width,
        height: image.height,
        detail: image.detail,
        lat: String(image.lat),
        lon: String(image.lon),
        type: image.type,
        show: 1,
        sort: image.sort,
        del: 0,
      }
    })

    if (resultRow) {
      await tx.imagesAlbumsRelation.create({
        data: {
          imageId: resultRow.id,
          album_value: image.album
        }
      })
    } else {
      throw new Error('事务处理失败！')
    }
  })
}

/**
 * 逻辑删除图片
 * @param id 图片 ID
 */
export async function deleteImage(id: string) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: id
      }
    })

    await tx.images.update({
      where: {
        id: id
      },
      data: {
        del: 1,
        updatedAt: new Date(),
      }
    })
  })
}

/**
 * 批量逻辑删除图片
 * @param ids 图片 ID 数组
 */
export async function deleteBatchImage(ids: string[]) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: {
          in: ids
        }
      }
    })
    await tx.images.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        del: 1,
        updatedAt: new Date(),
      },
    })
  })
}

/**
 * 更新图片
 * @param image 图片数据
 */
export async function updateImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }
  await db.$transaction(async (tx) => {
    await tx.images.update({
      where: {
        id: image.id
      },
      data: {
        url: image.url,
        title: image.title,
        preview_url: image.preview_url,
        video_url: image.video_url,
        exif: image.exif,
        labels: image.labels,
        detail: image.detail,
        sort: image.sort,
        show: image.show,
        show_on_mainpage: image.show_on_mainpage,
        width: image.width,
        height: image.height,
        lat: image.lat,
        lon: image.lon,
        updatedAt: new Date(),
      }
    })
  })
}

/**
 * 更新图片的显示状态
 * @param id 图片 ID
 * @param show 显示状态：0=显示，1=隐藏
 */
export async function updateImageShow(id: string, show: number) {
  return await db.images.update({
    where: {
      id: id
    },
    data: {
      show: show,
      updatedAt: new Date()
    }
  })
}

/**
 * 更新图片的相册
 * @param imageId 图片 ID
 * @param albumId 相册 ID
 */
export async function updateImageAlbum(imageId: string, albumId: string) {
  await db.$transaction(async (tx) => {
    const resultRow = await tx.albums.findUnique({
      where: {
        id: albumId
      }
    })
    if (!resultRow) {
      throw new Error('相册不存在！')
    }
    await tx.imagesAlbumsRelation.deleteMany({
      where: {
        imageId: imageId,
      }
    })
    await tx.imagesAlbumsRelation.create({
      data: {
        imageId: imageId,
        album_value: resultRow.album_value
      }
    })
  })
}
