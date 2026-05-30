/**
 * Client-safe variant tier constants and key helpers.
 *
 * This module is the single source of truth for the responsive-variant tier
 * ladder and object-key naming convention. It is deliberately free of any
 * server-only dependencies (no `sharp`, no AWS SDK, no `server-only`) so it can
 * be imported from both the server-side preprocessing pipeline
 * (`server/lib/image-variants.ts`, which re-exports these) and the client-side
 * gallery image loader (`lib/image/loader.ts`) — eliminating the previously
 * mirrored constants.
 */

/**
 * Responsive width ladder for generated image variants.
 *
 * Kept in sync with `next.config` `imageSizes` (320, 480) + `deviceSizes`
 * (640..2560) so every width the custom image loader requests maps onto a
 * width the pipeline actually generates. Always ascending — the preprocessing
 * queue generates tiers small-to-large so `ready_max_width` is a monotonic
 * watermark (a tier is ready iff its width <= ready_max_width).
 */
export const VARIANT_TIER_WIDTHS = [320, 480, 640, 800, 1080, 1280, 1920, 2560] as const

export type VariantFormat = 'avif' | 'webp'

/** Formats generated for every tier. Distinct immutable objects per format. */
export const VARIANT_FORMATS: readonly VariantFormat[] = ['avif', 'webp']

export function variantContentType(format: VariantFormat): string {
  return format === 'avif' ? 'image/avif' : 'image/webp'
}

/**
 * Variant object key: `{baseKey}_{width}.{format}`.
 *
 * Both the server pipeline and the client loader build this exact string, so it
 * is the single source of truth for the naming convention.
 */
export function buildVariantKey(baseKey: string, width: number, format: VariantFormat): string {
  return `${baseKey}_${width}.${format}`
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
