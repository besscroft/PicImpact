'use client'

import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { cn } from '~/lib/utils'

export default function BlurImage({ photo, dataList }: { photo: any, dataList: any }) {
  const { setMasonryView, setMasonryViewData, setMasonryViewDataList } = useButtonStore(
    (state) => state,
  )

  const [loaded, setLoaded] = useState(false)

  return (
    <img
      width={photo.width}
      height={photo.height}
      loading="lazy"
      src={photo.src}
      alt={photo.alt}
      onClick={() => {
        setMasonryView(true)
        setMasonryViewData(photo)
        setMasonryViewDataList(dataList)
      }}
      onLoad={() => setLoaded(true)}
      className={cn(
        "duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] group-hover:opacity-75 cursor-pointer transition-all will-change-transform hover:scale-[1.01]",
        {
          'opacity-100 scale-100 blur-0': loaded,
          'opacity-0 scale-95 blur-sm': !loaded,
        }
      )}
    />
  )
}