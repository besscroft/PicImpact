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

/**
 * Validate and normalize an OpenList mount path.
 *
 * Unlike a filename, a mount path is a *directory prefix* that may legitimately
 * contain multiple segments (e.g. `/storage/uploads`). We must preserve the
 * full path while still rejecting genuinely dangerous input:
 *
 * - `..` as a path segment (would let a caller traverse out of the mount).
 * - NUL bytes (terminator injection in downstream consumers).
 *
 * Normalization:
 * - Repeated slashes are collapsed (`//foo//bar` -> `/foo/bar`).
 * - A trailing slash is trimmed (`/foo/` -> `/foo`), except for the root.
 * - A leading slash, if present in the input, is preserved.
 * - `null`/`undefined`/empty input returns `''` (no mount prefix).
 *
 * Throws `badRequest('Invalid mount path')` if the input contains a `..`
 * segment or a NUL byte.
 */
export function validateMountPath(mountPath: unknown): string {
  if (mountPath == null) {
    return ''
  }
  const raw = typeof mountPath === 'string' ? mountPath : String(mountPath)
  if (raw.length === 0) {
    return ''
  }
  if (raw.includes('\0')) {
    throw badRequest('Invalid mount path')
  }
  const hasLeadingSlash = raw.startsWith('/')
  const segments = raw.split('/').filter((segment) => segment.length > 0)
  for (const segment of segments) {
    if (segment === '..') {
      throw badRequest('Invalid mount path')
    }
  }
  if (segments.length === 0) {
    // Input was something like '/' or '///' — treat as root, no prefix.
    return hasLeadingSlash ? '/' : ''
  }
  const joined = segments.join('/')
  return hasLeadingSlash ? `/${joined}` : joined
}
