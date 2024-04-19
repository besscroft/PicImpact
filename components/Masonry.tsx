'use client'

import React, { useEffect, useState } from 'react'
import { ImageHandleProps, ImageType } from '~/types'
import PhotoAlbum from 'react-photo-album'
import { Button } from '@nextui-org/react'
import { useSWRInfiniteHook } from '~/hooks/useSWRInfiniteHook'
import { useSWRPageTotalHook } from '~/hooks/useSWRPageTotalHook'

export default function Masonry(props : Readonly<ImageHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const { data: pageTotal } = useSWRPageTotalHook(props)
  const { data, isLoading, mutate } = useSWRInfiniteHook(props, pageNum)

  const [dataList, setDataList] = useState<ImageType[]>([])

  useEffect(() => {
    if (data) {
      setDataList((prevData: ImageType[]) => [...prevData, ...data])
    }
  }, [data])
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
          width: item.width,
          height: item.height,
        })) || []
      } />
      <div className="flex items-center justify-center my-4">
        {
          pageNum < pageTotal ?
            <Button
              color="primary"
              variant="bordered"
              isLoading={isLoading}
              onClick={() => {
                setPageNum(pageNum + 1)
                mutate()
              }}
            >
              加载更多
            </Button>
            :
            <></>
        }
      </div>
    </div>
  )
}