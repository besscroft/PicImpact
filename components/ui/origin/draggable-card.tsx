'use client'

import { cn } from '~/lib/utils'
import React, { useRef, useState, useEffect } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useVelocity,
  useAnimationControls,
  useReducedMotion,
} from 'motion/react'
import { useIsMobile } from '~/hooks/use-mobile'

export const DraggableCardBody = ({
  className,
  children,
  style,
  onMouseDown,
}: {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
}) => {
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  // The 3D tilt + glare + per-pointer spring graph is only worth running for
  // pointer users who haven't asked for reduced motion. On mobile or with
  // reduced motion we keep the card draggable but drop the expensive tilt.
  const tiltEnabled = !isMobile && !prefersReducedMotion
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const controls = useAnimationControls()
  const [constraints, setConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  // Promote to a compositor layer only while the card is actually moving
  // (dragging or tilting on hover). Polaroid cards are not virtualized, so a
  // permanent `will-change` would create one idle compositor layer per card.
  const [isInteracting, setIsInteracting] = useState(false)

  // physics biatch
  const velocityX = useVelocity(mouseX)
  const velocityY = useVelocity(mouseY)

  const springConfig = {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  }

  const rotateX = useSpring(
    useTransform(mouseY, [-300, 300], [25, -25]),
    springConfig,
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-300, 300], [-25, 25]),
    springConfig,
  )

  const opacity = useSpring(
    useTransform(mouseX, [-300, 0, 300], [0.8, 1, 0.8]),
    springConfig,
  )

  const glareOpacity = useSpring(
    useTransform(mouseX, [-300, 0, 300], [0.2, 0, 0.2]),
    springConfig,
  )

  useEffect(() => {
    // Update constraints when component mounts or window resizes
    const updateConstraints = () => {
      const element = cardRef.current
      if (typeof window !== 'undefined' && element && element.offsetParent) {
        const { offsetLeft, offsetTop, offsetWidth, offsetHeight, offsetParent } = element
        const parentRect = offsetParent.getBoundingClientRect()

        // Calculate the center point relative to the viewport
        const initialCenterX = parentRect.left + offsetLeft + offsetWidth / 2
        const initialCenterY = parentRect.top + offsetTop + offsetHeight / 2

        setConstraints({
          top: -initialCenterY,
          bottom: window.innerHeight - initialCenterY,
          left: -initialCenterX,
          right: window.innerWidth - initialCenterX,
        })
      }
    }

    updateConstraints()

    // Add resize listener
    window.addEventListener('resize', updateConstraints)

    // Clean up
    return () => {
      window.removeEventListener('resize', updateConstraints)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return
    const { clientX, clientY } = e
    const { width, height, left, top } =
      cardRef.current?.getBoundingClientRect() ?? {
        width: 0,
        height: 0,
        left: 0,
        top: 0,
      }
    const centerX = left + width / 2
    const centerY = top + height / 2
    const deltaX = clientX - centerX
    const deltaY = clientY - centerY
    mouseX.set(deltaX)
    mouseY.set(deltaY)
  }

  const handleMouseEnter = () => {
    setIsInteracting(true)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsInteracting(false)
  }

  return (
    <motion.div
      ref={cardRef}
      drag
      dragConstraints={constraints}
      onMouseDown={onMouseDown}
      onDragStart={() => {
        document.body.style.cursor = 'grabbing'
        setIsInteracting(true)
      }}
      onDragEnd={(_event, info) => {
        document.body.style.cursor = 'default'
        setIsInteracting(false)

        if (tiltEnabled) {
          controls.start({
            rotateX: 0,
            rotateY: 0,
            transition: {
              type: 'spring',
              ...springConfig,
            },
          })
        }
        const currentVelocityX = velocityX.get()
        const currentVelocityY = velocityY.get()

        const velocityMagnitude = Math.sqrt(
          currentVelocityX * currentVelocityX +
          currentVelocityY * currentVelocityY,
        )
        const bounce = Math.min(0.8, velocityMagnitude / 1000)

        animate(info.point.x, info.point.x + currentVelocityX * 0.3, {
          duration: 0.8,
          ease: [0.2, 0, 0, 1],
          bounce,
          type: 'spring',
          stiffness: 50,
          damping: 15,
          mass: 0.8,
        })

        animate(info.point.y, info.point.y + currentVelocityY * 0.3, {
          duration: 0.8,
          ease: [0.2, 0, 0, 1],
          bounce,
          type: 'spring',
          stiffness: 50,
          damping: 15,
          mass: 0.8,
        })
      }}
      style={{
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        opacity: tiltEnabled ? opacity : 1,
        willChange: isInteracting ? 'transform' : undefined,
        ...style,
      }}
      animate={controls}
      whileHover={tiltEnabled ? { scale: 1.02 } : undefined}
      onMouseEnter={tiltEnabled ? handleMouseEnter : undefined}
      onMouseMove={tiltEnabled ? handleMouseMove : undefined}
      onMouseLeave={tiltEnabled ? handleMouseLeave : undefined}
      className={cn(
        'relative min-h-96 w-80 overflow-hidden rounded-md bg-neutral-100 p-6 shadow-2xl dark:bg-neutral-900',
        // transform-3d only matters while the tilt is active; dropping it avoids
        // creating a useless 3D rendering context per card otherwise.
        tiltEnabled && 'transform-3d',
        className,
      )}
    >
      {children}
      {tiltEnabled && (
        <motion.div
          style={{
            opacity: glareOpacity,
          }}
          className="pointer-events-none absolute inset-0 bg-white select-none"
        />
      )}
    </motion.div>
  )
}

export const DraggableCardContainer = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={cn('[perspective:3000px]', className)}>{children}</div>
  )
}
