'use client'

import type React from 'react'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface SquareTerminalIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

interface SquareTerminalIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number
}

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 17,
  mass: 1,
}

const SquareTerminalIcon = forwardRef<SquareTerminalIconHandle, SquareTerminalIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      }
    })

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('animate')
        } else {
          onMouseEnter?.(e)
        }
      },
      [controls, onMouseEnter],
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('normal')
        } else {
          onMouseLeave?.(e)
        }
      },
      [controls, onMouseLeave],
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
          <motion.rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            ry="2"
            variants={{
              normal: { scale: 1 },
              animate: { scale: 1.05 },
            }}
            animate={controls}
            transition={defaultTransition}
          />
          <motion.path
            d="m7 15 3-3-3-3"
            variants={{
              normal: { x: 0, opacity: 0.8 },
              animate: { x: 1, opacity: 1 },
            }}
            animate={controls}
            transition={{
              ...defaultTransition,
              repeat: 1,
              repeatType: 'reverse',
            }}
          />
          <motion.line
            x1="13"
            y1="15"
            x2="17"
            y2="15"
            variants={{
              normal: { opacity: 0.8 },
              animate: { opacity: 1 },
            }}
            animate={controls}
            transition={{
              ...defaultTransition,
              delay: 0.1,
            }}
          />
          <motion.line
            x1="18"
            y1="13"
            x2="18"
            y2="17"
            strokeWidth="2.5"
            initial={{ opacity: 1 }}
            animate={{
              opacity: [1, 0, 1, 0, 1],
              transition: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              },
            }}
            variants={{
              normal: { opacity: [1, 0, 1, 0, 1], transition: { duration: 2 } },
              animate: { opacity: [1, 0, 1, 0, 1], transition: { duration: 1 } },
            }}
          />
        </svg>
      </div>
    )
  },
)

SquareTerminalIcon.displayName = 'SquareTerminalIcon'

export { SquareTerminalIcon }
