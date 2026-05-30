import 'server-only'

import { createId } from '@paralleldrive/cuid2'
import { Prisma } from '@prisma/client'

import { db } from '~/server/lib/db'
import {
  createMetadataTaskCancelledError,
  isMetadataTaskCancelledError,
  throwIfMetadataTaskCancelled,
} from '~/server/tasks/metadata-refresh'
import {
  preprocessImage,
  type PreprocessImage,
} from '~/server/tasks/image-preprocess'
import { resolveVariantStorage } from '~/server/lib/variant-storage'
import type {
  AdminTaskError,
  AdminTaskIssue,
  AdminTaskStage,
  AdminTaskStatus,
  PreprocessTaskScope,
} from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_PREPROCESS_IMAGES, normalizePreprocessTaskScope } from '~/types/admin-tasks'

// Variant generation is far heavier (decode + multi-tier encode + uploads) than
// the metadata task, so use a smaller batch and a longer lease. Images are
// processed sequentially within a batch to bound memory (each holds the
// original plus ~16 variant buffers).
const PREPROCESS_TASK_BATCH_SIZE = 4
const PREPROCESS_TASK_LOCK_ID = 42012
const PREPROCESS_TASK_LEASE_MS = 5 * 60 * 1000
const ACTIVE_TASK_STATUSES: AdminTaskStatus[] = ['queued', 'running', 'cancelling']
const RUNNABLE_TASK_STATUSES: AdminTaskStatus[] = ['queued', 'running']
const RECENT_HISTORY_LIMIT = 10
const VALID_TASK_STAGES = new Set<AdminTaskStage>(['prepare', 'fetch', 'parse-exif', 'read-dimensions', 'persist', 'process-batch', 'unknown'])

declare const globalThis: {
  preprocessTaskAbortControllers?: Map<string, AbortController>;
} & typeof global

const taskAbortControllers = globalThis.preprocessTaskAbortControllers || new Map<string, AbortController>()
globalThis.preprocessTaskAbortControllers = taskAbortControllers

type TaskRunRecord = {
  id: string
  taskKey: string
  status: string
  scope: unknown
  totalCount: number
  processedCount: number
  successCount: number
  skippedCount: number
  failedCount: number
  nextCursor: string | null
  recentIssues: unknown
  lastError: unknown
  leaseExpiresAt: Date | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  updatedAt: Date | null
}

