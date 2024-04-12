'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function TagEditSheet() {
  const { tagEdit, tag, setTagEdit } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={tagEdit}
      onOpenChange={() => setTagEdit(!tagEdit, null)}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{tag?.name}</SheetTitle>
          <SheetDescription>
            {tag?.detail}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}