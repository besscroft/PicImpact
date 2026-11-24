import 'server-only'

import { Prisma } from '@prisma/client'

import { db } from '~/server/lib/db'
import type {
  BackupAlbumRecord,
  BackupConfigRecord,
  BackupImageAlbumRelationRecord,
  BackupImageRecord,
  BackupJsonValue,
  BackupPayloadV1,
  BackupSource,
} from '~/types/backup'
import type { BackupRepository, BackupRepositoryImportResult } from '~/server/backup/repository'

const IMPORT_TRANSACTION_TIMEOUT_MS = 120_000

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function toBackupJson(value: Prisma.JsonValue | null): BackupJsonValue | null {
  return value as BackupJsonValue | null
}

function toPrismaJson(value: BackupJsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.DbNull
  }

  return value as Prisma.InputJsonValue
}

function countCreatedAndUpdated(existingKeys: Set<string>, incomingKeys: string[]) {
  let createdCount = 0
  let updatedCount = 0

  for (const key of incomingKeys) {
    if (existingKeys.has(key)) {
      updatedCount += 1
    } else {
      createdCount += 1
    }
  }

  return {
    totalCount: incomingKeys.length,
    createdCount,
    updatedCount,
  }
}

function createRelationSet(relations: BackupImageAlbumRelationRecord[]) {
  return new Set(relations.map((item) => `${item.imageId}::${item.album_value}`))
}

function groupRelationAlbumValues(relations: Array<{ imageId: string; album_value: string }>) {
  const map = new Map<string, Set<string>>()

  for (const relation of relations) {
    const relationSet = map.get(relation.imageId) ?? new Set<string>()
    relationSet.add(relation.album_value)
    map.set(relation.imageId, relationSet)
  }

  return map
}

function areRelationSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

function mapConfigRecord(config: {
  config_key: string;
  config_value: string | null;
  detail: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}): BackupConfigRecord {
  return {
    config_key: config.config_key,
    config_value: config.config_value,
    detail: config.detail,
    createdAt: config.createdAt.toISOString(),
    updatedAt: toIsoString(config.updatedAt),
  }
}

function mapAlbumRecord(album: {
  album_value: string;
  name: string;
  detail: string | null;
  theme: string;
  show: number;
  sort: number;
  random_show: number;
  license: string | null;
  image_sorting: number;
  daily_weight: number;
  del: number;
  createdAt: Date;
  updatedAt: Date | null;
}): BackupAlbumRecord {
  return {
    album_value: album.album_value,
    name: album.name,
    detail: album.detail,
    theme: album.theme,
    show: album.show,
    sort: album.sort,
    random_show: album.random_show,
    license: album.license,
    image_sorting: album.image_sorting,
    daily_weight: album.daily_weight,
    del: album.del,
    createdAt: album.createdAt.toISOString(),
    updatedAt: toIsoString(album.updatedAt),
  }
}

function mapImageRecord(image: {
  id: string;
  image_name: string | null;
  url: string | null;
  preview_url: string | null;
  video_url: string | null;
  blurhash: string | null;
  exif: Prisma.JsonValue | null;
  labels: Prisma.JsonValue | null;
  width: number;
  height: number;
  lon: string | null;
  lat: string | null;
  title: string | null;
  detail: string | null;
  type: number;
  show: number;
  show_on_mainpage: number;
  sort: number;
  del: number;
  createdAt: Date;
  updatedAt: Date | null;
}): BackupImageRecord {
  return {
    id: image.id,
    image_name: image.image_name,
    url: image.url,
    preview_url: image.preview_url,
    video_url: image.video_url,
    blurhash: image.blurhash,
    exif: toBackupJson(image.exif),
    labels: toBackupJson(image.labels),
    width: image.width,
    height: image.height,
    lon: image.lon,
    lat: image.lat,
    title: image.title,
    detail: image.detail,
    type: image.type,
    show: image.show,
    show_on_mainpage: image.show_on_mainpage,
    sort: image.sort,
    del: image.del,
    createdAt: image.createdAt.toISOString(),
    updatedAt: toIsoString(image.updatedAt),
  }
}

export class PrismaBackupRepository implements BackupRepository {
  getSource(): BackupSource {
    return {
      orm: 'prisma',
      database: 'postgresql',
    }
  }