export type PreprocessTaskRunSummary = {
  id: string
  taskKey: typeof ADMIN_TASK_KEY_PREPROCESS_IMAGES
  status: AdminTaskStatus
  scope: PreprocessTaskScope
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

export type PreprocessTaskRunDetail = PreprocessTaskRunSummary & {
  recentIssues: AdminTaskIssue[]
  lastError: AdminTaskError | null
}

export type PreprocessTaskRunsResponse = {
  activeRun: PreprocessTaskRunSummary | null
  recentRuns: PreprocessTaskRunSummary[]
}

type TaskBatchProgress = {
  processedCount: number
  successCount: number
  skippedCount: number
  failedCount: number
  nextCursor: string | null
  issues: AdminTaskIssue[]
}

const taskRunSelect = Prisma.sql`
  SELECT
    "id",
    "task_key" AS "taskKey",
    "status",
    "scope",
    "total_count" AS "totalCount",
    "processed_count" AS "processedCount",
    "success_count" AS "successCount",
    "skipped_count" AS "skippedCount",
    "failed_count" AS "failedCount",
    "next_cursor" AS "nextCursor",
    "recent_issues" AS "recentIssues",
    "last_error" AS "lastError",
    "lease_expires_at" AS "leaseExpiresAt",
    "started_at" AS "startedAt",
    "finished_at" AS "finishedAt",
    "created_at" AS "createdAt",
    "updated_at" AS "updatedAt"
  FROM "public"."admin_task_runs"
`

const taskRunReturning = Prisma.sql`
  RETURNING
    "id",
    "task_key" AS "taskKey",
    "status",
    "scope",
    "total_count" AS "totalCount",
    "processed_count" AS "processedCount",
    "success_count" AS "successCount",
    "skipped_count" AS "skippedCount",
    "failed_count" AS "failedCount",
    "next_cursor" AS "nextCursor",
    "recent_issues" AS "recentIssues",
    "last_error" AS "lastError",
    "lease_expires_at" AS "leaseExpiresAt",
    "started_at" AS "startedAt",
    "finished_at" AS "finishedAt",
    "created_at" AS "createdAt",
    "updated_at" AS "updatedAt"
`

function jsonValue(value: unknown) {
  return Prisma.sql`${JSON.stringify(value)}::json`
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableString(value: unknown) {
  const normalized = cleanString(value)
  return normalized || null
}

function normalizeTaskStage(value: unknown): AdminTaskStage {
  const normalized = cleanString(value)
  return VALID_TASK_STAGES.has(normalized as AdminTaskStage) ? normalized as AdminTaskStage : 'unknown'
}

function normalizeNullableNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function fallbackIssueTime(record: Pick<TaskRunRecord, 'createdAt' | 'updatedAt'>) {
  return serializeDate(record.updatedAt) ?? record.createdAt.toISOString()
}

function normalizeTaskIssueArray(value: unknown, fallbackAt: string): AdminTaskIssue[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []

    const rawIssue = item as Record<string, unknown>
    const imageId = cleanString(rawIssue.imageId)
    const summary = cleanString(rawIssue.summary)
    if (!imageId || !summary) return []

    return [{
      imageId,
      imageTitle: cleanString(rawIssue.imageTitle) || imageId,
      taskKey: ADMIN_TASK_KEY_PREPROCESS_IMAGES,
      level: cleanString(rawIssue.level) === 'error'
        ? 'error'
        : cleanString(rawIssue.level) === 'info'
          ? 'info'
          : 'warning',
      stage: normalizeTaskStage(rawIssue.stage),
      code: cleanString(rawIssue.code) || 'unknown_error',
      summary,
      detail: nullableString(rawIssue.detail),
      httpStatus: normalizeNullableNumber(rawIssue.httpStatus),
      httpStatusText: nullableString(rawIssue.httpStatusText),
      at: cleanString(rawIssue.at) || fallbackAt,
    } satisfies AdminTaskIssue]
  })
}

function normalizeTaskError(value: unknown, fallbackAt: string): AdminTaskError | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const rawError = value as Record<string, unknown>
  const message = cleanString(rawError.message)
  if (!message) return null

  return {
    message,
    detail: nullableString(rawError.detail),
    stage: normalizeTaskStage(rawError.stage),
    code: cleanString(rawError.code) || 'unknown_error',
    at: cleanString(rawError.at) || fallbackAt,
  }
}

function toTaskRunBase(record: TaskRunRecord): PreprocessTaskRunSummary {
  return {
    id: record.id,
    taskKey: ADMIN_TASK_KEY_PREPROCESS_IMAGES,
    status: record.status as AdminTaskStatus,
    scope: normalizePreprocessTaskScope(record.scope),
    totalCount: record.totalCount,
    processedCount: record.processedCount,
    successCount: record.successCount,
    skippedCount: record.skippedCount,
    failedCount: record.failedCount,
    nextCursor: record.nextCursor,
    leaseExpiresAt: serializeDate(record.leaseExpiresAt),
    startedAt: serializeDate(record.startedAt),
    finishedAt: serializeDate(record.finishedAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: serializeDate(record.updatedAt),
  }
}

function toSummary(record: TaskRunRecord | null): PreprocessTaskRunSummary | null {
  if (!record) return null
  return toTaskRunBase(record)
}

function toDetail(record: TaskRunRecord | null): PreprocessTaskRunDetail | null {
  if (!record) return null
  const fallbackAt = fallbackIssueTime(record)
  return {
    ...toTaskRunBase(record),
    recentIssues: normalizeTaskIssueArray(record.recentIssues, fallbackAt),
    lastError: normalizeTaskError(record.lastError, fallbackAt),
  }
}

function createTaskError(message: string, options?: { detail?: string | null; stage?: AdminTaskStage; code?: string }): AdminTaskError {
  return {
    message,
    detail: options?.detail ?? null,
    stage: options?.stage ?? 'process-batch',
    code: options?.code ?? 'batch_failed',
    at: new Date().toISOString(),
  }
}

function mergeRecentIssues(existing: unknown, incoming: AdminTaskIssue[], fallbackAt: string) {
  if (incoming.length === 0) return normalizeTaskIssueArray(existing, fallbackAt)
  return [...normalizeTaskIssueArray(existing, fallbackAt), ...incoming].slice(-20)
}

function unknownErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error.'
}

