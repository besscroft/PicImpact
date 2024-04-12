'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function TagAddSheet() {
  const { tagAdd, setTagAdd } = useButtonStore(
    (state) => state,
  )

  return (
    <Sheet
      defaultOpen={false}
      open={tagAdd}
      onOpenChange={() => setTagAdd(!tagAdd)}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}