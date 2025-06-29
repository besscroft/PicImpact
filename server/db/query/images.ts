// 图片表

'use server'

import { Prisma } from '@prisma/client'
import { db } from '~/server/lib/db'
import type { ImageType } from '~/types'
import { fetchConfigValue } from './configs'

const ALBUM_IMAGE_SORTING_ORDER = [
  null,
  'image.created_at DESC, image.updated_at DESC',
  'COALESCE(TO_TIMESTAMP(image.exif->>\'data_time\', \'YYYY:MM:DD HH24:MI:SS\'), \'1970-01-01 00:00:00\') DESC, image.created_at DESC, image.updated_at DESC',
  'image.created_at ASC, image.updated_at ASC',
  'COALESCE(TO_TIMESTAMP(image.exif->>\'data_time\', \'YYYY:MM:DD HH24:MI:SS\'), \'1970-01-01 00:00:00\') ASC, image.created_at ASC, image.updated_at ASC',
]

/**
 * 根据相册获取图片分页列表（服务端）
 * @param pageNum 页码
 * @param album 相册
 * @param showStatus 公开状态 (0: 公开, 1: 未公开, -1: 全部)
 * @param camera 相机型号
 * @param lens 镜头型号
 * @param pageSize 每页显示数量
 * @returns {Promise<ImageType[]>} 图片列表
 */
export async function fetchServerImagesListByAlbum(
  pageNum: number,
  album: string,
  showStatus: number = -1,
  camera?: string,
  lens?: string,
  pageSize?: number
): Promise<ImageType[]> {
  if (album === 'all') {
    album = ''
  }
  if (pageNum < 1) {
    pageNum = 1
  }
  
  // 如果没有提供 pageSize，从配置中获取
  if (!pageSize) {
    const configPageSize = await fetchConfigValue('admin_images_per_page', '8')
    pageSize = parseInt(configPageSize, 10) || 8
  }
  
  if (album && album !== '') {
    return await db.$queryRaw`
      SELECT 
          image.*,
          albums.name AS album_name,
          albums.id AS album_value
      FROM 
          "public"."images" AS image
      INNER JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
      INNER JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
      WHERE
          image.del = 0
      AND
          albums.del = 0
      AND
          albums.album_value = ${album}
          ${showStatus !== -1 ? Prisma.sql`AND image.show = ${showStatus}` : Prisma.empty}
          ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
          ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
      ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
      LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
    `
  }
  return await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value
    FROM 
        "public"."images" AS image
    LEFT JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    LEFT JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE 
        image.del = 0
        ${showStatus !== -1 ? Prisma.sql`AND image.show = ${showStatus}` : Prisma.empty}
        ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
        ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC 
    LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
  `
}

/**
 * 根据相册获取图片分页总数（服务端）
 * @param album 相册
 * @param showStatus 公开状态 (0: 公开, 1: 未公开, -1: 全部)
 * @param camera 相机型号
 * @param lens 镜头型号
 * @returns {Promise<number>} 图片总数
 */
export async function fetchServerImagesPageTotalByAlbum(
  album: string,
  showStatus: number = -1,
  camera?: string,
  lens?: string
): Promise<number> {
  if (album === 'all') {
    album = ''
  }
  if (album && album !== '') {
    const pageTotal = await db.$queryRaw`
      SELECT COALESCE(COUNT(1),0) AS total
      FROM (
        SELECT DISTINCT ON (image.id)
            image.id 
        FROM 
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE 
            image.del = 0
        AND
            albums.del = 0
        AND
            albums.album_value = ${album}
            ${showStatus !== -1 ? Prisma.sql`AND image.show = ${showStatus}` : Prisma.empty}
            ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
            ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
      ) AS unique_images;
    `
    // @ts-expect-error - The query result is guaranteed to have a total field
    return Number(pageTotal[0].total) ?? 0
  }
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
            image.id
        FROM
            "public"."images" AS image
        LEFT JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        LEFT JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
            ${showStatus !== -1 ? Prisma.sql`AND image.show = ${showStatus}` : Prisma.empty}
            ${camera ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
            ${lens ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
     ) AS unique_images;
  `
  // @ts-expect-error - The query result is guaranteed to have a total field
  return Number(pageTotal[0].total) ?? 0
}

