'use client'

import { Button } from '~/components/ui/button'
import { useButtonStore } from '~/app/providers/button-store-providers'

export default function AlbumAddButton() {
  const { setAlbumAdd } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      onClick={() => setAlbumAdd(true)}
      aria-label="新增"
    >
      新增
    </Button>
  )
}