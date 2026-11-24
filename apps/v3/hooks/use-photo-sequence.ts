'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAlbumNeighborWindow } from '~/server/actions/images'
import type { AlbumNeighborWindow, ImageType } from '~/types'

// Refetch the next window when the current index gets within this many slides of
// a loaded edge, so swiping never stalls at the boundary waiting for data.
const EDGE_THRESHOLD = 3

export interface PhotoSequence {
  photos: ImageType[]
  index: number
  current: ImageType | undefined
  /** A previous photo exists (loaded or beyond the loaded window). */
  hasPrev: boolean
  /** A next photo exists (loaded or beyond the loaded window). */
  hasNext: boolean
  /** Sync the index from the carousel's settled slide. */
  setIndex: (i: number) => void
}

/**
 * Drives the detail-view photo carousel: holds a windowed slice of the album's
 * ordered photos (seeded from the server-resolved `initialWindow`), tracks the
 * current index, and transparently extends the window by calling
 * `getAlbumNeighborWindow` when the index approaches a loaded edge — so large
 * albums page in without ever loading the whole list. Falls back to a
 * single-photo sequence when there is no window (e.g. a deep-link to a hidden
 * image, where currentIndex is -1).
 */
export function usePhotoSequence({
  album,
  initialWindow,
  fallback,
}: {
  album: string | undefined
  initialWindow: AlbumNeighborWindow | null | undefined
  fallback: ImageType
}): PhotoSequence {
  const seeded = (initialWindow?.images?.length ?? 0) > 0 && (initialWindow?.currentIndex ?? -1) >= 0
  const [photos, setPhotos] = useState<ImageType[]>(seeded ? initialWindow!.images : [fallback])
  const [index, setIndexState] = useState(seeded ? initialWindow!.currentIndex : 0)
  const [moreBefore, setMoreBefore] = useState(seeded ? initialWindow!.hasPrev : false)
  const [moreAfter, setMoreAfter] = useState(seeded ? initialWindow!.hasNext : false)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => () => { mountedRef.current = false }, [])

  const extend = useCallback(async (i: number) => {
    if (loadingRef.current || !album || photos.length === 0) return
    const nearStart = i <= EDGE_THRESHOLD && moreBefore
    const nearEnd = i >= photos.length - 1 - EDGE_THRESHOLD && moreAfter
    if (!nearStart && !nearEnd) return

    loadingRef.current = true
    try {
      const anchorId = nearStart ? photos[0].id : photos[photos.length - 1].id
      const w = await getAlbumNeighborWindow(anchorId, album)
      // The preview may have been closed while the request was in flight.
      if (!mountedRef.current) return
      const have = new Set(photos.map((p) => p.id))
      const fresh = w?.images?.filter((p) => !have.has(p.id)) ?? []
      if (nearStart) {
        if (fresh.length > 0) {
          setPhotos((prev) => [...fresh, ...prev])
          setIndexState((idx) => idx + fresh.length)
        }
        // No *new* photos this direction (empty window or a fully-overlapping
        // one) → treat the edge as exhausted, otherwise the extend effect keeps
        // re-firing the same overlapping fetch in a tight loop.
        setMoreBefore(fresh.length > 0 ? Boolean(w?.hasPrev) : false)
      } else {
        if (fresh.length > 0) setPhotos((prev) => [...prev, ...fresh])
        setMoreAfter(fresh.length > 0 ? Boolean(w?.hasNext) : false)
      }
    } catch {
      // Best-effort: keep the current window; the user can still browse it.
    } finally {
      loadingRef.current = false
    }
  }, [album, photos, moreBefore, moreAfter])

  useEffect(() => {
    void extend(index)
  }, [index, extend])

  const setIndex = useCallback((i: number) => {
    setIndexState((prev) => (i === prev || i < 0 ? prev : i))
  }, [])

  return {
    photos,
    index,
    current: photos[index] ?? fallback,
    hasPrev: index > 0 || moreBefore,
    hasNext: index < photos.length - 1 || moreAfter,
    setIndex,
  }
}
