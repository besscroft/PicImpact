'use client'

import React from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Image } from '@nextui-org/image'

export default function BlurImage({ photo }: { photo: any }) {
  const { setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )

  return (
    <div className="my-2">
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        disableSkeleton
        shadow="sm"
        radius="none"
        onClick={() => {
          setMasonryView(true)
          setMasonryViewData(photo)
        }}
        className="duration-700 ease-in-out group-hover:opacity-75 cursor-pointer transition-all will-change-transform hover:scale-[1.01]"
      />
    </div>
  )
}