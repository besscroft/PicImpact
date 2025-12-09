'use client'

import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import type { HandleProps } from '~/types/props.ts'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'

export default function RefreshButton(props: Readonly<HandleProps>) {
  const { isLoading, mutate } = useSwrHydrated(props)

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      disabled={isLoading}
      aria-label="刷新"
      onClick={async () => {
        await mutate()
      }}
    >
      {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      刷新
    </Button>
  )
}