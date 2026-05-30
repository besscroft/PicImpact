'use client'

import { useRouter } from 'next-nprogress-bar'
import { useBlurImageDataUrl, DEFAULT_HASH } from '~/hooks/use-blurhash'
import { MotionImage } from '~/components/album/motion-image'
import { Skeleton } from '~/components/ui/skeleton'
import { useState } from 'react'
import { cn } from '~/lib/utils'
import { hasReadyVariants, makeVariantLoader } from '~/lib/image/loader'
import { useAvifSupport } from '~/hooks/use-avif-support'

export default function BlurImage({ photo }: { photo: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const avifOk = useAvifSupport()
  const [variantFailed, setVariantFailed] = useState(false)

  const dataURL = useBlurImageDataUrl(photo.blurhash)
  const hasRealBlurhash = !!photo.blurhash && photo.blurhash !== DEFAULT_HASH

  // Variant ladder (same policy as the main gallery): responsive variant →
  // preview thumbnail → blurhash. Never the full original in the tag grid.
  const variantBaseUrl = photo.variantBaseUrl ?? ''
  const variantReady = !variantFailed && hasReadyVariants(photo.image_key, photo.ready_max_width, variantBaseUrl)
  const previewSrc = photo.preview_url || ''
  const imageProps = variantReady
    ? {
        src: photo.image_key,
        sizes: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
        loader: makeVariantLoader({
          base: variantBaseUrl,
          imageKey: photo.image_key,
          readyMaxWidth: photo.ready_max_width,
          format: (avifOk ? 'avif' : 'webp') as 'avif' | 'webp',
        }),
      }
    : previewSrc
      ? { src: previewSrc, overrideSrc: previewSrc, unoptimized: true }
      : null
  const blurhashOnly = !imageProps && hasRealBlurhash

  return (
    <div
      role="link"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/preview/${photo?.id}`)
        }
      }}
      className="relative inline-block select-none shadow-sm transition-transform duration-500 ease-out hover:scale-[1.02]">
      {
        imageProps && isLoading && (
          <Skeleton className="absolute inset-0 z-10 rounded-none" />
        )
      }
      {imageProps ? (
        <MotionImage
          {...imageProps}
          key={variantReady ? 'variant' : 'preview'}
          className={cn('cursor-pointer', isLoading && 'animate-pulse')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          alt={photo.alt || 'Photo'}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          placeholder={hasRealBlurhash ? 'blur' : 'empty'}
          blurDataURL={dataURL}
          onClick={() => router.push(`/preview/${photo?.id}`)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            // A ready variant failed → fall to preview/blurhash, never the original.
            if (variantReady) {
              setVariantFailed(true)
              return
            }
            setIsLoading(false)
          }}
        />
      ) : blurhashOnly ? (
        <div
          aria-hidden
          className="bg-cover bg-center"
          style={{ backgroundImage: `url(${dataURL})`, width: photo.width, height: photo.height, maxWidth: '100%' }}
          onClick={() => router.push(`/preview/${photo?.id}`)}
        />
      ) : (
        <Skeleton style={{ width: photo.width, height: photo.height, maxWidth: '100%' }} className="rounded-none" />
      )}
      {
        photo.type === 2 &&
        <div className="absolute top-2 left-2 p-5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 text-white opacity-75 z-10"
            width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            role="img" aria-label="Live Photo">
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