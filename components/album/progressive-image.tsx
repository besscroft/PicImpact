'use client'

import type { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef, Activity } from 'react'
import { useTranslations } from 'next-intl'
import { MotionImage } from '~/components/album/motion-image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { WebGLImageViewer } from '~/components/album/webgl-viewer'
import type { WebGLImageViewerRef } from '~/components/album/webgl-viewer'
import { isWebGLSupported } from '~/lib/utils/webgl'
import { hasReadyVariants, makeVariantLoader } from '~/lib/image/loader'
import { useAvifSupport } from '~/hooks/use-avif-support'

// Width requested for the variant FALLBACK used only when a photo has no
// original URL; the loader clamps it to the largest generated tier (2560). The
// zoom viewer normally loads the original (see highResSource below).
const DETAIL_HIGH_RES_WIDTH = 2560

/**
 * 渐进式图片展示组件，支持 WebGL 高性能渲染
 * - 首先显示预览图
 * - 后台加载原始图片
 * - 加载完成后使用 WebGL 渲染器进行高性能缩放/平移
 * - 如果 WebGL 不可用，fallback 到普通图片显示
 */
export default function ProgressiveImage(
  props: Readonly<ProgressiveImageProps>,
) {
  const t = useTranslations()

  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highResImageUrl, setHighResImageUrl] = useState<string | null>(null)
  const [highResImageLoaded, setHighResImageLoaded] = useState(false)
  const [showFullScreenViewer, setShowFullScreenViewer] = useState(Boolean(props.showLightbox))
  // Latches true on the first full-screen open and stays true so the WebGL
  // viewer remains mounted across subsequent open/close (toggled only via CSS
  // visibility) — preserving its context + zoom/pan state. Lazily gates the
  // first mount so the engine isn't built until the user actually zooms.
  const [hasOpenedFullScreen, setHasOpenedFullScreen] = useState(Boolean(props.showLightbox))
  const [webGLAvailable] = useState(() => isWebGLSupported())
  const avifOk = useAvifSupport()

  // High-res source for the full-screen zoom viewer: the ORIGINAL, full-
  // resolution image. The zoom panel is where the user explicitly pixel-peeps,
  // so it must show native detail — the largest variant (≤2560) looks soft once
  // magnified past that width. This is loaded lazily, gated to the lightbox
  // actually opening (see below), so the multi-MB original is only fetched when
  // the user opts into zooming; the inline detail view keeps showing the
  // lightweight preview/variant and never pulls the original. Falls back to the
  // largest variant only if no original URL is available.
  const variantHighResSource = hasReadyVariants(props.imageKey, props.readyMaxWidth ?? 0, props.variantBaseUrl)
    ? makeVariantLoader({
        base: props.variantBaseUrl as string,
        imageKey: props.imageKey as string,
        readyMaxWidth: props.readyMaxWidth as number,
        format: avifOk ? 'avif' : 'webp',
      })({ src: props.imageKey as string, width: DETAIL_HIGH_RES_WIDTH })
    : ''
  const highResSource = props.imageUrl || variantHighResSource

  const webglViewerRef = useRef<WebGLImageViewerRef | null>(null)
  useEffect(() => {
    return () => {
      webglViewerRef.current?.destroy()
    }
  }, [])

  // Load the high-res image ONLY when the lightbox is actually opened — never
  // eagerly on mount. This stops the detail page from fetching a large image
  // just for being opened (and re-fetching on every open/close re-mount).
  useEffect(() => {
    if (props.showLightbox) {
      setShowFullScreenViewer(true)
      setHasOpenedFullScreen(true)
      if (!highResImageUrl && !isLoading) {
        loadHighResolutionImage()
      }
    }
  }, [props.showLightbox])

  // Revoke the object URL on unmount / source change.
  useEffect(() => {
    return () => {
      if (highResImageUrl) {
        URL.revokeObjectURL(highResImageUrl)
      }
    }
  }, [highResSource])

  // Open the full-screen viewer, loading the high-res image on demand.
  const openFullScreen = () => {
    setShowFullScreenViewer(true)
    setHasOpenedFullScreen(true)
    props.onShowLightboxChange?.(true)
    if (!highResImageUrl && !isLoading) {
      loadHighResolutionImage()
    }
  }

  const loadHighResolutionImage = () => {
    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)

    const xhr = new XMLHttpRequest()
    xhr.open('GET', highResSource, true)
    xhr.responseType = 'blob'

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100)
        setLoadingProgress(percentComplete)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const imgBlob = xhr.response
        const imgUrl = URL.createObjectURL(imgBlob)
        setHighResImageUrl(imgUrl)
        setIsLoading(false)
      } else {
        console.log(`image load error: ${xhr.status}`)
        setError(t('Tips.imageLoadFailed'))
        setIsLoading(false)
      }
    }
    xhr.onerror = () => {
      setError(t('Tips.imageLoadFailed'))
      setIsLoading(false)
    }
    xhr.send()
  }

  const dataURL = useBlurImageDataUrl(props.blurhash)

  const handleCloseViewer = () => {
    setShowFullScreenViewer(false)
    if (props.onShowLightboxChange) {
      props.onShowLightboxChange(false)
    }
  }

  return (
    <div className="relative">
      {/* 预览图 - 在高清图未加载完成时显示 */}
      <Activity mode={highResImageLoaded ? 'hidden' : 'visible'}>
        <MotionImage
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="object-contain md:max-h-[90vh] cursor-pointer"
          src={props.previewUrl}
          overrideSrc={props.previewUrl}
          placeholder="blur"
          unoptimized
          blurDataURL={dataURL}
          width={props.width}
          height={props.height}
          alt={props.alt || 'image'}
          onClick={openFullScreen}
        />
        {/* 加载进度条 */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full">
            <div
              className="h-1 bg-primary"
              style={{ width: `${loadingProgress}%` }}
            ></div>
            <div className="absolute bottom-2 right-2 bg-overlay text-foreground text-xs px-2 py-1 rounded">
              {loadingProgress}%
            </div>
          </div>
        )}
        {/* 错误提示 */}
        {error && (
          <div className="absolute bottom-0 left-0 w-full">
            <div className="absolute bottom-2 right-2 text-foreground bg-overlay text-xs px-2 py-1 rounded">
              {error}
            </div>
          </div>
        )}
      </Activity>
      {highResImageUrl ? (
        <>
          <Activity mode={highResImageLoaded && !showFullScreenViewer ? 'visible' : 'hidden'}>
            <img
              className="object-contain md:max-h-[90vh] cursor-pointer"
              src={highResImageUrl}
              width={props.width}
              height={props.height}
              alt={props.alt || 'image'}
              onClick={openFullScreen}
              onLoad={() => {
                setHighResImageLoaded(true)
              }}
            />
          </Activity>
          {/* Keep the full-screen viewer MOUNTED once it has been opened, and
              toggle it with CSS visibility rather than <Activity> or conditional
              mount/unmount. <Activity> runs the child's effect cleanup on hide
              (firing the WebGL engine's destroy()/loseContext() on every close →
              the 2nd-open crash); conditional unmount rebuilds the engine on every
              open (losing zoom/pan state + paying the re-creation cost). Staying
              mounted keeps one engine + WebGL context alive across open/close, so
              zoom/pan state is preserved and the context is reused — and destroy()
              only runs when ProgressiveImage itself unmounts (leaving the detail
              page), which keeps the FU-13 leak fix. `visibility:hidden` (not
              display:none) keeps the canvas sized so re-showing doesn't reset the
              view, and pointer-events are disabled while hidden so the invisible
              overlay never blocks the page. Mounted lazily on first open so the
              engine isn't built until the user actually zooms. */}
          {hasOpenedFullScreen && (
            webGLAvailable ? <div
              className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center"
              style={{ visibility: showFullScreenViewer ? 'visible' : 'hidden', pointerEvents: showFullScreenViewer ? 'auto' : 'none' }}
              onClick={(e) => {
                // 点击背景关闭
                if (e.target === e.currentTarget) {
                  handleCloseViewer()
                }
              }}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleCloseViewer}
                className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
                aria-label={t('Button.close')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* 操作提示 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-foreground/50 text-sm pointer-events-none">
                {t('Tips.zoomHint')}
              </div>

              {/* WebGL 图片查看器 */}
              <div className="w-full h-full">
                <WebGLImageViewer
                  ref={webglViewerRef}
                  src={highResImageUrl}
                  width={props.width}
                  height={props.height}
                  className="w-full h-full"
                  initialScale={1}
                  minScale={0.5}
                  maxScale={10}
                  limitToBounds={true}
                  smooth={true}
                  debug={process.env.NODE_ENV === 'development'}
                />
              </div>
            </div> : <div
              className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center overflow-auto"
              style={{ visibility: showFullScreenViewer ? 'visible' : 'hidden', pointerEvents: showFullScreenViewer ? 'auto' : 'none' }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseViewer()
                }
              }}
            >
              <button
                onClick={handleCloseViewer}
                className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors"
                aria-label={t('Button.close')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              {/* WebGL 不可用提示 */}
              <div className="absolute top-4 left-4 text-foreground/70 text-sm bg-overlay px-3 py-1 rounded">
                {t('Tips.webglUnavailable')}
              </div>
              <img
                className="max-w-full max-h-full object-contain"
                src={highResImageUrl}
                alt={props.alt || 'image'}
              />
            </div>
          )}
        </>
      ) : null}

    </div>
  )
}