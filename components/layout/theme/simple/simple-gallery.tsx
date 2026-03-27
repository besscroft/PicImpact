'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { Config, ImageType } from '~/types'
import GalleryImage from '~/components/gallery/simple/gallery-image.tsx'
import InfiniteScroll from '~/components/ui/origin/infinite-scroll.tsx'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import useSWR from 'swr'
import FloatingFilterBall from '~/components/album/floating-filter-ball.tsx'

export default function SimpleGallery(props: Readonly<ImageHandleProps>) {
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedLens, setSelectedLens] = useState('')
  // Debounced filter values for API requests
  const [debouncedCamera, setDebouncedCamera] = useState('')
  const [debouncedLens, setDebouncedLens] = useState('')
  const [, startTransition] = useTransition()
  const { data: pageTotal } = useSWR(
    [`pageTotal-${props.args}-${props.album}`, debouncedCamera, debouncedLens],
    () => props.totalHandle(props.album, debouncedCamera || undefined, debouncedLens || undefined),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    }
  )
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
  const { data: configData } = useSwrHydrated<Config[]>({
    handle: props.configHandle ?? (async () => [] as Config[]),
    args: 'system-config',
  })
  // Memoize dataList to avoid unnecessary recalculations
  const dataList = useMemo(() => data?.flat() ?? [], [data])
  const customIndexOriginEnable = useMemo(
    () => configData?.find((item: Config) => item.config_key === 'custom_index_origin_enable')?.config_value === 'true',
    [configData]
  )
  const t = useTranslations()

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

  // Reset pagination when debounced filters change - SWR key change will auto-refetch
  const prevFiltersRef = useRef({ camera: '', lens: '' })
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
        className="w-full max-w-3xl mx-auto px-4 space-y-8 sm:space-y-12"
        hasMore={size < (pageTotal ?? 0)}
        isLoading={isValidating}
        next={() => setSize(size + 1)}
      >
        {dataList?.map((item: ImageType) => (
          <GalleryImage
            key={`${item.id}-${item.url}-${item.preview_url}-${customIndexOriginEnable ? 'origin' : 'preview'}`}
            photo={item}
            customIndexOriginEnable={customIndexOriginEnable}
          />
        ))}
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