/**
 * 根据相册获取图片分页列表（客户端）
 * @param pageNum 页码
 * @param album 相册
 * @returns {Promise<ImageType[]>} 图片列表
 */
export async function fetchClientImagesListByAlbum(pageNum: number, album: string): Promise<ImageType[]> {
  if (pageNum < 1) {
    pageNum = 1
  }
  if (album === '/') {
    return await db.$queryRaw`
    SELECT 
        image.*
    FROM 
        "public"."images" AS image
    WHERE
        image.del = 0
    AND
        image.show = 0
    AND
        image.show_on_mainpage = 0
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `
  }
  const albumData = await db.albums.findFirst({
    where: {
      album_value: album
    }
  })
  let orderBy = Prisma.sql(['image.sort DESC, image.created_at DESC, image.updated_at DESC'])
  if (albumData && albumData.image_sorting && ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]) {
    orderBy = Prisma.sql([`image.sort DESC, ${ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]}`])
  }
  const dataList: any[] = await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value,
        albums.license AS album_license,
        albums.image_sorting AS album_image_sorting
    FROM 
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE
        image.del = 0
    AND
        albums.del = 0
    AND
        image.show = 0
    AND
        albums.show = 0
    AND
        albums.album_value = ${album}
    ORDER BY ${orderBy}
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `
  if (dataList && albumData && albumData.random_show === 0) {
    return [...dataList].sort(() => Math.random() - 0.5)
  }
  return dataList
}

/**
 * 根据相册获取图片分页总数（客户端）
 * @param album 相册
 * @returns {Promise<number>} 图片总数
 */
export async function fetchClientImagesPageTotalByAlbum(album: string): Promise<number> {
  if (album === '/') {
    const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        WHERE
            image.del = 0
        AND
            image.show = 0
        AND
            image.show_on_mainpage = 0
    ) AS unique_images;
  `
    // @ts-ignore
    return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
  }
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            albums.album_value = ${album}
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

/**
 * 根据图片标签获取图片分页列表（客户端）
 * @param pageNum 页码
 * @param tag 标签
 * @returns {Promise<ImageType[]>} 图片列表
 */
export async function fetchClientImagesListByTag(pageNum: number, tag: string): Promise<ImageType[]> {
  if (pageNum < 1) {
    pageNum = 1
  }
  return await db.$queryRaw`
    SELECT 
        image.*,
        albums.name AS album_name,
        albums.id AS album_value,
        albums.license AS album_license
    FROM 
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE
        image.del = 0
    AND
        albums.del = 0
    AND
        image.show = 0
    AND
        albums.show = 0
    AND
        image.labels::jsonb @> ${JSON.stringify([tag])}::jsonb
    ORDER BY image.sort DESC, image.created_at DESC, image.updated_at DESC
    LIMIT 16 OFFSET ${(pageNum - 1) * 16}
  `
}

/**
 * 根据图片标签获取图片分页总数（客户端）
 * @param tag 标签
 * @returns {Promise<number>} 图片总数
 */
