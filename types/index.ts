// 数据库表结构类型

export type AlbumType = {
  id: string;
  name: string;
  album_value: string;
  detail: string | null;
  theme: string;
  show: number;
  sort: number;
  license: string | null;
  image_sorting: number;
  random_show: number;
  del?: number;
  createdAt?: Date;
  updatedAt?: Date | null;
}

export type ExifType = {
  make: string | undefined;
  model: string | undefined;
  bits: string | undefined;
  dateTime: string | undefined;
  exposure_time: string | undefined;
  f_number: string | undefined;
  exposure_program: string | undefined;
  iso_speed_rating: string | undefined;
  focal_length: string | undefined;
  lens_specification: string | undefined;
  lens_model: string | undefined;
  exposure_mode: string | undefined;
  cfa_pattern: string | undefined;
  color_space: string | undefined;
  white_balance: string | undefined;
}

export type ImageType = {
  id: string;
  image_name: string;
  title: string;
  url: string;
  preview_url: string;
  video_url: string;
  blurhash: string;
  image_key: string;
  variants_ready: boolean;
  ready_max_width: number;
  exif: ExifType;
  labels: any;
  width: number;
  height: number;
  lon: string;
  lat: string;
  album: string;
  detail: string;
  type: number; // type: 图片类型为 1，livephoto 类型为 2
  show: number;
  show_on_mainpage: number;
  sort: number;
  album_name: string;
  album_value: string;
  album_license: string;
}

/**
 * @deprecated Use the dedicated config-shape types below (`CustomInfo`, `S3Info`,
 * `R2Info`, `OpenListInfo`, `AdminConfig`, `DailyConfig`). This raw row shape is
 * still consumed by the storage client builders (`getClient`, `getR2Client`) and
 * by parts of the server-side download/upload pipeline that read the
 * `Config[]` snapshot returned by `fetchConfigsByKeys`. The API contract for
 * `/api/v1/settings/*` and `/api/v1/daily/config` no longer exposes this shape.
 */
export type Config = {
  id: string;
  config_key: string;
  config_value: string | null;
  detail: string | null;
}

// === API-facing configuration shapes (camelCase, flat) ===
//
// These types describe what `/api/v1/settings/*` and `/api/v1/daily/config`
// return and accept on the wire. Snake_case DB column names are mapped at the
// server boundary via `server/lib/config-transform.ts`.

export type CustomInfo = {
  customTitle: string
  customFaviconUrl: string
  customAuthor: string
  rssFeedId: string
  rssUserId: string
  customIndexStyle: string
  customIndexDownloadEnable: boolean
  previewMaxWidthLimit: number
  previewMaxWidthLimitSwitch: boolean
  previewQuality: number
  umamiHost: string
  umamiAnalytics: string
  maxUploadFiles: number
  customIndexOriginEnable: boolean
  adminImagesPerPage: number
  defaultTheme: string
}

export type S3Info = {
  accesskeyId: string
  accesskeySecret: string
  region: string
  endpoint: string
  bucket: string
  storageFolder: string
  forcePathStyle: boolean
  s3Cdn: boolean
  s3CdnUrl: string
  s3DirectDownload: boolean
}

/**
 * Which storage backend the image preprocessing pipeline uploads variants to.
 * Empty string disables the pipeline (gallery falls back to preview/blurhash).
 */
export type VariantStorageInfo = {
  variantStorage: '' | 's3' | 'r2'
}

export type R2Info = {
  r2AccesskeyId: string
  r2AccesskeySecret: string
  r2AccountId: string
  r2Bucket: string
  r2StorageFolder: string
  r2PublicDomain: string
  r2DirectDownload: boolean
}

export type OpenListInfo = {
  openListUrl: string
  openListToken: string
}

export type AdminConfig = {
  adminImagesPerPage: number
}

export type DailyConfig = {
  dailyEnabled: boolean
  dailyRefreshInterval: string
  dailyTotalCount: number
  dailyLastRefresh: string | null
}

// Slim camelCase shape passed from server actions to gallery components via
// `configHandle`. The fields are the subset of `CustomInfo` the public/album
// pages actually need; populated by the server action that wraps
// `fetchConfigsByKeys`.
export type GalleryDisplayConfig = {
  customTitle?: string
  customIndexDownloadEnable: boolean
  customIndexOriginEnable: boolean
  // Public root (no trailing slash, folder already included) for responsive
  // image variants. Populated server-side from the configured variant storage
  // backend. Empty/undefined → the gallery loader stays dormant and degrades to
  // the preview thumbnail / blurhash placeholder (e.g. OpenList-backed images,
  // or before the preprocessing backfill has run).
  variantBaseUrl?: string
}