// Scope query: every non-deleted image, optionally restricted to those still
// missing variants. `force` reprocesses everything (e.g. after a tier-ladder
// or encoder change).
function buildScopeWhere(scope: PreprocessTaskScope) {
  const readyFilter = scope.force ? Prisma.empty : Prisma.sql`AND image.variants_ready = false`
  return Prisma.sql`WHERE image.del = 0 ${readyFilter}`
}

async function countImagesForScope(scope: PreprocessTaskScope) {
  const result = await db.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(1) AS total
    FROM "public"."images" AS image
    ${buildScopeWhere(scope)}
  `
  return Number(result[0]?.total ?? 0)
}

async function fetchImagesBatchForScope(scope: PreprocessTaskScope, nextCursor: string | null) {
  const cursorFilter = nextCursor ? Prisma.sql`AND image.id > ${nextCursor}` : Prisma.empty
  return db.$queryRaw<PreprocessImage[]>`
    SELECT
      image.id,
      image.image_name,
      image.title,
      image.url
    FROM "public"."images" AS image
    ${buildScopeWhere(scope)}
      ${cursorFilter}
    ORDER BY image.id ASC
    LIMIT ${PREPROCESS_TASK_BATCH_SIZE}
  `
}

async function applyPreprocessUpdates(imageId: string, updates: NonNullable<Awaited<ReturnType<typeof preprocessImage>>['updates']>) {
  await db.images.update({
    where: { id: imageId },
    data: {
      image_key: updates.image_key,
      width: updates.width,
      height: updates.height,
      blurhash: updates.blurhash,
      ready_max_width: updates.ready_max_width,
      variants_ready: updates.variants_ready,
      updatedAt: new Date(),
    },
  })
}

async function withTaskLock<T>(callback: () => Promise<T>) {
  const lockResult = await db.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>`
    SELECT pg_try_advisory_lock(${PREPROCESS_TASK_LOCK_ID})
  `
  if (!lockResult[0]?.pg_try_advisory_lock) return null
  try {
    return await callback()
  } finally {
    await db.$executeRaw`SELECT pg_advisory_unlock(${PREPROCESS_TASK_LOCK_ID})`
  }
}

async function withTaskLockWarn<T>(context: string, callback: () => Promise<T>) {
  const result = await withTaskLock(callback)
  if (result === null) {
    console.warn(`preprocess task lock busy: ${context}`)
  }
  return result
}

const PROGRESS_LOCK_RETRY_COUNT = 5
const PROGRESS_LOCK_RETRY_DELAY_MS = 50

async function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function withTaskLockRetry<T>(context: string, callback: () => Promise<T>) {
  for (let attempt = 0; attempt < PROGRESS_LOCK_RETRY_COUNT; attempt += 1) {
    const result = await withTaskLock(callback)
    if (result !== null) return result
    if (attempt < PROGRESS_LOCK_RETRY_COUNT - 1) {
      await delay(PROGRESS_LOCK_RETRY_DELAY_MS)
    }
  }
  console.warn(`preprocess task lock busy after retries: ${context}`)
  return null
}

async function findTaskRunById(runId: string) {
  const rows = await db.$queryRaw<TaskRunRecord[]>`
    ${taskRunSelect}
    WHERE "id" = ${runId}
    LIMIT 1
  `
  return rows[0] ?? null
}

async function findActiveTaskRun(order: 'asc' | 'desc' = 'desc') {
  const orderSql = Prisma.raw(order.toUpperCase())
  const rows = await db.$queryRaw<TaskRunRecord[]>`
    ${taskRunSelect}
    WHERE "task_key" = ${ADMIN_TASK_KEY_PREPROCESS_IMAGES}
      AND "status" IN (${Prisma.join(ACTIVE_TASK_STATUSES)})
    ORDER BY "created_at" ${orderSql}
    LIMIT 1
  `
  return rows[0] ?? null
}

async function findRunnableTaskRun(order: 'asc' | 'desc' = 'desc') {
  const orderSql = Prisma.raw(order.toUpperCase())
  const rows = await db.$queryRaw<TaskRunRecord[]>`
    ${taskRunSelect}
    WHERE "task_key" = ${ADMIN_TASK_KEY_PREPROCESS_IMAGES}
      AND "status" IN (${Prisma.join(RUNNABLE_TASK_STATUSES)})
    ORDER BY "created_at" ${orderSql}
    LIMIT 1
  `
  return rows[0] ?? null
}

async function listRecentTaskRunRecords(limit: number, excludeRunId: string | null) {
  const excludeSql = excludeRunId ? Prisma.sql`AND "id" <> ${excludeRunId}` : Prisma.empty
  return db.$queryRaw<TaskRunRecord[]>`
    ${taskRunSelect}
    WHERE "task_key" = ${ADMIN_TASK_KEY_PREPROCESS_IMAGES}
      ${excludeSql}
    ORDER BY "created_at" DESC
    LIMIT ${limit}
  `
}

async function leaseTaskRun(runId: string) {
  const now = new Date()
  const leaseExpiresAt = new Date(now.getTime() + PREPROCESS_TASK_LEASE_MS)
  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "status" = 'running',
      "started_at" = COALESCE("started_at", ${now}),
      "lease_expires_at" = ${leaseExpiresAt},
      "last_error" = NULL,
      "updated_at" = ${now}
    WHERE "id" = ${runId}
      AND "status" IN (${Prisma.join(RUNNABLE_TASK_STATUSES)})
      AND ("lease_expires_at" IS NULL OR "lease_expires_at" <= ${now})
    ${taskRunReturning}
  `
  return rows[0] ?? null
}

