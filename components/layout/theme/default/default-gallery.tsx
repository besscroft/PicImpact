'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { useState, useCallback, useEffect, useRef, useMemo, useTransition } from 'react'
import MasonryPhotoItem from '~/components/gallery/masonry-photo-item'
import InfiniteScroll from '~/components/ui/origin/infinite-scroll.tsx'
import FloatingFilterBall from '~/components/album/floating-filter-ball.tsx'
import { Skeleton } from '~/components/ui/skeleton'

const MASONRY_SKELETON_RATIOS = [
  '4 / 5',
  '1 / 1',
  '3 / 4',
  '5 / 4',
  '2 / 3',
  '4 / 3',
  '3 / 5',
  '1 / 1',
  '5 / 6',
  '6 / 5',
  '3 / 4',
  '4 / 5',
]

function MasonrySkeletonGrid() {
  return (
    <div
      aria-hidden="true"
      className="columns-2 gap-1 px-1 sm:columns-3 sm:px-2 lg:columns-4 xl:columns-5"
    >
      {MASONRY_SKELETON_RATIOS.map((aspectRatio, index) => (
        <div key={`${aspectRatio}-${index}`} className="mb-1 break-inside-avoid">
          <Skeleton
            className="w-full rounded-sm bg-accent/80"
            style={{ aspectRatio }}
          />
        </div>
      ))}
    </div>
  )
}

export default function DefaultGallery(props : Readonly<ImageHandleProps>) {
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedLens, setSelectedLens] = useState('')
  // Debounced filter values for API requests
  const [debouncedCamera, setDebouncedCamera] = useState('')
  const [debouncedLens, setDebouncedLens] = useState('')
  const [, startTransition] = useTransition()
  // Use SWR Infinite for paginated data with filter support - use debounced values
  const { data, isValidating, size, setSize } = useSWRInfinite(
    (index) => {
      return [`client-${props.args}-${index}-${props.album}-${debouncedCamera}-${debouncedLens}`, index]
    },
    ([, index]) => {
      return props.handle(index + 1, props.album, debouncedCamera || undefined, debouncedLens || undefined)
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    }
  )

  // Use SWR for page total with filter support - use debounced values
  const { data: pageTotal } = useSWR(
    [`pageTotal-${props.args}-${props.album}`, debouncedCamera, debouncedLens],
    () => props.totalHandle(props.album, debouncedCamera || undefined, debouncedLens || undefined),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      keepPreviousData: true, // Keep previous data while loading new data
    }
  )

  // Memoize dataList to avoid unnecessary recalculations
  const dataList = useMemo(() => data?.flat() ?? [], [data])
  const showInitialSkeleton = dataList.length === 0 && isValidating
  const isPaginating = isValidating && dataList.length > 0
  const t = useTranslations()

  // Reset pagination when debounced filters change - SWR key change will auto-refetch
  const prevFiltersRef = useRef({ camera: '', lens: '' })

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedCamera(selectedCamera)
        setDebouncedLens(selectedLens)
      })
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedCamera, selectedLens])

  useEffect(() => {
    const prev = prevFiltersRef.current
    if (prev.camera !== debouncedCamera || prev.lens !== debouncedLens) {
      prevFiltersRef.current = { camera: debouncedCamera, lens: debouncedLens }
      // Only reset size, SWR will auto-refetch due to key change
      if (size > 1) {
        setSize(1)
      }
    }
  }, [debouncedCamera, debouncedLens, size, setSize])

  const handleCameraChange = useCallback((camera: string) => {
    setSelectedCamera(camera)
  }, [])

  const handleLensChange = useCallback((lens: string) => {
    setSelectedLens(lens)
  }, [])

  const handleReset = useCallback(() => {
    setSelectedCamera('')
    setSelectedLens('')
  }, [])

  return (
    <>
      <InfiniteScroll
        className="w-full space-y-2"
        hasMore={size < (pageTotal ?? 0)}
        isLoading={isPaginating}
        next={() => setSize(size + 1)}
      >
        {showInitialSkeleton ? (
          <MasonrySkeletonGrid />
        ) : (
          <div className="columns-2 gap-1 px-1 sm:columns-3 sm:px-2 lg:columns-4 xl:columns-5">
            {dataList?.map((item: ImageType) => (
              <div key={`${item.id}-${item.preview_url || item.url}`} className="mb-1 break-inside-avoid">
                <MasonryPhotoItem photo={item} />
              </div>
            ))}
          </div>
        )}
        {dataList.length === 0 && !isValidating && (
          <div className="flex items-center justify-center my-4">
            {t('Tips.noImg')}
          </div>
        )}
      </InfiniteScroll>
      {/* Floating Filter Ball */}
      <FloatingFilterBall
        album={props.album}
        selectedCamera={selectedCamera}
        selectedLens={selectedLens}
        onCameraChange={handleCameraChange}
        onLensChange={handleLensChange}
        onReset={handleReset}
      />
    </>
  )
}
