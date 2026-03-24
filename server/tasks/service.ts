import 'server-only'

import { createId } from '@paralleldrive/cuid2'
import { Prisma } from '@prisma/client'

import { buildShowFilter } from '~/server/db/query/helpers'
import { db } from '~/server/lib/db'
import {
  createMetadataTaskCancelledError,
  isMetadataTaskCancelledError,
  refreshImageMetadata,
  throwIfMetadataTaskCancelled,
  type MetadataRefreshImage,
  type MetadataRefreshUpdate,
} from '~/server/tasks/metadata-refresh'
import type {
  AdminTaskError,
  AdminTaskIssue,
  AdminTaskRunDetail,
  AdminTaskRunSummary,
  AdminTaskRunsResponse,
  AdminTaskScope,
  AdminTaskStage,
  AdminTaskStatus,
} from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA, normalizeMetadataTaskScope } from '~/types/admin-tasks'

const METADATA_TASK_BATCH_SIZE = 10
const METADATA_TASK_LOCK_ID = 42011
const METADATA_TASK_LEASE_MS = 2 * 60 * 1000
const ACTIVE_TASK_STATUSES: AdminTaskStatus[] = ['queued', 'running', 'cancelling']
const RUNNABLE_TASK_STATUSES: AdminTaskStatus[] = ['queued', 'running']
const RECENT_HISTORY_LIMIT = 10
const VALID_TASK_STAGES = new Set<AdminTaskStage>(['prepare', 'fetch', 'parse-exif', 'read-dimensions', 'persist', 'process-batch', 'unknown'])

declare const globalThis: {
  metadataTaskAbortControllers?: Map<string, AbortController>;
} & typeof global

const taskAbortControllers = globalThis.metadataTaskAbortControllers || new Map<string, AbortController>()
globalThis.metadataTaskAbortControllers = taskAbortControllers

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

