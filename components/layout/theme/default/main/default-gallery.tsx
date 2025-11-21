'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import BlurImage from '~/components/album/blur-image.tsx'
import InfiniteScroll from '~/components/ui/origin/infinite-scroll.tsx'

function renderNextImage(
  _: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
  )
}

export default function DefaultGallery(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, isValidating, size, setSize } = useSWRInfinite((index) => {
    return [`client-${props.args}-${index}-${props.album}`, index]
  },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  })
  const dataList = data ? [].concat(...data) : []
  const t = useTranslations()

  return (
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
  )
}
