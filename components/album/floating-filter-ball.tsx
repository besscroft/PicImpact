'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform, animate, useSpring } from 'motion/react'
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

// Clamp position to stay within screen bounds
function clampToBounds(posX: number, posY: number): Position {
  if (typeof window === 'undefined') {
    return { x: posX, y: posY }
  }
  const { innerWidth, innerHeight } = window

  // Keep within horizontal bounds
  const newX = Math.max(
    EDGE_MARGIN,
    Math.min(posX, innerWidth - BALL_SIZE - EDGE_MARGIN)
  )

  // Keep within vertical bounds
  const newY = Math.max(
    EDGE_MARGIN,
    Math.min(posY, innerHeight - BALL_SIZE - EDGE_MARGIN)
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
  const [isDragging, setIsDragging] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Use motion values for smooth GPU-accelerated animations
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Track velocity for rotation effect
  const dragVelocity = useRef({ x: 0, y: 0 })
  const rotateValue = useMotionValue(0)
  const smoothRotate = useSpring(rotateValue, { stiffness: 300, damping: 30 })
  
  // Scale spring for smooth scaling
  const scaleValue = useMotionValue(1)
  const smoothScale = useSpring(scaleValue, { stiffness: 400, damping: 25 })
  
  // Glow intensity based on dragging
  const glowOpacity = useMotionValue(0)
  const smoothGlow = useSpring(glowOpacity, { stiffness: 200, damping: 20 })
  
  // Pre-compute transforms (must be called before any conditional returns)
  const boxShadowTransform = useTransform(
    smoothGlow,
    [0, 1],
    [
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '0 0 20px 4px hsl(var(--primary) / 0.5), 0 0 40px 8px hsl(var(--primary) / 0.3), 0 8px 16px -4px rgb(0 0 0 / 0.2)'
    ]
  )
  const glowRingScale = useTransform(smoothGlow, [0, 1], [1, 1.5])
  const glowRingOpacity = useTransform(smoothGlow, [0, 1], [0, 0.6])
  const iconRotate = useTransform(smoothGlow, [0, 1], [0, 180])
  
  // Store position in ref to avoid re-renders during drag
  const positionRef = useRef<Position>({ x: 0, y: 0 })
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })

  const hasActiveFilter = selectedCamera !== '' || selectedLens !== ''

  // Load saved position on mount
  useEffect(() => {
    const saved = loadPosition()
    const initialPos = saved ? clampToBounds(saved.x, saved.y) : getDefaultPosition()
    positionRef.current = initialPos
    x.set(initialPos.x)
    y.set(initialPos.y)
    setIsHydrated(true)
  }, [x, y])

  // Handle window resize - debounced for better performance
  useEffect(() => {
    if (!isHydrated) return
    
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const clamped = clampToBounds(positionRef.current.x, positionRef.current.y)
        positionRef.current = clamped
        animate(x, clamped.x, { duration: 0.2 })
        animate(y, clamped.y, { duration: 0.2 })
      }, 100)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [isHydrated, x, y])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    dragStartPos.current = { x: x.get(), y: y.get() }
    // Activate glow effect
    glowOpacity.set(1)
    scaleValue.set(1.15)
  }, [x, y, glowOpacity, scaleValue])

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Update velocity for rotation effect
    dragVelocity.current = { x: info.velocity.x, y: info.velocity.y }
    
    // Calculate rotation based on horizontal velocity (tilt effect)
    const tiltAmount = Math.max(-15, Math.min(15, info.velocity.x * 0.02))
    rotateValue.set(tiltAmount)
  }, [rotateValue])

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newX = dragStartPos.current.x + info.offset.x
    const newY = dragStartPos.current.y + info.offset.y
    const clamped = clampToBounds(newX, newY)
    
    // Update ref and set final position
    positionRef.current = clamped
    x.set(clamped.x)
    y.set(clamped.y)
    
    // Reset rotation with spring animation
    rotateValue.set(0)
    // Deactivate glow effect
    glowOpacity.set(0)
    // Reset scale with a little bounce
    scaleValue.set(1)
    
    // Save position in next tick to avoid blocking
    requestAnimationFrame(() => savePosition(clamped))
    
    // Small delay to allow click events to be handled properly
    setTimeout(() => {
      setIsDragging(false)
    }, 100)
  }, [x, y, rotateValue, glowOpacity, scaleValue])

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
        'bg-primary/90 text-primary-foreground backdrop-blur-sm',
        'cursor-grab active:cursor-grabbing',
        'hover:bg-primary',
        hasActiveFilter && 'ring-2 ring-offset-2 ring-primary'
      )}
      style={{
        width: BALL_SIZE,
        height: BALL_SIZE,
        left: 0,
        top: 0,
        x,
        y,
        rotate: smoothRotate,
        scale: smoothScale,
        willChange: 'transform',
        boxShadow: boxShadowTransform,
      }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 25 },
      }}
    >
      {/* Animated glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        style={{
          scale: glowRingScale,
          opacity: glowRingOpacity,
        }}
      />
      
      {/* Icon with rotation animation */}
      <motion.div
        style={{
          rotate: iconRotate,
        }}
      >
        <SlidersHorizontal className="h-5 w-5 relative z-10" />
      </motion.div>
      
      {/* Active filter indicator with pulse */}
      {hasActiveFilter && (
        <motion.span 
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
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

