'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Button, Input, Switch, cn, Textarea } from '@nextui-org/react'
import { HandleProps, CopyrightType } from '~/types'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'

export default function CopyrightAddSheet(props : Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)
  const { copyrightAdd, setCopyrightAdd } = useButtonStore(
    (state) => state,
  )
  const [data, setData] = useState({} as CopyrightType)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!data.name) {
      toast.error('请先填写版权名称！')
      return
    }
    if (!data.type) {
      toast.error('请先选择类型！')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/copyright-add', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'POST',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success('添加成功！')
        setCopyrightAdd(false)
        setData({} as CopyrightType)
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
      open={copyrightAdd}
      onOpenChange={() => setCopyrightAdd(!copyrightAdd)}
      modal={false}
    >
      <SheetContent side="left" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>新增版权</SheetTitle>
          <SheetDescription className="space-y-2">
            <Input
              isRequired
              value={data.name}
              onValueChange={(value) => setData({ ...data, name: value })}
              isClearable
              type="text"
              variant="bordered"
              label="版权名称"
              placeholder="输入版权名称"
            />
            <Input
              value={data.social_name}
              onValueChange={(value) => setData({ ...data, social_name: value })}
              isClearable
              type="text"
              variant="bordered"
              label="社交媒体名称"
              placeholder="输入社交媒体名称"
            />
            <Select
              value={data.type}
              onValueChange={(value: string) => {
                data.type = value
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择类型" />
              </SelectTrigger>
              <SelectContent>
                {copyrightSelect.map((copyright) => (
                  <SelectItem key={copyright.value} value={copyright.value}>
                    {copyright.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={data.url}
              onValueChange={(value) => setData({ ...data, url: value })}
              label="地址"
              variant="bordered"
              placeholder="输入地址"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Textarea
              value={data.avatar_url}
              onValueChange={(value) => setData({ ...data, avatar_url: value })}
              label="社交媒体头像地址"
              variant="bordered"
              placeholder="输入社交媒体头像地址"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Textarea
              value={data.detail}
              onValueChange={(value) => setData({ ...data, detail: value })}
              label="社交媒体介绍"
              variant="bordered"
              placeholder="输入社交媒体介绍"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Switch
              value={data.show === 0 ? 'true' : 'false'}
              onValueChange={(value) => setData({ ...data, show: value ? 0 : 1 })}
              classNames={{
                base: cn(
                  "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center",
                  "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
                  "data-[selected=true]:border-primary",
                ),
                wrapper: "p-0 h-4 overflow-visible",
                thumb: cn("w-6 h-6 border-2 shadow-lg",
                  "group-data-[hover=true]:border-primary",
                  //selected
                  "group-data-[selected=true]:ml-6",
                  // pressed
                  "group-data-[pressed=true]:w-7",
                  "group-data-[selected]:group-data-[pressed]:ml-4",
                ),
              }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-medium">显示状态</p>
                <p className="text-tiny text-default-400">
                  是否需要在用户侧显示当前版权信息，关闭后在所有图片都会不显示。
                </p>
              </div>
            </Switch>
            <Button
              isLoading={loading}
              color="primary"
              variant="shadow"
              onClick={() => submit()}
              aria-label="提交"
            >
              提交
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}