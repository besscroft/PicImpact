import { unstable_cache, revalidateTag } from 'next/cache'

import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import { fetchDailyImagesList, fetchDailyImagesPageTotal } from '~/server/db/query/daily'
import { fetchAlbumsShow, fetchAlbumByRouter } from '~/server/db/query/albums'
import { fetchConfigsByKeys, fetchConfigValue } from '~/server/db/query/configs'
import { getVariantBaseUrl } from '~/server/lib/variant-storage'

/**
 * Request-independent caching for the public gallery's read path.
 *
 * The public album/home pages render dynamically and each request re-runs the
 * same DB reads (album nav, title/display config, image lists, daily view),
 * which dominates TTFB. These wrappers memoize ONLY globally-public, read-only
 * data via `unstable_cache`, keyed by their arguments, and bust on demand via
 * `revalidateTag` from the mutation paths. Nothing per-user / authenticated /
 * admin is routed through here, and the page rendering / auth model is left
 * untouched (no change to `force-dynamic`).
 */
export const CACHE_TAG = {
  /** Image listings: client album lists, page totals, daily lists. */
  gallery: 'public-gallery',
  /** Album nav (`fetchAlbumsShow`) and album-by-router lookups. */
  albums: 'public-albums',
  /** Public config reads (title / display flags) and the variant base url. */
  config: 'public-config',
} as const

/**
 * On-demand `revalidateTag` is the primary freshness mechanism. This TTL is a
 * safety net so a missed invalidation self-heals. Albums and public config only
 * change via admin writes (which call `revalidateTag` synchronously in request
 * scope), so a long safety-net TTL is fine for them.
 */
const REVALIDATE_SECONDS = 3600

/**
 * Image listings (the `gallery` tag) have an extra freshness source the others
 * don't: the preprocess ticker flips `variants_ready` in the BACKGROUND, so it
 * runs outside request scope and cannot call `revalidateTag` (Next throws
 * "Invariant: static generation store missing" with no work store). That update
 * is therefore only picked up when the cache entry expires, so the gallery TTL
 * doubles as the upper bound on how long a freshly-processed image can keep
 * showing its placeholder. Keep it short to bound that lag (≤60s) while still
 * absorbing the bulk of repeat reads — page-1 first paint stays a cache hit for
 * most requests within each window. Admin writes still bust this tag instantly
 * via `revalidateGalleryCache`; this only governs the background-ticker gap.
 */
const GALLERY_REVALIDATE_SECONDS = 60

export const cachedClientImagesListByAlbum = unstable_cache(
  (pageNum: number, album: string, camera?: string, lens?: string) =>
    fetchClientImagesListByAlbum(pageNum, album, camera, lens),
  ['public-client-images-list'],
  { tags: [CACHE_TAG.gallery], revalidate: GALLERY_REVALIDATE_SECONDS },
)

export const cachedClientImagesPageTotalByAlbum = unstable_cache(
  (album: string, camera?: string, lens?: string) =>
    fetchClientImagesPageTotalByAlbum(album, camera, lens),
  ['public-client-images-total'],
  { tags: [CACHE_TAG.gallery], revalidate: GALLERY_REVALIDATE_SECONDS },
)

export const cachedDailyImagesList = unstable_cache(
  (pageNum: number, camera?: string, lens?: string) =>
    fetchDailyImagesList(pageNum, camera, lens),
  ['public-daily-images-list'],
  { tags: [CACHE_TAG.gallery], revalidate: GALLERY_REVALIDATE_SECONDS },
)

export const cachedDailyImagesPageTotal = unstable_cache(
  (camera?: string, lens?: string) =>
    fetchDailyImagesPageTotal(camera, lens),
  ['public-daily-images-total'],
  { tags: [CACHE_TAG.gallery], revalidate: GALLERY_REVALIDATE_SECONDS },
)

export const cachedAlbumsShow = unstable_cache(
  () => fetchAlbumsShow(),
  ['public-albums-show'],
  { tags: [CACHE_TAG.albums], revalidate: REVALIDATE_SECONDS },
)

export const cachedAlbumByRouter = unstable_cache(
  (router: string) => fetchAlbumByRouter(router),
  ['public-album-by-router'],
  { tags: [CACHE_TAG.albums], revalidate: REVALIDATE_SECONDS },
)

// PUBLIC config keys ONLY. The result is cached under the public `config` tag
// and served to unauthenticated visitors — never pass secret keys (storage
// credentials, tokens, etc.) through this wrapper. Read those with the
// uncached `fetchConfigsByKeys` instead.
export const cachedConfigsByKeys = unstable_cache(
  (keys: string[]) => fetchConfigsByKeys(keys),
  ['public-configs-by-keys'],
  { tags: [CACHE_TAG.config], revalidate: REVALIDATE_SECONDS },
)

export const cachedConfigValue = unstable_cache(
  (key: string, defaultValue: string = '') => fetchConfigValue(key, defaultValue),
  ['public-config-value'],
  { tags: [CACHE_TAG.config], revalidate: REVALIDATE_SECONDS },
)

export const cachedVariantBaseUrl = unstable_cache(
  () => getVariantBaseUrl(),
  ['public-variant-base-url'],
  { tags: [CACHE_TAG.config], revalidate: REVALIDATE_SECONDS },
)

/**
 * Invalidate cached image listings. Call from any write that changes what the
 * gallery shows: image create / update / delete / show-hide / sort.
 *
 * MUST be called from a request scope (Server Action or Route Handler) — never
 * during render. The daily materialized-view refresh deliberately does NOT call
 * this, because it can run during page render via `initDailyIfNeeded`; daily
 * freshness is covered by the TTL instead.
 */
export function revalidateGalleryCache() {
  revalidateTag(CACHE_TAG.gallery, 'max')
}

/**
 * Invalidate album nav + album lookups (album create / update / delete). Also
 * busts gallery listings, since album changes affect which images are shown.
 */
export function revalidateAlbumsCache() {
  revalidateTag(CACHE_TAG.albums, 'max')
  revalidateTag(CACHE_TAG.gallery, 'max')
}

/**
 * Invalidate public config + variant base url (admin settings save). Also busts
 * gallery listings, since some settings change them (page size, daily toggle).
 */
export function revalidateConfigCache() {
  revalidateTag(CACHE_TAG.config, 'max')
  revalidateTag(CACHE_TAG.gallery, 'max')
}

/**
 * Bust every public cache at once. For bulk writes that touch many entities and
 * bypass the per-entity mutation paths above (e.g. backup restore).
 */
export function revalidateAllPublicCaches() {
  revalidateTag(CACHE_TAG.gallery, 'max')
  revalidateTag(CACHE_TAG.albums, 'max')
  revalidateTag(CACHE_TAG.config, 'max')
}
