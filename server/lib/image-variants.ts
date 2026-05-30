import 'server-only'

import { createHash } from 'node:crypto'

import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { rgbaToThumbHash } from 'thumbhash'

/**
 * Responsive width ladder for generated image variants.
 *
 * Kept in sync with `next.config` `imageSizes` (320, 480) + `deviceSizes`
 * (640..2560) so every width the custom image loader requests maps onto a
 * width we actually generated. Always ascending — the preprocessing queue
 * generates tiers small-to-large so `ready_max_width` is a monotonic
 * watermark (a tier is ready iff its width <= ready_max_width).
 */
export const VARIANT_TIER_WIDTHS = [320, 480, 640, 800, 1080, 1280, 1920, 2560] as const

export type VariantFormat = 'avif' | 'webp'

/** Formats generated for every tier. Distinct immutable objects per format. */
export const VARIANT_FORMATS: readonly VariantFormat[] = ['avif', 'webp']

/**
 * Decompression-bomb guard for sharp. 100 MP comfortably covers high-end
 * camera output (e.g. 100MP medium format) while rejecting pathological
 * inputs crafted to exhaust memory.
 */
const MAX_INPUT_PIXELS = 100_000_000

/** Edge length used when sampling the image down to compute its thumbhash. */
const THUMBHASH_MAX_EDGE = 100

/** Immutable cache header for content-addressed variant objects. */
export const VARIANT_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function variantContentType(format: VariantFormat): string {
  return format === 'avif' ? 'image/avif' : 'image/webp'
}

/**
 * Variant object key: `{baseKey}_{width}.{format}`.
 *
 * The custom next/image loader builds the same string client-side, so this is
 * the single source of truth for the naming convention.
 */
export function buildVariantKey(baseKey: string, width: number, format: VariantFormat): string {
  return `${baseKey}_${width}.${format}`
}

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
 * Tier widths to generate for a given source width, ascending. Never upscales:
 * only tiers up to the source width are produced. Sources smaller than the
 * smallest tier yield a single variant at their native width.
 */
export function tierWidthsForSource(sourceWidth: number): number[] {
  const tiers = VARIANT_TIER_WIDTHS.filter((width) => width <= sourceWidth)
  return tiers.length > 0 ? tiers : [sourceWidth]
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
  const { avifQuality = 50, webpQuality = 72, avifEffort = 4 } = opts

  const metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'none' }).metadata()

  const storedWidth = metadata.width ?? 0
  const storedHeight = metadata.height ?? 0
  if (storedWidth <= 0 || storedHeight <= 0) {
    throw new Error('Unable to read source image dimensions')
  }

  // sharp's `.metadata()` reports the stored (pre-rotation) dimensions, while
  // the variants below are produced via `.rotate()` (EXIF auto-orientation).
  // For orientation 5-8 (transpose / rotate 90 / rotate 270 / transverse —
  // very common on phone photos) the displayed image has width and height
  // swapped. Report the oriented dimensions so they match both the generated
  // variant pixels and the browser-reported dimensions stored for existing
  // rows (avoiding portrait-as-landscape gallery layout breakage).
  const orientation = metadata.orientation ?? 1
  const swapDimensions = orientation >= 5 && orientation <= 8
  const sourceWidth = swapDimensions ? storedHeight : storedWidth
  const sourceHeight = swapDimensions ? storedWidth : storedHeight

  const blurhash = await generateThumbhash(input)

  const variants: GeneratedVariant[] = []
  for (const width of tierWidthsForSource(sourceWidth)) {
    const resized = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true })

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
 * Compute the base64 thumbhash for an image by sampling it down to a small
 * RGBA bitmap. Cheap and deterministic; the existing `useBlurhash` hook decodes
 * exactly this format from the `blurhash` column.
 */
export async function generateThumbhash(input: Buffer): Promise<string> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'none' })
    .rotate()
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
