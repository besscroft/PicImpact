'use server'

import { db } from '~/server/lib/db'
import type {
  AdminDashboardAlbumBreakdownItem,
  AdminDashboardData,
  AdminDashboardEquipmentBreakdownItem,
  AdminDashboardRecentUpload,
} from '~/types/admin-dashboard'

type DashboardSummaryRow = {
  totalImages: number
  publicImages: number
  featuredOnHome: number
  geoTaggedImages: number
  taggedImages: number
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const [summaryRows, recentUploadsRows, albumBreakdownRows, equipmentBreakdownRows] = await Promise.all([
    db.$queryRaw<DashboardSummaryRow[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "public"."images" WHERE del = 0) AS "totalImages",
        (SELECT COUNT(*)::int FROM "public"."images" WHERE del = 0 AND show = 0) AS "publicImages",
        (SELECT COUNT(*)::int FROM "public"."images" WHERE del = 0 AND show_on_mainpage = 0) AS "featuredOnHome",
        (
          SELECT COUNT(*)::int
          FROM "public"."images"
          WHERE del = 0
            AND lat IS NOT NULL
            AND lat <> ''
            AND lon IS NOT NULL
            AND lon <> ''
        ) AS "geoTaggedImages",
        (
          SELECT COUNT(*)::int
          FROM "public"."images"
          WHERE del = 0
            AND labels IS NOT NULL
            AND jsonb_typeof(labels::jsonb) = 'array'
            AND jsonb_array_length(labels::jsonb) > 0
        ) AS "taggedImages"
    `,
    db.$queryRaw<AdminDashboardRecentUpload[]>`
      SELECT
        image.id,
        image.title,
        image.image_name AS "imageName",
        image.url,
        image.preview_url,
        image.width,
        image.height,
        image.show,
        image.created_at AS "createdAt",
        COALESCE(STRING_AGG(DISTINCT albums.name, ' · '), '') AS "albumNames"
      FROM "public"."images" AS image
      LEFT JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
      LEFT JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
        AND albums.del = 0
      WHERE image.del = 0
      GROUP BY
        image.id,
        image.title,
        image.image_name,
        image.url,
        image.preview_url,
        image.width,
        image.height,
        image.show,
        image.created_at
      ORDER BY image.created_at DESC
      LIMIT 6
    `,
    db.$queryRaw<AdminDashboardAlbumBreakdownItem[]>`
      SELECT
        albums.name,
        albums.album_value AS "albumValue",
        COUNT(image.id)::int AS total,
        COALESCE(SUM(CASE WHEN image.show = 0 THEN 1 ELSE 0 END), 0)::int AS "publicCount"
      FROM "public"."albums" AS albums
      LEFT JOIN "public"."images_albums_relation" AS relation
        ON albums.album_value = relation.album_value
      LEFT JOIN "public"."images" AS image
        ON relation."imageId" = image.id
        AND image.del = 0
      WHERE albums.del = 0
      GROUP BY albums.id, albums.name, albums.album_value
      HAVING COUNT(image.id) > 0
      ORDER BY total DESC, albums.name ASC
      LIMIT 6
    `,
    db.$queryRaw<AdminDashboardEquipmentBreakdownItem[]>`
      SELECT
        COALESCE(exif->>'model', 'Unknown') AS camera,
        COALESCE(exif->>'lens_model', 'Unknown') AS lens,
        COUNT(*)::int AS count
      FROM "public"."images"
      WHERE del = 0
      GROUP BY camera, lens
      ORDER BY count DESC, camera ASC, lens ASC
      LIMIT 6
    `,
  ])

  const summaryRow = summaryRows[0] ?? {
    totalImages: 0,
    publicImages: 0,
    featuredOnHome: 0,
    geoTaggedImages: 0,
    taggedImages: 0,
  }

  const totalImages = Number(summaryRow.totalImages) || 0
  const publicImages = Number(summaryRow.publicImages) || 0

  return {
    summary: {
      totalImages,
      publicImages,
    },
    coverage: {
      publicRatio: totalImages > 0 ? Number(((publicImages / totalImages) * 100).toFixed(1)) : 0,
      featuredOnHome: Number(summaryRow.featuredOnHome) || 0,
      geoTaggedImages: Number(summaryRow.geoTaggedImages) || 0,
      taggedImages: Number(summaryRow.taggedImages) || 0,
    },
    recentUploads: recentUploadsRows.map((item) => ({
      ...item,
      width: Number(item.width) || 0,
      height: Number(item.height) || 0,
      show: Number(item.show) || 0,
    })),
    albumBreakdown: albumBreakdownRows.map((item) => ({
      ...item,
      total: Number(item.total) || 0,
      publicCount: Number(item.publicCount) || 0,
    })),
    equipmentBreakdown: equipmentBreakdownRows.map((item) => ({
      ...item,
      count: Number(item.count) || 0,
    })),
  }
}
