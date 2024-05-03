'use client'

import React from 'react'
import { ImageHandleProps, ImageType } from '~/types'
import PhotoAlbum from 'react-photo-album'
import { Button, Image, Spinner } from '@nextui-org/react'
import { useSWRPageTotalHook } from '~/hooks/useSWRPageTotalHook'
import useSWRInfinite from 'swr/infinite'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import MasonryItem from '~/components/MasonryItem'

export default function Masonry(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSWRPageTotalHook(props)
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
    return [`client--${index}-${props.tag}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.tag)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const dataList = data ? [].concat(...data) : [];

  const { setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )

  return (
    <div className="w-full sm:w-4/5 mx-auto p-2">
      <PhotoAlbum
        columns={(containerWidth) => {
          if (containerWidth < 640) return 1;
          if (containerWidth < 768) return 2;
          if (containerWidth < 1024) return 3;
          return 4;
        }}
        layout="masonry"
        photos={
          dataList?.map((item: ImageType) => ({
            src: item.url,
            alt: item.detail,
            ...item
          })) || []
        }
        renderPhoto={({ photo, wrapperStyle, renderDefaultPhoto }) => (
          <div className="my-2">
            <Image
              className="cursor-pointer transition-all will-change-transform hover:scale-[1.01]"
              src={photo.src}
              alt={photo.alt}
              radius="none"
              loading="lazy"
              isBlurred
              shadow="sm"
              onClick={() => {
                setMasonryView(true)
                setMasonryViewData(photo)
              }}
            />
          </div>
        )}
      />
      {isValidating && <Spinner label="Loading..." color="primary" className="mx-auto w-full my-6" />}
      <div className="flex items-center justify-center my-4">
        {
          size < pageTotal ?
            <Button
              color="primary"
              variant="bordered"
              isLoading={isLoading}
              onClick={() => {
                setSize(size + 1)
              }}
            >
              加载更多
            </Button>
            :
            <></>
        }
      </div>
      <MasonryItem />
    </div>
  )
}