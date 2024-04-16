'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { ImageType } from '~/types'
import { cn, Input, Switch, Textarea, Image } from '@nextui-org/react'
import React from 'react'

export default function ImageView() {
  const { imageView, imageViewData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={imageView}
      onOpenChange={(open) => {
        if (!open) {
          setImageView(false)
          setImageViewData({} as ImageType)
        }
      }}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>编辑标签</SheetTitle>
          <SheetDescription className="space-y-2">
            <Image
              isBlurred
              isZoomed
              src={imageViewData.url}
              alt={imageViewData.detail}
            />
            <Textarea
              isReadOnly
              value={imageViewData?.detail}
              label="详情"
              variant="bordered"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Input
              isReadOnly
              value={String(imageViewData?.sort)}
              type="number"
              variant="bordered"
              label="排序"
              placeholder="0"
            />
            <Switch
              isDisabled
              isSelected={imageViewData?.show === 0}
              value={imageViewData?.show === 0 ? 'true' : 'false'}
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
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}