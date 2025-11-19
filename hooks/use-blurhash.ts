import { useMemo } from 'react'
import { decodeThumbHash } from '~/lib/utils/blurhash-client'

export const DEFAULT_HASH = 'MggCBoBxh4d/eHeIiIiHd3eIAAAAAAA='

export const useBlurImageDataUrl = (hash: string): string => {
  return useMemo(() => {
    if (!hash || hash === '') {
      return decodeThumbHash(DEFAULT_HASH)
    }
    return decodeThumbHash(hash)
  }, [hash])
}