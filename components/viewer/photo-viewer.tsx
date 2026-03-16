'use client'

import Image from 'next/image'
import { useRouter } from 'next-nprogress-bar'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '~/components/ui/button'
import type { ImageType } from '~/types'
import { cn } from '~/lib/utils'

interface PhotoViewerProps {
  photo: ImageType
  photos?: ImageType[]
}

export default function PhotoViewer({ photo, photos }: PhotoViewerProps) {
  const router = useRouter()
  const [showInspector, setShowInspector] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!photos) return 0
    const idx = photos.findIndex(p => p.id === photo.id)
    return idx >= 0 ? idx : 0
  })

  const currentPhoto = photos ? photos[currentIndex] || photo : photo
  const hasPrev = photos && currentIndex > 0
  const hasNext = photos && currentIndex < photos.length - 1

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex(i => i - 1)
  }, [hasPrev])

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex(i => i + 1)
  }, [hasNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          router.back()
          break
        case 'ArrowLeft':
          goPrev()
          break
        case 'ArrowRight':
          goNext()
          break
        case 'i':
          setShowInspector(prev => !prev)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, goPrev, goNext])

  // Body scroll lock
  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex bg-background/95 backdrop-blur-sm">
      {/* Main image area */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Close button -- top left */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 rounded-full bg-foreground/10 hover:bg-foreground/20"
          onClick={() => router.back()}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Toggle inspector -- top right (desktop) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 rounded-full bg-foreground/10 hover:bg-foreground/20 hidden lg:flex"
          onClick={() => setShowInspector(!showInspector)}
        >
          <Info className="h-5 w-5" />
        </Button>

        {/* Previous button */}
        {hasPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-foreground/10 hover:bg-foreground/20"
            onClick={goPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}

        {/* Next button */}
        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-foreground/10 hover:bg-foreground/20"
            onClick={goNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}

        {/* Photo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'relative max-h-[90vh] max-w-[90vw]',
              showInspector && 'lg:max-w-[calc(100vw-360px)]'
            )}
          >
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.title || ''}
              width={currentPhoto.width}
              height={currentPhoto.height}
              className="max-h-[90vh] w-auto object-contain"
              priority
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Inspector sidebar -- desktop only, togglable */}
      {showInspector && (
        <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <h2 className="font-display text-xl font-semibold">{currentPhoto.title}</h2>

            {/* Camera & lens */}
            {currentPhoto.exif && (
              <>
                {(currentPhoto.exif.make || currentPhoto.exif.model) && (
                  <p className="text-sm text-muted-foreground">
                    {[currentPhoto.exif.make, currentPhoto.exif.model].filter(Boolean).join(' ')}
                  </p>
                )}
                {currentPhoto.exif.lens_model && (
                  <p className="text-sm text-muted-foreground">{currentPhoto.exif.lens_model}</p>
                )}

                {/* EXIF grid -- 2x2 */}
                <div className="grid grid-cols-2 gap-2">
                  {currentPhoto.exif.focal_length && (
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Focal Length</p>
                      <p className="text-sm font-medium">{currentPhoto.exif.focal_length}</p>
                    </div>
                  )}
                  {currentPhoto.exif.f_number && (
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Aperture</p>
                      <p className="text-sm font-medium">{currentPhoto.exif.f_number}</p>
                    </div>
                  )}
                  {currentPhoto.exif.exposure_time && (
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Shutter</p>
                      <p className="text-sm font-medium">{currentPhoto.exif.exposure_time}</p>
                    </div>
                  )}
                  {currentPhoto.exif.iso_speed_rating && (
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">ISO</p>
                      <p className="text-sm font-medium">{currentPhoto.exif.iso_speed_rating}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Date */}
            {currentPhoto.exif?.data_time && (
              <p className="text-sm text-muted-foreground">{currentPhoto.exif.data_time}</p>
            )}

            {/* Description */}
            {currentPhoto.detail && (
              <p className="text-sm text-foreground/80">{currentPhoto.detail}</p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
