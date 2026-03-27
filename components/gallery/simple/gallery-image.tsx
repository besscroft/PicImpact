'use client'

import type { ImageType } from '~/types'
import { cn } from '~/lib/utils'
import { useRouter } from 'next-nprogress-bar'
import { useBlurImageDataUrl, DEFAULT_HASH } from '~/hooks/use-blurhash.ts'
import { MotionImage } from '~/components/album/motion-image'
import { Skeleton } from '~/components/ui/skeleton'
import { useState } from 'react'
import { Badge } from '~/components/ui/badge.tsx'

export default function GalleryImage({
  photo,
  customIndexOriginEnable,
}: {
  photo: ImageType
  customIndexOriginEnable: boolean
}) {
  const router = useRouter()
  const preferredSrc = customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url
  const fallbackSrc = customIndexOriginEnable ? photo.preview_url || photo.url : photo.url || photo.preview_url
  const [imgSrc, setImgSrc] = useState(preferredSrc)
  const [isLoading, setIsLoading] = useState(true)
  const dataURL = useBlurImageDataUrl(photo.blurhash)
  const hasRealBlurhash = !!photo.blurhash && photo.blurhash !== DEFAULT_HASH
  const hasFallbackSrc = !!fallbackSrc && fallbackSrc !== preferredSrc
  const useUnoptimized = customIndexOriginEnable || (!!photo.preview_url && imgSrc === photo.preview_url)

  const exifParts: string[] = []
  if (photo?.exif?.make && photo?.exif?.model) {
    exifParts.push(`${photo.exif.make} ${photo.exif.model}`)
  }
  if (photo?.exif?.focal_length) {
    exifParts.push(photo.exif.focal_length)
  }
  if (photo?.exif?.f_number) {
    exifParts.push(photo.exif.f_number)
  }
  if (photo?.exif?.exposure_time) {
    exifParts.push(photo.exif.exposure_time)
  }
  if (photo?.exif?.iso_speed_rating) {
    exifParts.push(`ISO ${photo.exif.iso_speed_rating}`)
  }

  return (
    <div className="w-full">
      <div
        role="link"
        tabIndex={0}
        className="relative cursor-pointer"
        onClick={() => router.push(`/preview/${photo?.id}`)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            router.push(`/preview/${photo?.id}`)
          }
        }}
      >
        {isLoading && (
          <Skeleton
            className={cn(
              'absolute inset-0 z-10 rounded-none',
              hasRealBlurhash
                ? 'animate-none bg-black/10 backdrop-blur-[2px] dark:bg-white/10'
                : 'bg-accent'
            )}
          />
        )}
        <MotionImage
          key={imgSrc}
          className={cn('w-full h-auto', isLoading && !hasRealBlurhash && 'animate-pulse')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={imgSrc}
          overrideSrc={imgSrc}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          unoptimized={useUnoptimized}
          placeholder={hasRealBlurhash ? 'blur' : 'empty'}
          blurDataURL={dataURL}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (hasFallbackSrc && imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc)
              return
            }
            setIsLoading(false)
          }}
        />
        {photo.type === 2 && (
          <div className="absolute top-2 left-2 p-5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 text-white opacity-75 z-10"
              width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
              strokeLinecap="round" strokeLinejoin="round">
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
        )}
      </div>
      <div className="mt-3 px-1">
        <h3 className="font-display text-lg">{photo.title}</h3>
        {exifParts.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {exifParts.join(' \u00B7 ')}
          </p>
        )}
        {photo?.labels && photo.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {photo.labels.map((tag: string) => (
              <Badge
                variant="secondary"
                className="cursor-pointer select-none text-xs"
                key={tag}
                onClick={() => router.push(`/tag/${tag}`)}
              >{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
