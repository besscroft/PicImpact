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
    <div className="relative inline-block">
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
      {
        photo.type === 2 &&
        <div className="absolute top-2 left-2 p-5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 text-white opacity-75 z-10"
               width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
               stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" fill="none"></path>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
            <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
            <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
            <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
            <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
            <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
            <line x1="12" y1="3" x2="12" y2="3.01"></line>
            <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
            <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
            <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
            <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
            <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
            <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
            <line x1="12" y1="21" x2="12" y2="21.01"></line>
          </svg>
        </div>
      }
    </div>
  )
}