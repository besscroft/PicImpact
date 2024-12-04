'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { DataProps, ImageType } from '~/types'
import React from 'react'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ExifView from '~/components/album/ExifView'
import { Switch } from '~/components/ui/switch'
import LivePhoto from '~/components/album/LivePhoto'
import MultipleSelector from '~/components/ui/origin/multiselect'

export default function ImageView() {
  const { imageView, imageViewData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )
  const { data } = useSWR('/api/v1/copyrights/get', fetcher)

  const props: DataProps = {
    data: imageViewData,
  }

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
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide">
        <SheetHeader>
          <SheetTitle>{imageViewData.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {imageViewData?.type === 1 ?
            <img
              src={imageViewData.preview_url || imageViewData.url}
              alt={imageViewData.detail}
            />
            :
            <LivePhoto url={imageViewData.preview_url || imageViewData.url} videoUrl={imageViewData.video_url} />
          }
          {imageViewData?.labels &&
            <div className="space-x-1">
              {imageViewData?.labels.map((tag: string) => (
                <span key={tag} className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                  <p className="whitespace-nowrap text-sm">{tag}</p>
                </span>
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
          <MultipleSelector
            commandProps={{
              label: "选择版权信息",
            }}
            options={data}
            disabled
            hidePlaceholderWhenSelected
            value={!imageViewData.copyrights ? [] : imageViewData.copyrights.map((item: any) => {
              const found = data?.find((element: any) => element.value === item)
              return {
                label: found?.label || '',
                value: item
              }
            })}
            placeholder="选择版权信息"
            emptyIndicator={<p className="text-center text-sm">暂未选择版权信息</p>}
          />
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要在首页显示图片
              </div>
            </div>
            <Switch
              checked={imageViewData?.show === 0}
              disabled
              aria-readonly
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}