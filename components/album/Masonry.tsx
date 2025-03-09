'use client'

import React, { useEffect } from 'react'
import { HandleProps, ImageHandleProps, ImageType } from '~/types'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import { useSWRPageTotalHook } from '~/hooks/useSWRPageTotalHook'
import useSWRInfinite from 'swr/infinite'
import MasonryItem from '~/components/album/MasonryItem'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import BlurImage from '~/components/album/BlurImage'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { FloatButton } from 'antd'
import { useTranslations } from 'next-intl'

import 'react-photo-album/masonry.css'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import {useConfigStore} from "~/app/providers/config-store-Providers.tsx";

function renderNextImage(
  { alt = '', title, sizes }: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
  );
}

export default function Masonry(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSWRPageTotalHook(props)
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
    return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSWRHydrated(configProps)
  const dataList = data ? [].concat(...data) : [];
  const searchParams = useSearchParams()
  const t = useTranslations()

  const { setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )
  const { setCustomIndexDownloadEnable } = useConfigStore(
    (state) => state,
  )

  useEffect(() => {
    if (configData && !isLoading) {
      const value = configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value
      setCustomIndexDownloadEnable(value.toString() === 'true')
    }
  }, [configData])

  useEffect(() => {
    const fetchData = async (id: string) => {
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
        toast.error('图片获取错误，请重试！')
      }
    };
    const id = searchParams.get('id')
    if (id) {
      fetchData(id);
    }
  }, []);

  return (
    <div className="w-full sm:w-4/5 mx-auto p-2">
      <MasonryPhotoAlbum
        columns={(containerWidth) => {
          if (containerWidth < 768) return 2;
          if (containerWidth < 1024) return 3;
          return 4;
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
      <div className="flex items-center justify-center my-4">
        {
          isValidating ?
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>
            : dataList.length > 0 ?
          size < pageTotal &&
            <Button
              disabled={isLoading}
              onClick={() => {
                setSize(size + 1)
              }}
              aria-label="加载更多"
            >
              加载更多
            </Button>
            : t('Tips.noImg')
        }
      </div>
      <FloatButton.BackTop />
      <MasonryItem />
    </div>
  )
}