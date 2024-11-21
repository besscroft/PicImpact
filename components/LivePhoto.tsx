'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'

export default function LivePhoto({ url, videoUrl }: { url: string; videoUrl: string }) {
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
    <div ref={livePhotoRef} className="w-full md:max-h-[90vh]"/>
  )
}
