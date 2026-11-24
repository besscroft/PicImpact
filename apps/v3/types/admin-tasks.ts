export const ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA = 'refresh-image-metadata' as const
export const ADMIN_TASK_KEY_PREPROCESS_IMAGES = 'preprocess-images' as const

export type AdminTaskKey =
  | typeof ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA
  | typeof ADMIN_TASK_KEY_PREPROCESS_IMAGES

/**
 * Scope for the image-preprocessing task. `force: false` (default) only
 * (re)generates variants for images whose `variants_ready` is still false
 * (backfill + incremental); `force: true` reprocesses every image (e.g. after
 * changing the tier ladder or encoder settings).
 */
export type PreprocessTaskScope = {
  force: boolean
}

export function normalizePreprocessTaskScope(scope: unknown): PreprocessTaskScope {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
    return { force: false }
  }

  return { force: (scope as Partial<PreprocessTaskScope>).force === true }
}

export const ADMIN_TASK_STATUSES = ['queued', 'running', 'cancelling', 'succeeded', 'failed', 'cancelled'] as const

export type AdminTaskStatus = (typeof ADMIN_TASK_STATUSES)[number]

export type AdminTaskScope = {
  albumValue: string
  showStatus: -1 | 0 | 1
}

export type AdminTaskIssueLevel = 'info' | 'warning' | 'error'

export type AdminTaskStage =
  | 'prepare'
  | 'fetch'
  | 'parse-exif'
  | 'read-dimensions'
  | 'persist'
  | 'process-batch'
  | 'unknown'

export type AdminTaskIssue = {
  imageId: string
  imageTitle: string
  taskKey: AdminTaskKey
  level: AdminTaskIssueLevel
  stage: AdminTaskStage
  code: string
  summary: string
  detail: string | null
  httpStatus: number | null
  httpStatusText: string | null
  at: string
}

export type AdminTaskError = {
  message: string
  detail: string | null
  stage: AdminTaskStage
  code: string
  at: string
}

export type AdminTaskRunBase = {
  id: string
  taskKey: AdminTaskKey
  status: AdminTaskStatus
  scope: AdminTaskScope
  totalCount: number
  processedCount: number
  successCount: number
  skippedCount: number
  failedCount: number
  nextCursor: string | null
  leaseExpiresAt: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export type AdminTaskRunSummary = AdminTaskRunBase

export type AdminTaskRunDetail = AdminTaskRunBase & {
  recentIssues: AdminTaskIssue[]
  lastError: AdminTaskError | null
}

export type AdminTaskRunsResponse = {
  activeRun: AdminTaskRunSummary | null
  recentRuns: AdminTaskRunSummary[]
}

export type AdminTaskPreviewCount = {
  totalCount: number
}

export function normalizeMetadataTaskScope(scope: unknown): AdminTaskScope {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
    return {
      albumValue: 'all',
      showStatus: -1,
    }
  }

  const rawScope = scope as Partial<AdminTaskScope>
  const showStatus = Number(rawScope.showStatus)

  return {
    albumValue: typeof rawScope.albumValue === 'string' && rawScope.albumValue ? rawScope.albumValue : 'all',
    showStatus: showStatus === 0 || showStatus === 1 ? showStatus : -1,
  }
}
