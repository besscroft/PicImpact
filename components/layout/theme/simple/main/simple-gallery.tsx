'use client'

import type { HandleProps, ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import GalleryImage from '~/components/gallery/simple/gallery-image.tsx'
import InfiniteScroll from '~/components/ui/origin/infinite-scroll.tsx'

export default function SimpleGallery(props: Readonly<ImageHandleProps>) {
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
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)
  const dataList = data ? [].concat(...data) : []
  const t = useTranslations()

  return (
    <InfiniteScroll
      className="w-full p-2 space-y-4"
      hasMore={size < pageTotal}
      isLoading={isValidating}
      next={() => setSize(size + 1)}
    >
      {dataList?.map((item: ImageType) => (
        <GalleryImage key={item.id} photo={item} configData={configData} />
      ))}
      {dataList.length === 0 && !isValidating && (
        <div className="flex items-center justify-center my-4">
          {t('Tips.noImg')}
        </div>
      )}
    </InfiniteScroll>
  )
}
