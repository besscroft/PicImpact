'use client'

import { Button } from '@nextui-org/react'
import React from 'react'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { HandleProps } from '~/types'
import { toast } from 'sonner'

export default function RefreshButton(props: Readonly<HandleProps>) {
  const { isLoading, mutate, error } = useSWRHydrated(props)

  if (error) {
    toast.error('获取失败！')
  }

  return (
    <Button
      color="primary"
      radius="full"
      size="sm"
      isLoading={isLoading}
      onClick={async () => {
        await mutate()
      }}
    >
      刷新
    </Button>
  )
}