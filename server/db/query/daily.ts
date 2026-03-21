// 每日精选图片

'use server'

import { Prisma } from '@prisma/client'
import { db } from '~/server/lib/db'
import type { ImageType } from '~/types'

const DEFAULT_SIZE = 24

/**
 * 获取每日精选图片分页列表
 * @param pageNum 页码
 * @param camera 相机型号（可选）
 * @param lens 镜头型号（可选）
 * @returns {Promise<ImageType[]>} 图片列表
 */
export async function fetchDailyImagesList(
  pageNum: number,
  camera?: string,
  lens?: string
): Promise<ImageType[]> {
  if (pageNum < 1) {
    pageNum = 1
  }
  return await db.$queryRaw`
    SELECT
        image.*
    FROM
        "public"."daily_images" AS image
    WHERE
        1 = 1
    ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
    ORDER BY image.daily_sort
    LIMIT ${DEFAULT_SIZE} OFFSET ${(pageNum - 1) * DEFAULT_SIZE}
  `
}

/**
 * 获取每日精选图片分页总数
 * @param camera 相机型号（可选）
 * @param lens 镜头型号（可选）
 * @returns {Promise<number>} 分页总数
 */
export async function fetchDailyImagesPageTotal(
  camera?: string,
  lens?: string
): Promise<number> {
  const pageTotal = await db.$queryRaw<Array<{ total: bigint }>>`
    SELECT COALESCE(COUNT(1), 0) AS total
    FROM "public"."daily_images" AS image
    WHERE
        1 = 1
    ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
  `
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / DEFAULT_SIZE) : 0
}

/**
 * 获取每日精选图片的相机和镜头型号列表
 * @returns {Promise<{ cameras: string[], lenses: string[] }>} 相机和镜头列表
 */
export async function fetchDailyCameraAndLensList(): Promise<{ cameras: string[], lenses: string[] }> {
  const stats = await db.$queryRaw<Array<{ camera: string; lens: string }>>`
    SELECT DISTINCT
      COALESCE(exif->>'model', 'Unknown') as camera,
      COALESCE(exif->>'lens_model', 'Unknown') as lens
    FROM "public"."daily_images"
    ORDER BY camera, lens
  `

  const cameras = [...new Set(stats.map(item => item.camera))]
  const lenses = [...new Set(stats.map(item => item.lens))]

  return {
    cameras,
    lenses
  }
}

/**
 * 获取所有相册及其每日权重配置
 * @returns 相册列表（含每日权重和照片数量）
 */
export async function fetchAlbumsWithDailyWeight(): Promise<Array<{
  id: string
  name: string
  album_value: string
  daily_weight: number
  photo_count: number
}>> {
  return await db.$queryRaw`
    SELECT
        albums.id,
        albums.name,
        albums.album_value,
        albums.daily_weight,
        COALESCE(COUNT(image.id), 0)::INTEGER AS photo_count
    FROM
        "public"."albums" AS albums
    LEFT JOIN "public"."images_albums_relation" AS relation
        ON albums.album_value = relation.album_value
    LEFT JOIN "public"."images" AS image
        ON relation."imageId" = image.id
        AND image.del = 0
        AND image.show = 0
    WHERE
        albums.del = 0
    GROUP BY albums.id, albums.name, albums.album_value, albums.daily_weight, albums.sort, albums.created_at
    ORDER BY albums.sort DESC, albums.created_at DESC
  `
}
