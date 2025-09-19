'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useRef, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { Zoom } from 'yet-another-react-lightbox/plugins'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

/**
 * 渐进式图片展示组件，首先显示预览图，后台加载原始图片，当原始图片加载成功后替换预览图
 */
export default function ProgressiveImage(
  props: Readonly<ProgressiveImageProps>,
) {
  const t = useTranslations()
  
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highDipImageUrl, setHighDipImageUrl] = useState<string | null>(null)
  const [showLightbox,setShowLightbox] = useState(Boolean(props.showLightbox))
  const zoomRef = useRef(null)

  useEffect(() => {
    setShowLightbox(Boolean(props.showLightbox))
  }, [props.showLightbox])
  
  useEffect(() => {
    loadHighResolutionImage()
    return () => {
      if (highDipImageUrl) {
        // clean blob
        URL.revokeObjectURL(highDipImageUrl)
      }
    }
  }, [])

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
        setHighDipImageUrl(imgUrl)
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

  return (
    <div className="relative">
      {!highDipImageUrl ? (
        <Image
          className="object-contain md:max-h-[90vh]"
          src={props.previewUrl}
          overrideSrc={props.previewUrl}
          placeholder="blur"
          blurDataURL={dataURL}
          width={props.width}
          height={props.height}
          alt={props.alt || 'image'}
        />
      ) : (
        <img
          className="object-contain md:max-h-[90vh]"
          src={highDipImageUrl}
          width={props.width}
          height={props.height}
          alt={props.alt || 'image'}
        />
      )}

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

      {error && (
        <div className="absolute bottom-0 left-0 w-full">
          <div className="absolute bottom-2 right-2 text-white bg-black/60 text-w text-xs px-2 py-1 rounded  ">
            {error}
          </div>
        </div>
      )}

      <Lightbox
        open={showLightbox}
        close={() => {
          setShowLightbox(false)
          if (props.onShowLightboxChange) {
            props.onShowLightboxChange(false)
          }
        }}
        slides={showLightbox ? [{
          src: highDipImageUrl ? highDipImageUrl :props.previewUrl,
          alt: props.alt,
        }] : undefined}
        plugins={[Zoom]}
        zoom={{ ref: zoomRef }}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, .8)' } }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullUp: true,
          closeOnPullDown: true,
        }}
      />
    </div>
  )
}