async function finalizeTaskRunAsCancelled(runId: string, now = new Date()) {
  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "status" = 'cancelled',
      "finished_at" = COALESCE("finished_at", ${now}),
      "lease_expires_at" = NULL,
      "updated_at" = ${now}
    WHERE "id" = ${runId}
    ${taskRunReturning}
  `
  return rows[0] ?? null
}

async function commitTaskRunProgress(runId: string, progress: TaskBatchProgress) {
  if (progress.processedCount === 0 && progress.issues.length === 0) {
    return findTaskRunById(runId)
  }
  const currentRecord = await findTaskRunById(runId)
  if (!currentRecord) return null

  const now = new Date()
  const leaseExpiresAt = new Date(now.getTime() + PREPROCESS_TASK_LEASE_MS)
  const nextCursor = progress.processedCount > 0 ? progress.nextCursor : currentRecord.nextCursor
  const mergedIssues = mergeRecentIssues(currentRecord.recentIssues, progress.issues, fallbackIssueTime(currentRecord))

  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "processed_count" = "processed_count" + ${progress.processedCount},
      "success_count" = "success_count" + ${progress.successCount},
      "skipped_count" = "skipped_count" + ${progress.skippedCount},
      "failed_count" = "failed_count" + ${progress.failedCount},
      "next_cursor" = ${nextCursor},
      "recent_issues" = ${jsonValue(mergedIssues)},
      "lease_expires_at" = CASE
        WHEN "status" IN ('cancelling', 'cancelled') THEN "lease_expires_at"
        ELSE ${leaseExpiresAt}
      END,
      "updated_at" = ${now}
    WHERE "id" = ${runId}
    ${taskRunReturning}
  `
  return rows[0] ?? null
}

function resetProgress(progress: TaskBatchProgress) {
  progress.processedCount = 0
  progress.successCount = 0
  progress.skippedCount = 0
  progress.failedCount = 0
  progress.issues = []
}

