'use client'

import { useMemo, useState, useRef, useCallback, memo } from 'react'
import type { HandleProps, ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { DraggableCardBody, DraggableCardContainer } from '~/components/ui/origin/draggable-card.tsx'
import type { ImageType } from '~/types'
import Image from 'next/image'
import { Skeleton } from '~/components/ui/skeleton'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { cn } from '~/lib/utils'

/**
 * 拍立得照片卡片组件
 * @param props - 包含图片数据、位置样式和点击处理函数
 */
const PolaroidCard = memo(function PolaroidCard({
  item,
  style,
  onMouseDown,
  zIndex,
}: {
  item: ImageType
  style: React.CSSProperties
  onMouseDown: (id: string) => void
  zIndex: number
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState(item.preview_url)
  const blurDataUrl = useBlurImageDataUrl(item.blurhash)

  // 如果缺少宽高数据，则跳过渲染以规避报错
  if (!item.width || !item.height || item.width <= 0 || item.height <= 0) {
    return null
  }

  // 定义 6 种相纸规格 (单位: mm)
  const POLAROID_STYLES = [
    { name: '富士MINI', cardW: 54, cardH: 86, imgW: 46, imgH: 62 },
    { name: '富士WIDE', cardW: 108, cardH: 86, imgW: 99, imgH: 62 },
    { name: '富士SQ', cardW: 72, cardH: 86, imgW: 62, imgH: 62 },
    { name: '宝丽来GO', cardW: 53.9, cardH: 66.6, imgW: 47, imgH: 46 },
    { name: '宝丽来宽幅', cardW: 103, cardH: 102, imgW: 92, imgH: 73 },
    { name: '宝丽来标准', cardW: 88.5, cardH: 107.5, imgW: 78.9, imgH: 76.8 },
  ]

  // 根据图片比例自动选择最合适的相纸
  const selectedStyle = useMemo(() => {
    const imgRatio = item.width / item.height
    return POLAROID_STYLES.reduce((prev, curr) => {
      const currRatio = curr.imgW / curr.imgH
      const prevRatio = prev.imgW / prev.imgH
      return Math.abs(imgRatio - currRatio) < Math.abs(imgRatio - prevRatio) ? curr : prev
    })
  }, [item.width, item.height])

  // 物理尺寸转像素比例 (1mm = 3.8px)
  const scale = 3.8
  const cardWidth = selectedStyle.cardW * scale
  const cardHeight = selectedStyle.cardH * scale
  const imgWidth = selectedStyle.imgW * scale
  const imgHeight = selectedStyle.imgH * scale

  // 计算边距 (通常左右居中，顶部边距等于侧边，剩余给底部)
  const paddingSide = (cardWidth - imgWidth) / 2
  const paddingTop = paddingSide
  const paddingBottom = cardHeight - imgHeight - paddingTop

  return (
    <DraggableCardBody
      className="absolute flex flex-col p-0 shadow-xl min-h-0 h-auto bg-white dark:bg-neutral-50 rounded-sm"
      style={{ 
        ...style, 
        zIndex, 
        width: `${cardWidth}px`, 
        height: `${cardHeight}px`,
        padding: `${paddingTop}px ${paddingSide}px ${paddingBottom}px ${paddingSide}px`
      }}
      onMouseDown={() => onMouseDown(item.id)}
    >
      <div 
        className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 shrink-0 w-full h-full shadow-inner"
      >
        {isLoading && (
          <Skeleton className="absolute inset-0 z-20 rounded-none" />
        )}
        <Image
          src={imgSrc}
          alt={item.title}
          width={Math.round(imgWidth)}
          height={Math.round(imgHeight)}
          className={cn(
            "pointer-events-none relative z-10 h-full w-full object-cover transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          placeholder="blur"
          blurDataURL={blurDataUrl}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (imgSrc !== item.url) {
              setImgSrc(item.url)
            }
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
      {/* 标题区域：绝对定位在底部留白处，不影响相纸尺寸 */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-2 overflow-hidden"
        style={{ height: `${paddingBottom}px` }}
      >
        <h3 className="w-full text-center text-sm font-medium text-neutral-600 dark:text-neutral-400 truncate opacity-80">
          {item.title}
        </h3>
      </div>
    </DraggableCardBody>
  )
})

/**
 * 拍立得画廊组件
 * @param props - 包含配置处理和图片加载处理
 */
export default function PolaroidGallery(props: Readonly<ImageHandleProps>) {
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  const customTitle = configData?.find((item: any) => item.config_key === 'custom_title')?.config_value.toString()

  const { data } = useSWRInfinite((index) => {
    return [`client-${props.args}-${index}-${props.album}`, index]
  },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  })

  const dataList = useMemo(() => data ? [].concat(...data) : [], [data])

  // 使用 ref 存储位置，确保数据追加时旧图片位置不变
  const positionsRef = useRef<Record<string, { top: string, left: string, rotate: string }>>({})

  const currentPositions = useMemo(() => {
    dataList.forEach((item: ImageType) => {
      if (!positionsRef.current[item.id]) {
        positionsRef.current[item.id] = {
          top: `${Math.floor(Math.random() * 40) + 10}%`, // 10% - 50%
          left: `${Math.floor(Math.random() * 50) + 10}%`, // 10% - 60%
          rotate: `${Math.floor(Math.random() * 20) - 10}deg`, // -10deg - 10deg
        }
      }
    })
    return positionsRef.current
  }, [dataList])

  const maxZIndexRef = useRef(10)
  const [cardZIndices, setCardZIndices] = useState<Record<string, number>>({})

  /**
   * 处理卡片点击，将其置于最顶层
   * @param id - 图片 ID
   */
  const handleCardClick = useCallback((id: string) => {
    maxZIndexRef.current += 1
    const newZIndex = maxZIndexRef.current
    setCardZIndices((prev) => ({
      ...prev,
      [id]: newZIndex,
    }))
  }, [])

  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
      <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        {customTitle || '瓦达西可不可爱'}
      </p>
      {dataList?.map((item: ImageType) => (
        <PolaroidCard
          key={item.id}
          item={item}
          style={currentPositions[item.id]}
          zIndex={cardZIndices[item.id] || 1}
          onMouseDown={handleCardClick}
        />
      ))}
    </DraggableCardContainer>
  )
}