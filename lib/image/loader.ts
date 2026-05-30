/**
 * Client-side responsive variant URL builder for the gallery's custom
 * next/image loader.
 *
 * IMPORTANT: this MUST stay in sync with `server/lib/image-variants.ts`
 * (`VARIANT_TIER_WIDTHS` + `buildVariantKey`). That module is `server-only`
 * (it imports sharp), so the naming convention is mirrored here as the single
 * client-side source of truth. Any change to the tier ladder or the
 * `{baseKey}_{width}.{format}` key shape must be made in both files.
 */

export const VARIANT_TIER_WIDTHS = [320, 480, 640, 800, 1080, 1280, 1920, 2560] as const

export type VariantFormat = 'avif' | 'webp'

/**
 * Round a requested render width up to the nearest generated tier, clamped to
 * the largest tier. Every width next/image asks the loader for therefore maps
 * onto a width we actually generated.
 */
export function ceilToTier(width: number): number {
  for (const tier of VARIANT_TIER_WIDTHS) {
    if (width <= tier) {
      return tier
    }
  }
  return VARIANT_TIER_WIDTHS[VARIANT_TIER_WIDTHS.length - 1]
}

/** Variant object key `{baseKey}_{width}.{format}` — mirrors `buildVariantKey`. */
export function buildVariantKey(baseKey: string, width: number, format: VariantFormat): string {
  return `${baseKey}_${width}.${format}`
}

function joinUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key}`
}

/**
 * Whether a photo has variants that can be served right now. Defensive against
 * the loose `image_key: string` type — existing rows and just-uploaded rows
 * that the preprocessing queue has not reached yet carry `image_key === ''`
 * (or null) and `ready_max_width === 0`, which must degrade to a placeholder
 * rather than request a non-existent object.
 */
export function hasReadyVariants(
  imageKey: string | null | undefined,
  readyMaxWidth: number,
  base: string | null | undefined,
): boolean {
  return Boolean(base) && Boolean(imageKey) && readyMaxWidth > 0
}

interface VariantLoaderOptions {
  /** Public root for variant objects (no trailing slash needed), from server config. */
  base: string
  /** Content-addressed base key from the DB (`image_key`), e.g. `variants/<digest>`. */
  imageKey: string
  /**
   * Monotonic readiness watermark: a tier is available iff its width is
   * `<= readyMaxWidth`. Always equals a generated tier value, so clamping a
   * tier to it always yields a generated tier.
   */
  readyMaxWidth: number
  format: VariantFormat
}

/**
 * Build a next/image-compatible loader bound to one photo's variant state. The
 * requested width is rounded up to a tier and then clamped to the readiness
 * watermark, so during backfill we may temporarily serve a slightly softer tier
 * but never request an ungenerated object (no 404 / origin miss). The returned
 * URL points straight at the CDN-hosted variant, bypassing `/_next/image`.
 */
export function makeVariantLoader(opts: VariantLoaderOptions) {
  return ({ width }: { src: string, width: number, quality?: number }): string => {
    const tier = Math.min(ceilToTier(width), opts.readyMaxWidth)
    return joinUrl(opts.base, buildVariantKey(opts.imageKey, tier, opts.format))
  }
}
