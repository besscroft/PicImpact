'use client'

import { useEffect, useState } from 'react'

// 1x1 AVIF test image (canonical feature-detection payload). If a browser can
// decode this it supports AVIF.
const AVIF_TEST_IMAGE =
  'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI='

// Module-level cache so the detection runs at most once per page load and every
// gallery item shares the result.
let cachedSupport: boolean | null = null
let pendingDetection: Promise<boolean> | null = null

function detectAvifSupport(): Promise<boolean> {
  if (cachedSupport !== null) {
    return Promise.resolve(cachedSupport)
  }
  if (pendingDetection) {
    return pendingDetection
  }
  pendingDetection = new Promise<boolean>((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      cachedSupport = img.width > 0 && img.height > 0
      resolve(cachedSupport)
    }
    img.onerror = () => {
      cachedSupport = false
      resolve(false)
    }
    img.src = AVIF_TEST_IMAGE
  })
  return pendingDetection
}

/**
 * One-time AVIF capability detection shared across the gallery. Optimistically
 * assumes AVIF (>95% support) until detection settles, then corrects to WebP
 * for the rare client that can't decode it. The custom image loader reads this
 * to pick the variant extension — no per-image `<picture>`/onError fallback and
 * no `Vary: Accept` cache fragmentation on the CDN.
 */
export function useAvifSupport(): boolean {
  const [supported, setSupported] = useState<boolean>(cachedSupport ?? true)

  useEffect(() => {
    let active = true
    detectAvifSupport().then((ok) => {
      if (active) {
        setSupported(ok)
      }
    })
    return () => {
      active = false
    }
  }, [])

  return supported
}
