'use client'

import type React from 'react'

import { motion, useAnimation } from 'motion/react'
import type { Variants } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface ApertureIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface ApertureIconProps extends HTMLAttributes<HTMLDivElement> {
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

const bladeVariants: Variants = {
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

const ApertureIcon = forwardRef<ApertureIconHandle, ApertureIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const circleControls = useAnimation()
    const blade1Controls = useAnimation()
    const blade2Controls = useAnimation()
    const blade3Controls = useAnimation()
    const blade4Controls = useAnimation()
    const blade5Controls = useAnimation()
    const blade6Controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: () => {
          circleControls.start('animate')
          blade1Controls.start('animate')
          blade2Controls.start('animate')
          blade3Controls.start('animate')
          blade4Controls.start('animate')
          blade5Controls.start('animate')
          blade6Controls.start('animate')
        },
        stopAnimation: () => {
          circleControls.start('normal')
          blade1Controls.start('normal')
          blade2Controls.start('normal')
          blade3Controls.start('normal')
          blade4Controls.start('normal')
          blade5Controls.start('normal')
          blade6Controls.start('normal')
        },
      }
    })

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          circleControls.start('animate')
          blade1Controls.start('animate')
          blade2Controls.start('animate')
          blade3Controls.start('animate')
          blade4Controls.start('animate')
          blade5Controls.start('animate')
          blade6Controls.start('animate')
        } else {
          onMouseEnter?.(e)
        }
      },
      [
        circleControls,
        blade1Controls,
        blade2Controls,
        blade3Controls,
        blade4Controls,
        blade5Controls,
        blade6Controls,
        onMouseEnter,
      ],
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          circleControls.start('normal')
          blade1Controls.start('normal')
          blade2Controls.start('normal')
          blade3Controls.start('normal')
          blade4Controls.start('normal')
          blade5Controls.start('normal')
          blade6Controls.start('normal')
        } else {
          onMouseLeave?.(e)
        }
      },
      [
        circleControls,
        blade1Controls,
        blade2Controls,
        blade3Controls,
        blade4Controls,
        blade5Controls,
        blade6Controls,
        onMouseLeave,
      ],
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
            variants={bladeVariants}
            initial="normal"
            animate={blade1Controls}
            x1="14.31"
            y1="8"
            x2="20.05"
            y2="17.94"
          />
          <motion.line
            variants={bladeVariants}
            initial="normal"
            animate={blade2Controls}
            x1="9.69"
            y1="8"
            x2="21.17"
            y2="8"
          />
          <motion.line
            variants={bladeVariants}
            initial="normal"
            animate={blade3Controls}
            x1="7.38"
            y1="12"
            x2="13.12"
            y2="2.06"
          />
          <motion.line
            variants={bladeVariants}
            initial="normal"
            animate={blade4Controls}
            x1="9.69"
            y1="16"
            x2="3.95"
            y2="6.06"
          />
          <motion.line
            variants={bladeVariants}
            initial="normal"
            animate={blade5Controls}
            x1="14.31"
            y1="16"
            x2="2.83"
            y2="16"
          />
          <motion.line
            variants={bladeVariants}
            initial="normal"
            animate={blade6Controls}
            x1="16.62"
            y1="12"
            x2="10.88"
            y2="21.94"
          />
        </svg>
      </div>
    )
  },
)

ApertureIcon.displayName = 'ApertureIcon'

export { ApertureIcon }
