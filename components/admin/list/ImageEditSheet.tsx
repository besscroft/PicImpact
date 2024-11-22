'use client'

import { useButtonStore } from '~/app/providers/button-store-Providers'
import { ImageServerHandleProps, ImageType } from '~/types'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
import { Select } from 'antd'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import { Switch } from '~/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'


export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSWRInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const { data, isLoading } = useSWR('/api/v1/copyrights/get', fetcher)

  async function submit() {
    if (!image.url) {
      toast.error('图片链接不能为空！')
      return
    }
    if (!image.height || image.height <= 0) {
      toast.error('图片高度不能为空且必须大于 0！')
      return
    }
    if (!image.width || image.width <= 0) {
      toast.error('图片宽度不能为空且必须大于 0！')
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/update', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(image),
        method: 'PUT',
      }).then(response => response.json())
      toast.success('更新成功！')
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
    }
  }

  const fieldNames = { label: 'name', value: 'id' }

  return (
    <Sheet
      defaultOpen={false}
      open={imageEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageEdit(false)
          setImageEditData({} as ImageType)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>编辑图片</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-2">
          <label
            htmlFor="title"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 图片标题 </span>

            <input
              type="text"
              id="title"
              placeholder="请输入图片标题"
              value={image?.title}
              onChange={(e) => setImageEditData({...image, title: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 链接 </span>

            <input
              type="text"
              id="url"
              placeholder="输入链接"
              value={image?.url}
              onChange={(e) => setImageEditData({...image, url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="preview_url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 预览链接 </span>

            <input
              type="text"
              id="preview_url"
              placeholder="输入预览链接"
              value={image?.preview_url}
              onChange={(e) => setImageEditData({...image, preview_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="video_url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 视频链接 </span>

            <input
              type="text"
              id="video_url"
              placeholder="输入视频链接"
              value={image?.video_url}
              onChange={(e) => setImageEditData({...image, video_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 详情 </span>

            <input
              type="text"
              id="detail"
              placeholder="输入详情"
              value={image?.detail}
              onChange={(e) => setImageEditData({...image, detail: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="width"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 宽度 px </span>

            <input
              type="number"
              id="width"
              value={image?.width}
              onChange={(e) => setImageEditData({...image, width: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="height"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 高度 px </span>

            <input
              type="number"
              id="height"
              value={image?.height}
              onChange={(e) => setImageEditData({...image, height: Number(e.target.value)})}
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
              placeholder="输入经度"
              value={image?.lon}
              onChange={(e) => setImageEditData({...image, lon: e.target.value})}
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
              placeholder="输入纬度"
              value={image?.lat}
              onChange={(e) => setImageEditData({...image, lat: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="sort"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 排序 </span>

            <input
              type="number"
              id="sort"
              value={image?.sort}
              onChange={(e) => setImageEditData({...image, sort: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <Select
            className="!block"
            mode="multiple"
            placeholder="选择版权信息"
            defaultValue={image.copyrights}
            fieldNames={fieldNames}
            options={data}
            onChange={(value, option: any) => {
              setImageEditData({...image, copyrights: value})
            }}
          />
          <Select
            mode="tags"
            value={image.labels}
            style={{width: '100%'}}
            placeholder="请输入图片索引标签，如：猫猫，不要输入特殊字符。"
            onChange={(value: any) => setImageEditData({...image, labels: value})}
            options={[]}
          />
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要在首页显示图片
              </div>
            </div>
            <Switch
              checked={image?.show === 0}
              onCheckedChange={(value) => setImageEditData({...image, show: value ? 0 : 1})}
            />
          </div>
          <Button
            disabled={loading}
            onClick={() => submit()}
            aria-label="更新"
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            更新
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}