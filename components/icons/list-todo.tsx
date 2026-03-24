'use client'

import type { Transition } from 'motion/react'
import { motion, useAnimation } from 'motion/react'
import type { HTMLAttributes } from 'react'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { cn } from '~/lib/utils'

export interface ListTodoIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ListTodoIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 16,
  mass: 0.9,
}

const ListTodoIcon = forwardRef<ListTodoIconHandle, ListTodoIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation()
    const isControlledRef = useRef(false)

    useImperativeHandle(ref, () => {
      isControlledRef.current = true

      return {
        startAnimation: async () => {
          await controls.start('firstState')
          await controls.start('secondState')
        },
        stopAnimation: () => controls.start('normal'),
      }
    })

    const handleMouseEnter = useCallback(
      async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          await controls.start('firstState')
          await controls.start('secondState')
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
          'cursor-pointer select-none rounded-md p-2 transition-colors duration-200 hover:bg-accent flex items-center justify-center',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <motion.svg
          xmlns='http://www.w3.org/2000/svg'
          width={size}
          height={size}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          variants={{
            normal: {
              y: 0,
              scale: 1,
            },
            firstState: {
              y: -1.6,
              scale: 1.035,
            },
            secondState: {
              y: 0,
              scale: 1,
            },
          }}
          transition={bounceTransition}
          animate={controls}
        >
          <rect x='3' y='4' width='6' height='6' rx='1' />
          <path d='M13 5h8' />
          <path d='M13 12h8' />
          <path d='M13 19h8' />
          <path d='m3 17 2 2 4-4' />
        </motion.svg>
      </div>
    )
  }
)

ListTodoIcon.displayName = 'ListTodoIcon'

export { ListTodoIcon }
