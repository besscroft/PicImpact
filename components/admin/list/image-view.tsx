'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageDataProps } from '~/types/props'
import ExifView from '~/components/admin/album/exif-view.tsx'
import { Switch } from '~/components/ui/switch'
import LivePhoto from '~/components/album/live-photo'
import { MotionImage } from '~/components/album/motion-image'
import { Badge } from '~/components/ui/badge'
import { useTranslations } from 'next-intl'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

export default function ImageView() {
  const t = useTranslations()
  const { imageView, imageViewData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )

  const props: ImageDataProps = {
    data: imageViewData,
  }

  const dataURL = useBlurImageDataUrl(imageViewData.blurhash)

  return (
    <Sheet
      defaultOpen={false}
      open={imageView}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageView(false)
          setImageViewData({} as ImageType)
        }
      }}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2">
        <SheetHeader>
          <SheetTitle>{imageViewData.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {imageViewData?.type === 1 ?
            <MotionImage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="cursor-pointer"
              src={imageViewData.preview_url || imageViewData.url}
              overrideSrc={imageViewData.preview_url || imageViewData.url}
              alt={imageViewData.detail}
              width={imageViewData.width}
              height={imageViewData.height}
              unoptimized
              loading="lazy"
              placeholder="blur"
              blurDataURL={dataURL}
            />
            :
            <LivePhoto url={imageViewData.preview_url || imageViewData.url} videoUrl={imageViewData.video_url} />
          }
          {imageViewData?.labels &&
            <div className="space-x-1">
              {imageViewData?.labels.map((tag: string) => (
                <Badge key={tag} variant="secondary" aria-label={t('Words.album')}>{tag}</Badge>
              ))}
            </div>
          }
          <ExifView {...props} />
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 详情 </span>

            <input
              type="text"
              id="detail"
              disabled
              value={imageViewData?.detail}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="width"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 宽度 px </span>

            <input
              type="text"
              id="width"
              disabled
              value={String(imageViewData?.width)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="height"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 高度 px </span>

            <input
              type="text"
              id="height"
              disabled
              value={String(imageViewData?.height)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lon"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 经度 </span>

            <input
              type="text"
              id="lon"
              disabled
              value={String(imageViewData?.lon)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lat"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 纬度 </span>

            <input
              type="text"
              id="lat"
              disabled
              value={String(imageViewData?.lat)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="sort"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 排序 </span>

            <input
              type="text"
              id="sort"
              disabled
              value={String(imageViewData?.sort)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要显示图片
              </div>
            </div>
            <Switch
              checked={imageViewData?.show === 0}
              disabled
              aria-readonly
            />
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">首页显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要在首页显示图片
              </div>
            </div>
            <Switch
              checked={imageViewData?.show_on_mainpage === 0}
              disabled
              aria-readonly
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}