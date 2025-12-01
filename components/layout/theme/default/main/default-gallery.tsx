'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React, { useState, useCallback, useEffect } from 'react'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import BlurImage from '~/components/album/blur-image.tsx'
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
            render={{image: (...args) => renderNextImage(...args, dataList)}}
          />
        </div>
        <div className="flex flex-wrap space-x-2 sm:space-x-0 sm:flex-col flex-1 px-2 py-1 sm:py-0 space-y-1 text-gray-500 sm:sticky top-4 self-start">
        </div>
      </div>
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