async function finalizeFailedTaskRun(runId: string, progress: TaskBatchProgress, error: unknown) {
  const currentRecord = await findTaskRunById(runId)
  if (!currentRecord) return null

  const now = new Date()
  const nextCursor = progress.processedCount > 0 ? progress.nextCursor : currentRecord.nextCursor
  const batchError = jsonValue(createTaskError('Failed to process task batch.', {
    detail: unknownErrorDetail(error),
    stage: 'process-batch',
    code: 'batch_failed',
  }))

  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "processed_count" = "processed_count" + ${progress.processedCount},
      "success_count" = "success_count" + ${progress.successCount},
      "skipped_count" = "skipped_count" + ${progress.skippedCount},
      "failed_count" = "failed_count" + ${progress.failedCount},
      "next_cursor" = ${nextCursor},
      "recent_issues" = ${jsonValue(mergeRecentIssues(currentRecord.recentIssues, progress.issues, fallbackIssueTime(currentRecord)))},
      "lease_expires_at" = NULL,
      "status" = CASE
        WHEN "status" IN ('cancelling', 'cancelled') THEN 'cancelled'
        ELSE 'failed'
      END,
      "finished_at" = COALESCE("finished_at", ${now}),
      "last_error" = CASE
        WHEN "status" IN ('cancelling', 'cancelled') THEN "last_error"
        ELSE ${batchError}
      END,
      "updated_at" = ${now}
    WHERE "id" = ${runId}
    ${taskRunReturning}
  `
  return toSummary(rows[0] ?? null)
}

async function finalizeTaskRunBatch(runId: string, progress: TaskBatchProgress, batchLength: number, stoppedByCancellation: boolean) {
  const currentRecord = await findTaskRunById(runId)
  if (!currentRecord) return null

  const finalProcessedCount = currentRecord.processedCount + progress.processedCount
  const nextCursor = progress.processedCount > 0 ? progress.nextCursor : currentRecord.nextCursor
  const isCompleted = !stoppedByCancellation && (
    finalProcessedCount >= currentRecord.totalCount
    || (batchLength < PREPROCESS_TASK_BATCH_SIZE && progress.processedCount === batchLength)
  )
  const now = new Date()

  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "processed_count" = "processed_count" + ${progress.processedCount},
      "success_count" = "success_count" + ${progress.successCount},
      "skipped_count" = "skipped_count" + ${progress.skippedCount},
      "failed_count" = "failed_count" + ${progress.failedCount},
      "next_cursor" = ${nextCursor},
      "recent_issues" = ${jsonValue(mergeRecentIssues(currentRecord.recentIssues, progress.issues, fallbackIssueTime(currentRecord)))},
      "lease_expires_at" = NULL,
      "status" = CASE
        WHEN "status" IN ('cancelling', 'cancelled') THEN 'cancelled'
        WHEN ${isCompleted} THEN 'succeeded'
        ELSE 'running'
      END,
      "finished_at" = CASE
        WHEN "status" IN ('cancelling', 'cancelled') OR ${isCompleted} THEN COALESCE("finished_at", ${now})
        ELSE NULL
      END,
      "updated_at" = ${now}
    WHERE "id" = ${runId}
    ${taskRunReturning}
  `
  return toSummary(rows[0] ?? null)
}

function registerTaskAbortController(runId: string) {
  const controller = new AbortController()
  taskAbortControllers.set(runId, controller)
  return controller
}

function clearTaskAbortController(runId: string, controller?: AbortController) {
  const current = taskAbortControllers.get(runId)
  if (!current) return
  if (controller && current !== controller) return
  taskAbortControllers.delete(runId)
}

function abortTaskController(controller: AbortController, reason?: unknown) {
  if (controller.signal.aborted) return
  controller.abort(createMetadataTaskCancelledError(reason))
}

function abortTaskRunInProcess(runId: string, reason?: unknown) {
  const controller = taskAbortControllers.get(runId)
  if (!controller) return false
  abortTaskController(controller, reason)
  return true
}

function hasActiveLease(record: Pick<TaskRunRecord, 'leaseExpiresAt'>, now = new Date()) {
  return Boolean(record.leaseExpiresAt && record.leaseExpiresAt.getTime() > now.getTime())
}

