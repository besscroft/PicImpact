'use client'

import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function SearchBorder() {
  const { setSearchOpen } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      variant={"outline"}
      className={cn(
        "w-[240px] justify-start text-left font-normal",
        "text-muted-foreground"
      )}
      onClick={() => setSearchOpen(true)}
    >
      <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
      <span>搜索</span>
    </Button>
  )
}