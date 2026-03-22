'use client'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface CalendarDaysIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CalendarDaysIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 17,
  mass: 1,
}

const CalendarDaysIcon = forwardRef<CalendarDaysIconHandle, CalendarDaysIconProps>(
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
            d="M8 2v4"
            variants={{
              animate: { translateY: -2 },
              normal: { translateY: 0 },
            }}
            animate={controls}
            transition={defaultTransition}
          />
          <motion.path
            d="M16 2v4"
            variants={{
              animate: { translateY: -2 },
              normal: { translateY: 0 },
            }}
            animate={controls}
            transition={defaultTransition}
          />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </svg>
      </div>
    )
  }
)

CalendarDaysIcon.displayName = 'CalendarDaysIcon'

export { CalendarDaysIcon }
