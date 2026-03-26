import 'server-only'

import type {
  BackupEntityImportStats,
  BackupPayloadV1,
  BackupRelationImportStats,
  BackupSource,
} from '~/types/backup'
import { PrismaBackupRepository } from '~/server/backup/prisma-repository'

export type BackupRepositoryImportResult = {
  entities: {
    configs: BackupEntityImportStats;
    albums: BackupEntityImportStats;
    images: BackupEntityImportStats;
    imageAlbumRelations: BackupRelationImportStats;
  };
  dailyRefreshAt: string;
}

// eslint-disable-next-line no-unused-vars
type BackupImportSnapshot = (value: BackupPayloadV1) => Promise<BackupRepositoryImportResult>

export interface BackupRepository {
  getSource(): BackupSource
  exportSnapshot(): Promise<BackupPayloadV1>
  importSnapshot: BackupImportSnapshot
}

export function getBackupRepository(): BackupRepository {
  return new PrismaBackupRepository()
}

