'use client'

import { Button } from '@nextui-org/react'
import React from 'react'
import { CircleHelp } from 'lucide-react'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function AlbumHelp() {
  const { setAlbumHelp } = useButtonStore(
    (state) => state,
  )
  return (
    <Button
      isIconOnly
      size="sm"
      color="warning"
      aria-label="帮助"
      onClick={() => setAlbumHelp(true)}
    >
      <CircleHelp />
    </Button>
  )
}