type IssueInput = {
  level: AdminTaskIssue['level']
  stage: AdminTaskStage
  code: string
  summary: string
  detail?: string | null
  httpStatus?: number | null
  httpStatusText?: string | null
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
      taskKey: ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA,
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

function toTaskRunBase(record: TaskRunRecord) {
  return {
    id: record.id,
    taskKey: record.taskKey as AdminTaskRunSummary['taskKey'],
    status: record.status as AdminTaskStatus,
    scope: normalizeMetadataTaskScope(record.scope),
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

function toAdminTaskRunSummary(record: TaskRunRecord | null): AdminTaskRunSummary | null {
  if (!record) return null
  return toTaskRunBase(record)
}

function toAdminTaskRunDetail(record: TaskRunRecord | null): AdminTaskRunDetail | null {
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

function buildTaskScopeQuery(scope: AdminTaskScope) {
  if (scope.albumValue !== 'all') {
    return {
      from: Prisma.sql`
        FROM "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS album ON relation.album_value = album.album_value
      `,
      where: Prisma.sql`
        WHERE image.del = 0 AND album.del = 0 AND album.album_value = ${scope.albumValue}
        ${buildShowFilter(scope.showStatus)}
      `,
    }
  }

  return {
    from: Prisma.sql`FROM "public"."images" AS image`,
    where: Prisma.sql`WHERE image.del = 0 ${buildShowFilter(scope.showStatus)}`,
  }
}

function imageTitle(image: Pick<MetadataRefreshImage, 'id' | 'title' | 'image_name'>) {
  return cleanString(image.title) || cleanString(image.image_name) || image.id
}

function createImageIssue(image: MetadataRefreshImage, input: IssueInput): AdminTaskIssue {
  return {
    imageId: image.id,
    imageTitle: imageTitle(image),
    taskKey: ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA,
    level: input.level,
    stage: input.stage,
    code: input.code,
    summary: input.summary,
    detail: input.detail ?? null,
    httpStatus: input.httpStatus ?? null,
    httpStatusText: nullableString(input.httpStatusText),
    at: new Date().toISOString(),
  }
}

function unknownErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error.'
}

function hasActiveLease(record: Pick<TaskRunRecord, 'leaseExpiresAt'>, now = new Date()) {
  return Boolean(record.leaseExpiresAt && record.leaseExpiresAt.getTime() > now.getTime())
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

async function countImagesForScope(scope: AdminTaskScope) {
  const query = buildTaskScopeQuery(scope)
  const result = await db.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(DISTINCT image.id) AS total
    ${query.from}
    ${query.where}
  `
  return Number(result[0]?.total ?? 0)
}

async function fetchImagesBatchForScope(scope: AdminTaskScope, nextCursor: string | null) {
  const query = buildTaskScopeQuery(scope)
  const cursorFilter = nextCursor ? Prisma.sql`AND image.id > ${nextCursor}` : Prisma.empty

  return db.$queryRaw<MetadataRefreshImage[]>`
    SELECT DISTINCT ON (image.id)
      image.id,
      image.image_name,
      image.title,
      image.url,
      image.exif,
      image.width,
      image.height,
      image.lat,
      image.lon
    ${query.from}
    ${query.where}
      ${cursorFilter}
    ORDER BY image.id ASC
    LIMIT ${METADATA_TASK_BATCH_SIZE}
  `
}

async function updateImageMetadataFields(imageId: string, updates: MetadataRefreshUpdate) {
  const data: Prisma.ImagesUpdateInput = { updatedAt: new Date() }
  if (updates.exif) data.exif = updates.exif
  if (typeof updates.width === 'number') data.width = updates.width
  if (typeof updates.height === 'number') data.height = updates.height
  if (typeof updates.lat === 'string') data.lat = updates.lat
  if (typeof updates.lon === 'string') data.lon = updates.lon

  return db.images.update({ where: { id: imageId }, data })
}

async function withTaskLock<T>(callback: () => Promise<T>) {
  const lockResult = await db.$queryRaw<Array<{ pg_try_advisory_lock: boolean }>>`
    SELECT pg_try_advisory_lock(${METADATA_TASK_LOCK_ID})
  `

  if (!lockResult[0]?.pg_try_advisory_lock) return null

  try {
    return await callback()
  } finally {
    await db.$executeRaw`SELECT pg_advisory_unlock(${METADATA_TASK_LOCK_ID})`
  }
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
    WHERE "task_key" = ${ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA}
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
    WHERE "task_key" = ${ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA}
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
    WHERE "task_key" = ${ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA}
      ${excludeSql}
    ORDER BY "created_at" DESC
    LIMIT ${limit}
  `
}

async function leaseTaskRun(runId: string) {
  const now = new Date()
  const leaseExpiresAt = new Date(now.getTime() + METADATA_TASK_LEASE_MS)

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

async function ensureTaskRunCanContinue(runId: string, controller: AbortController) {
  throwIfMetadataTaskCancelled(controller.signal)

  const record = await findTaskRunById(runId)
  if (!record) {
    abortTaskController(controller, 'Task run no longer exists.')
    throw createMetadataTaskCancelledError('Task run no longer exists.')
  }

  if (record.status === 'cancelling' || record.status === 'cancelled') {
    abortTaskController(controller, 'Task cancellation requested.')
    throw createMetadataTaskCancelledError('Task cancellation requested.')
  }

  throwIfMetadataTaskCancelled(controller.signal)
  return record
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

  return toAdminTaskRunSummary(rows[0] ?? null)
}

async function finalizeTaskRunBatch(runId: string, progress: TaskBatchProgress, batchLength: number, stoppedByCancellation: boolean) {
  const currentRecord = await findTaskRunById(runId)
  if (!currentRecord) return null

  const finalProcessedCount = currentRecord.processedCount + progress.processedCount
  const nextCursor = progress.processedCount > 0 ? progress.nextCursor : currentRecord.nextCursor
  const isCompleted = !stoppedByCancellation && (
    finalProcessedCount >= currentRecord.totalCount
    || (batchLength < METADATA_TASK_BATCH_SIZE && progress.processedCount === batchLength)
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

  return toAdminTaskRunSummary(rows[0] ?? null)
}

export async function getMetadataTaskPreviewCount(scope: AdminTaskScope) {
  return { totalCount: await countImagesForScope(scope) }
}

export async function listMetadataTaskRuns(): Promise<AdminTaskRunsResponse> {
  const activeRecord = await findActiveTaskRun('desc')
  const activeRun = toAdminTaskRunSummary(activeRecord)
  const historyRecords = await listRecentTaskRunRecords(RECENT_HISTORY_LIMIT, activeRecord?.id ?? null)

  return {
    activeRun,
    recentRuns: historyRecords
      .map((record) => toAdminTaskRunSummary(record))
      .filter(Boolean) as AdminTaskRunSummary[],
  }
}

export async function getMetadataTaskRunDetail(runId: string) {
  return toAdminTaskRunDetail(await findTaskRunById(runId))
}

export async function createMetadataTaskRun(scope: AdminTaskScope) {
  return withTaskLock(async () => {
    const existingRun = await findActiveTaskRun('desc')
    if (existingRun) throw new Error('Another metadata task is already active')

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
        ${ADMIN_TASK_KEY_REFRESH_IMAGE_METADATA},
        'queued',
        ${jsonValue(scope)},
        ${totalCount},
        0,
        0,
        0,
        0,
        NULL,
        ${jsonValue([])},
        NULL,
        ${now},
        ${now}
      )
      ${taskRunReturning}
    `

    return toAdminTaskRunSummary(rows[0] ?? null)
  })
}

export async function cancelMetadataTaskRun(runId: string) {
  const record = await findTaskRunById(runId)
  if (!record) return null

  const status = record.status as AdminTaskStatus
  if (!ACTIVE_TASK_STATUSES.includes(status)) return toAdminTaskRunSummary(record)

  const now = new Date()
  const leaseActive = hasActiveLease(record, now)

  if (status === 'queued' || ((status === 'running' || status === 'cancelling') && !leaseActive)) {
    const cancelledRecord = await finalizeTaskRunAsCancelled(runId, now)
    abortTaskRunInProcess(runId, 'Task cancellation requested.')
    return toAdminTaskRunSummary(cancelledRecord ?? record)
  }

  if (status === 'cancelling') {
    abortTaskRunInProcess(runId, 'Task cancellation requested.')
    return toAdminTaskRunSummary(record)
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

  if (rows[0]) return toAdminTaskRunSummary(rows[0])
  return toAdminTaskRunSummary(await findTaskRunById(runId))
}

export async function kickMetadataTaskRun(runId: string) {
  const result = await withTaskLock(async () => {
    const leasedRun = await leaseTaskRun(runId)
    if (!leasedRun) return toAdminTaskRunSummary(await findTaskRunById(runId))

    const controller = registerTaskAbortController(leasedRun.id)
    const progress: TaskBatchProgress = {
      processedCount: 0,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      nextCursor: leasedRun.nextCursor,
      issues: [],
    }

    try {
      const scope = normalizeMetadataTaskScope(leasedRun.scope)
      const batch = await fetchImagesBatchForScope(scope, leasedRun.nextCursor)

      if (batch.length === 0) {
        return await finalizeTaskRunBatch(leasedRun.id, progress, 0, false)
      }

      let stoppedByCancellation = false

      try {
        for (const image of batch) {
          await ensureTaskRunCanContinue(leasedRun.id, controller)

          try {
            const result = await refreshImageMetadata(image, controller.signal)
            await ensureTaskRunCanContinue(leasedRun.id, controller)

            progress.issues.push(...result.issues)

            if (result.outcome === 'success') {
              await updateImageMetadataFields(image.id, result.updates)
              progress.successCount += 1
            } else if (result.outcome === 'skipped') {
              progress.skippedCount += 1
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
            progress.issues.push(createImageIssue(image, {
              level: 'error',
              stage: 'process-batch',
              code: 'unexpected_error',
              summary: 'Unexpected error while processing image metadata.',
              detail: unknownErrorDetail(error),
            }))
          }
        }
      } catch (error) {
        if (isMetadataTaskCancelledError(error)) {
          stoppedByCancellation = true
        } else {
          return await finalizeFailedTaskRun(leasedRun.id, progress, error)
        }
      }

      return await finalizeTaskRunBatch(leasedRun.id, progress, batch.length, stoppedByCancellation)
    } finally {
      clearTaskAbortController(leasedRun.id, controller)
    }
  })

  return result ?? toAdminTaskRunSummary(await findTaskRunById(runId))
}

export async function tickMetadataTaskRuns() {
  const runnableRecord = await findRunnableTaskRun('asc')
  if (runnableRecord) {
    return { activeRun: await kickMetadataTaskRun(runnableRecord.id) }
  }

  const activeRecord = await findActiveTaskRun('asc')
  if (!activeRecord) return { activeRun: null }
  return { activeRun: toAdminTaskRunSummary(activeRecord) }
}
