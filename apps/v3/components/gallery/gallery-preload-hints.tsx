import { preload, preconnect } from 'react-dom'
import type { ImageType } from '~/types'
import { hasReadyVariants } from '~/lib/image/loader'
import { VARIANT_TIER_WIDTHS, buildVariantKey } from '~/lib/image/variant-tiers'

// Smallest entry of next.config `images.deviceSizes` — the base width
// next/image multiplies by the smallest `vw` ratio in `sizes` to decide which
// srcset candidates to emit. Keep in sync with next.config.
const SMALLEST_DEVICE_SIZE = 640

/**
 * Server-rendered resource hints for the gallery's LCP image.
 *
 * The gallery itself is a client component loaded with `ssr: false`, so its
 * first image (the LCP element) is not present in the initial HTML — the
 * browser's preload scanner can't discover it and the image only starts
 * downloading after hydration + dynamic import (~2.7s of pure "load delay" was
 * measured this way). This server component emits, into the initial `<head>`:
 *
 *  - `preconnect` to the variant CDN origin, so the TLS/TCP handshake overlaps
 *    with JS download.
 *  - a responsive `preload` (`as=image`, `fetchpriority=high`) for the first
 *    image's AVIF variants. The `imagesrcset` is generated from the SAME shared
 *    tier ladder (`VARIANT_TIER_WIDTHS` + `buildVariantKey`) that next/image's
 *    custom loader uses, and `imagesizes` is the SAME string the rendered
 *    `<img>` uses — so the preload scanner and next/image select the identical
 *    candidate (single download, no waste). Tiers are clamped to
 *    `ready_max_width` because, unlike the loader, this manual preload is not
 *    clamped and must not point at an ungenerated (404) variant.
 *
 * AVIF only: `type="image/avif"` lets non-AVIF browsers (<5%) skip the hint
 * entirely (so they incur no waste and just fall back to the normal lazy load).
 *
 * Renders nothing.
 */
export default function GalleryPreloadHints({
  image,
  variantBaseUrl,
  sizes,
}: {
  image: ImageType | undefined
  variantBaseUrl: string
  sizes: string
}) {
  if (!variantBaseUrl) {
    return null
  }

  // Warm the connection to the variant CDN regardless of the first image (helps
  // every below-the-fold image too).
  try {
    preconnect(new URL(variantBaseUrl).origin)
  } catch {
    // variantBaseUrl wasn't an absolute URL — skip preconnect.
  }

  if (!image || !hasReadyVariants(image.image_key, image.ready_max_width, variantBaseUrl)) {
    return null
  }

  const base = variantBaseUrl.replace(/\/+$/, '')

  // Replicate next/image's `getWidths` candidate selection so the preload
  // scanner and next/image evaluate the SAME srcset against the SAME `sizes` and
  // pick the identical entry (single download). For a `sizes` with vw units,
  // next/image keeps the tiers `>= deviceSizes[0] * (smallestVw / 100)`. Then
  // clamp to `ready_max_width` (the manual preload, unlike the loader, isn't
  // clamped and must not point at an ungenerated → 404 variant).
  const vwValues = [...sizes.matchAll(/(\d{1,3})vw/g)].map((m) => Number(m[1]))
  const smallestRatio = vwValues.length > 0 ? Math.min(...vwValues) / 100 : 0
  const threshold = SMALLEST_DEVICE_SIZE * smallestRatio
  const tiers = VARIANT_TIER_WIDTHS.filter(
    (width) => width >= threshold && width <= image.ready_max_width,
  )
  if (tiers.length === 0) {
    return null
  }

  const url = (width: number) => `${base}/${buildVariantKey(image.image_key, width, 'avif')}`
  const imageSrcSet = tiers.map((width) => `${url(width)} ${width}w`).join(', ')

  preload(url(tiers[0]), {
    as: 'image',
    fetchPriority: 'high',
    type: 'image/avif',
    imageSrcSet,
    imageSizes: sizes,
  })

  return null
}
