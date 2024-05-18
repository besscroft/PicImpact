'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function TagHelpSheet() {
  const { tagHelp, setTagHelp } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={tagHelp}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setTagHelp(false)
        }
      }}
      modal={false}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>帮助</SheetTitle>
          <SheetDescription className="space-y-2">
            <p>
              您要展示除⌈首页⌋外的其它相册，需要添加新的⌈标签⌋，并标记为可显示状态。
            </p>
            <p>
              ⌈标签⌋的⌈路由⌋需要带 / 前缀。
            </p>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}