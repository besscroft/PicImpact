'use client'

import type { HandleProps, ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import useSWR from 'swr'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React, { useState, useCallback, useEffect } from 'react'
import GalleryImage from '~/components/gallery/simple/gallery-image.tsx'
import FloatingFilterBall from '~/components/album/floating-filter-ball.tsx'

export default function SimpleGallery(props : Readonly<ImageHandleProps>) {
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedLens, setSelectedLens] = useState('')
  const t = useTranslations()

  // Use SWR for page total with filter support
  const { data: pageTotal, mutate: mutateTotal } = useSWR(
    [`pageTotal-${props.args}-${props.album}`, selectedCamera, selectedLens],
    () => props.totalHandle(props.album, selectedCamera || undefined, selectedLens || undefined),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )

  // Use SWR Infinite for paginated data with filter support
  const { data, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    (index) => {
      return [`client-${props.args}-${index}-${props.album}-${selectedCamera}-${selectedLens}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album, selectedCamera || undefined, selectedLens || undefined)
    }, 
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)
  const dataList = data ? [].concat(...data) : []

  // Reset pagination and refetch when filters change
  useEffect(() => {
    setSize(1)
    mutate()
    mutateTotal()
  }, [selectedCamera, selectedLens, setSize, mutate, mutateTotal])

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
    <div className="w-full p-2 space-y-4">
      {dataList?.map((item: ImageType) => (
        <GalleryImage key={item.id} photo={item} configData={configData} />
      ))}
      <div className="flex items-center justify-center my-4">
        {
          isValidating ?
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>
            : dataList.length > 0 ?
              size < (pageTotal || 0) &&
              <Button
                disabled={isLoading}
                onClick={() => {
                  setSize(size + 1)
                }}
                className="select-none cursor-pointer"
                aria-label={t('Button.loadMore')}
              >
                {t('Button.loadMore')}
              </Button>
              : t('Tips.noImg')
        }
      </div>
      
      {/* Floating Filter Ball */}
      <FloatingFilterBall
        album={props.album}
        selectedCamera={selectedCamera}
        selectedLens={selectedLens}
        onCameraChange={handleCameraChange}
        onLensChange={handleLensChange}
        onReset={handleReset}
      />
    </div>
  )
}
