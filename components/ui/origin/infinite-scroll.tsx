'use client'

import { useEffect, useRef } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'

interface InfiniteScrollProps {
    hasMore: boolean
    isLoading: boolean
    next: () => void
    children: React.ReactNode
    className?: string
    // How far below the viewport (px) to start prefetching the next page. Larger
    // = more aggressive lookahead so fast scrolling rarely waits at the bottom for
    // the API (variants are AVIF/small, so prefetching ahead is cheap). Defaults
    // to ~1.5 viewport heights, floored at 800px.
    prefetchPx?: number
}

export default function InfiniteScroll({
    hasMore,
    isLoading,
    next,
    children,
    className,
    prefetchPx,
}: InfiniteScrollProps) {
    const observerTarget = useRef<HTMLDivElement>(null)
    // Latest `next` in a ref so the observer never depends on the caller's closure
    // identity (callers commonly pass a fresh closure every render, which would
    // otherwise tear down and recreate the observer each render).
    const nextRef = useRef(next)
    // Latest `hasMore` in a ref so the chain logic always reads the current value.
    const hasMoreRef = useRef(hasMore)
    // Re-entrancy guard: a single zone-entry requests only one page until the load
    // settles; then chain-on-load decides whether to fetch the next.
    const loadingRef = useRef(isLoading)
    const requestedRef = useRef(false)
    // Whether the sentinel is currently within the prefetch zone.
    const intersectingRef = useRef(false)

    // Keep the ref pointing at the latest callback without re-creating the observer
    // (writing to a ref must happen in an effect, not during render).
    useEffect(() => {
        nextRef.current = next
    }, [next])

    // Request the next page if we're in the prefetch zone and idle. Reads only
    // refs, so the (once-created) observer and the load-settle effect can both call
    // it and always act on the current state.
    const maybeLoadMore = () => {
        if (
            intersectingRef.current &&
            hasMoreRef.current &&
            !loadingRef.current &&
            !requestedRef.current
        ) {
            requestedRef.current = true
            nextRef.current()
        }
    }

    // When a load settles, clear the guard and — if the sentinel is still within
    // the prefetch zone — chain the next page. Faster scrolling keeps the sentinel
    // in the zone longer, so more pages prefetch automatically (velocity-adaptive);
    // it self-caps once enough content sits below the viewport to push the sentinel
    // out of the zone.
    useEffect(() => {
        loadingRef.current = isLoading
        if (!isLoading) {
            requestedRef.current = false
            maybeLoadMore()
        }
    }, [isLoading])

    // Track hasMore and re-check when more data becomes available.
    useEffect(() => {
        hasMoreRef.current = hasMore
        if (hasMore) {
            maybeLoadMore()
        }
    }, [hasMore])

    // Create the observer once. Immune to `next` / `isLoading` / `hasMore` identity
    // churn (all read via refs). The large bottom `rootMargin` makes the sentinel
    // intersect well before the actual bottom, so the next page is prefetched early.
    useEffect(() => {
        const target = observerTarget.current
        if (!target) {
            return
        }

        const viewport = typeof window !== 'undefined' ? window.innerHeight : 800
        const lookahead = prefetchPx ?? Math.max(800, Math.round(viewport * 1.5))

        const observer = new IntersectionObserver(
            (entries) => {
                intersectingRef.current = entries[0]?.isIntersecting ?? false
                maybeLoadMore()
            },
            { threshold: 0, rootMargin: `0px 0px ${lookahead}px 0px` }
        )

        observer.observe(target)

        return () => observer.disconnect()
    }, [prefetchPx])

    return (
        <div className={className}>
            {children}
            <div ref={observerTarget} className='h-4 w-full flex items-center justify-center mt-4'>
                {isLoading && <ReloadIcon className='h-4 w-4 animate-spin' />}
            </div>
        </div>
    )
}
