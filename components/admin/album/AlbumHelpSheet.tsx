'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function AlbumHelpSheet() {
  const { albumHelp, setAlbumHelp } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={albumHelp}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setAlbumHelp(false)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide">
        <SheetHeader>
          <SheetTitle>帮助</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>
              您要展示除⌈首页⌋外的其它相册，需要添加新的⌈相册⌋，并标记为可显示状态。
            </p>
            <p>
              ⌈相册⌋的⌈路由⌋需要带 / 前缀。
            </p>
            <p>
              注意，如果您将⌈相册⌋设置为⌈禁用状态⌋，那么未登录时无法以任何方式获取该⌈相册⌋下的图片信息。
            </p>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}