'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function ImageHelpSheet() {
  const { imageHelp, setImageHelp } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={imageHelp}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageHelp(false)
        }
      }}
      modal={false}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>帮助</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>
              您在当前页面可以维护图片的数据。
            </p>
            <p>
              您可以为每一张图片打上标签，但请注意不要用特殊字符。
              为了兼容 SSR 场景，通过路由来获取的参数，如果有特殊字符可能会没法正确访问数据。
              您可以通过点击图片标签，来访问所有包含该标签的图片。
            </p>
            <p>
              注意，如果您将⌈图片⌋设置为⌈禁用状态⌋，那么未登录时无法以任何方式获取该图片的信息，但不影响通过链接访问图片，因为这个权限由存储方管理。
            </p>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}