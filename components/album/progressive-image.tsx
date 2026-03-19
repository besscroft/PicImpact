'use client'

import type { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef, Activity } from 'react'
import { useTranslations } from 'next-intl'
import { MotionImage } from '~/components/album/motion-image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { WebGLImageViewer } from '~/components/album/webgl-viewer'
import type { WebGLImageViewerRef } from '~/components/album/webgl-viewer'
import { isWebGLSupported } from '~/lib/utils/webgl'

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

  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(!isMobile)
  const [error, setError] = useState<string | null>(null)
  const [highResImageUrl, setHighResImageUrl] = useState<string | null>(null)
  const [highResImageLoaded, setHighResImageLoaded] = useState(false)
  const [showFullScreenViewer, setShowFullScreenViewer] = useState(Boolean(props.showLightbox))
  const [webGLAvailable] = useState(() => isWebGLSupported())

  const webglViewerRef = useRef<WebGLImageViewerRef | null>(null)
  useEffect(() => {
    return () => {
      webglViewerRef.current?.destroy()
    }
  }, [])
  useEffect(() => {
    setShowFullScreenViewer(Boolean(props.showLightbox))
    // On mobile, load full-res only when lightbox is requested
    if (isMobile && props.showLightbox && !highResImageUrl && !isLoading) {
      loadHighResolutionImage()
    }
  }, [props.showLightbox])

  useEffect(() => {
    // On mobile, defer full-res loading until user requests lightbox
    if (!isMobile) {
      loadHighResolutionImage()
    }
    return () => {
      if (highResImageUrl) {
        URL.revokeObjectURL(highResImageUrl)
      }
    }
  }, [props.imageUrl])

  const loadHighResolutionImage = () => {
    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)

    const xhr = new XMLHttpRequest()
    xhr.open('GET', props.imageUrl, true)
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
          className="object-contain md:max-h-[90vh]"
          src={props.previewUrl}
          overrideSrc={props.previewUrl}
          placeholder="blur"
          unoptimized
          blurDataURL={dataURL}
          width={props.width}
          height={props.height}
          alt={props.alt || 'image'}
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
              onClick={() => {
                setShowFullScreenViewer(true)
                if (props.onShowLightboxChange) {
                  props.onShowLightboxChange(true)
                }
              }}
              onLoad={() => {
                setHighResImageLoaded(true)
              }}
            />
          </Activity>
          <Activity mode={showFullScreenViewer ? 'visible' : 'hidden'}>
            {webGLAvailable ? <div
              className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center"
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
            </div>}
          </Activity>
        </>
      ) : null}

    </div>
  )
}