export async function getPreprocessTaskPreviewCount(scope: PreprocessTaskScope) {
  return { totalCount: await countImagesForScope(scope) }
}

export async function listPreprocessTaskRuns(): Promise<PreprocessTaskRunsResponse> {
  const activeRecord = await findActiveTaskRun('desc')
  const activeRun = toSummary(activeRecord)
  const historyRecords = await listRecentTaskRunRecords(RECENT_HISTORY_LIMIT, activeRecord?.id ?? null)
  return {
    activeRun,
    recentRuns: historyRecords.map((record) => toSummary(record)).filter(Boolean) as PreprocessTaskRunSummary[],
  }
}

export async function getPreprocessTaskRunDetail(runId: string) {
  return toDetail(await findTaskRunById(runId))
}

export async function createPreprocessTaskRun(scope: PreprocessTaskScope) {
  // Refuse to create a run the pipeline cannot fulfil — surfaces the missing
  // `variant_storage` config to the caller instead of failing per-image later.
  const storage = await resolveVariantStorage()
  if (!storage) throw new Error('Variant storage backend is not configured')

  return withTaskLockWarn('createRun', async () => {
    const existingRun = await findActiveTaskRun('desc')
    if (existingRun) throw new Error('Another preprocess task is already active')

    const totalCount = await countImagesForScope(scope)
    if (totalCount < 1) throw new Error('No images matched the selected filters')

    const now = new Date()
    const rows = await db.$queryRaw<TaskRunRecord[]>`
      INSERT INTO "public"."admin_task_runs" (
        "id", "task_key", "status", "scope", "total_count", "processed_count",
        "success_count", "skipped_count", "failed_count", "next_cursor", "recent_issues",
        "last_error", "created_at", "updated_at"
      ) VALUES (
        ${createId()},
        ${ADMIN_TASK_KEY_PREPROCESS_IMAGES},
        'queued',
        ${jsonValue(scope)},
        ${totalCount},
        0, 0, 0, 0,
        NULL,
        ${jsonValue([])},
        NULL,
        ${now},
        ${now}
      )
      ${taskRunReturning}
    `
    return toSummary(rows[0] ?? null)
  })
}

export async function cancelPreprocessTaskRun(runId: string) {
  const record = await findTaskRunById(runId)
  if (!record) return null

  const status = record.status as AdminTaskStatus
  if (!ACTIVE_TASK_STATUSES.includes(status)) return toSummary(record)

  const now = new Date()
  const leaseActive = hasActiveLease(record, now)

  if (status === 'queued' || ((status === 'running' || status === 'cancelling') && !leaseActive)) {
    const cancelledRecord = await finalizeTaskRunAsCancelled(runId, now)
    abortTaskRunInProcess(runId, 'Task cancellation requested.')
    return toSummary(cancelledRecord ?? record)
  }

  if (status === 'cancelling') {
    abortTaskRunInProcess(runId, 'Task cancellation requested.')
    return toSummary(record)
  }

  const rows = await db.$queryRaw<TaskRunRecord[]>`
    UPDATE "public"."admin_task_runs"
    SET
      "status" = 'cancelling',
      "updated_at" = ${now}
    WHERE "id" = ${runId}
      AND "status" = 'running'
    ${taskRunReturning}
  `
  abortTaskRunInProcess(runId, 'Task cancellation requested.')
  if (rows[0]) return toSummary(rows[0])
  return toSummary(await findTaskRunById(runId))
}

