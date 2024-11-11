'use client'

import { Button } from '~/components/ui/button'
import React from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function CopyrightAddButton() {
  const { setCopyrightAdd } = useButtonStore(
    (state) => state,
  )

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      onClick={() => setCopyrightAdd(true)}
      aria-label="新增"
    >
      新增
    </Button>
  )
}