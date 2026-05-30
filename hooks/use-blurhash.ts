import { useMemo } from 'react'
import { decodeThumbHash } from '~/lib/utils/blurhash-client'

export const DEFAULT_HASH = 'MggCBoBxh4d/eHeIiIiHd3eIAAAAAAA='

// Module-level cache of decoded thumbhash data URLs keyed by the raw hash.
// Decoding runs a canvas/Uint8Array conversion per call, so caching avoids
// re-decoding the same hash on every remount/reuse (e.g. virtualization
// recycling items in and out of the viewport).
const decodedCache = new Map<string, string>()

function getDecodedDataUrl(hash: string): string {
  const key = !hash || hash === '' ? DEFAULT_HASH : hash
  const cached = decodedCache.get(key)
  if (cached !== undefined) {
    return cached
  }
  const decoded = decodeThumbHash(key)
  decodedCache.set(key, decoded)
  return decoded
}

export const useBlurImageDataUrl = (hash: string): string => {
  return useMemo(() => getDecodedDataUrl(hash), [hash])
}
