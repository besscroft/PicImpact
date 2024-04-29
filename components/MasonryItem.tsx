'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '~/components/ui/Dialog'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { ImageType } from '~/types'
import { Image } from '@nextui-org/react'

export default function MasonryItem() {
  const { MasonryView, MasonryViewData, setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )

  return (
    <Dialog
      defaultOpen={false}
      open={MasonryView}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setMasonryView(false)
          setMasonryViewData({} as ImageType)
        }
      }}
    >
      <DialogContent>
        <div className="mx-auto w-full sm:w-[62%] mt-4">
          <Image
            alt={MasonryViewData.detail}
            src={MasonryViewData.url}
          />
        </div>
        <DialogFooter>
          {MasonryViewData.detail}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}