export async function kickPreprocessTaskRun(runId: string) {
  const leaseResult = await withTaskLockWarn('kick:lease', async () => {
    const leasedRun = await leaseTaskRun(runId)
    if (!leasedRun) return { leased: null as TaskRunRecord | null }
    return { leased: leasedRun }
  })

  if (leaseResult === null) {
    return toSummary(await findTaskRunById(runId))
  }

  const leasedRun = leaseResult.leased
  if (!leasedRun) {
    return toSummary(await findTaskRunById(runId))
  }

  const controller = registerTaskAbortController(leasedRun.id)
  const progress: TaskBatchProgress = {
    processedCount: 0,
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
    nextCursor: leasedRun.nextCursor,
    issues: [],
  }
  let stoppedByCancellation = false
  let batchLength = 0

  try {
    // Resolve the storage backend once per kick (outside the lock). If it's no
    // longer configured, fail the run with a clear error.
    const storage = await resolveVariantStorage()
    if (!storage) {
      const failed = await withTaskLockRetry('kick:no-storage', () =>
        finalizeFailedTaskRun(leasedRun.id, progress, new Error('Variant storage backend is not configured')),
      )
      return failed ?? toSummary(await findTaskRunById(leasedRun.id))
    }

    const scope = normalizePreprocessTaskScope(leasedRun.scope)
    const batch = await fetchImagesBatchForScope(scope, leasedRun.nextCursor)
    batchLength = batch.length

    if (batch.length === 0) {
      const finalized = await withTaskLockRetry('kick:finalize-empty', () =>
        finalizeTaskRunBatch(leasedRun.id, progress, 0, false),
      )
      return finalized ?? toSummary(await findTaskRunById(runId))
    }

    try {
      for (const image of batch) {
        throwIfMetadataTaskCancelled(controller.signal)

        try {
          const result = await preprocessImage(image, storage, controller.signal)
          throwIfMetadataTaskCancelled(controller.signal)

          progress.issues.push(...result.issues)

          // Persist any progress (partial uploads advance ready_max_width;
          // image_key/dims/blurhash are worth storing even on failure).
          if (result.updates) {
            await applyPreprocessUpdates(image.id, result.updates)
          }

          if (result.outcome === 'success') {
            progress.successCount += 1
          } else {
            progress.failedCount += 1
          }

          progress.processedCount += 1
          progress.nextCursor = image.id
        } catch (error) {
          if (isMetadataTaskCancelledError(error)) {
            stoppedByCancellation = true
            break
          }
          progress.failedCount += 1
          progress.processedCount += 1
          progress.nextCursor = image.id
          progress.issues.push({
            imageId: image.id,
            imageTitle: cleanString(image.title) || cleanString(image.image_name) || image.id,
            taskKey: ADMIN_TASK_KEY_PREPROCESS_IMAGES,
            level: 'error',
            stage: 'process-batch',
            code: 'unexpected_error',
            summary: 'Unexpected error while preprocessing image.',
            detail: unknownErrorDetail(error),
            httpStatus: null,
            httpStatusText: null,
            at: new Date().toISOString(),
          })
        }

        const checkpoint = await withTaskLockRetry('kick:checkpoint', () =>
          commitTaskRunProgress(leasedRun.id, progress),
        )
        if (checkpoint) {
          resetProgress(progress)
          if (checkpoint.status === 'cancelling' || checkpoint.status === 'cancelled') {
            abortTaskController(controller, 'Task cancellation requested.')
            stoppedByCancellation = true
            break
          }
        }
      }
    } catch (error) {
      if (isMetadataTaskCancelledError(error)) {
        stoppedByCancellation = true
      } else {
        const failed = await withTaskLockRetry('kick:finalize-failed', () =>
          finalizeFailedTaskRun(leasedRun.id, progress, error),
        )
        return failed ?? toSummary(await findTaskRunById(leasedRun.id))
      }
    }

    const finalized = await withTaskLockRetry('kick:finalize', () =>
      finalizeTaskRunBatch(leasedRun.id, progress, batchLength, stoppedByCancellation),
    )
    return finalized ?? toSummary(await findTaskRunById(leasedRun.id))
  } finally {
    clearTaskAbortController(leasedRun.id, controller)
  }
}

export async function tickPreprocessTaskRuns() {
  const runnableRecord = await findRunnableTaskRun('asc')
  if (runnableRecord) {
    return { activeRun: await kickPreprocessTaskRun(runnableRecord.id) }
  }
  const activeRecord = await findActiveTaskRun('asc')
  if (!activeRecord) return { activeRun: null }
  return { activeRun: toSummary(activeRecord) }
}
