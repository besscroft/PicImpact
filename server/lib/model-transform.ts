import 'server-only'

import type { AlbumType, ImageType } from '~/types'

// === Album mappers ===
//
// PicImpact keeps DB column names snake_case (see `prisma/schema.prisma`) so
// Prisma rows access fields as `row.album_value`, `row.image_sorting`, etc.
// The API/UI contract uses camelCase for these four fields:
//   - album_value      → albumValue
//   - image_sorting    → imageSorting
//   - image_name       → imageName
//   - show_on_mainpage → showOnMainpage
//
// These helpers convert at the boundary so callers can stay in one casing.

// Shape of an `Albums` row coming back from Prisma (snake_case fields).
type PrismaAlbumRow = {
  id: string
  name: string
  album_value: string
  detail: string | null
  theme: string
  show: number
  sort: number
  license: string | null
  image_sorting: number
  random_show: number
  del?: number
  createdAt?: Date
  updatedAt?: Date | null
}

export function toAlbum(row: PrismaAlbumRow): AlbumType {
  return {
    id: row.id,
    name: row.name,
    albumValue: row.album_value,
    detail: row.detail,
    theme: row.theme,
    show: row.show,
    sort: row.sort,
    license: row.license,
    imageSorting: row.image_sorting,
    random_show: row.random_show,
    del: row.del,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toAlbumList(rows: PrismaAlbumRow[]): AlbumType[] {
  return rows.map(toAlbum)
}

// Inputs the API/UI sends. Snake_case field names that Prisma understands are
// mapped here so callers never need to know about column naming.
type AlbumWriteInput = Pick<AlbumType, 'name' | 'detail' | 'theme' | 'show' | 'sort' | 'license' | 'random_show'> & {
  albumValue: string
  imageSorting: number
}

export function toAlbumPrismaCreate(input: AlbumWriteInput) {
  return {
    name: input.name,
    album_value: input.albumValue,
    detail: input.detail,
    sort: input.sort,
    theme: input.theme,
    show: input.show,
    license: input.license,
    del: 0,
    image_sorting: input.imageSorting,
    random_show: input.random_show,
  }
}

export function toAlbumPrismaUpdate(input: AlbumWriteInput) {
  return {
    name: input.name,
    album_value: input.albumValue,
    detail: input.detail,
    sort: input.sort,
    theme: input.theme,
    show: input.show,
    license: input.license,
    updatedAt: new Date(),
    image_sorting: input.imageSorting,
    random_show: input.random_show,
  }
}

// === Image mappers ===
//
// Image rows arrive in two flavours:
//   1) Plain Prisma rows (snake_case fields) from `findMany`/`findFirst`.
//   2) Raw SQL rows that already alias the four canonical columns
//      (`AS "albumValue"`, `AS "imageName"`, etc.); for those, prefer the
//      `Prisma.sql` alias and skip the mapper.
//
// `toImage` accepts either shape and returns the camelCase API surface.

type ImageInsertInput = {
  id: string
  imageName: string
  url: string
  title: string
  blurhash: string
  preview_url: string
  video_url: string
  exif: unknown
  labels: unknown
  width: number
  height: number
  detail: string
  lat: string | number
  lon: string | number
  type: number
  sort: number
  album: string
}

export function toImagePrismaCreate(input: ImageInsertInput) {
  return {
    id: input.id,
    image_name: input.imageName,
    url: input.url,
    title: input.title,
    blurhash: input.blurhash,
    preview_url: input.preview_url,
    video_url: input.video_url,
    exif: input.exif as any,
    labels: input.labels as any,
    width: input.width,
    height: input.height,
    detail: input.detail,
    lat: String(input.lat),
    lon: String(input.lon),
    type: input.type,
    show: 1,
    sort: input.sort,
    del: 0,
  }
}

// Map a raw-SQL row (snake_case PostgreSQL columns) into the camelCase
// `ImageType` shape consumed by API responses and frontend consumers.
//
// Raw queries that use `image.*` return rows with snake_case keys; this helper
// renames the four canonical fields without touching the rest of the payload.
// Other snake_case fields (`preview_url`, `video_url`, `album_name`, ...) are
// left as-is — they're tracked separately in the API refactor plan.
export function mapRawImageRow<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row
  const next: Record<string, any> = { ...row }
  if ('image_name' in next) {
    next.imageName = next.image_name
    delete next.image_name
  }
  if ('show_on_mainpage' in next) {
    next.showOnMainpage = next.show_on_mainpage
    delete next.show_on_mainpage
  }
  if ('album_value' in next) {
    next.albumValue = next.album_value
    delete next.album_value
  }
  if ('image_sorting' in next) {
    next.imageSorting = next.image_sorting
    delete next.image_sorting
  }
  return next as T
}

export function mapRawImageRows<T extends Record<string, any>>(rows: T[]): T[] {
  return rows.map(mapRawImageRow)
}

type ImageUpdateInput = Pick<
  ImageType,
  'id' | 'url' | 'title' | 'preview_url' | 'video_url' | 'blurhash' | 'exif' | 'labels' | 'detail' | 'sort' | 'show' | 'width' | 'height' | 'lat' | 'lon'
> & { showOnMainpage: number }

export function toImagePrismaUpdate(input: ImageUpdateInput) {
  return {
    url: input.url,
    title: input.title,
    preview_url: input.preview_url,
    video_url: input.video_url,
    blurhash: input.blurhash,
    exif: input.exif as any,
    labels: input.labels as any,
    detail: input.detail,
    sort: input.sort,
    show: input.show,
    show_on_mainpage: input.showOnMainpage,
    width: input.width,
    height: input.height,
    lat: input.lat,
    lon: input.lon,
    updatedAt: new Date(),
  }
}
