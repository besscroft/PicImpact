'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Button, Input, Switch, cn, Textarea } from '@nextui-org/react'
import { HandleProps, TagType } from '~/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'

export default function TagAddSheet(props : Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)
  const { tagAdd, setTagAdd } = useButtonStore(
    (state) => state,
  )
  const [data, setData] = useState({} as TagType)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!data.name || !data.tag_value) {
      toast.error('请先填写必填项！')
      return
    }
    if (data.tag_value && data.tag_value.charAt(0) !== '/') {
      toast.error('路由必须以 / 开头！')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/tag-add', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'POST',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success('添加成功！')
        setTagAdd(false)
        setData({} as TagType)
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
      open={tagAdd}
      onOpenChange={() => setTagAdd(!tagAdd)}
      modal={false}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>新增相册</SheetTitle>
          <SheetDescription className="space-y-2">
            <Input
              isRequired
              value={data.name}
              onValueChange={(value) => setData({ ...data, name: value })}
              isClearable
              type="text"
              variant="bordered"
              label="相册名称"
              placeholder="输入相册名称"
            />
            <Input
              isRequired
              value={data.tag_value}
              onValueChange={(value) => setData({ ...data, tag_value: value })}
              isClearable
              type="text"
              variant="bordered"
              label="路由"
              placeholder="输入路由，如：/tietie"
            />
            <Textarea
              value={data.detail}
              onValueChange={(value) => setData({ ...data, detail: value })}
              label="详情"
              variant="bordered"
              placeholder="输入详情"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Input
              value={String(data.sort)}
              onValueChange={(value) => setData({ ...data, sort: Number(value) })}
              type="number"
              variant="bordered"
              label="排序"
              placeholder="0"
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
                  是否需要在首页以路由形式呈现，点击后跳转页面。
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