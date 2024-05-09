'use client'

import { Button } from '@nextui-org/react'
import React from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function TagAddButton() {
  const { setTagAdd } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      color="primary"
      radius="full"
      size="sm"
      variant="shadow"
      onClick={() => setTagAdd(true)}
      aria-label="新增"
    >
      新增
    </Button>
  )
}