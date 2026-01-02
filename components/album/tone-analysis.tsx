'use client'

import { cn } from '~/lib/utils'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

// 影调类型定义
export type ToneType = 'low-key' | 'high-key' | 'normal' | 'high-contrast'

// 影调分析结果
export interface ToneAnalysisData {
  toneType: ToneType
  brightness: number // 0-100，平均亮度
  contrast: number // 0-100，对比度
  shadowRatio: number // 0-1，阴影区域占比
  highlightRatio: number // 0-1，高光区域占比
}

// 分析影调
function analyzeTone(imageData: ImageData): ToneAnalysisData {
  const { data } = imageData
  const luminanceValues: number[] = []

  // 计算每个像素的亮度值
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    luminanceValues.push(luminance)
  }

  const totalPixels = luminanceValues.length
  if (totalPixels === 0) {
    return {
      toneType: 'normal',
      brightness: 50,
      contrast: 50,
      shadowRatio: 0.33,
      highlightRatio: 0.33,
    }
  }

  // 计算平均亮度
  const sum = luminanceValues.reduce((acc, val) => acc + val, 0)
  const avgLuminance = sum / totalPixels
  const brightness = Math.round((avgLuminance / 255) * 100)

  // 计算标准差（对比度指标）
  const variance = luminanceValues.reduce((acc, val) => acc + Math.pow(val - avgLuminance, 2), 0) / totalPixels
  const stdDev = Math.sqrt(variance)
  const contrast = Math.min(100, Math.round((stdDev / 128) * 100))

  // 统计阴影和高光区域
  let shadowCount = 0
  let highlightCount = 0
  const shadowThreshold = 64 // 暗部阈值
  const highlightThreshold = 192 // 亮部阈值

  for (const lum of luminanceValues) {
    if (lum < shadowThreshold) {
      shadowCount++
    } else if (lum > highlightThreshold) {
      highlightCount++
    }
  }

  const shadowRatio = shadowCount / totalPixels
  const highlightRatio = highlightCount / totalPixels

  // 判断影调类型
  let toneType: ToneType

  if (contrast > 60) {
    toneType = 'high-contrast'
  } else if (brightness < 35 && shadowRatio > 0.4) {
    toneType = 'low-key'
  } else if (brightness > 65 && highlightRatio > 0.4) {
    toneType = 'high-key'
  } else {
    toneType = 'normal'
  }

  return {
    toneType,
    brightness,
    contrast,
    shadowRatio,
    highlightRatio,
  }
}

interface ToneAnalysisProps {
  imageUrl: string
  className?: string
}

export default function ToneAnalysis({ imageUrl, className = '' }: Readonly<ToneAnalysisProps>) {
  const [toneData, setToneData] = useState<ToneAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [needsCors, setNeedsCors] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    if (!imageUrl) {
      setError(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setNeedsCors(false)

    // 检查是否为同源 URL
    const isSameOrigin = (() => {
      try {
        const url = new URL(imageUrl, window.location.origin)
        return url.origin === window.location.origin
      } catch {
        return imageUrl.startsWith('/') || imageUrl.startsWith('./')
      }
    })()

    const img = new Image()
    // 跨域图片需要设置 crossOrigin，但服务器也需要配置 CORS
    if (!isSameOrigin) {
      img.crossOrigin = 'anonymous'
    }
    // 添加时间戳绕过缓存，确保获取带 CORS 头的新响应
    const urlWithCache = isSameOrigin ? imageUrl : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
    img.src = urlWithCache

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        setError(true)
        setLoading(false)
        return
      }

      // 缩放图片以提高性能
      const maxSize = 200
      const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight)
      const scaledWidth = Math.floor(img.naturalWidth * scale)
      const scaledHeight = Math.floor(img.naturalHeight * scale)

      canvas.width = scaledWidth
      canvas.height = scaledHeight
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

      try {
        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight)
        const analysis = analyzeTone(imageData)
        setToneData(analysis)
      } catch (e) {
        console.error('Error analyzing tone:', e)
        // 检查是否是 CORS/tainted canvas 错误
        if (e instanceof DOMException && e.name === 'SecurityError') {
          setNeedsCors(true)
        } else {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    img.onerror = () => {
      // 如果是跨域图片加载失败，可能是 CORS 问题
      const isSameOrigin = (() => {
        try {
          const url = new URL(imageUrl, window.location.origin)
          return url.origin === window.location.origin
        } catch {
          return imageUrl.startsWith('/') || imageUrl.startsWith('./')
        }
      })()
      
      if (!isSameOrigin) {
        setNeedsCors(true)
      } else {
        setError(true)
      }
      setLoading(false)
    }
  }, [imageUrl])

  const getToneTypeLabel = (type: ToneType): string => {
    const labels: Record<ToneType, string> = {
      'low-key': t('Exif.toneLowKey'),
      'high-key': t('Exif.toneHighKey'),
      'normal': t('Exif.toneNormal'),
      'high-contrast': t('Exif.toneHighContrast'),
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-2', className)}>
        <div className="animate-spin text-sm text-gray-400">⟳</div>
      </div>
    )
  }

  if (needsCors) {
    return (
      <div className={cn('text-center py-2', className)}>
        <div className="text-xs text-gray-400">{t('Exif.toneAnalysisCorsError')}</div>
      </div>
    )
  }

  if (error || !toneData) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{t('Exif.toneType')}</span>
        <span className="dark:text-gray-50 text-gray-700 font-medium">{getToneTypeLabel(toneData.toneType)}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('Exif.brightness')}</span>
          <span className="dark:text-gray-50 text-gray-700">{toneData.brightness}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('Exif.contrast')}</span>
          <span className="dark:text-gray-50 text-gray-700">{toneData.contrast}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('Exif.shadowRatio')}</span>
          <span className="dark:text-gray-50 text-gray-700">{Math.round(toneData.shadowRatio * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">{t('Exif.highlightRatio')}</span>
          <span className="dark:text-gray-50 text-gray-700">{Math.round(toneData.highlightRatio * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
