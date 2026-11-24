'use client'

import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface KeySquareIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface KeySquareIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const KeySquareIcon = forwardRef<KeySquareIconHandle, KeySquareIconProps>(
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
      [controls, onMouseEnter]
    )

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('normal')
        } else {
          onMouseLeave?.(e)
        }
      },
      [controls, onMouseLeave]
    )

    return (
      <div
        className={cn(
          'cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            normal: { scale: 1, rotate: 0 },
            animate: {
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            },
          }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
          }}
          animate={controls}
        >
          <path d="M12.4 2.7c.9-.9 2.5-.9 3.4 0l5.5 5.5c.9.9.9 2.5 0 3.4L16.4 16c-.4.4-.9.6-1.4.6h-2c-.6 0-1-.4-1-1v-2c0-.5.2-1 .6-1.4l4.9-4.9"/>
          <path d="m14 7 3 3"/>
          <path d="M5 6a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h7"/>
          <rect x="4" y="16" width="6" height="6" rx="1"/>
        </motion.svg>
      </div>
    )
  }
)

KeySquareIcon.displayName = 'KeySquareIcon'

export { KeySquareIcon }