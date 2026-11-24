import 'server-only'

import {
  buildVariantKey,
  computeImageKey,
  generateImageVariants,
  putVariantObject,
} from '~/server/lib/image-variants'
import {
  createMetadataTaskCancelledError,
  isMetadataTaskCancelledError,
  throwIfMetadataTaskCancelled,
} from '~/server/tasks/metadata-refresh'
import { buildOriginalPresignedUrl } from '~/server/lib/original-presign'
import type { ResolvedVariantStorage } from '~/server/lib/variant-storage'
import type { AdminTaskIssue, AdminTaskStage } from '~/types/admin-tasks'
import { ADMIN_TASK_KEY_PREPROCESS_IMAGES } from '~/types/admin-tasks'

// Originals can be 20MB+ and live behind slow object storage; 30s timed out on
// the largest files during backfill. 60s gives slow large-original fetches more
// headroom while still bounding a stuck request.
const FETCH_TIMEOUT_MS = 60_000

export type PreprocessImage = {
  id: string
  image_name: string | null
  title: string | null
  url: string | null
}

export type PreprocessUpdate = {
  image_key: string
  width: number
  height: number
  blurhash: string
  /** Largest tier width whose avif+webp objects were both uploaded. */
  ready_max_width: number
  /** True only when every generated tier uploaded successfully. */
  variants_ready: boolean
}

export type PreprocessResult = {
  outcome: 'success' | 'failed'
  /** Present (possibly partial) whenever any progress was persistable. */
  updates: PreprocessUpdate | null
  issues: AdminTaskIssue[]
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

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function pickImageTitle(image: PreprocessImage) {
  return cleanString(image.title) || cleanString(image.image_name) || image.id
}

function toErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return null
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.name === 'TimeoutError' || error.name === 'AbortError' || /timeout/i.test(error.message)
}

function createIssue(image: PreprocessImage, input: IssueInput): AdminTaskIssue {
  return {
    imageId: image.id,
    imageTitle: pickImageTitle(image),
    taskKey: ADMIN_TASK_KEY_PREPROCESS_IMAGES,
    level: input.level,
    stage: input.stage,
    code: input.code,
    summary: input.summary,
    detail: input.detail ?? null,
    httpStatus: input.httpStatus ?? null,
    httpStatusText: input.httpStatusText ?? null,
    at: new Date().toISOString(),
  }
}

/** Storage object key for a variant: storageFolder + the variant key. */
function variantObjectKey(storageFolder: string, imageKey: string, width: number, format: 'avif' | 'webp') {
  const key = buildVariantKey(imageKey, width, format)
  return storageFolder ? `${storageFolder}/${key}` : key
}

