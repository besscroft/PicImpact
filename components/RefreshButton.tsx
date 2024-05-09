'use client'

import { Button } from '@nextui-org/react'
import React from 'react'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { HandleProps } from '~/types'

export default function RefreshButton(props: Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)

  return (
    <Button
      color="primary"
      radius="full"
      size="sm"
      variant="shadow"
      isLoading={isLoading}
      aria-label="刷新"
      onClick={async () => {
        await mutate()
      }}
    >
      刷新
    </Button>
  )
}