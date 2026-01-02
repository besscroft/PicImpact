'use client'

import { cn } from '~/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

interface CompressedHistogramData {
  red: number[]
  green: number[]
  blue: number[]
  luminance: number[]
}

interface HistogramData {
  red: number[]
  green: number[]
  blue: number[]
  luminance: number[]
}

const calculateHistogram = (imageData: ImageData): CompressedHistogramData => {
  const histogram: HistogramData = {
    red: Array.from({ length: 256 }).fill(0) as number[],
    green: Array.from({ length: 256 }).fill(0) as number[],
    blue: Array.from({ length: 256 }).fill(0) as number[],
    luminance: Array.from({ length: 256 }).fill(0) as number[],
  }

  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    histogram.red[r]++
    histogram.green[g]++
    histogram.blue[b]++
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    histogram.luminance[luminance]++
  }

  const compress = (channelData: number[]): number[] => {
    const compressed = Array.from({ length: 128 }).fill(0) as number[]
    for (let i = 0; i < 256; i++) {
      compressed[Math.floor(i / 2)] += channelData[i]
    }
    return compressed
  }

  return {
    red: compress(histogram.red),
    green: compress(histogram.green),
    blue: compress(histogram.blue),
    luminance: compress(histogram.luminance),
  }
}

const drawHistogram = (canvas: HTMLCanvasElement, histogram: CompressedHistogramData) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 获取 Canvas 的实际显示尺寸
  const rect = canvas.getBoundingClientRect()
  const { width, height } = rect
  const dpr = window.devicePixelRatio || 1

  // 设置高分辨率
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx.scale(dpr, dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 找到最大值用于归一化
  const maxVal = Math.max(...histogram.luminance, ...histogram.red, ...histogram.green, ...histogram.blue)

  if (maxVal === 0) return

  const padding = 0
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Apple 风格的颜色定义
  const colors = {
    red: 'rgb(255, 105, 97)',
    green: 'rgb(52, 199, 89)',
    blue: 'rgb(64, 156, 255)',
    luminance: 'rgba(255, 255, 255, 0.6)',
    background: 'rgba(28, 28, 30, 0.95)',
    grid: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
  }

  // 绘制背景
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  // 绘制极简网格
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 0.5

  // 只绘制几条关键的网格线
  for (let i = 1; i <= 3; i++) {
    const y = padding + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }

  // 绘制柱状图函数
  const drawBars = (data: number[], color: string, alpha = 1) => {
    const barWidth = chartWidth / data.length

    for (const [i, datum] of data.entries()) {
      const barHeight = (datum / maxVal) * chartHeight
      const x = padding + i * barWidth
      const y = height - padding - barHeight

      // 创建渐变
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding)

      // 正确处理颜色字符串转换
      let topColor: string
      let bottomColor: string

      if (color.startsWith('rgba')) {
        topColor = color.replace(/[\d.]+\)$/, `${alpha})`)
        bottomColor = color.replace(/[\d.]+\)$/, `${alpha * 0.1})`)
      } else if (color.startsWith('rgb')) {
        topColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
        bottomColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.1})`)
      } else {
        topColor = color
        bottomColor = color
      }

      gradient.addColorStop(0, topColor)
      gradient.addColorStop(1, bottomColor)

      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth * 0.8, barHeight)
    }
  }

  // 先绘制亮度通道作为背景
  drawBars(histogram.luminance, colors.luminance, 0.3)

  // 设置混合模式
  ctx.globalCompositeOperation = 'screen'

  // 绘制 RGB 通道
  drawBars(histogram.red, colors.red, 0.7)
  drawBars(histogram.green, colors.green, 0.7)
  drawBars(histogram.blue, colors.blue, 0.7)

  // 重置混合模式
  ctx.globalCompositeOperation = 'source-over'

  // 绘制边框
  ctx.strokeStyle = colors.border
  ctx.lineWidth = 1
  ctx.strokeRect(padding - 0.5, padding - 0.5, chartWidth + 1, chartHeight + 1)

  // 添加顶部高光
  const highlightGradient = ctx.createLinearGradient(0, 0, 0, height * 0.2)
  highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
  highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = highlightGradient
  ctx.fillRect(0, 0, width, height * 0.2)
}

interface HistogramChartProps {
  imageUrl: string
  className?: string
}

export default function HistogramChart({ imageUrl, className = '' }: Readonly<HistogramChartProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previousHistogramRef = useRef<CompressedHistogramData | null>(null)
  const animationRef = useRef<number | null>(null)
  const [histogram, setHistogram] = useState<CompressedHistogramData | null>(null)
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

      // 为了更好的性能，缩放图片到合适的大小
      const maxSize = 300
      const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight)
      const scaledWidth = Math.floor(img.naturalWidth * scale)
      const scaledHeight = Math.floor(img.naturalHeight * scale)

      canvas.width = scaledWidth
      canvas.height = scaledHeight
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

      try {
        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight)
        const calculatedHistogram = calculateHistogram(imageData)
        setHistogram(calculatedHistogram)
      } catch (e) {
        console.error('Error calculating histogram:', e)
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

  useEffect(() => {
    if (!histogram || !canvasRef.current) return

    const canvas = canvasRef.current

    // Cancel any ongoing animation before starting a new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    // If we don't have a previous histogram, draw immediately and set baseline
    if (!previousHistogramRef.current) {
      drawHistogram(canvas, histogram)
      previousHistogramRef.current = histogram
      return
    }

    const startAt = performance.now()
    const prev = previousHistogramRef.current

    // Spring parameters (slightly underdamped for natural feel)
    const frequency = 8
    const damping = 7
    const restDelta = 0.001
    const maxMs = 1200

    const springProgress = (tSec: number) => {
      const w = frequency
      const d = damping
      const exp = Math.exp(-d * tSec)
      const value = 1 - exp * (Math.cos(w * tSec) + (d / w) * Math.sin(w * tSec))
      return Math.max(0, Math.min(1, value))
    }

    const lerpArray = (from: number[], to: number[], p: number) => from.map((v, i) => v + (to[i] - v) * p)

    const frame = (now: number) => {
      const elapsedMs = now - startAt
      const tSec = elapsedMs / 1000
      const eased = springProgress(tSec)

      const interpolated: CompressedHistogramData = {
        red: lerpArray(prev.red, histogram.red, eased),
        green: lerpArray(prev.green, histogram.green, eased),
        blue: lerpArray(prev.blue, histogram.blue, eased),
        luminance: lerpArray(prev.luminance, histogram.luminance, eased),
      }

      drawHistogram(canvas, interpolated)

      const done = Math.abs(1 - eased) < restDelta || elapsedMs >= maxMs
      if (!done) {
        animationRef.current = requestAnimationFrame(frame)
      } else {
        previousHistogramRef.current = histogram
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(frame)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [histogram])

  return (
    <div className={cn('relative w-full h-32 group', className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-gray-900/80 backdrop-blur-xl">
          <div className="animate-spin text-xl text-white/70">⟳</div>
        </div>
      )}
      {needsCors && (
        <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-gray-900/80 backdrop-blur-xl">
          <div className="text-center px-4">
            <div className="text-xs text-gray-400">{t('Exif.histogramCorsError')}</div>
          </div>
        </div>
      )}
      {error && !needsCors && (
        <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-gray-900/80 backdrop-blur-xl">
          <div className="text-center">
            <div className="text-xs text-gray-400">{t('Exif.histogramError')}</div>
          </div>
        </div>
      )}
      {histogram && (
        <canvas
          ref={canvasRef}
          className={cn(
            'h-full w-full rounded-sm ring-1 ring-white/10 backdrop-blur-xl transition-all duration-200 group-hover:ring-white/20',
            loading && 'opacity-30',
          )}
        />
      )}
    </div>
  )
}