export async function fetchClientImagesPageTotalByTag(tag: string): Promise<number> {
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            image.labels::jsonb @> ${JSON.stringify([tag])}::jsonb
    ) AS unique_images;
  `
  // @ts-ignore
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
}

/**
 * 获取图片分析数据
 * @returns {Promise<{ total: number, showTotal: number, crTotal: number, tagsTotal: number, cameraStats: any[], result: any[] }>} 图片分析数据
 */
export async function fetchImagesAnalysis():
  Promise<{
    total: number,
    showTotal: number,
    crTotal: number,
    tagsTotal: number,
    cameraStats: any[],
    result: any[]
  }> {
  const counts = await db.$queryRaw<[{ images_total: number, images_show: number, cr_total: number, tags_total: number }]>`
    SELECT 
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."images" WHERE del = 0) as images_total,
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."images" WHERE del = 0 AND show = 0) as images_show,
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."albums" WHERE del = 0) as tags_total
  `

  const cameraStats = await db.$queryRaw`
    SELECT COUNT(*) as count, 
      COALESCE(exif->>'model', 'Unknown') as camera,
      COALESCE(exif->>'lens_model', 'Unknown') as lens
    FROM "public"."images"
    WHERE del = 0
    GROUP BY camera, lens
    ORDER BY count DESC
  ` as any[]

  const result = await db.$queryRaw`
    SELECT
        albums.name AS name,
        albums.album_value AS value,
        COALESCE(COUNT(1), 0) AS total,
        COALESCE(SUM(CASE WHEN image.show = 0 THEN 1 ELSE 0 END), 0) AS show_total
    FROM
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE 
        image.del = 0
    AND
        albums.del = 0
    GROUP BY albums.name, albums.album_value
    ORDER BY total DESC
  ` as any[]

  // @ts-ignore
  result.total = Number(result.total)
  // @ts-ignore
  result.show_total = Number(result.show_total)

  return {
    total: Number(counts[0].images_total),
    showTotal: Number(counts[0].images_show),
    crTotal: Number(counts[0].cr_total),
    tagsTotal: Number(counts[0].tags_total),
    cameraStats,
    result
  }
}

/**
 * 根据图片 ID 获取图片详情
 * @param id 图片 ID
 * @returns {Promise<ImageType>} 图片详情
 */
export async function fetchImageByIdAndAuth(id: string): Promise<ImageType> {
  const data: ImageType[] = await db.$queryRaw`
    SELECT
        "images".*,
        "albums".license AS album_license,
        "albums".album_value AS album_value
    FROM
        "images"
    INNER JOIN "images_albums_relation"
        ON "images"."id" = "images_albums_relation"."imageId"
    INNER JOIN "albums"
        ON "images_albums_relation".album_value = "albums".album_value
    WHERE
        "images".del = 0
    AND
        "albums".del = 0
    AND
        "images".show = 0
    AND
        "albums".show = 0
    AND
        "images".id = ${id}
  `
  return data[0]
}

/**
 * 获取最新的 10 张图片
 * @returns {Promise<ImageType[]>} 图片列表
 */
export async function getRSSImages(): Promise<ImageType[]> {
  // 每个相册取最新 10 张照片
  return await db.$queryRaw`
    WITH RankedImages AS (
    SELECT
      i.*,
      A.album_value,
      ROW_NUMBER() OVER (PARTITION BY A.album_value ORDER BY i.created_at DESC) AS rn
    FROM
      images i
      INNER JOIN images_albums_relation iar ON i.ID = iar."imageId"
      INNER JOIN albums A ON iar.album_value = A.album_value
    WHERE
      A.del = 0
      AND A."show" = 0
      AND i.del = 0
      AND i."show" = 0
    )
    SELECT *
    FROM RankedImages
    WHERE rn <= 10;
  `
}

/**
 * 获取所有相机和镜头型号列表
 * @returns {Promise<{ cameras: string[], lenses: string[] }>} 相机和镜头列表
 */
export async function fetchCameraAndLensList(): Promise<{ cameras: string[], lenses: string[] }> {
  const stats = await db.$queryRaw<Array<{ camera: string; lens: string }>>`
    SELECT DISTINCT
      COALESCE(exif->>'model', 'Unknown') as camera,
      COALESCE(exif->>'lens_model', 'Unknown') as lens
    FROM "public"."images"
    WHERE del = 0
    ORDER BY camera, lens
  `

  const cameras = [...new Set(stats.map(item => item.camera))]
  const lenses = [...new Set(stats.map(item => item.lens))]

  return {
    cameras,
    lenses
  }
}
