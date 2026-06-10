'use client'

import type { GalleryDisplayConfig, ImageType } from '~/types'
import type { PreviewImageHandleProps } from '~/types/props'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { XIcon } from '~/components/icons/x'
import { Badge } from '~/components/ui/badge'
import { LanguagesIcon } from '~/components/icons/languages'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { usePhotoSequence } from '~/hooks/use-photo-sequence'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { hasReadyVariants, makeVariantLoader } from '~/lib/image/loader'
import { useAvifSupport } from '~/hooks/use-avif-support'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon } from '~/components/icons/chevron-left'
import { ChevronRightIcon } from '~/components/icons/chevron-right'
import { ExpandIcon } from '~/components/icons/expand'
import { useTranslations } from 'next-intl'
import ProgressiveImage from '~/components/album/progressive-image.tsx'
import TransitionOverlay from '~/components/album/transition-overlay'
import { motion } from 'motion/react'
import ToneAnalysis from '~/components/album/tone-analysis'
import HistogramChart from '~/components/album/histogram-chart'
import { Separator } from '~/components/ui/separator'
import { TelescopeIcon } from '~/components/icons/telescope'
import { FlaskIcon } from '~/components/icons/flask'
import { ScrollArea } from '~/components/ui/scroll-area'
import { AnimatedIconTrigger, mergeAnimatedTriggerProps } from '~/components/icons/animated-trigger'

// Row component for unified key-value display
function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-foreground">{value}</span>
    </div>
  )
}

// Badge component for capture parameters
function ParamBadge({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3">
      {icon}
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  )
}

// Section title component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
      {children}
    </h4>
  )
}

