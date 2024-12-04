'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { HandleProps, AlbumType } from '~/types'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'

export default function AlbumAddSheet(props : Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)
  const { albumAdd, setAlbumAdd } = useButtonStore(
    (state) => state,
  )
  const [data, setData] = useState({} as AlbumType)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!data.name || !data.album_value) {
      toast.error('请先填写必填项！')
      return
    }
    if (data.album_value && data.album_value.charAt(0) !== '/') {
      toast.error('路由必须以 / 开头！')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/albums/add', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'POST',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success('添加成功！')
        setAlbumAdd(false)
        setData({} as AlbumType)
        await mutate()
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('添加失败！')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={albumAdd}
      onOpenChange={() => setAlbumAdd(!albumAdd)}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>新增相册</SheetTitle>
          <SheetDescription className="space-y-2">
            <label
              htmlFor="name"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> 相册名称 </span>

              <input
                type="text"
                id="name"
                value={data?.name}
                placeholder="输入相册名称"
                onChange={(e) => setData({...data, name: e.target.value})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="album_value"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> 路由 </span>

              <input
                type="text"
                id="album_value"
                value={data?.album_value}
                placeholder="输入路由，如：/tietie"
                onChange={(e) => setData({...data, album_value: e.target.value})}
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
                value={data?.detail}
                placeholder="输入详情"
                onChange={(e) => setData({...data, detail: e.target.value})}
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
                value={data?.sort}
                placeholder="0"
                onChange={(e) => setData({...data, sort: Number(e.target.value)})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 许可协议 </span>

            <input
                type="text"
                id="detail"
                value={data?.license}
                placeholder="CC BY-NC-SA 4.0"
                onChange={(e) => setData({...data, license: e.target.value})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">允许下载</div>
                <div className="text-tiny text-default-400">
                  是否显示下载/复制按钮。
                </div>
              </div>
              <Switch
                checked={data?.allow_download === 0}
                onCheckedChange={(value) => {
                  setData({...data, allow_download: value ? 0 : 1})
                }}
              />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">显示状态</div>
                <div className="text-tiny text-default-400">
                  是否需要在首页以路由形式呈现，点击后跳转页面。
                </div>
              </div>
              <Switch
                checked={data?.show === 0}
                onCheckedChange={(value) => {
                  setData({...data, show: value ? 0 : 1})
                }}
              />
            </div>
            <Button
              disabled={loading}
              onClick={() => submit()}
              aria-label="提交"
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
              提交
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}