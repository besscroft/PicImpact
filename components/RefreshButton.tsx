'use client'

import React from 'react'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { HandleProps } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'

export default function RefreshButton(props: Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)

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