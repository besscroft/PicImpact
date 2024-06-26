'use client'

import React, { useEffect } from 'react'
import { ImageHandleProps, ImageType } from '~/types'
import PhotoAlbum from 'react-photo-album'
import { Button, Spinner } from '@nextui-org/react'
import { useSWRPageTotalHook } from '~/hooks/useSWRPageTotalHook'
import useSWRInfinite from 'swr/infinite'
import MasonryItem from '~/components/MasonryItem'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import BlurImage from '~/components/BlurImage'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function Masonry(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSWRPageTotalHook(props)
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
    return [`client-${props.args}-${index}-${props.tag}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.tag)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const dataList = data ? [].concat(...data) : [];
  const searchParams = useSearchParams()

  const { setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )

  useEffect(() => {
    const fetchData = async (id: number) => {
      try {
        const res = await fetch(`/api/open/get-image-by-id?id=${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }).then(response => response.json())
        if (res.code == 200 && Array.isArray(res.data) && res.data?.length > 0) {
          setMasonryView(true)
          setMasonryViewData(res.data[0])
        } else {
          toast.warning(res.message)
        }
      } catch (error) {
        console.log(error)
        toast.error('图片获取错误，请重试！')
      }
    };
    const id = searchParams.get('id')
    if (Number(id) > 0) {
      fetchData(Number(id));
    }
  }, []);

  return (
    <div className="w-full sm:w-4/5 mx-auto p-2">
      <PhotoAlbum
        columns={(containerWidth) => {
          if (containerWidth < 768) return 2;
          if (containerWidth < 1024) return 3;
          return 4;
        }}
        layout="masonry"
        photos={
          dataList?.map((item: ImageType) => ({
            src: item.preview_url || item.url,
            alt: item.detail,
            ...item
          })) || []
        }
        renderPhoto={({ photo, wrapperStyle, renderDefaultPhoto }) => (
          <BlurImage key={photo.id} photo={photo} />
        )}
      />
      <div className="flex items-center justify-center my-4">
        {
          isValidating ?
            <Spinner label="Loading..." color="primary" />
            :
          size < pageTotal &&
            <Button
              color="primary"
              variant="bordered"
              isLoading={isLoading}
              onClick={() => {
                setSize(size + 1)
              }}
              aria-label="加载更多"
            >
              加载更多
            </Button>
        }
      </div>
      <MasonryItem />
    </div>
  )
}