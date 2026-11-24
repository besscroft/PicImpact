'use client'

import type React from 'react'

import { motion, useAnimation } from 'motion/react'
import type { Variants } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface CrosshairIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface CrosshairIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const circleVariants: Variants = {
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

const lineVariants: Variants = {
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

const CrosshairIcon = forwardRef<CrosshairIconHandle, CrosshairIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const circleControls = useAnimation()
    const horizontalLineControls = useAnimation()
    const verticalLineControls = useAnimation()
    const centerDotControls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: () => {
          circleControls.start('animate')
          horizontalLineControls.start('animate')
          verticalLineControls.start('animate')
          centerDotControls.start('animate')
        },
        stopAnimation: () => {
          circleControls.start('normal')
          horizontalLineControls.start('normal')
          verticalLineControls.start('normal')
          centerDotControls.start('normal')
        },
      }
    })

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          circleControls.start('animate')
          horizontalLineControls.start('animate')
          verticalLineControls.start('animate')
          centerDotControls.start('animate')
        } else {
          onMouseEnter?.(e)
        }
      },
      [circleControls, horizontalLineControls, verticalLineControls, centerDotControls, onMouseEnter],
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          circleControls.start('normal')
          horizontalLineControls.start('normal')
          verticalLineControls.start('normal')
          centerDotControls.start('normal')
        } else {
          onMouseLeave?.(e)
        }
      },
      [circleControls, horizontalLineControls, verticalLineControls, centerDotControls, onMouseLeave],
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
          <motion.circle variants={circleVariants} initial="normal" animate={circleControls} cx="12" cy="12" r="10" />
          <motion.line
            variants={lineVariants}
            initial="normal"
            animate={horizontalLineControls}
            x1="22"
            y1="12"
            x2="2"
            y2="12"
          />
          <motion.line
            variants={lineVariants}
            initial="normal"
            animate={verticalLineControls}
            x1="12"
            y1="2"
            x2="12"
            y2="22"
          />
          <motion.circle variants={circleVariants} initial="normal" animate={centerDotControls} cx="12" cy="12" r="1" />
        </svg>
      </div>
    )
  },
)

CrosshairIcon.displayName = 'CrosshairIcon'

export { CrosshairIcon }