// Off-budget carousel slides (beyond the load radius) render only the decoded
// blurhash at the photo's aspect ratio — no variant request — so a large album
// never fans out into dozens of concurrent image loads.
function PlaceholderSlide({ blurhash, width, height }: { blurhash: string; width?: number; height?: number }) {
  const dataUrl = useBlurImageDataUrl(blurhash)
  return (
    <div
      aria-hidden
      className="w-full sm:max-h-[90vh]"
      style={{
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
        backgroundImage: dataUrl ? `url(${dataUrl})` : undefined,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    />
  )
}

// One strip thumbnail. Smallest variant tier (320, via width 96) for a 48px
// cell — NOT the full-resolution preview_url (decoding ~30MP per thumbnail on
// open was the detail-view jank). Cascade follows blur-image.tsx: variant →
// decoded blurhash; onError steps down to blurhash, never up to the original.
function StripThumb({ photo, variantBaseUrl, avifOk }: { photo: ImageType; variantBaseUrl: string; avifOk: boolean }) {
  const [failed, setFailed] = useState(false)
  const blur = useBlurImageDataUrl(photo.blurhash)
  const ready = !failed && hasReadyVariants(photo.image_key, photo.ready_max_width, variantBaseUrl)
  if (ready) {
    const src = makeVariantLoader({
      base: variantBaseUrl,
      imageKey: photo.image_key,
      readyMaxWidth: photo.ready_max_width,
      format: avifOk ? 'avif' : 'webp',
    })({ src: photo.image_key, width: 96 })
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    )
  }
  return <div aria-hidden className="h-full w-full bg-cover bg-center" style={{ backgroundImage: blur ? `url(${blur})` : undefined }} />
}

// Bottom thumbnail strip — a horizontally scrollable row over the album window,
// the active photo ringed and auto-centered. Clicking jumps the carousel there.
// Plain <img>/blurhash only (no WebGL), and it reuses the same windowed `photos`
// the carousel already holds, so it adds no fetches.
function ThumbnailStrip({ photos, activeIndex, variantBaseUrl, onSelect }: { photos: ImageType[]; activeIndex: number; variantBaseUrl: string; onSelect: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const avifOk = useAvifSupport()
  useEffect(() => {
    // Defer the scroll past the commit so reading layout doesn't force a
    // synchronous reflow on every switch; 'auto' (instant) keeps the active
    // thumbnail centered without a per-switch smooth-scroll animation.
    const raf = requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>('[data-active="true"]')
        ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' })
    })
    return () => cancelAnimationFrame(raf)
  }, [activeIndex])
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center px-2">
      <div
        ref={ref}
        className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto rounded-xl bg-background/60 p-1.5 backdrop-blur-md scrollbar-hide"
      >
        {photos.map((p, i) => {
          const active = i === activeIndex
          return (
            <button
              key={p.id}
              type="button"
              data-active={active}
              aria-current={active}
              aria-label={`View photo ${i + 1}`}
              onClick={() => onSelect(i)}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '48px 48px' } as React.CSSProperties}
              className={cn(
                'relative size-12 shrink-0 overflow-hidden rounded-md transition-all',
                active ? 'opacity-100 ring-2 ring-primary' : 'opacity-50 hover:opacity-90',
              )}
            >
              <StripThumb photo={p} variantBaseUrl={variantBaseUrl} avifOk={avifOk} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const { photos, index, current, hasPrev, hasNext, setIndex } = usePhotoSequence({
    album: props.data?.album_value,
    initialWindow: props.initialWindow,
    fallback: props.data,
  })
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', current?.url ?? ''], null)
  const [lightboxPhoto, setLightboxPhoto] = useState<boolean>(false)
  // GL-context LRU: ids of recently-zoomed photos whose WebGL viewer stays
  // mounted (hard cap 3). Opening zoom bumps a photo to the front; one that falls
  // off the tail gets keepViewerMounted=false → its viewer unmounts and releases
  // its GL context. The current photo is always most-recently-opened (front), so
  // it is never evicted. This caps live contexts at ≤3 — well under the browser
  // limit — on top of the ±loadRadius unmount that already bounds them.
  const VIEWER_LRU_CAP = 3
  const [zoomLru, setZoomLru] = useState<string[]>([])
  const bumpZoomLru = useCallback((id: string) => {
    setZoomLru((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, VIEWER_LRU_CAP))
  }, [])
  // Exit transition: fade the detail view out, then navigate (deferred-nav), so
  // closing isn't a hard cut back to the grid.
  const [closing, setClosing] = useState(false)

  // Detail-view carousel: the image area is an embla carousel over the windowed
  // album slice. The metadata panel + zoom always follow `current` (the settled
  // slide). Drag is disabled while zoomed so the WebGL viewer owns the gesture.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center', startIndex: index, watchDrag: !lightboxPhoto })
  // Only neighbors within this radius render their image (variant); farther
  // slides stay blurhash placeholders. This *is* the adjacent-prefetch budget —
  // tighter on mobile to cap memory (see the AVIF double-load fix).
  const [loadRadius, setLoadRadius] = useState(2)
  const indexRef = useRef(index)
  indexRef.current = index
  const photosRef = useRef(photos)
  photosRef.current = photos
  const currentIdRef = useRef(current?.id)
  currentIdRef.current = current?.id
  const lastSettledRef = useRef(index)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const apply = () => setLoadRadius(mq.matches ? 1 : 2)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // The settled slide is the source of truth: sync the index, drop any open zoom,
  // and shallow-update the URL (history.replaceState — no server re-render) so
  // every photo is shareable/back-navigable. Ignore no-op settles from reInit
  // (same index) so paging in more photos / toggling zoom never self-closes.
  const onSettle = useCallback(() => {
    if (!emblaApi) return
    const i = emblaApi.selectedScrollSnap()
    // A reInit settles at the index we just stored in lastSettledRef (the current
    // photo), so it lands here as a no-op. Only a genuine user settle to a new
    // slide gets past this to sync index / drop zoom / write the URL. (We rely on
    // lastSettledRef, NOT a "programmatic" flag — a flag could stick if a reInit
    // emitted no settle and then swallow the user's next real navigation.)
    if (i === lastSettledRef.current) return
    lastSettledRef.current = i
    setIndex(i)
    setLightboxPhoto(false)
    const photo = photosRef.current[i]
    if (photo && typeof window !== 'undefined') {
      window.history.replaceState(window.history.state, '', `/preview/${photo.id}`)
    }
  }, [emblaApi, setIndex])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('settle', onSettle)
    return () => { emblaApi.off('settle', onSettle) }
  }, [emblaApi, onSettle])

  // Re-measure + re-center when the window pages in more photos (prepend shifts
  // the index) or when zoom toggles drag. `index` is read fresh via ref so a
  // user swipe is never fought by a reInit.
  useEffect(() => {
    if (!emblaApi) return
    // Re-center on the current photo's *identity*, not a cached index — a
    // prepend shifts every index, but findIndex keeps the same photo centered.
    const found = currentIdRef.current ? photosRef.current.findIndex((p) => p.id === currentIdRef.current) : -1
    const startIndex = found >= 0 ? found : indexRef.current
    lastSettledRef.current = startIndex
    emblaApi.reInit({ loop: false, align: 'center', startIndex, watchDrag: !lightboxPhoto })
  }, [emblaApi, photos.length, lightboxPhoto])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (lightboxPhoto) return
      if (e.key === 'ArrowLeft') emblaApi?.scrollPrev()
      else if (e.key === 'ArrowRight') emblaApi?.scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [emblaApi, lightboxPhoto])

  const exifIconClass = 'text-muted-foreground hover:text-primary transition-colors'
  const badgeIconClass = 'shrink-0 text-primary/60'

  const emptyConfig: GalleryDisplayConfig = {
    customIndexDownloadEnable: false,
    customIndexOriginEnable: false,
  }
  const { data: configData } = useSwrHydrated<GalleryDisplayConfig>({
    handle: props.configHandle ?? (async () => emptyConfig),
    args: 'system-config',
  })

  // Format date time
  const formattedDateTime = useMemo(() => {
    if (!current?.exif?.dateTime) return null
    const parsed = dayjs(current.exif.dateTime, 'YYYY:MM:DD HH:mm:ss')
    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : current.exif.dateTime
  }, [current?.exif?.dateTime])

  // Calculate file info
  const dimensions = useMemo(() => {
    if (current?.width && current?.height) {
      return `${current.width} × ${current.height}`
    }
    return null
  }, [current?.width, current?.height])

  const megaPixels = useMemo(() => {
    if (current?.width && current?.height) {
      return `${((current.width * current.height) / 1_000_000).toFixed(1)} MP`
    }
    return null
  }, [current?.width, current?.height])

  // Image URL for tone analysis and histogram
  const imageUrl = current?.preview_url || current?.url || ''

  // Debounce the histogram/tone source: those run an image-load + getImageData +
  // full-pixel scan, wasteful to fire for every photo flashed past during fast
  // switching. Initialised to the opened photo (so it shows immediately on open,
  // no pop-in), then only updated once switching settles for a short idle — so a
  // fast swipe through 10 photos analyses just the one you stop on.
  const [deferredImageUrl, setDeferredImageUrl] = useState(imageUrl)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setTimeout(() => setDeferredImageUrl(imageUrl), 220)
    return () => window.clearTimeout(id)
  }, [imageUrl])

  const navigateAway = () => {
    if (window != undefined) {
      if (window.history.length > 1) {
        router.back()
        return
      }
    }
    if (current?.album_value) {
      router.push(`${current.album_value}`)
    } else {
      router.push('/')
    }
  }

  // Trigger the exit fade; the actual navigation runs when it completes.
  const handleClose = () => {
    if (closing) return
    setClosing(true)
  }

  const handleDownload = async () => {
    setDownload(true)
    try {
      let msg = t('Tips.downloadStart')
      if (current?.album_license != null) {
        msg += t('Tips.downloadLicense', { license: current.album_license })
      }

      toast.warning(msg, { duration: 1500 })

      // 获取存储类型
      const storageType = current?.url?.includes('s3') ? 's3' : 'r2'

      // 读取直接下载配置，决定走二进制 blob 端点还是 presigned URL 端点
      const flagsResponse = await fetch('/api/public/download/config')
      const flagsJson = flagsResponse.ok ? await flagsResponse.json() : null
      const directDownload = storageType === 's3'
        ? Boolean(flagsJson?.data?.s3DirectDownload)
        : Boolean(flagsJson?.data?.r2DirectDownload)

      let blob: Blob
      let filename: string

      if (directDownload) {
        // 直接下载模式：从 presigned 端点拿到 URL 后由浏览器拉对象存储
        const presignedResponse = await fetch(`/api/public/download/${current?.id}/presigned?storage=${storageType}`)
        if (!presignedResponse.ok) throw new Error('presigned request failed')
        const presignedJson = await presignedResponse.json()
        const data = presignedJson?.data
        if (!data?.url) throw new Error('presigned response missing url')
        filename = decodeURIComponent(data.filename || 'download.jpg')
        const objectResponse = await fetch(data.url)
        if (!objectResponse.ok) throw new Error('object fetch failed')
        blob = await objectResponse.blob()
      } else {
        // 代理下载模式：服务端返回二进制 blob，文件名从 Content-Disposition 取
        const binaryResponse = await fetch(`/api/public/download/${current?.id}?storage=${storageType}`)
        if (!binaryResponse.ok) throw new Error('download request failed')
        const contentDisposition = binaryResponse.headers.get('content-disposition')
        let parsedFilename = 'download'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
          if (filenameMatch) {
            parsedFilename = decodeURIComponent(filenameMatch[1])
          }
        }
        blob = await binaryResponse.blob()
        filename = parsedFilename
      }

      const objectUrl = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('Tips.loading')}</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col overflow-y-auto scrollbar-hide h-full rounded-none! max-w-none gap-0 p-2"
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onAnimationComplete={() => { if (closing) navigateAway() }}
    >
      <TransitionOverlay />
      <div className="relative h-full flex flex-col space-y-2 sm:grid sm:gap-4 sm:grid-cols-3 w-full">
        <div className="show-up-motion relative sm:col-span-2 sm:flex sm:justify-center sm:max-h-[90vh] select-none">
          <div className="overflow-hidden w-full" ref={emblaRef}>
            <div className="flex h-full">
              {photos.map((photo, i) => {
                const near = Math.abs(i - index) <= loadRadius
                const isCurrent = i === index
                return (
                  <div
                    key={photo.id}
                    data-flip-target={isCurrent ? '' : undefined}
                    className="relative flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center sm:max-h-[90vh]"
                  >
                    {near ? (
                      photo.type === 1 ? (
                        <ProgressiveImage
                          key={photo.id}
                          imageUrl={photo.url}
                          previewUrl={photo.preview_url}
                          alt={photo.title}
                          height={photo.height}
                          width={photo.width}
                          blurhash={photo.blurhash}
                          imageKey={photo.image_key}
                          readyMaxWidth={photo.ready_max_width}
                          variantBaseUrl={configData?.variantBaseUrl ?? ''}
                          keepViewerMounted={zoomLru.includes(photo.id)}
                          showLightbox={isCurrent && lightboxPhoto}
                          onShowLightboxChange={isCurrent ? ((value) => { setLightboxPhoto(value); if (value) bumpZoomLru(photo.id) }) : undefined}
                        />
                      ) : (
                        <LivePhoto
                          url={photo.preview_url || photo.url}
                          videoUrl={photo.video_url}
                          className="md:h-[90vh] md:max-h-[90vh]"
                        />
                      )
                    ) : (
                      // Only decode the real blurhash for slides near the current one;
                      // farther off-screen slides pass '' (→ one shared cached default
                      // decode) so opening a large album doesn't decode ~20 thumbhashes.
                      <PlaceholderSlide
                        blurhash={Math.abs(i - index) <= loadRadius + 2 ? photo.blurhash : ''}
                        width={photo.width}
                        height={photo.height}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {hasPrev && (
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-30 hidden backdrop-blur text-gray-300 rounded-full items-center justify-center sm:flex"
            >
              <ChevronLeftIcon className='!bg-transparent hover:!bg-transparent' size={22} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-30 hidden backdrop-blur text-gray-300 rounded-full items-center justify-center sm:flex"
            >
              <ChevronRightIcon className='!bg-transparent hover:!bg-transparent' size={22} />
            </button>
          )}
          {photos.length > 1 && !lightboxPhoto && (
            <ThumbnailStrip
              photos={photos}
              activeIndex={index}
              variantBaseUrl={configData?.variantBaseUrl ?? ''}
              onSelect={(i) => emblaApi?.scrollTo(i)}
            />
          )}
        </div>

        {/* Right side panel with all EXIF info */}
        <ScrollArea className="sm:max-h-[90vh]">
          <div className="flex w-full flex-col space-y-6 pr-4">
            {/* Header with title and close button */}
            <div className="flex items-center justify-between">
              <div className="flex-1 font-display font-semibold text-lg">{current?.title}</div>
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <button
                    onClick={handleClose}
                    className="z-50"
                    aria-label={t('Button.goBack')}
                    {...mergeAnimatedTriggerProps({}, triggerProps)}
                  >
                    <XIcon ref={iconRef} className={exifIconClass} size={18} />
                  </button>
                )}
              </AnimatedIconTrigger>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <button
                    aria-label="Copy link"
                    className="inline-flex items-center justify-center cursor-pointer"
                    onClick={async () => {
                      try {
                        const url = current?.url
                        await navigator.clipboard.writeText(url)
                        let msg = t('Tips.copyImageSuccess')
                        if (current?.album_license != null) {
                          msg = t('Tips.downloadLicense', { license: current?.album_license })
                        }
                        toast.success(msg, { duration: 1500 })
                      } catch {
                        toast.error(t('Tips.copyImageFailed'), { duration: 500 })
                      }
                    }}
                    {...mergeAnimatedTriggerProps({}, triggerProps)}
                  >
                    <CopyIcon
                      ref={iconRef}
                      className={cn(exifIconClass, 'cursor-pointer')}
                      size={20}
                    />
                  </button>
                )}
              </AnimatedIconTrigger>
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <button
                    aria-label="Copy share link"
                    className="inline-flex items-center justify-center cursor-pointer"
                    onClick={async () => {
                      try {
                        const url = window.location.origin + '/preview/' + current.id
                        await navigator.clipboard.writeText(url)
                        toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
                      } catch {
                        toast.error(t('Tips.copyShareFailed'), { duration: 500 })
                      }
                    }}
                    {...mergeAnimatedTriggerProps({}, triggerProps)}
                  >
                    <LinkIcon
                      ref={iconRef}
                      className={cn(exifIconClass, 'cursor-pointer')}
                      size={20}
                    />
                  </button>
                )}
              </AnimatedIconTrigger>
              {configData?.customIndexDownloadEnable === true
                && <>
                  {download ?
                    <RefreshCWIcon
                      className={cn(exifIconClass, 'animate-spin cursor-not-allowed')}
                      size={20}
                    /> :
                    <AnimatedIconTrigger>
                      {({ iconRef, triggerProps }) => (
                        <button
                          aria-label="Download"
                          className="inline-flex items-center justify-center cursor-pointer"
                          onClick={() => handleDownload()}
                          {...mergeAnimatedTriggerProps({}, triggerProps)}
                        >
                          <DownloadIcon
                            ref={iconRef}
                            className={cn(exifIconClass, 'cursor-pointer')}
                            size={20}
                          />
                        </button>
                      )}
                    </AnimatedIconTrigger>
                  }
                </>
              }
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <button
                    aria-label="View fullscreen"
                    className="inline-flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setLightboxPhoto(true)
                    }}
                    {...mergeAnimatedTriggerProps({}, triggerProps)}
                  >
                    <ExpandIcon
                      ref={iconRef}
                      className={cn(exifIconClass, 'cursor-pointer')}
                      size={20}
                    />
                  </button>
                )}
              </AnimatedIconTrigger>
            </div>

            <Separator className="bg-border" />

            {/* Basic Information */}
            <div>
              <SectionTitle>{t('Exif.basicInfo')}</SectionTitle>
              <div className="space-y-1">
                {dimensions && <Row label={t('Exif.dimensions')} value={dimensions} />}
                {megaPixels && <Row label={t('Exif.pixels')} value={megaPixels} />}
                <Row label={t('Exif.captureTime')} value={formattedDateTime} />
                {current?.exif?.color_space && (
                  <Row label={t('Exif.colorSpace')} value={current.exif.color_space} />
                )}
              </div>
            </div>

            {/* Capture Parameters - Badge style */}
            {(current?.exif?.focal_length || current?.exif?.f_number || 
              current?.exif?.exposure_time || current?.exif?.iso_speed_rating) && (
              <div>
                <SectionTitle>{t('Exif.captureParams')}</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  {current?.exif?.focal_length && (
                    <ParamBadge 
                      icon={<CrosshairIcon className={badgeIconClass} size={14} />}
                      value={current.exif.focal_length}
                    />
                  )}
                  {current?.exif?.f_number && (
                    <ParamBadge 
                      icon={<ApertureIcon className={badgeIconClass} size={14} />}
                      value={current.exif.f_number}
                    />
                  )}
                  {current?.exif?.exposure_time && (
                    <ParamBadge 
                      icon={<TimerIcon className={badgeIconClass} size={14} />}
                      value={current.exif.exposure_time}
                    />
                  )}
                  {current?.exif?.iso_speed_rating && (
                    <ParamBadge 
                      icon={<GaugeIcon className={badgeIconClass} size={14} />}
                      value={`ISO ${current.exif.iso_speed_rating}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tone Analysis */}
            {deferredImageUrl && (
              <div>
                <SectionTitle>{t('Exif.toneAnalysis')}</SectionTitle>
                <ToneAnalysis imageUrl={deferredImageUrl} />
              </div>
            )}

            {/* Histogram */}
            {deferredImageUrl && (
              <div>
                <SectionTitle>{t('Exif.histogram')}</SectionTitle>
                <HistogramChart imageUrl={deferredImageUrl} />
              </div>
            )}

            {/* Device Information */}
            {(current?.exif?.make || current?.exif?.model || current?.exif?.lens_model) && (
              <div>
                <SectionTitle>{t('Exif.deviceInfo')}</SectionTitle>
                <div className="space-y-1.5">
                  {current?.exif?.make && current?.exif?.model && (
                    <div className="flex items-center gap-2">
                      <CameraIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-foreground">
                        {`${current.exif.make} ${current.exif.model}`}
                      </span>
                    </div>
                  )}
                  {current?.exif?.lens_model && (
                    <div className="flex items-center gap-2">
                      <TelescopeIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-foreground">
                        {current.exif.lens_model}
                      </span>
                    </div>
                  )}
                  {current?.exif?.focal_length && (
                    <Row label={t('Exif.focalLength')} value={current.exif.focal_length} />
                  )}
                </div>
              </div>
            )}

            {/* Capture Mode */}
            {(current?.exif?.exposure_mode || current?.exif?.exposure_program ||
              current?.exif?.white_balance) && (
              <div>
                <SectionTitle>{t('Exif.captureMode')}</SectionTitle>
                <div className="space-y-1">
                  {current?.exif?.exposure_program && (
                    <Row label={t('Exif.exposureProgram')} value={current.exif.exposure_program} />
                  )}
                  <Row label={t('Exif.exposureMode')} value={current?.exif?.exposure_mode} />
                  <Row label={t('Exif.whiteBalance')} value={current?.exif?.white_balance} />
                  {current?.exif?.color_space && (
                    <div className="flex items-center gap-2">
                      <FlaskIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-foreground">
                        {current.exif.color_space}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Parameters */}
            {(current?.exif?.bits || current?.exif?.cfa_pattern) && (
              <div>
                <SectionTitle>{t('Exif.technicalParams')}</SectionTitle>
                <div className="space-y-1">
                  {current?.exif?.bits && (
                    <Row label={t('Exif.bitDepth')} value={current.exif.bits} />
                  )}
                  {current?.exif?.cfa_pattern && (
                    <Row label={t('Exif.cfaPattern')} value={current.exif.cfa_pattern} />
                  )}
                </div>
              </div>
            )}

            {/* Labels/Tags */}
            {current?.labels && current.labels.length > 0 && (
              <div>
                <SectionTitle>{t('Exif.tags')}</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {current.labels.map((tag: string) => (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer border-primary/15 bg-primary/10 text-foreground hover:bg-primary/20 transition-colors"
                      key={tag}
                      onClick={() => {
                        router.push(`/tag/${tag}`)
                      }}
                    >{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {current?.detail && (
              <div>
                <div className="flex items-start gap-2">
                  <LanguagesIcon className={badgeIconClass} size={14} />
                  <p className="text-sm text-foreground text-wrap">
                    {current.detail}
                  </p>
                </div>
              </div>
            )}

            {/* Copy EXIF button */}
            <div className="flex w-full items-center justify-end pt-2">
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <button
                    className="flex items-center space-x-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                    onClick={async () => {
                      try {
                        const exif = JSON.stringify(current?.exif, null, 2)
                        await navigator.clipboard.writeText(exif)
                        toast.success(t('Exif.copySuccess'), { duration: 1500 })
                      } catch {
                        toast.error(t('Exif.copyFailed'), { duration: 500 })
                      }
                    }}
                    {...mergeAnimatedTriggerProps({}, triggerProps)}
                  >
                    <CopyIcon ref={iconRef} className={exifIconClass} size={16} />
                    <span>{t('Exif.copyExif')}</span>
                  </button>
                )}
              </AnimatedIconTrigger>
            </div>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
