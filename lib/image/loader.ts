/**
 * Client-side responsive variant URL builder for the gallery's custom
 * next/image loader.
 *
 * The tier ladder and `{baseKey}_{width}.{format}` key shape come from the
 * shared, client-safe `~/lib/image/variant-tiers` module (the single source of
 * truth, also re-exported by the server-only `server/lib/image-variants.ts`),
 * so there are no longer duplicated constants to keep in sync.
 */

import { VARIANT_TIER_WIDTHS, buildVariantKey, type VariantFormat } from '~/lib/image/variant-tiers'

export type { VariantFormat }

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
