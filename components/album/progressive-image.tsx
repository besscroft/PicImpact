'use client'

import type { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef } from 'react'
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
  
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highResImageUrl, setHighResImageUrl] = useState<string | null>(null)
  const [showWebGLViewer, setShowWebGLViewer] = useState(Boolean(props.showLightbox))
  const [webGLAvailable, setWebGLAvailable] = useState(true)
  
  const webglViewerRef = useRef<WebGLImageViewerRef | null>(null)

  useEffect(() => {
    setShowWebGLViewer(Boolean(props.showLightbox))
  }, [props.showLightbox])

  // 检测 WebGL 支持
  useEffect(() => {
    setWebGLAvailable(isWebGLSupported())
  }, [])
  
  useEffect(() => {
    loadHighResolutionImage()
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
    setShowWebGLViewer(false)
    if (props.onShowLightboxChange) {
      props.onShowLightboxChange(false)
    }
  }

  return (
    <div className="relative">
      {/* 预览图 - 在高清图未加载完成时显示 */}
      {!highResImageUrl ? (
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
      ) : (
        /* 高清图已加载 - 根据状态选择渲染方式 */
        <>
          {/* 普通预览模式 - 点击可打开全屏查看 */}
          {!showWebGLViewer && (
            <img
              className="object-contain md:max-h-[90vh] cursor-pointer"
              src={highResImageUrl}
              width={props.width}
              height={props.height}
              alt={props.alt || 'image'}
              onClick={() => {
                setShowWebGLViewer(true)
                if (props.onShowLightboxChange) {
                  props.onShowLightboxChange(true)
                }
              }}
            />
          )}
          
          {/* WebGL 全屏查看模式 */}
          {showWebGLViewer && webGLAvailable && (
            <div 
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
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
                className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
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
                  className="text-white"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {/* 操作提示 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none">
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
                  centerOnInit={true}
                  smooth={true}
                  debug={process.env.NODE_ENV === 'development'}
                />
              </div>
            </div>
          )}
          
          {/* WebGL 不可用时的 Fallback - 使用普通全屏图片 */}
          {showWebGLViewer && !webGLAvailable && (
            <div 
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center overflow-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseViewer()
                }
              }}
            >
              <button
                onClick={handleCloseViewer}
                className="absolute top-4 right-4 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
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
                  className="text-white"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {/* WebGL 不可用提示 */}
              <div className="absolute top-4 left-4 text-white/70 text-sm bg-black/50 px-3 py-1 rounded">
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
      )}

      {/* 加载进度条 */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 w-full">
          <div
            className="h-1 bg-blue-500"
            style={{ width: `${loadingProgress}%` }}
          ></div>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {loadingProgress}%
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-0 left-0 w-full">
          <div className="absolute bottom-2 right-2 text-white bg-black/60 text-xs px-2 py-1 rounded">
            {error}
          </div>
        </div>
      )}
    </div>
  )
}
