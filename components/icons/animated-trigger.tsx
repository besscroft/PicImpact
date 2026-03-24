'use client'

import * as React from 'react'

export type AnimatedIconHandle = {
  startAnimation: () => void | Promise<void>
  stopAnimation: () => void | Promise<void>
}

export type AnimatedIconProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number
}

export type AnimatedIconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<AnimatedIconProps> & React.RefAttributes<AnimatedIconHandle>
>

export type AnimatedTriggerProps = Pick<
  React.HTMLAttributes<HTMLElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'
>

type AnimatedIconTriggerRenderProps = {
  iconRef: React.RefObject<AnimatedIconHandle | null>
  triggerProps: AnimatedTriggerProps
}

function composeEventHandler<EventType>(
  originalHandler: ((event: EventType) => void) | undefined,
  animatedHandler: ((event: EventType) => void) | undefined,
) {
  return (event: EventType) => {
    originalHandler?.(event)
    animatedHandler?.(event)
  }
}

export function mergeAnimatedTriggerProps<const Props extends Record<string, unknown>>(
  props: Props,
  triggerProps: AnimatedTriggerProps,
) {
  return {
    ...props,
    onMouseEnter: composeEventHandler(
      props.onMouseEnter as ((event: React.MouseEvent<HTMLElement>) => void) | undefined,
      triggerProps.onMouseEnter,
    ),
    onMouseLeave: composeEventHandler(
      props.onMouseLeave as ((event: React.MouseEvent<HTMLElement>) => void) | undefined,
      triggerProps.onMouseLeave,
    ),
    onFocus: composeEventHandler(
      props.onFocus as ((event: React.FocusEvent<HTMLElement>) => void) | undefined,
      triggerProps.onFocus,
    ),
    onBlur: composeEventHandler(
      props.onBlur as ((event: React.FocusEvent<HTMLElement>) => void) | undefined,
      triggerProps.onBlur,
    ),
  }
}

export function AnimatedIconTrigger({
  children,
}: {
  children: (props: AnimatedIconTriggerRenderProps) => React.ReactNode
}) {
  const iconRef = React.useRef<AnimatedIconHandle | null>(null)

  const startAnimation = React.useCallback(() => {
    void iconRef.current?.startAnimation()
  }, [])

  const stopAnimation = React.useCallback(() => {
    void iconRef.current?.stopAnimation()
  }, [])

  const triggerProps = React.useMemo<AnimatedTriggerProps>(
    () => ({
      onMouseEnter: () => startAnimation(),
      onMouseLeave: () => stopAnimation(),
      onFocus: () => startAnimation(),
      onBlur: () => stopAnimation(),
    }),
    [startAnimation, stopAnimation],
  )

  // eslint-disable-next-line react-hooks/refs
  return children({
    iconRef,
    triggerProps,
  })
}
