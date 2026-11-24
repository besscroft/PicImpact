'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { useTransitionStore } from '~/stores/transition-store'

interface Box { top: number; left: number; width: number; height: number }

// The object-contain box of an image with the given aspect inside a container —
// the same letterbox math the detail <img className="object-contain"> applies,
// so the flight lands exactly where the real image will sit.
function containedBox(container: Box, aspect: number): Box {
  if (aspect <= 0 || container.width <= 0 || container.height <= 0) return container
  const containerAspect = container.width / container.height
  let width: number
  let height: number
  if (containerAspect > aspect) {
    height = container.height
    width = height * aspect
  } else {
    width = container.width
    height = width / aspect
  }
  return {
    width,
    height,
    left: container.left + (container.width - width) / 2,
    top: container.top + (container.height - height) / 2,
  }
}

/**
 * Shared-element (FLIP) transition from a grid thumbnail into the detail view.
 * Reads the source rect captured at click time, measures where the detail image
 * will land ([data-flip-target]), then flies the cached thumbnail pixels from
 * one to the other and cross-fades into the real detail image. Because the grid
 * cell and the contained detail image share the photo's aspect ratio, this is a
 * clean uniform scale — no stretch, no crop discontinuity. Renders nothing (and
 * the detail just opens instantly) when there is no source or no target.
 */
export default function TransitionOverlay() {
  const source = useTransitionStore((s) => s.source)
  const clear = useTransitionStore((s) => s.clear)
  const [mounted, setMounted] = useState(false)
  const [flight, setFlight] = useState<null | { target: Box; dx: number; dy: number; scale: number; src: string }>(null)
  const [phase, setPhase] = useState<'flying' | 'fading'>('flying')
  const rafRef = useRef<number | null>(null)
  const startedForRef = useRef<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!source) {
      // The render guard below (`!source`) already hides the overlay; just reset
      // the once-per-source latch so a future source animates again.
      startedForRef.current = null
      return
    }
    if (startedForRef.current === source.id) return

    let frames = 0
    const measure = () => {
      const targetEl = document.querySelector<HTMLElement>('[data-flip-target]')
      if (targetEl) {
        const r = targetEl.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          const target = containedBox({ top: r.top, left: r.left, width: r.width, height: r.height }, source.aspect)
          startedForRef.current = source.id
          setFlight({
            target,
            dx: source.rect.left - target.left,
            dy: source.rect.top - target.top,
            scale: target.width > 0 ? source.rect.width / target.width : 1,
            src: source.src,
          })
          setPhase('flying')
          return
        }
      }
      frames += 1
      if (frames > 30) {
        // Target never laid out (~0.5s) — give up and open without the flight.
        clear()
        return
      }
      rafRef.current = requestAnimationFrame(measure)
    }
    rafRef.current = requestAnimationFrame(measure)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [source, clear])

  if (!mounted || !source || !flight) return null

  const { target, dx, dy, scale, src } = flight

  return createPortal(
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[120] overflow-hidden rounded-sm"
      style={{ top: target.top, left: target.left, width: target.width, height: target.height, transformOrigin: '0 0' }}
      initial={{ x: dx, y: dy, scale, opacity: 1 }}
      animate={phase === 'fading'
        ? { x: 0, y: 0, scale: 1, opacity: 0 }
        : { x: 0, y: 0, scale: 1, opacity: 1 }}
      transition={phase === 'fading'
        ? { duration: 0.18, ease: 'easeOut' }
        : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (phase === 'flying') setPhase('fading')
        else clear()
      }}
    >
      {/* Deliberately a plain <img>, not next/image: this flies the exact src the
          grid already decoded/cached, so it must not go through a loader or refetch. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
    </motion.div>,
    document.body,
  )
}
