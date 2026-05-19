import 'server-only'

import path from 'node:path'
import { badRequest } from '~/hono/_lib/errors'

/**
 * Maximum upload size enforced for direct (`/upload`) uploads.
 *
 * Hardcoded for now — a config-driven `max_upload_size` is a future enhancement.
 */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024

/**
 * MIME types permitted by the upload pipeline.
 *
 * Covers the still-image formats the gallery renders plus the two container
 * formats used by Live Photo videos (`.mov`/`.mp4`).
 */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/gif',
  'video/mp4',
  'video/quicktime',
]

const FILENAME_REJECT_PATTERN = /[/\\\0]|\.\./

/**
 * Validate an uploaded filename.
 *
 * Rejects empty strings, NUL bytes, path separators (`/`, `\\`) and any `..`
 * segments, then runs `path.basename` to strip residual directory components
 * (defence in depth in case the caller crafted something the surface checks
 * missed).
 *
 * Returns the sanitized basename so callers can substitute it for the raw
 * user input.
 *
 * Throws `badRequest('Invalid filename')` on any failure.
 */
export function validateFilename(name: unknown): string {
  if (typeof name !== 'string' || name.length === 0) {
    throw badRequest('Invalid filename')
  }
  if (FILENAME_REJECT_PATTERN.test(name)) {
    throw badRequest('Invalid filename')
  }
  const base = path.basename(name)
  if (base.length === 0 || base === '.' || base === '..') {
    throw badRequest('Invalid filename')
  }
  return base
}

/**
 * Validate that the supplied MIME type is on the upload allowlist.
 *
 * Throws `badRequest('Unsupported file type: <type>')` otherwise.
 */
export function validateMimeType(type: unknown): void {
  const value = typeof type === 'string' ? type : ''
  if (!ALLOWED_MIME_TYPES.includes(value)) {
    throw badRequest(`Unsupported file type: ${value}`)
  }
}

/**
 * Validate that the supplied file size is within `MAX_UPLOAD_SIZE`.
 *
 * Throws `badRequest('File too large')` otherwise.
 */
export function validateFileSize(size: unknown): void {
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    throw badRequest('File too large')
  }
  if (size > MAX_UPLOAD_SIZE) {
    throw badRequest('File too large')
  }
}
