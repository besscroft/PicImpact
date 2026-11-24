export const BACKUP_FORMAT = 'picimpact-backup' as const
export const BACKUP_VERSION_V1 = 1 as const

export type BackupOrm = 'prisma' | 'drizzle' | 'unknown'
export type BackupDatabase = 'postgresql'

export type BackupJsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: BackupJsonValue }
  | BackupJsonValue[]

export type BackupSource = {
  orm: BackupOrm;
  database: BackupDatabase;
}

export type BackupConfigRecord = {
  config_key: string;
  config_value: string | null;
  detail: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type BackupAlbumRecord = {
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
  createdAt: string;
  updatedAt: string | null;
}

export type BackupImageRecord = {
  id: string;
  image_name: string | null;
  url: string | null;
  preview_url: string | null;
  video_url: string | null;
  blurhash: string | null;
  exif: BackupJsonValue | null;
  labels: BackupJsonValue | null;
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
  createdAt: string;
  updatedAt: string | null;
}

export type BackupImageAlbumRelationRecord = {
  imageId: string;
  album_value: string;
}

export type BackupPayloadV1 = {
  configs: BackupConfigRecord[];
  albums: BackupAlbumRecord[];
  images: BackupImageRecord[];
  imageAlbumRelations: BackupImageAlbumRelationRecord[];
}

export type BackupEnvelopeV1 = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION_V1;
  exportedAt: string;
  source: BackupSource;
  payload: BackupPayloadV1;
}

export type BackupValidationIssue = {
  path: string;
  message: string;
}

export type BackupPreviewCounts = {
  configs: number;
  albums: number;
  images: number;
  imageAlbumRelations: number;
}

export type BackupPreviewScope = {
  included: string[];
  excluded: string[];
}

export type BackupPreviewData = {
  valid: boolean;
  format: string | null;
  version: number | null;
  exportedAt: string | null;
  source: BackupSource | null;
  scope: BackupPreviewScope;
  counts: BackupPreviewCounts;
  warnings: string[];
  issues: BackupValidationIssue[];
}

export type BackupEntityImportStats = {
  totalCount: number;
  createdCount: number;
  updatedCount: number;
}

export type BackupRelationImportStats = {
  totalCount: number;
  addedCount: number;
  unchangedCount: number;
  replacedImageCount: number;
  removedCount: number;
}

export type BackupImportResult = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION_V1;
  importedAt: string;
  source: BackupSource;
  counts: BackupPreviewCounts;
  warnings: string[];
  entities: {
    configs: BackupEntityImportStats;
    albums: BackupEntityImportStats;
    images: BackupEntityImportStats;
    imageAlbumRelations: BackupRelationImportStats;
  };
  dailyRefresh: {
    refreshed: boolean;
    refreshedAt: string | null;
    message: string;
  };
}
