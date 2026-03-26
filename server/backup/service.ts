import 'server-only'

import {
  BACKUP_FORMAT,
  BACKUP_VERSION_V1,
  type BackupEnvelopeV1,
  type BackupImportResult,
  type BackupPreviewData,
} from '~/types/backup'
import { parseBackupEnvelope } from '~/server/backup/format-adapter'
import { getBackupRepository } from '~/server/backup/repository'

const repository = getBackupRepository()

export async function exportBackupEnvelope(): Promise<BackupEnvelopeV1> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION_V1,
    exportedAt: new Date().toISOString(),
    source: repository.getSource(),
    payload: await repository.exportSnapshot(),
  }
}

export async function previewBackupImport(input: unknown): Promise<BackupPreviewData> {
  return parseBackupEnvelope(input).preview
}

export async function importBackupEnvelope(input: unknown): Promise<BackupImportResult> {
  const { envelope, preview } = parseBackupEnvelope(input)
  const result = await repository.importSnapshot(envelope.payload)

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION_V1,
    importedAt: new Date().toISOString(),
    source: envelope.source,
    counts: preview.counts,
    warnings: preview.warnings,
    entities: result.entities,
    dailyRefresh: {
      refreshed: true,
      refreshedAt: result.dailyRefreshAt,
      message: `Daily materialized data was rebuilt at ${result.dailyRefreshAt}.`,
    },
  }
}
