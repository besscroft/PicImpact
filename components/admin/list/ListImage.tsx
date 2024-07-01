'use client'

import React, { useState } from 'react'
import { Image } from '@nextui-org/image'
import { cn } from '~/utils'

export default function ListImage({ image }: { image: any }) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Image
      src={image.preview_url || image.url}
      alt={image.detail}
      loading="lazy"
      removeWrapper
      disableSkeleton
      className={cn(
        'duration-700 ease-in-out group-hover:opacity-75 aspect-video object-cover',
        isLoading
          ? 'scale-110 blur-2xl grayscale'
          : 'scale-100 blur-0 grayscale-0'
      )}
      onLoad={() => setIsLoading(false)}
    />
  )
}