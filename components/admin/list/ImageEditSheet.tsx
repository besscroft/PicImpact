'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { ImageServerHandleProps, ImageType } from '~/types'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
import { Button, cn, Input, Switch, Textarea } from '@nextui-org/react'
import React, { useState } from 'react'
import { toast } from 'sonner'

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { tag: string }>) {
  const { pageNum, tag, ...restProps } = props
  const { mutate } = useSWRInfiniteServerHook(restProps, pageNum, tag)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)

  async function submit() {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/image-update', {
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
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>编辑标签</SheetTitle>
          <SheetDescription className="space-y-2">
            <Textarea
              value={image?.detail}
              onValueChange={(value) => setImageEditData({ ...image, detail: value })}
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
              value={String(image?.sort)}
              onValueChange={(value) => setImageEditData({ ...image, sort: Number(value) })}
              type="number"
              variant="bordered"
              label="排序"
              placeholder="0"
            />
            <Switch
              isSelected={image?.show === 0}
              value={image?.show === 0 ? 'true' : 'false'}
              onValueChange={(value) => setImageEditData({ ...image, show: value ? 0 : 1 })}
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
                  是否需要在首页显示图片
                </p>
              </div>
            </Switch>
            <Button
              isLoading={loading}
              color="primary"
              variant="shadow"
              onClick={() => submit()}
            >
              更新
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}