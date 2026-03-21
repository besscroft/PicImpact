'use client'

import Image from 'next/image'
import { useRouter } from 'next-nprogress-bar'
import { cn } from '~/lib/utils'
import type { ImageType } from '~/types'
import { Aperture, Timer, Focus, Disc3 } from 'lucide-react'
import { useBlurImageDataUrl, DEFAULT_HASH } from '~/hooks/use-blurhash'

export default function MasonryPhotoItem({ photo }: { photo: ImageType }) {
  const router = useRouter()
  const dataURL = useBlurImageDataUrl(photo.blurhash)

  const exif = photo.exif
  const hasExif = exif && (exif.focal_length || exif.f_number || exif.exposure_time || exif.iso_speed_rating)

  return (
    <div
      role="link"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden rounded-sm"
      style={{ aspectRatio: photo.width / photo.height, willChange: 'transform' }}
      onClick={() => router.push(`/preview/${photo.id}`)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/preview/${photo.id}`)
        }
      }}
    >
      {photo.preview_url ? (
        <Image
          className="transition-transform duration-500 group-hover:scale-105 object-cover"
          src={photo.preview_url}
          alt={photo.detail || photo.title || ''}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
          unoptimized
          placeholder={(photo.blurhash === DEFAULT_HASH || !photo.blurhash) ? 'empty' : 'blur'}
          blurDataURL={dataURL}
        />
      ) : (
        <Image
          className="transition-transform duration-500 group-hover:scale-105 object-cover"
          src={photo.url}
          alt={photo.detail || photo.title || ''}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
          placeholder={(photo.blurhash === DEFAULT_HASH || !photo.blurhash) ? 'empty' : 'blur'}
          blurDataURL={dataURL}
        />
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
