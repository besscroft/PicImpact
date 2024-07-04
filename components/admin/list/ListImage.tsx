'use client'

import React from 'react'
import { Image } from '@nextui-org/image'

export default function ListImage({ image }: { image: any }) {
  return (
    <Image
      src={image.preview_url || image.url}
      alt={image.detail}
      loading="lazy"
      removeWrapper
      disableSkeleton
      radius="none"
      className="duration-700 ease-in-out group-hover:opacity-75 object-cover"
    />
  )
}