'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '~/lib/utils'

export default function LivePhoto({ url, videoUrl, className }: { url: string; videoUrl: string; className?: string }) {
  const livePhotoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initializeLivePhotosKit = async () => {
      const LivePhotosKit = (await import('livephotoskit'))
      if (livePhotoRef.current && url && videoUrl) {
        LivePhotosKit.augmentElementAsPlayer(livePhotoRef.current, {
          effectType: 'live',
          photoSrc: url,
          videoSrc: videoUrl,
          showsNativeControls: true,
        })
      }
    };

    initializeLivePhotosKit();
  }, [livePhotoRef, url, videoUrl])

  return (
    <div ref={livePhotoRef} className={
      cn(className, "w-full object-contain h-[36vh]")
    } />
  )
}
