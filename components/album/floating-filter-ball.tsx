'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, PanInfo } from 'motion/react'
import { useIsMobile } from '~/hooks/use-mobile'
import { useTranslations } from 'next-intl'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '~/lib/utils'
import CameraLensFilter from './camera-lens-filter'

interface FloatingFilterBallProps {
  album: string
  selectedCamera: string
  selectedLens: string
  onCameraChange: (camera: string) => void
  onLensChange: (lens: string) => void
  onReset: () => void
}

const BALL_SIZE = 48
const EDGE_MARGIN = 16
const STORAGE_KEY = 'floating-filter-ball-position'

interface Position {
  x: number
  y: number
}

function getDefaultPosition(): Position {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }
  return {
    x: window.innerWidth - BALL_SIZE - EDGE_MARGIN,
    y: window.innerHeight - BALL_SIZE - 120,
  }
}

function loadPosition(): Position | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return null
}

function savePosition(position: Position) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  } catch {
    // ignore
  }
}

function snapToEdge(x: number, y: number): Position {
  if (typeof window === 'undefined') {
    return { x, y }
  }
  const { innerWidth, innerHeight } = window
  const centerX = innerWidth / 2

  // Snap to left or right edge
  const newX = x < centerX 
    ? EDGE_MARGIN 
    : innerWidth - BALL_SIZE - EDGE_MARGIN

  // Keep within vertical bounds
  const newY = Math.max(
    EDGE_MARGIN,
    Math.min(y, innerHeight - BALL_SIZE - EDGE_MARGIN)
  )

  return { x: newX, y: newY }
}

export default function FloatingFilterBall({
  album,
  selectedCamera,
  selectedLens,
  onCameraChange,
  onLensChange,
  onReset,
}: FloatingFilterBallProps) {
  const isMobile = useIsMobile()
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })

  const hasActiveFilter = selectedCamera !== '' || selectedLens !== ''

  // Load saved position on mount
  useEffect(() => {
    setIsHydrated(true)
    const saved = loadPosition()
    if (saved) {
      // Validate saved position is still within bounds
      const snapped = snapToEdge(saved.x, saved.y)
      setPosition(snapped)
    } else {
      setPosition(getDefaultPosition())
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    if (!isHydrated) return
    const handleResize = () => {
      setPosition(prev => snapToEdge(prev.x, prev.y))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isHydrated])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    dragStartPos.current = { ...position }
  }, [position])

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newX = dragStartPos.current.x + info.offset.x
    const newY = dragStartPos.current.y + info.offset.y
    const snapped = snapToEdge(newX, newY)
    setPosition(snapped)
    savePosition(snapped)
    
    // Small delay to allow click events to be handled properly
    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }, [])

  const handleClick = useCallback(() => {
    if (!isDragging) {
      setIsOpen(true)
    }
  }, [isDragging])

  if (!isHydrated) {
    return null
  }

  const FilterContent = (
    <CameraLensFilter
      album={album}
      selectedCamera={selectedCamera}
      selectedLens={selectedLens}
      onCameraChange={onCameraChange}
      onLensChange={onLensChange}
      onReset={onReset}
    />
  )

  const BallButton = (
    <motion.div
      className={cn(
        'fixed z-50 flex items-center justify-center rounded-full',
        'bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm',
        'cursor-grab active:cursor-grabbing',
        'hover:bg-primary hover:scale-105 transition-colors',
        hasActiveFilter && 'ring-2 ring-offset-2 ring-primary'
      )}
      style={{
        width: BALL_SIZE,
        height: BALL_SIZE,
        left: position.x,
        top: position.y,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <SlidersHorizontal className="h-5 w-5" />
      {hasActiveFilter && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
      )}
    </motion.div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild onClick={handleClick}>
          {BallButton}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{t('Filter.title')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {FilterContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild onClick={handleClick}>
        {BallButton}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72" 
        side="left" 
        align="end"
        sideOffset={12}
      >
        {FilterContent}
      </PopoverContent>
    </Popover>
  )
}

