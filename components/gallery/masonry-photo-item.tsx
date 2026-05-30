'use client'

import Image from 'next/image'
import { useRouter } from 'next-nprogress-bar'
import { cn } from '~/lib/utils'
import type { ImageType } from '~/types'
import { Aperture, Timer, Focus, Disc3 } from 'lucide-react'
import { useBlurImageDataUrl, DEFAULT_HASH } from '~/hooks/use-blurhash'
import { Skeleton } from '~/components/ui/skeleton'
import { useState } from 'react'
import { hasReadyVariants, makeVariantLoader } from '~/lib/image/loader'
import { useAvifSupport } from '~/hooks/use-avif-support'
import { DEFAULT_GRID_SIZES } from '~/lib/image/grid-image-sizes'

export default function MasonryPhotoItem({ photo, width, variantBaseUrl = '', priority = false }: { photo: ImageType, width?: number, variantBaseUrl?: string, priority?: boolean }) {
  const router = useRouter()
  const dataURL = useBlurImageDataUrl(photo.blurhash)
  const avifOk = useAvifSupport()
  const [isLoading, setIsLoading] = useState(true)
  // If a (supposedly ready) variant fails to load, fall back down the ladder
  // rather than retrying the variant forever.
  const [variantFailed, setVariantFailed] = useState(false)

  const exif = photo.exif
  const hasExif = exif && (exif.focal_length || exif.f_number || exif.exposure_time || exif.iso_speed_rating)
  const aspectRatio = photo.width > 0 && photo.height > 0 ? photo.width / photo.height : 1
  const hasRealBlurhash = !!photo.blurhash && photo.blurhash !== DEFAULT_HASH

  // Image source ladder — the grid must NEVER load the full-resolution original
  // (the multi-MB photos that tank scrolling). In order:
  //   1. responsive variants via the custom CDN loader (bypasses /_next/image),
  //   2. the small preview thumbnail (unoptimized — it is already sized),
  //   3. nothing → the blurhash placeholder stays as the final visible state.
  const variantReady = !variantFailed && hasReadyVariants(photo.image_key, photo.ready_max_width, variantBaseUrl)
  const previewSrc = photo.preview_url || ''
  const imageProps = variantReady
    ? {
        src: photo.image_key,
        loader: makeVariantLoader({
          base: variantBaseUrl,
          imageKey: photo.image_key,
          readyMaxWidth: photo.ready_max_width,
          format: (avifOk ? 'avif' : 'webp') as 'avif' | 'webp',
        }),
      }
    : previewSrc
      ? { src: previewSrc, unoptimized: true }
      : null
  // No servable image (un-backfilled row without a preview, e.g. OpenList) →
  // show the decoded blurhash itself instead of a perpetual loading skeleton.
  const blurhashOnly = !imageProps && hasRealBlurhash
  // When rendered inside the virtualized masonry, masonic supplies the column
  // width and measures item height. Deriving an explicit pixel height from the
  // known aspect ratio lets masonic position items immediately and stably
  // without waiting for the image to load. Outside masonic (no `width`), fall
  // back to a pure aspect-ratio box.
  const sizeStyle = typeof width === 'number'
    ? { width, height: Math.round(width / aspectRatio) }
    : { aspectRatio }

  return (
    <div
      role="link"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden rounded-sm [will-change:auto] hover:[will-change:transform]"
      style={sizeStyle}
      onClick={() => router.push(`/preview/${photo.id}`)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/preview/${photo.id}`)
        }
      }}
    >
      {imageProps && isLoading && (
        <Skeleton
          className={cn(
            'absolute inset-0 z-10 rounded-none',
            hasRealBlurhash
              ? 'animate-none bg-black/10 backdrop-blur-[2px] dark:bg-white/10'
              // Neutral muted tone (not the near-white bg-accent) so a cell still
              // loading during fast scroll reads as a placeholder, not a white gap.
              : 'bg-muted'
          )}
        />
      )}
      {imageProps ? (
        <Image
          {...imageProps}
          key={variantReady ? 'variant' : 'preview'}
          className={cn(
            'object-cover transition-transform duration-500 group-hover:scale-105',
            isLoading && !hasRealBlurhash && 'animate-pulse'
          )}
          alt={photo.detail || photo.title || ''}
          fill
          sizes={DEFAULT_GRID_SIZES}
          // First above-the-fold items load eagerly with high fetch priority so the
          // LCP image is discovered immediately instead of waiting on the lazy
          // IntersectionObserver at low priority (the variant is a tiny AVIF — the
          // cost was discovery delay, not bytes). Later items stay lazy.
          {...(priority ? { priority: true } : { loading: 'lazy' as const })}
          placeholder={hasRealBlurhash ? 'blur' : 'empty'}
          blurDataURL={dataURL}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            // A ready variant failed → step down the ladder (preview/blurhash);
            // never escalate to the full original in the grid.
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
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${dataURL})` }}
        />
      ) : (
        <Skeleton className="absolute inset-0 rounded-none bg-accent/80" />
      )}
      {/* Hover gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Hover content */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
        <h3 className="truncate text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {photo.title}
        </h3>
        {hasExif && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {exif.focal_length && (
              <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur-md">
                <Focus className="h-3 w-3 text-white/70" />
                <span className="text-white/90">{exif.focal_length}</span>
              </div>
            )}
            {exif.f_number && (
              <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur-md">
                <Aperture className="h-3 w-3 text-white/70" />
                <span className="text-white/90">{exif.f_number}</span>
              </div>
            )}
            {exif.exposure_time && (
              <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur-md">
                <Timer className="h-3 w-3 text-white/70" />
                <span className="text-white/90">{exif.exposure_time}</span>
              </div>
            )}
            {exif.iso_speed_rating && (
              <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 backdrop-blur-md">
                <Disc3 className="h-3 w-3 text-white/70" />
                <span className="text-white/90">ISO {exif.iso_speed_rating}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Live Photo badge */}
      {photo.type === 2 && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" fill="none" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="12" r="5" />
            <line x1="15.9" y1="20.11" x2="15.9" y2="20.12" />
            <line x1="19.04" y1="17.61" x2="19.04" y2="17.62" />
            <line x1="20.77" y1="14" x2="20.77" y2="14.01" />
            <line x1="20.77" y1="10" x2="20.77" y2="10.01" />
            <line x1="19.04" y1="6.39" x2="19.04" y2="6.4" />
            <line x1="15.9" y1="3.89" x2="15.9" y2="3.9" />
            <line x1="12" y1="3" x2="12" y2="3.01" />
            <line x1="8.1" y1="3.89" x2="8.1" y2="3.9" />
            <line x1="4.96" y1="6.39" x2="4.96" y2="6.4" />
            <line x1="3.23" y1="10" x2="3.23" y2="10.01" />
            <line x1="3.23" y1="14" x2="3.23" y2="14.01" />
            <line x1="4.96" y1="17.61" x2="4.96" y2="17.62" />
            <line x1="8.1" y1="20.11" x2="8.1" y2="20.12" />
            <line x1="12" y1="21" x2="12" y2="21.01" />
          </svg>
          <span>Live</span>
        </div>
      )}
    </div>
  )
}