  async exportSnapshot(): Promise<BackupPayloadV1> {
    const [configs, albums, images, imageAlbumRelations] = await Promise.all([
      db.configs.findMany({
        orderBy: [{ config_key: 'asc' }],
        select: {
          config_key: true,
          config_value: true,
          detail: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.albums.findMany({
        orderBy: [{ sort: 'desc' }, { createdAt: 'asc' }, { album_value: 'asc' }],
        select: {
          album_value: true,
          name: true,
          detail: true,
          theme: true,
          show: true,
          sort: true,
          random_show: true,
          license: true,
          image_sorting: true,
          daily_weight: true,
          del: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.images.findMany({
        orderBy: [{ sort: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          image_name: true,
          url: true,
          preview_url: true,
          video_url: true,
          blurhash: true,
          exif: true,
          labels: true,
          width: true,
          height: true,
          lon: true,
          lat: true,
          title: true,
          detail: true,
          type: true,
          show: true,
          show_on_mainpage: true,
          sort: true,
          del: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.imagesAlbumsRelation.findMany({
        orderBy: [{ imageId: 'asc' }, { album_value: 'asc' }],
        select: {
          imageId: true,
          album_value: true,
        },
      }),
    ])

    return {
      configs: configs.map(mapConfigRecord),
      albums: albums.map(mapAlbumRecord),
      images: images.map(mapImageRecord),
      imageAlbumRelations,
    }
  }

  async importSnapshot(snapshot: BackupPayloadV1): Promise<BackupRepositoryImportResult> {
    const configKeys = snapshot.configs.map((item) => item.config_key)
    const albumValues = snapshot.albums.map((item) => item.album_value)
    const imageIds = snapshot.images.map((item) => item.id)
    const importedRelationSet = createRelationSet(snapshot.imageAlbumRelations)

    const [existingConfigs, existingAlbums, existingImages, existingRelations] = await Promise.all([
      configKeys.length > 0
        ? db.configs.findMany({
          where: { config_key: { in: configKeys } },
          select: { config_key: true },
        })
        : Promise.resolve([]),
      albumValues.length > 0
        ? db.albums.findMany({
          where: { album_value: { in: albumValues } },
          select: { album_value: true },
        })
        : Promise.resolve([]),
      imageIds.length > 0
        ? db.images.findMany({
          where: { id: { in: imageIds } },
          select: { id: true },
        })
        : Promise.resolve([]),
      imageIds.length > 0
        ? db.imagesAlbumsRelation.findMany({
          where: { imageId: { in: imageIds } },
          select: { imageId: true, album_value: true },
        })
        : Promise.resolve([]),
    ])

    const configStats = countCreatedAndUpdated(
      new Set(existingConfigs.map((item) => item.config_key)),
      configKeys,
    )
    const albumStats = countCreatedAndUpdated(
      new Set(existingAlbums.map((item) => item.album_value)),
      albumValues,
    )
    const imageStats = countCreatedAndUpdated(
      new Set(existingImages.map((item) => item.id)),
      imageIds,
    )

    const existingRelationSet = new Set(existingRelations.map((item) => `${item.imageId}::${item.album_value}`))
    const existingRelationsByImage = groupRelationAlbumValues(existingRelations)
    const importedRelationsByImage = groupRelationAlbumValues(snapshot.imageAlbumRelations)

    let addedCount = 0
    let unchangedCount = 0
    let removedCount = 0
    let replacedImageCount = 0

    for (const relationKey of importedRelationSet) {
      if (existingRelationSet.has(relationKey)) {
        unchangedCount += 1
      } else {
        addedCount += 1
      }
    }

    for (const relationKey of existingRelationSet) {
      if (!importedRelationSet.has(relationKey)) {
        removedCount += 1
      }
    }

    for (const [imageId, importedAlbumValues] of importedRelationsByImage) {
      const existingAlbumValues = existingRelationsByImage.get(imageId)
      if (existingAlbumValues && !areRelationSetsEqual(existingAlbumValues, importedAlbumValues)) {
        replacedImageCount += 1
      }
    }

    const importedAt = new Date()

    await db.$transaction(async (tx) => {
      for (const config of snapshot.configs) {
        await tx.configs.upsert({
          where: {
            config_key: config.config_key,
          },
          update: {
            config_value: config.config_value,
            detail: config.detail,
            createdAt: new Date(config.createdAt),
          },
          create: {
            config_key: config.config_key,
            config_value: config.config_value,
            detail: config.detail,
            createdAt: new Date(config.createdAt),
            updatedAt: config.updatedAt ? new Date(config.updatedAt) : undefined,
          },
        })
      }

      for (const album of snapshot.albums) {
        await tx.albums.upsert({
          where: {
            album_value: album.album_value,
          },
          update: {
            name: album.name,
            detail: album.detail,
            theme: album.theme,
            show: album.show,
            sort: album.sort,
            random_show: album.random_show,
            license: album.license,
            image_sorting: album.image_sorting,
            daily_weight: album.daily_weight,
            del: album.del,
            createdAt: new Date(album.createdAt),
          },
          create: {
            album_value: album.album_value,
            name: album.name,
            detail: album.detail,
            theme: album.theme,
            show: album.show,
            sort: album.sort,
            random_show: album.random_show,
            license: album.license,
            image_sorting: album.image_sorting,
            daily_weight: album.daily_weight,
            del: album.del,
            createdAt: new Date(album.createdAt),
            updatedAt: album.updatedAt ? new Date(album.updatedAt) : undefined,
          },
        })
      }

      for (const image of snapshot.images) {
        await tx.images.upsert({
          where: {
            id: image.id,
          },
          update: {
            image_name: image.image_name,
            url: image.url,
            preview_url: image.preview_url,
            video_url: image.video_url,
            blurhash: image.blurhash,
            exif: toPrismaJson(image.exif),
            labels: toPrismaJson(image.labels),
            width: image.width,
            height: image.height,
            lon: image.lon,
            lat: image.lat,
            title: image.title,
            detail: image.detail,
            type: image.type,
            show: image.show,
            show_on_mainpage: image.show_on_mainpage,
            sort: image.sort,
            del: image.del,
            createdAt: new Date(image.createdAt),
          },
          create: {
            id: image.id,
            image_name: image.image_name,
            url: image.url,
            preview_url: image.preview_url,
            video_url: image.video_url,
            blurhash: image.blurhash,
            exif: toPrismaJson(image.exif),
            labels: toPrismaJson(image.labels),
            width: image.width,
            height: image.height,
            lon: image.lon,
            lat: image.lat,
            title: image.title,
            detail: image.detail,
            type: image.type,
            show: image.show,
            show_on_mainpage: image.show_on_mainpage,
            sort: image.sort,
            del: image.del,
            createdAt: new Date(image.createdAt),
            updatedAt: image.updatedAt ? new Date(image.updatedAt) : undefined,
          },
        })
      }

      if (imageIds.length > 0) {
        await tx.imagesAlbumsRelation.deleteMany({
          where: {
            imageId: {
              in: imageIds,
            },
          },
        })
      }

      if (snapshot.imageAlbumRelations.length > 0) {
        await tx.imagesAlbumsRelation.createMany({
          data: snapshot.imageAlbumRelations,
          skipDuplicates: true,
        })
      }

      await tx.$executeRaw`REFRESH MATERIALIZED VIEW "daily_images"`

      await tx.configs.upsert({
        where: {
          config_key: 'daily_last_refresh',
        },
        update: {
          config_value: importedAt.toISOString(),
          detail: 'Daily homepage last refresh time',
          createdAt: importedAt,
        },
        create: {
          config_key: 'daily_last_refresh',
          config_value: importedAt.toISOString(),
          detail: 'Daily homepage last refresh time',
          createdAt: importedAt,
          updatedAt: importedAt,
        },
      })
    }, {
      maxWait: 10_000,
      timeout: IMPORT_TRANSACTION_TIMEOUT_MS,
    })

    return {
      entities: {
        configs: configStats,
        albums: albumStats,
        images: imageStats,
        imageAlbumRelations: {
          totalCount: snapshot.imageAlbumRelations.length,
          addedCount,
          unchangedCount,
          replacedImageCount,
          removedCount,
        },
      },
      dailyRefreshAt: importedAt.toISOString(),
    }
  }
}
