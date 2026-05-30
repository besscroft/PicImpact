import 'server-only'

import { createHash } from 'node:crypto'

import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import sharp, { type Sharp } from 'sharp'
import { rgbaToThumbHash } from 'thumbhash'

import {
  VARIANT_FORMATS,
  VARIANT_TIER_WIDTHS,
  buildVariantKey,
  tierWidthsForSource,
  variantContentType,
  type VariantFormat,
} from '~/lib/image/variant-tiers'

// The variant tier ladder + key/format helpers live in the client-safe
// `~/lib/image/variant-tiers` module (the single source of truth shared with
// the gallery loader). Re-export them so existing server-side imports from
// this module keep working.
export {
  VARIANT_FORMATS,
  VARIANT_TIER_WIDTHS,
  buildVariantKey,
  tierWidthsForSource,
  variantContentType,
}
export type { VariantFormat }

/**
 * Default decompression-bomb guard for sharp, in pixels. sharp's own default is
 * ~268MP; an earlier revision tightened this to 100MP, which turned out to
 * reject large stitched panoramas (well above 100MP). The default is raised to
 * comfortably cover multi-row panoramas while still rejecting pathological
 * gigapixel inputs crafted to exhaust memory, and is overridable via the
 * `IMAGE_MAX_INPUT_PIXELS` env var for outliers.
 *
 * Memory note: variants only need a <=2560px decode and `resize` downsamples,
 * and JPEG benefits from libvips shrink-on-load (decode memory tracks the
 * output, not the input) — so a high limit is memory-safe for the common JPEG
 * case. Very large non-JPEG sources (e.g. a 300MP PNG) still decode in full
 * (~1.2GB raw), so the guard stays a bounded number rather than disabled
 * (`false`).
 */
const DEFAULT_MAX_INPUT_PIXELS = 500_000_000

function resolveMaxInputPixels(raw: string | undefined): number {
  if (raw) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed)
    }
  }
  return DEFAULT_MAX_INPUT_PIXELS
}

const MAX_INPUT_PIXELS = resolveMaxInputPixels(process.env.IMAGE_MAX_INPUT_PIXELS)

/** Edge length used when sampling the image down to compute its thumbhash. */
const THUMBHASH_MAX_EDGE = 100

/** Immutable cache header for content-addressed variant objects. */
export const VARIANT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

/**
 * Content-addressed base key derived from the original bytes. Because the key
 * changes whenever the content changes, variant objects can be served with an
 * immutable cache header and never need invalidation.
 */
export function computeImageKey(input: Buffer, prefix = 'variants'): string {
  const digest = createHash('sha256').update(input).digest('hex').slice(0, 32)
  return `${prefix}/${digest}`
}

/**
 * Resolve an image's *displayed* dimensions from sharp metadata.
 *
 * sharp's `.metadata()` reports the stored (pre-rotation) width/height plus the
 * EXIF `orientation` flag. For orientation 5-8 (transpose / rotate 90 / rotate
 * 270 / transverse — very common on phone photos) the displayed image has its
 * width and height swapped relative to storage. Anything that persists or lays
 * out dimensions must use these oriented values so they match the
 * EXIF-auto-oriented pixels (and the browser-reported dimensions stored for
 * existing rows), avoiding portrait-as-landscape layout breakage.
 *
 * Returns `0` for any dimension sharp could not read.
 */
export function getOrientedDimensions(
  metadata: { width?: number; height?: number; orientation?: number },
): { width: number; height: number } {
  const storedWidth = metadata.width ?? 0
  const storedHeight = metadata.height ?? 0
  const orientation = metadata.orientation ?? 1
  const swap = orientation >= 5 && orientation <= 8
  return {
    width: swap ? storedHeight : storedWidth,
    height: swap ? storedWidth : storedHeight,
  }
}

export interface GeneratedVariant {
  width: number
  format: VariantFormat
  buffer: Buffer
  contentType: string
}

export interface ImageVariantResult {
  /** Intrinsic width of the source image (after EXIF auto-orientation). */
  width: number
  /** Intrinsic height of the source image (after EXIF auto-orientation). */
  height: number
  /** Base64-encoded thumbhash placeholder (stored in the `blurhash` column). */
  blurhash: string
  /** Generated variants, ascending by width, both formats per tier. */
  variants: GeneratedVariant[]
}

export interface GenerateOptions {
  avifQuality?: number
  webpQuality?: number
  avifEffort?: number
}

/**
 * Generate the full responsive variant set for an original image plus its
 * thumbhash placeholder. Pure: produces in-memory buffers and reads no
 * external state. Uploading and persistence are the caller's responsibility
 * (the preprocessing queue), which lets it advance `ready_max_width` after
 * each successfully uploaded tier.
 */
export async function generateImageVariants(
  input: Buffer,
  opts: GenerateOptions = {},
): Promise<ImageVariantResult> {
  // AVIF effort dominates encoding time; effort 2 (vs sharp's default 4) was
  // ~2.6x faster in a local benchmark for a small size penalty — a good
  // trade-off for bulk variant generation.
  const { avifQuality = 50, webpQuality = 72, avifEffort = 2 } = opts

  const metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'none' }).metadata()

  // The variants below are produced via `.rotate()` (EXIF auto-orientation), so
  // report the oriented dimensions (see getOrientedDimensions).
  const { width: sourceWidth, height: sourceHeight } = getOrientedDimensions(metadata)
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('Unable to read source image dimensions')
  }

  // Decode + EXIF-orient the original ONCE; every tier and the thumbhash derive
  // from clones of this pipeline so a (potentially 20MB+) original is decoded a
  // single time instead of once per output.
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'none' }).rotate()

  const blurhash = await generateThumbhash(base.clone())

  const variants: GeneratedVariant[] = []
  for (const width of tierWidthsForSource(sourceWidth)) {
    const resized = base.clone().resize({ width, withoutEnlargement: true })

    const [avif, webp] = await Promise.all([
      resized.clone().avif({ quality: avifQuality, effort: avifEffort }).toBuffer(),
      resized.clone().webp({ quality: webpQuality }).toBuffer(),
    ])

    variants.push({ width, format: 'avif', buffer: avif, contentType: variantContentType('avif') })
    variants.push({ width, format: 'webp', buffer: webp, contentType: variantContentType('webp') })
  }

  return { width: sourceWidth, height: sourceHeight, blurhash, variants }
}

/**
 * Compute the base64 thumbhash by sampling an image down to a small RGBA
 * bitmap. Takes an already-prepared sharp pipeline (e.g. a `base.clone()` that
 * has been decoded + EXIF-oriented) so it shares the single decode instead of
 * re-decoding the original. Cheap and deterministic; the `useBlurhash` hook
 * decodes exactly this format from the `blurhash` column.
 */
export async function generateThumbhash(image: Sharp): Promise<string> {
  const { data, info } = await image
    .resize({ width: THUMBHASH_MAX_EDGE, height: THUMBHASH_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const hash = rgbaToThumbHash(info.width, info.height, new Uint8Array(data))
  return Buffer.from(hash).toString('base64')
}

/**
 * Upload a single variant object to an S3-compatible backend (S3 or R2) with
 * the immutable cache header. Reuses the existing storage clients
 * (`getClient` / `getR2Client`).
 */
export async function putVariantObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: VARIANT_CACHE_CONTROL,
    }),
  )
}