async function fetchOriginal(image: PreprocessImage, storage: ResolvedVariantStorage, signal: AbortSignal | undefined): Promise<Buffer> {
  const fetchSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])
    : AbortSignal.timeout(FETCH_TIMEOUT_MS)

  // Originals commonly live in a private bucket, so a plain public
  // fetch(image.url) is rejected with 403. Read the original through a
  // credentialed presigned GET (same mechanism as the download route),
  // resolving the key against the configured variant_storage backend — which,
  // in a single-backend deployment, is also where the originals live.
  const presignedUrl = await buildOriginalPresignedUrl(storage.backend, image.url as string)
  const response = await fetch(presignedUrl, { signal: fetchSignal, cache: 'no-store' })
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`)
    ;(error as { httpStatus?: number }).httpStatus = response.status
    ;(error as { httpStatusText?: string }).httpStatusText = response.statusText
    throw error
  }
  return Buffer.from(await response.arrayBuffer())
}

/**
 * Generate and upload responsive variants for a single image, then return the
 * DB updates. Uploads tiers smallest-to-largest and advances `ready_max_width`
 * only past tiers whose avif **and** webp objects both uploaded, so the value
 * always points at a fully-available tier (the invariant the gallery loader
 * relies on). `variants_ready` flips true only when every generated tier
 * uploaded; a partial failure leaves it false so the backfill scope re-picks
 * the image (re-upload is idempotent via content-addressed keys).
 */
export async function preprocessImage(
  image: PreprocessImage,
  storage: ResolvedVariantStorage,
  signal?: AbortSignal,
): Promise<PreprocessResult> {
  throwIfMetadataTaskCancelled(signal)

  if (!image.url) {
    return {
      outcome: 'failed',
      updates: null,
      issues: [createIssue(image, {
        level: 'error',
        stage: 'prepare',
        code: 'missing_source_url',
        summary: 'Missing source image URL.',
        detail: 'The image record has no original URL to generate variants from.',
      })],
    }
  }

  let buffer: Buffer
  try {
    buffer = await fetchOriginal(image, storage, signal)
    throwIfMetadataTaskCancelled(signal)
  } catch (error) {
    if (signal?.aborted || isMetadataTaskCancelledError(error)) {
      throw createMetadataTaskCancelledError(signal?.reason ?? error)
    }
    const timeout = isTimeoutError(error)
    return {
      outcome: 'failed',
      updates: null,
      issues: [createIssue(image, {
        level: 'error',
        stage: 'fetch',
        code: timeout ? 'timeout' : 'fetch_error',
        summary: timeout ? 'Timed out fetching the original image.' : 'Failed to fetch the original image.',
        detail: toErrorDetail(error) || 'Unknown fetch error.',
        httpStatus: (error as { httpStatus?: number }).httpStatus ?? null,
        httpStatusText: (error as { httpStatusText?: string }).httpStatusText ?? null,
      })],
    }
  }

  let generated
  try {
    generated = await generateImageVariants(buffer)
    throwIfMetadataTaskCancelled(signal)
  } catch (error) {
    if (signal?.aborted || isMetadataTaskCancelledError(error)) {
      throw createMetadataTaskCancelledError(signal?.reason ?? error)
    }
    return {
      outcome: 'failed',
      updates: null,
      issues: [createIssue(image, {
        level: 'error',
        stage: 'process-batch',
        code: 'variant_generation_failed',
        summary: 'Failed to generate image variants.',
        detail: toErrorDetail(error) || 'sharp could not process the image.',
      })],
    }
  }

  const imageKey = computeImageKey(buffer)

  // Group generated variants by width so each tier's avif + webp upload together
  // and we only advance the watermark past a fully-uploaded tier.
  const tiers = new Map<number, typeof generated.variants>()
  for (const variant of generated.variants) {
    const list = tiers.get(variant.width) ?? []
    list.push(variant)
    tiers.set(variant.width, list)
  }
  const ascendingWidths = [...tiers.keys()].sort((a, b) => a - b)

  const issues: AdminTaskIssue[] = []
  let readyMaxWidth = 0
  let uploadFailed = false

  for (const width of ascendingWidths) {
    throwIfMetadataTaskCancelled(signal)
    try {
      await Promise.all(
        (tiers.get(width) ?? []).map((variant) =>
          putVariantObject(
            storage.client,
            storage.bucket,
            variantObjectKey(storage.storageFolder, imageKey, variant.width, variant.format),
            variant.buffer,
            variant.contentType,
          ),
        ),
      )
      readyMaxWidth = width
    } catch (error) {
      if (signal?.aborted || isMetadataTaskCancelledError(error)) {
        throw createMetadataTaskCancelledError(signal?.reason ?? error)
      }
      uploadFailed = true
      issues.push(createIssue(image, {
        level: 'error',
        stage: 'persist',
        code: 'variant_upload_failed',
        summary: `Failed to upload the ${width}px variant.`,
        detail: toErrorDetail(error) || 'Storage upload failed.',
      }))
      // Stop at the first failed tier — later tiers would leave gaps above the
      // watermark. The image keeps variants_ready=false and is retried.
      break
    }
  }

  const updates: PreprocessUpdate = {
    image_key: imageKey,
    width: generated.width,
    height: generated.height,
    blurhash: generated.blurhash,
    ready_max_width: readyMaxWidth,
    variants_ready: !uploadFailed && readyMaxWidth > 0,
  }

  return {
    outcome: updates.variants_ready ? 'success' : 'failed',
    updates,
    issues,
  }
}
