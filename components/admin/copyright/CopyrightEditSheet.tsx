'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { HandleProps, CopyrightType } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'

export default function CopyrightEditSheet(props : Readonly<HandleProps>) {
  const { mutate } = useSWRHydrated(props)
  const { copyrightEdit, copyright, setCopyrightEdit, setCopyrightEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!copyright.name) {
      toast.error('请先填写版权名称！')
      return
    }
    if (!copyright.type) {
      toast.error('请先选择类型！')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/copyrights/update', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(copyright),
        method: 'PUT',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success('更新成功！')
        setCopyrightEditData({} as CopyrightType)
        setCopyrightEdit(false)
        await mutate()
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
    }
  }

  const copyrightSelect = [
    {
      label: '社交媒体',
      value: 'social',
    },
    {
      label: '外链',
      value: 'target',
    },
  ]

  return (
    <Sheet
      defaultOpen={false}
      open={copyrightEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setCopyrightEdit(false)
          setCopyrightEditData({} as CopyrightType)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>编辑版权</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 版权名称 </span>

            <input
              type="text"
              id="name"
              value={copyright?.name}
              placeholder="输入版权名称"
              onChange={(e) => setCopyrightEditData({...copyright, name: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="social_name"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 社交媒体名称 </span>

            <input
              type="text"
              id="social_name"
              value={copyright?.social_name}
              placeholder="输入社交媒体名称"
              onChange={(e) => setCopyrightEditData({...copyright, social_name: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <Select
            value={copyright.type}
            onValueChange={(value: string) => {
              setCopyrightEditData({...copyright, type: value})
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择类型"/>
            </SelectTrigger>
            <SelectContent>
              {copyrightSelect.map((copyright) => (
                <SelectItem key={copyright.value} value={copyright.value}>
                  {copyright.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label
            htmlFor="url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 地址 </span>

            <input
              type="text"
              id="url"
              value={copyright?.url}
              placeholder="输入地址"
              onChange={(e) => setCopyrightEditData({...copyright, url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="avatar_url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 社交媒体头像地址 </span>

            <input
              type="text"
              id="avatar_url"
              value={copyright?.avatar_url}
              placeholder="输入社交媒体头像地址"
              onChange={(e) => setCopyrightEditData({...copyright, avatar_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 社交媒体介绍 </span>

            <input
              type="text"
              id="detail"
              value={copyright?.detail}
              placeholder="输入社交媒体介绍"
              onChange={(e) => setCopyrightEditData({...copyright, detail: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要在用户侧显示当前版权信息，关闭后在所有图片都会不显示。
              </div>
            </div>
            <Switch
              checked={copyright?.show === 0}
              onCheckedChange={(value) => setCopyrightEditData({...copyright, show: value ? 0 : 1})}
            />
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">默认状态</div>
              <div className="text-tiny text-default-400">
                设置为默认后，所有的图片都会默认显示该版权信息。
              </div>
            </div>
            <Switch
              checked={copyright?.default === 0}
              onCheckedChange={(value) => setCopyrightEditData({...copyright, default: value ? 0 : 1})}
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