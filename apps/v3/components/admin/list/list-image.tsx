'use client'

import React from 'react'
import Image from 'next/image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash.ts'

export default React.memo(function ListImage({ image }: { image: any }) {
  const dataURL = useBlurImageDataUrl(image.blurhash)

  return (
    <Image
      className="group-hover:opacity-75 transition-opacity duration-500 ease-in-out w-full h-full object-contain"
      src={image.preview_url || image.url}
      overrideSrc={image.preview_url || image.url}
      alt={image.title}
      width={image.width}
      height={image.height}
      loading="lazy"
      unoptimized
      placeholder="blur"
      blurDataURL={dataURL}
    />
  )
}, (prevProps, nextProps) => {
  return prevProps.image.id === nextProps.image.id
    && prevProps.image.url === nextProps.image.url
    && prevProps.image.preview_url === nextProps.image.preview_url
})