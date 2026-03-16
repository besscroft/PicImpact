'use client'

import type { ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import BlurImage from '~/components/album/blur-image'
import { UndoIcon } from '~/components/icons/undo'
import { useRouter } from 'next-nprogress-bar'
import { Tag } from 'lucide-react'

function renderNextImage(
  _: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
  )
}

export default function TagGallery(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      // Tag gallery doesn't use camera/lens filters
      return props.handle(index + 1, props.album, undefined, undefined)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const dataList = data ? [].concat(...data) : []
  const t = useTranslations()
  const router = useRouter()

  return (
    <div className="w-full p-2 space-y-4">
      <div className="px-1 sm:px-2 pt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-foreground">
          <Tag className="h-3.5 w-3.5" />
          {props.album}
        </span>
        <span
          className="inline-flex items-center gap-1 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.back()}
        >
          <UndoIcon className="dark:text-gray-50" size={16} />
          {t('Button.goBack')}
        </span>
      </div>
      <div className="w-full">
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
                className="select-none cursor-pointer"
                aria-label={t('Button.loadMore')}
              >
                {t('Button.loadMore')}
              </Button>
              : t('Tips.noImg')
        }
      </div>
    </div>
  )
}