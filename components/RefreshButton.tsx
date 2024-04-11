'use client'

import { Button } from '@nextui-org/react'
import React from 'react'
import { useSWRConfig } from 'swr'

export default function RefreshButton() {
  const { mutate } = useSWRConfig()

  return (
    <Button
      color="primary"
      radius="full"
      size="sm"
      // isLoading={loading}
      onClick={() => {
        mutate('getTags')
      }}
    >
      刷新
    </Button>
  )
}