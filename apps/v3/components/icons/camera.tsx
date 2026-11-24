'use client'

import type React from 'react'

import { motion, useAnimation } from 'motion/react'
import type { Variants } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface CameraIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface CameraIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const bodyVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.6,
      ease: 'linear',
      opacity: { duration: 0.1 },
    },
  },
}

const lensVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.6,
      ease: 'linear',
      opacity: { duration: 0.1 },
    },
  },
}

const flashVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: 0.6,
      ease: 'linear',
      opacity: { duration: 0.1 },
    },
  },
}

const CameraIcon = forwardRef<CameraIconHandle, CameraIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const bodyControls = useAnimation()
    const lensControls = useAnimation()
    const flashControls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: () => {
          bodyControls.start('animate')
          lensControls.start('animate')
          flashControls.start('animate')
        },
        stopAnimation: () => {
          bodyControls.start('normal')
          lensControls.start('normal')
          flashControls.start('normal')
        },
      }
    })

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          bodyControls.start('animate')
          lensControls.start('animate')
          flashControls.start('animate')
        } else {
          onMouseEnter?.(e)
        }
      },
      [flashControls, onMouseEnter, lensControls, bodyControls],
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          bodyControls.start('normal')
          lensControls.start('normal')
          flashControls.start('normal')
        } else {
          onMouseLeave?.(e)
        }
      },
      [bodyControls, lensControls, flashControls, onMouseLeave],
    )

    return (
      <div
        className={cn(
          'cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center',
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            variants={bodyVariants}
            initial="normal"
            animate={bodyControls}
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <motion.circle variants={lensVariants} initial="normal" animate={lensControls} cx="12" cy="13" r="4" />
          <motion.line variants={flashVariants} initial="normal" animate={flashControls} x1="8" y1="5" x2="8" y2="5" />
        </svg>
      </div>
    )
  },
)

CameraIcon.displayName = 'CameraIcon'

export { CameraIcon }
