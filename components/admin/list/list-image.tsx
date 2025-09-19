'use client'

import React from 'react'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash.ts'
import Image from 'next/image'

export default function ListImage({ image }: { image: any }) {

  const dataURL = useBlurImageDataUrl(image.blurhash)
  
  return (
    <Image
      className="duration-700 ease-in-out group-hover:opacity-75 w-full h-full object-contain"
      src={image.preview_url || image.url}
      overrideSrc={image.preview_url || image.url}
      alt={image.title}
      width={image.width}
      height={image.height}
      loading="lazy"
      placeholder="blur"
      blurDataURL={dataURL}
    />
  )
}