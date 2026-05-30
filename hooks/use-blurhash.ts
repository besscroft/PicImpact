import { useMemo } from 'react'
import { decodeThumbHash } from '~/lib/utils/blurhash-client'

export const DEFAULT_HASH = 'MggCBoBxh4d/eHeIiIiHd3eIAAAAAAA='

// Module-level cache of decoded thumbhash data URLs keyed by the raw hash.
// Decoding runs a canvas/Uint8Array conversion per call, so caching avoids
// re-decoding the same hash on every remount/reuse (e.g. virtualization
// recycling items in and out of the viewport).
//
// Bounded as an LRU so a long browsing session over many distinct photos can't
// grow it without limit. A Map preserves insertion order, so the first key is
// the least-recently-used; re-inserting on a hit keeps hot entries at the back.
const DECODED_CACHE_LIMIT = 512
const decodedCache = new Map<string, string>()

function getDecodedDataUrl(hash: string): string {
  const key = !hash || hash === '' ? DEFAULT_HASH : hash
  const cached = decodedCache.get(key)
  if (cached !== undefined) {
    // Mark as most-recently-used.
    decodedCache.delete(key)
    decodedCache.set(key, cached)
    return cached
  }
  const decoded = decodeThumbHash(key)
  decodedCache.set(key, decoded)
  if (decodedCache.size > DECODED_CACHE_LIMIT) {
    // Evict the least-recently-used entry (the oldest key).
    const oldest = decodedCache.keys().next().value
    if (oldest !== undefined) {
      decodedCache.delete(oldest)
    }
  }
  return decoded
}

export const useBlurImageDataUrl = (hash: string): string => {
  return useMemo(() => getDecodedDataUrl(hash), [hash])
}
