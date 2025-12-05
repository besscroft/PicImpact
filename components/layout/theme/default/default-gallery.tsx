'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { useState, useCallback, useEffect, useRef, useMemo, useTransition } from 'react'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import BlurImage from '~/components/album/blur-image.tsx'
import InfiniteScroll from '~/components/ui/origin/infinite-scroll.tsx'
import FloatingFilterBall from '~/components/album/floating-filter-ball.tsx'

function renderNextImage(
  _: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
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
  const dataList = useMemo(() => data ? [].concat(...data) : [], [data])
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
        className="w-full p-2 space-y-4"
        hasMore={size < pageTotal}
        isLoading={isValidating}
        next={() => setSize(size + 1)}
      >
        <div className="flex flex-col sm:flex-row w-full p-2 items-start justify-between sm:relative overflow-x-clip">
          <div className="flex flex-1 flex-col px-2 sm:sticky top-4 self-start">
          </div>
          <div className="w-full sm:w-[66.667%] mx-auto">
            <MasonryPhotoAlbum
              columns={(containerWidth) => {
                if (containerWidth < 768) return 2
                if (containerWidth < 1024) return 3
                return 4
              }}
              photos={
                dataList?.map((item: ImageType) => ({
                  src: item.preview_url || item.url,
                  alt: item.detail,
                  ...item
                })) || []
              }
              render={{ image: (...args) => renderNextImage(...args, dataList) }}
            />
          </div>
          <div className="flex flex-wrap space-x-2 sm:space-x-0 sm:flex-col flex-1 px-2 py-1 sm:py-0 space-y-1 text-gray-500 sm:sticky top-4 self-start">
          </div>
        </div>
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
